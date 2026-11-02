// Reads the data files people download from their music services. Runs on their own device, and nothing is uploaded.
(function shareImport(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SolamImport = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const MIN_LISTEN_MS = 30000;
  const MAX_TRACKS_PER_LIST = 500;
  const MAX_RECENTS = 200;
  const MAX_LISTS = 20;
  const MAX_TASTE_ARTISTS = 50;
  const MAX_FOLLOWS = 200;
  const CHANNEL_NOISE = /\s*-\s*Topic$|VEVO$/i;

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const clean = text.replace(/^﻿/, '');
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      if (quoted) {
        if (c === '"' && clean[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    if (rows.length < 2) return [];
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    return rows.slice(1).filter((cells) => cells.some(Boolean)).map((cells) => Object.fromEntries(headers.map((header, i) => [header, (cells[i] || '').trim()])));
  }

  const song = (title, artist) => ({ title: String(title || '').trim(), artist: String(artist || '').trim() });
  const usable = (track) => track.title && track.artist;

  function emptyResult() {
    return { playlists: [], recents: [], follows: [], listens: [] };
  }

  function readSpotify(name, data, out) {
    if (data?.playlists) {
      data.playlists.forEach((list) => out.playlists.push({
        name: list.name || 'Spotify playlist',
        tracks: (list.items || []).map((item) => song(item.track?.trackName, item.track?.artistName)).filter(usable),
      }));
      return true;
    }
    if (data?.tracks || data?.artists) {
      if (data.tracks?.length) out.playlists.push({ name: 'Liked on Spotify', tracks: data.tracks.map((item) => song(item.track, item.artist)).filter(usable) });
      (data.artists || []).forEach((artist) => artist.name && out.follows.push(artist.name));
      return true;
    }
    if (Array.isArray(data) && data[0]?.trackName !== undefined) {
      data.filter((row) => (row.msPlayed ?? MIN_LISTEN_MS) >= MIN_LISTEN_MS).forEach((row) => out.listens.push({ ...song(row.trackName, row.artistName), at: row.endTime || '' }));
      return true;
    }
    if (Array.isArray(data) && data[0] && 'master_metadata_track_name' in data[0]) {
      data.filter((row) => row.master_metadata_track_name && (row.ms_played ?? MIN_LISTEN_MS) >= MIN_LISTEN_MS).forEach((row) => out.listens.push({ ...song(row.master_metadata_track_name, row.master_metadata_album_artist_name), at: row.ts || '' }));
      return true;
    }
    return false;
  }

  function readYoutube(name, data, out) {
    if (!Array.isArray(data) || !data.some((row) => row?.header && row?.title)) return false;
    data.filter((row) => row.header === 'YouTube Music' || /music\.youtube\.com/.test(row.titleUrl || '')).forEach((row) => {
      const artist = (row.subtitles?.[0]?.name || '').replace(CHANNEL_NOISE, '');
      const title = String(row.title || '').replace(/^(Watched|Просмотрено:?|Посмотрели:?)\s+/i, '');
      out.listens.push({ ...song(title, artist), at: row.time || '' });
    });
    return true;
  }

  function readAppleJson(name, data, out) {
    if (!Array.isArray(data) || !data[0] || !('Title' in data[0]) || !('Artist' in data[0])) return false;
    out.playlists.push({ name: 'Apple Music library', tracks: data.map((row) => song(row.Title, row.Artist)).filter(usable) });
    return true;
  }

  function readCsv(name, text, out) {
    const rows = parseCsv(text);
    if (!rows.length) return false;
    const has = (key) => key in rows[0];
    if (has('channel title')) {
      rows.forEach((row) => row['channel title'] && out.follows.push(row['channel title'].replace(CHANNEL_NOISE, '')));
      return true;
    }
    const titleKey = ['song name', 'track name', 'title', 'track', 'name', 'content name'].find(has);
    const artistKey = ['artist name', 'artist', 'artists', 'container artist name', 'creator'].find(has);
    if (!titleKey || !artistKey) return false;
    const tracks = rows.map((row) => song(row[titleKey], row[artistKey])).filter(usable);
    if (/activity|history/i.test(name)) tracks.forEach((track) => out.listens.push({ ...track, at: '' }));
    else out.playlists.push({ name: name.replace(/\.csv$/i, ''), tracks });
    return true;
  }

  // Each line like "Artist - Song", for any service or a list someone typed.
  function readList(text, listName = 'Imported songs') {
    const tracks = text.split(/\r?\n/).map((line) => {
      const parts = line.split(/\s[-–—]\s/);
      return parts.length >= 2 ? song(parts.slice(1).join(' - '), parts[0]) : song('', '');
    }).filter(usable);
    return tracks.length ? { name: listName, tracks } : null;
  }

  function readFile(file, out) {
    const name = String(file.name || '');
    const text = String(file.text || '');
    if (/\.json$/i.test(name)) {
      let data;
      try {
        data = JSON.parse(text.replace(/^﻿/, ''));
      } catch {
        return false;
      }
      return readSpotify(name, data, out) || readYoutube(name, data, out) || readAppleJson(name, data, out);
    }
    if (/\.csv$/i.test(name)) return readCsv(name, text, out);
    const list = readList(text, name.replace(/\.[^.]+$/, '') || 'Imported songs');
    if (list) out.playlists.push(list);
    return Boolean(list);
  }

  function uniqueSongs(tracks) {
    const seen = new Set();
    return tracks.filter((track) => {
      const key = `${track.title}|${track.artist}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Turns everything read from the files into playlists, recents, followed artists and top artists.
  function summarize(raw, service) {
    const playlists = raw.playlists
      .map((list) => ({ name: String(list.name).slice(0, 60), tracks: uniqueSongs(list.tracks).slice(0, MAX_TRACKS_PER_LIST) }))
      .filter((list) => list.tracks.length)
      .slice(0, MAX_LISTS);
    const recents = uniqueSongs([...raw.listens].sort((a, b) => String(b.at).localeCompare(String(a.at)))).slice(0, MAX_RECENTS).map(({ title, artist }) => ({ title, artist }));
    const counts = new Map();
    const addArtist = (artist, amount) => {
      const name = String(artist).split(/,| & | feat\.? /i)[0].trim();
      if (name) counts.set(name, (counts.get(name) || 0) + amount);
    };
    raw.listens.forEach((track) => addArtist(track.artist, 1));
    raw.playlists.forEach((list) => list.tracks.forEach((track) => addArtist(track.artist, 1)));
    raw.follows.forEach((artist) => addArtist(artist, 2));
    return {
      service,
      playlists,
      recents,
      follows: [...new Set(raw.follows.map((artist) => artist.trim()).filter(Boolean))].slice(0, MAX_FOLLOWS),
      topArtists: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_TASTE_ARTISTS).map(([name]) => name),
    };
  }

  function importFiles(files, service) {
    const raw = emptyResult();
    const unread = [];
    files.forEach((file) => {
      if (!readFile(file, raw)) unread.push(file.name);
    });
    return { ...summarize(raw, service), unread };
  }

  return { importFiles, readList, parseCsv };
}));
