// Finding music, artists and lyrics. Windows and the phone version share this.
(function shareMusic(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SolamMusic = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const ONLINE_API = 'https://api.audius.co/v1';
  const ONLINE_APP_NAME = 'Solam';
  const CATALOG_API = 'https://api.deezer.com';
  const JUNK_UPLOAD = /slowed|reverb|sped up|nightcore|karaoke|tribute|originally performed|in the style of|8d audio|spotidown|\.app\b|type beat/;
  const HIDDEN_ACCOUNTS = new Set(['audius']);
  const FREE_CATALOG = 'https://v1sion0coder.github.io/solam/free-catalog.json';
  // Only licenses that allow sharing in an app with paid features. Non-commercial music is left out.
  const OPEN_LICENSE = /creativecommons\.org\/(licenses\/(by|by-sa)\/|publicdomain\/)/i;
  const ARCHIVE_OPEN_LICENSES = `licenseurl:(${['by/2.0', 'by/2.5', 'by/3.0', 'by/4.0', 'by-sa/2.0', 'by-sa/2.5', 'by-sa/3.0', 'by-sa/4.0'].map((id) => `"http://creativecommons.org/licenses/${id}/"`).concat('"http://creativecommons.org/publicdomain/zero/1.0/"', '"http://creativecommons.org/publicdomain/mark/1.0/"').join(' OR ')})`;

  function licenseName(url) {
    const match = /licenses\/([a-z-]+)\/([\d.]+)/i.exec(url);
    return match ? `CC ${match[1].toUpperCase()} ${match[2]}` : 'Public domain';
  }

  function createMusic({ fetchJson, fetchCatalogJson = fetchJson, getBackend }) {
    function cleanText(value) {
      const text = value === null || value === undefined ? '' : String(value).trim();
      return ['null', 'undefined'].includes(text.toLowerCase()) ? '' : text;
    }

    function toCatalogArtist(artist) {
      return {
        id: String(artist.id),
        source: 'catalog',
        name: cleanText(artist.name) || 'Unknown artist',
        followers: artist.nb_fan || 0,
        trackCount: 0,
        verified: false,
        pic: artist.picture_big || artist.picture_xl || '',
        thumb: artist.picture_medium || artist.picture_big || '',
        cover: artist.picture_xl || '',
        bio: '',
      };
    }

    function toCatalogTrack(item) {
      return {
        id: String(item.id),
        source: 'preview',
        title: cleanText(item.title) || 'Unknown song',
        artist: cleanText(item.artist?.name) || 'Unknown artist',
        artistId: String(item.artist?.id || ''),
        artistSource: 'catalog',
        album: cleanText(item.album?.title),
        art: item.album?.cover_big || item.album?.cover_medium || '',
        thumb: item.album?.cover_medium || '',
        url: item.preview,
        duration: 30,
        plays: 0,
        popularity: item.rank || 0,
        genre: '',
      };
    }

    async function fetchCatalog(endpoint) {
      const data = await fetchCatalogJson(`${CATALOG_API}${endpoint}`);
      if (data?.error) throw new Error('Catalog unavailable');
      return data;
    }

    async function fetchCatalogTracks(endpoint) {
      return ((await fetchCatalog(endpoint))?.data || []).filter((item) => item.preview && item.readable !== false).map(toCatalogTrack);
    }

    async function fetchCatalogArtists(endpoint) {
      return ((await fetchCatalog(endpoint))?.data || []).map(toCatalogArtist);
    }

    async function loadCatalogArtist(id) {
      const encoded = encodeURIComponent(id);
      const [profile, tracks, related] = await Promise.all([
        fetchCatalog(`/artist/${encoded}`),
        fetchCatalogTracks(`/artist/${encoded}/top?limit=30`),
        fetchCatalogArtists(`/artist/${encoded}/related?limit=8`).catch(() => []),
      ]);
      if (!profile?.id) return null;
      return { ...toCatalogArtist(profile), trackCount: tracks.length, tracks, related, previewsOnly: true };
    }

    function toOnlineArtist(user) {
      return {
        id: user.id,
        source: 'online',
        name: cleanText(user.name) || cleanText(user.handle) || 'Unknown artist',
        handle: cleanText(user.handle),
        followers: user.follower_count || 0,
        trackCount: user.track_count || 0,
        verified: Boolean(user.is_verified),
        pic: user.profile_picture?.['480x480'] || '',
        thumb: user.profile_picture?.['150x150'] || '',
        cover: user.cover_photo?.['640x'] || '',
        artMirrors: user.profile_picture?.mirrors || [],
        bio: cleanText(user.bio),
      };
    }

    function toOnlineTrack(item) {
      const signed = item.stream?.url || '';
      const mirrors = signed ? (item.stream.mirrors || []).map((mirror) => mirror + new URL(signed).pathname + new URL(signed).search) : [];
      return {
        id: item.id,
        source: 'online',
        title: cleanText(item.title) || 'Unknown song',
        artist: cleanText(item.user?.name) || 'Unknown artist',
        artistId: item.user?.id || '',
        artistSource: 'online',
        artistFollowers: item.user?.follower_count || 0,
        verified: Boolean(item.user?.is_verified),
        album: '',
        art: item.artwork?.['480x480'] || '',
        thumb: item.artwork?.['150x150'] || '',
        artMirrors: item.artwork?.mirrors || [],
        url: `${ONLINE_API}/tracks/${encodeURIComponent(item.id)}/stream?app_name=${ONLINE_APP_NAME}`,
        fallbacks: [signed, ...mirrors].filter(Boolean),
        duration: item.duration || 0,
        plays: item.play_count || 0,
        genre: cleanText(item.genre),
        downloadable: Boolean(item.is_downloadable && item.access?.download),
      };
    }

    function isPlayableOnline(item) {
      return item.is_streamable !== false && !item.is_stream_gated && item.access?.stream !== false && !item.is_delete;
    }

    async function fetchOnline(endpoint) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const data = await fetchJson(`${ONLINE_API}${endpoint}${separator}app_name=${ONLINE_APP_NAME}`);
      return data?.data || [];
    }

    async function fetchOnlineTracks(endpoint) {
      return (await fetchOnline(endpoint)).filter(isPlayableOnline).map(toOnlineTrack);
    }

    async function fetchOnlineArtists(endpoint) {
      return (await fetchOnline(endpoint)).filter((user) => !HIDDEN_ACCOUNTS.has(String(user.handle).toLowerCase())).map(toOnlineArtist);
    }

    function normalize(text) {
      return String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    }

    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > 3) return 9;
      let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
      for (let i = 1; i <= a.length; i++) {
        const current = [i];
        for (let j = 1; j <= b.length; j++) {
          current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        previous = current;
      }
      return previous[b.length];
    }

    // Forgives spelling and spacing, so "emenem" means Eminem and "juicewrld" means Juice WRLD.
    function nameMatches(artistName, query) {
      const name = normalize(artistName).replace(/ /g, '');
      const wanted = query.replace(/ /g, '');
      if (!name || name.length < 2) return false;
      if (name === wanted) return true;
      if (wanted.length >= 4 && editDistance(name, wanted) <= (wanted.length >= 8 ? 3 : 2)) return true;
      return name.length >= 4 && ` ${query} `.includes(` ${normalize(artistName)} `);
    }

    function pickBestArtist(artists, query) {
      const matching = artists.filter((artist) => nameMatches(artist.name, query)).sort((a, b) => b.followers - a.followers);
      if (matching.length) return matching[0];
      return artists.filter((artist) => normalize(artist.name).startsWith(query) && artist.followers > 1000).sort((a, b) => b.followers - a.followers)[0] || null;
    }

    // The best artist's songs come first, then exact song matches, then the most popular.
    function scoreTrack(track, query, tokens, bestArtist) {
      const title = normalize(track.title);
      const artist = normalize(track.artist);
      let score = 0;
      if (bestArtist && track.artistId === bestArtist.id && track.artistSource === bestArtist.source) score += 1200;
      if (artist === query) score += 500;
      else if (artist.startsWith(query)) score += 200;
      if (title === query) score += 800;
      else if (title.startsWith(query)) score += 350;
      else if (title.includes(query)) score += 180;
      if (tokens.length > 1 && tokens.every((token) => `${title} ${artist}`.includes(token))) score += 450;
      // "lucid dreams juice": some words name the artist and the rest name the song.
      const artistWords = tokens.filter((token) => artist.includes(token));
      if (artistWords.length && artistWords.length < tokens.length && tokens.filter((token) => !artistWords.includes(token)).every((token) => title.includes(token))) score += 500;
      if (JUNK_UPLOAD.test(title)) score -= 450;
      score += Math.log10((track.popularity || track.plays || 0) + 1) * 35;
      score += Math.log10((track.artistFollowers || 0) + 1) * 30;
      if (track.verified) score += 40;
      return score;
    }

    function songIdentity(track) {
      return `${normalize(track.title.replace(/[([].*?[)\]]/g, ''))}|${normalize(track.artist)}`;
    }

    async function searchAll(term) {
      const text = String(term);
      const query = normalize(text);
      const tokens = query.split(' ').filter(Boolean);
      const encoded = encodeURIComponent(text);
      const [popular, relevant, users, own, ownArtists, catalogTracks, catalogArtists] = await Promise.allSettled([
        fetchOnlineTracks(`/tracks/search?limit=40&sort_method=popular&query=${encoded}`),
        fetchOnlineTracks(`/tracks/search?limit=40&query=${encoded}`),
        fetchOnlineArtists(`/users/search?limit=8&query=${encoded}`),
        getBackend().searchTracks(text),
        getBackend().searchArtists(text),
        fetchCatalogTracks(`/search/track?limit=25&q=${encoded}`),
        fetchCatalogArtists(`/search/artist?limit=6&q=${encoded}`),
      ]);
      const value = (result) => (result.status === 'fulfilled' ? result.value : []);
      if ([popular, relevant, users, catalogTracks].every((result) => result.status === 'rejected') && !value(own).length) throw new Error('Search failed');

      const artists = [...value(ownArtists), ...value(users), ...value(catalogArtists)].sort((a, b) => b.followers - a.followers);
      const bestArtist = pickBestArtist(artists, query);
      let byArtist = [];
      if (bestArtist?.source === 'online') byArtist = await fetchOnlineTracks(`/users/${encodeURIComponent(bestArtist.id)}/tracks?limit=20&sort_method=plays&sort_direction=desc`).catch(() => []);
      if (bestArtist?.source === 'catalog') byArtist = await fetchCatalogTracks(`/artist/${encodeURIComponent(bestArtist.id)}/top?limit=15`).catch(() => []);

      // A full song always beats a preview of the same song.
      const candidates = [...byArtist, ...value(popular), ...value(relevant), ...value(own), ...value(catalogTracks)];
      const fullSongs = new Set(candidates.filter((track) => track.source !== 'preview').map(songIdentity));
      const seen = new Set();
      const tracks = candidates.filter((track) => {
        const key = `${track.source}:${track.id}`;
        if (seen.has(key) || (track.source === 'preview' && fullSongs.has(songIdentity(track)))) return false;
        seen.add(key);
        if (track.source === 'preview') {
          const identity = songIdentity(track);
          if (seen.has(identity)) return false;
          seen.add(identity);
        }
        return true;
      });
      tracks.sort((a, b) => scoreTrack(b, query, tokens, bestArtist) - scoreTrack(a, query, tokens, bestArtist));
      return { topArtist: bestArtist, artists: artists.filter((artist) => artist.followers > 0 || artist.source === 'solam').slice(0, 10), tracks: tracks.slice(0, 60) };
    }

    async function loadOnlineArtist(id) {
      const encoded = encodeURIComponent(id);
      const [profile, tracks, related] = await Promise.all([
        fetchOnline(`/users/${encoded}`),
        fetchOnlineTracks(`/users/${encoded}/tracks?limit=100&sort_method=plays&sort_direction=desc`),
        fetchOnlineArtists(`/users/${encoded}/related?limit=8`).catch(() => []),
      ]);
      const user = Array.isArray(profile) ? profile[0] : profile;
      if (!user?.id) return null;
      const artist = toOnlineArtist(user);
      return { ...artist, tracks, related, totalPlays: tracks.reduce((sum, track) => sum + track.plays, 0), partialPlays: artist.trackCount > tracks.length };
    }

    async function searchArchive(term) {
      const safeTerm = term.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim();
      const query = `(${safeTerm || 'music'}) AND mediatype:audio AND collection:(netlabels OR opensource_audio) AND ${ARCHIVE_OPEN_LICENSES}`;
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=licenseurl&sort[]=downloads+desc&rows=30&output=json`;
      const data = await fetchJson(url);
      return (data?.response?.docs || []).filter((doc) => OPEN_LICENSE.test(String(doc.licenseurl))).map((doc) => ({
        license: licenseName(String(doc.licenseurl)),
        licenseUrl: String(doc.licenseurl).replace(/^http:/, 'https:'),
        id: doc.identifier,
        title: Array.isArray(doc.title) ? doc.title[0] : doc.title || doc.identifier,
        artist: (Array.isArray(doc.creator) ? doc.creator[0] : doc.creator) || 'Unknown artist',
        art: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
      }));
    }

    function parseLength(value) {
      if (!value) return 0;
      if (String(value).includes(':')) return String(value).split(':').reduce((total, part) => total * 60 + Number(part), 0);
      return Number(value) || 0;
    }

    async function loadArchiveAlbum(id) {
      if (!/^[\w.-]+$/.test(id)) throw new Error('Bad album id');
      const data = await fetchJson(`https://archive.org/metadata/${id}`);
      const files = data?.files || [];
      const pick = (test) => files.filter((file) => test(String(file.format || '')));
      const flac = pick((format) => /flac/i.test(format));
      // Each song is stored in several formats, so one is chosen to avoid listing it more than once.
      const mp3 = pick((format) => /mp3/i.test(format) && !/64kbps/i.test(format));
      const originals = mp3.filter((file) => file.source === 'original');
      const chosen = flac.length ? flac : originals.length ? originals : mp3;
      const creator = data?.metadata?.creator;
      const licenseUrl = String([data?.metadata?.licenseurl].flat()[0] || '');
      const license = OPEN_LICENSE.test(licenseUrl) ? { license: licenseName(licenseUrl), licenseUrl: licenseUrl.replace(/^http:/, 'https:') } : {};
      return chosen.map((file) => ({
        ...license,
        title: file.title || file.name.replace(/\.[^.]+$/, ''),
        artist: (Array.isArray(creator) ? creator[0] : creator) || 'Unknown artist',
        album: data?.metadata?.title || '',
        art: `https://archive.org/services/img/${encodeURIComponent(id)}`,
        id: `${id}/${file.name}`,
        url: `https://archive.org/download/${encodeURIComponent(id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`,
        duration: parseLength(file.length),
        format: flac.length ? 'FLAC' : 'MP3',
        name: file.name,
      })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }

    function cleanSongTitle(title, artist) {
      let clean = String(title)
        .replace(/[([][^)\]]*[)\]]/g, ' ')
        .replace(/\b(feat|ft|prod)\b\.?.*$/i, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Many uploads are named "Artist - Song".
      const dash = clean.split(' - ');
      if (dash.length === 2) clean = normalize(dash[0]).includes(normalize(artist).split(' ')[0] || ' ') ? dash[1] : dash[dash.length - 1];
      return clean.trim();
    }

    function pickLyrics(results, title, artist) {
      const wantedTitle = normalize(title);
      const wantedArtist = normalize(artist).split(' ')[0] || '';
      const matching = (results || []).filter((item) => {
        const itemTitle = normalize(item.trackName || item.name || '');
        const titleOk = itemTitle === wantedTitle || itemTitle.includes(wantedTitle) || wantedTitle.includes(itemTitle);
        return titleOk && normalize(item.artistName || '').includes(wantedArtist);
      });
      return matching.find((item) => item.syncedLyrics) || matching.find((item) => item.plainLyrics) || null;
    }

    async function loadLyrics({ title, artist, album, duration }) {
      const params = new URLSearchParams({ track_name: title, artist_name: artist });
      if (album) params.set('album_name', album);
      if (duration) params.set('duration', String(Math.round(duration)));
      // The exact lookup needs album and duration, and rejects requests without them.
      const exact = album && duration > 30 ? await fetchJson(`https://lrclib.net/api/get?${params}`).catch(() => null) : null;
      if (exact?.syncedLyrics || exact?.plainLyrics) return { synced: exact.syncedLyrics || '', plain: exact.plainLyrics || '' };
      const mainArtist = artist.split(/,|&| feat\.? | ft\.? | x /i)[0].trim();
      const cleanTitle = cleanSongTitle(title, mainArtist);
      const searches = [
        new URLSearchParams({ track_name: cleanTitle, artist_name: mainArtist }),
        new URLSearchParams({ q: `${mainArtist} ${cleanTitle}` }),
        new URLSearchParams({ track_name: cleanTitle }),
      ];
      for (const search of searches) {
        const results = await fetchJson(`https://lrclib.net/api/search?${search}`).catch(() => []);
        const best = pickLyrics(results, cleanTitle, mainArtist);
        if (best) return { synced: best.syncedLyrics || '', plain: best.plainLyrics || '' };
      }
      return null;
    }


    const freeAlbums = async () => (await fetchJson(FREE_CATALOG))?.albums || [];

    const trending = () => fetchOnlineTracks('/tracks/trending?limit=12');

    function similar(genre) {
      const query = genre ? `?limit=20&genre=${encodeURIComponent(String(genre))}` : '?limit=20';
      return fetchOnlineTracks(`/tracks/trending${query}`);
    }

    async function topArtists() {
      const [famous, online] = await Promise.allSettled([fetchCatalogArtists('/chart/0/artists?limit=24'), fetchOnlineArtists('/users/top?limit=24')]);
      if (famous.status === 'rejected' && online.status === 'rejected') throw new Error('Artists unavailable');
      return [...(famous.value || []), ...(online.value || [])];
    }

    async function searchArtists(text) {
      const [own, online, famous] = await Promise.allSettled([
        getBackend().searchArtists(text),
        fetchOnlineArtists(`/users/search?limit=30&query=${encodeURIComponent(text)}`),
        fetchCatalogArtists(`/search/artist?limit=15&q=${encodeURIComponent(text)}`),
      ]);
      return [...(own.value || []), ...(online.value || []), ...(famous.value || [])].sort((a, b) => b.followers - a.followers);
    }

    function loadArtist(source, id) {
      if (source === 'solam') return getBackend().artistPage(String(id));
      return source === 'catalog' ? loadCatalogArtist(String(id)) : loadOnlineArtist(String(id));
    }

    const previewUrl = async (id) => (await fetchCatalog(`/track/${encodeURIComponent(String(id))}`))?.preview || null;

    // Finds the real song for a name imported from another service.
    async function matchSong(title, artist) {
      const cleanName = cleanSongTitle(title, artist);
      const exact = `artist:"${String(artist).replace(/"/g, ' ')}" track:"${cleanName.replace(/"/g, ' ')}"`;
      const tracks = await fetchCatalogTracks(`/search/track?limit=5&q=${encodeURIComponent(exact)}`).catch(() => []);
      if (tracks.length) return tracks[0];
      const loose = await fetchCatalogTracks(`/search/track?limit=5&q=${encodeURIComponent(`${artist} ${cleanName}`)}`).catch(() => []);
      const wanted = normalize(artist).split(' ')[0];
      return loose.find((track) => normalize(track.artist).includes(wanted)) || null;
    }

    async function matchArtist(name) {
      const found = await fetchCatalogArtists(`/search/artist?limit=5&q=${encodeURIComponent(String(name))}`).catch(() => []);
      return found.filter((artist) => nameMatches(artist.name, normalize(name))).sort((a, b) => b.followers - a.followers)[0] || null;
    }

    async function artistTop(name) {
      const artist = await matchArtist(name);
      return artist ? fetchCatalogTracks(`/artist/${encodeURIComponent(artist.id)}/top?limit=5`) : [];
    }

    // Only songs the artist allows can be saved for offline listening.
    async function offlineDownloadUrl(track, backend) {
      if (track.source === 'online') {
        const [item] = [await fetchOnline(`/tracks/${encodeURIComponent(track.id)}`)].flat();
        if (!item?.is_downloadable || !item.access?.download) throw new Error('not-allowed');
        return `${ONLINE_API}/tracks/${encodeURIComponent(track.id)}/download?app_name=${ONLINE_APP_NAME}`;
      }
      if (track.source === 'free' && /^https:\/\/archive\.org\/download\//.test(track.url)) return track.url;
      if (track.source === 'solam' && backend.isOwnFile(track.url) && track.downloadable) return track.url;
      throw new Error('not-allowed');
    }

    return {
      searchAll, searchArtists, loadArtist, trending, similar, topArtists, previewUrl, matchSong, matchArtist, artistTop,
      freeAlbums, searchArchive, loadArchiveAlbum, loadLyrics, offlineDownloadUrl,
    };
  }

  return { createMusic };
}));
