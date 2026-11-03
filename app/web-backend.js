// The phone version of Solam's server code: accounts, uploads, approval, reports and saved music.
(() => {
  const BUCKET = 'music';
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  const MIN_UPLOAD_AGE = 13;
  const SITE = 'https://v1sion0coder.github.io/solam/';
  const SESSION_KEY = 'solam.session';
  const AUDIO_TYPES = { mp3: 'audio/mpeg', flac: 'audio/flac', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };
  const PHOTO_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm' };
  const TRACK_FIELDS = 'id,user_id,title,genre,audio_path,art_path,duration,plays,status,created_at,lyrics,allow_download,check_notes,artists(name)';
  const ARTIST_FIELDS = 'id,name,genre,pic_path,cover_path';

  const config = window.SOLAM_BACKEND;
  const picked = new Map();
  let session = null;

  function fullYearsSince(dateText) {
    const born = new Date(`${dateText}T00:00:00Z`);
    if (Number.isNaN(born.getTime())) return -1;
    const now = new Date();
    let years = now.getUTCFullYear() - born.getUTCFullYear();
    if (now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())) years--;
    return years;
  }

  function saveSession() {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // The person will just need to sign in again next time.
    }
  }

  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    session = null;
  }

  function adoptSession(data) {
    if (!data?.access_token) return false;
    session = { access: data.access_token, refresh: data.refresh_token, expires: Date.now() + (data.expires_in || 3600) * 1000, user: { id: data.user?.id, email: data.user?.email } };
    saveSession();
    return true;
  }

  async function raw(pathname, { method = 'GET', body, headers = {}, token, timeout = 30000 } = {}) {
    const response = await fetch(config.url + pathname, {
      method,
      body,
      signal: AbortSignal.timeout(timeout),
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token || config.anonKey}`, ...headers },
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!response.ok) {
      const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || `Server error ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const json = (pathname, method, value, extra = {}, token) => raw(pathname, { method, token, body: JSON.stringify(value), headers: { 'Content-Type': 'application/json', ...extra } });

  async function validToken() {
    if (!session) return null;
    if (Date.now() > session.expires - 60000) {
      try {
        adoptSession(await json('/auth/v1/token?grant_type=refresh_token', 'POST', { refresh_token: session.refresh }));
      } catch (error) {
        if (error.status === 400 || error.status === 401) {
          session = null;
          saveSession();
          return null;
        }
        throw error;
      }
    }
    return session.access;
  }

  async function requireToken() {
    const token = await validToken();
    if (!token) throw new Error('not-signed-in');
    return token;
  }

  const publicUrl = (file) => `${config.url}/storage/v1/object/public/${BUCKET}/${file.split('/').map(encodeURIComponent).join('/')}`;

  function toTrack(row) {
    const art = row.art_path ? publicUrl(row.art_path) : '';
    return {
      lyrics: row.lyrics || '', downloadable: Boolean(row.allow_download), id: row.id, source: 'solam', title: row.title,
      artist: row.artists?.name || 'Solam artist', artistId: row.user_id, artistSource: 'solam', album: '', art, thumb: art,
      url: publicUrl(row.audio_path), duration: row.duration || 0, plays: Number(row.plays) || 0, genre: row.genre || '', status: row.status, checkNotes: row.check_notes || [],
    };
  }

  function toArtist(row) {
    const pic = row.pic_path ? publicUrl(row.pic_path) : '';
    return { id: row.id, source: 'solam', name: row.name, genre: row.genre, followers: 0, trackCount: 0, pic, thumb: pic, cover: row.cover_path ? publicUrl(row.cover_path) : '', bio: '' };
  }

  const list = async (query, token) => (await raw(`/rest/v1/tracks?select=${TRACK_FIELDS}&${query}`, { token })).map(toTrack);
  const safeTerm = (term) => String(term).replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim().slice(0, 60);

  async function getState() {
    if (!(await validToken().catch(() => null))) return { configured: true, user: null, artist: null, isAdmin: false, google: false };
    const token = session.access;
    const [artists, admins] = await Promise.all([
      raw(`/rest/v1/artists?id=eq.${session.user.id}&select=${ARTIST_FIELDS}`, { token }).catch(() => []),
      raw(`/rest/v1/admins?user_id=eq.${session.user.id}&select=user_id`, { token }).catch(() => []),
    ]);
    return { configured: true, user: session.user, artist: artists?.[0] ? toArtist(artists[0]) : null, isAdmin: Boolean(admins?.length), google: false };
  }

  // A browser only allows a file chooser straight after a tap, so this opens right away.
  function pickFile(kind) {
    const audio = kind === 'audio';
    const video = kind === 'video';
    const types = audio ? AUDIO_TYPES : video ? VIDEO_TYPES : PHOTO_TYPES;
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = Object.keys(types).map((ext) => `.${ext}`).join(',');
      input.style.display = 'none';
      document.body.append(input);
      const done = () => input.remove();
      input.addEventListener('cancel', () => { done(); resolve(null); });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        done();
        if (!file) { resolve(null); return; }
        const extension = file.name.split('.').pop().toLowerCase();
        const type = types[extension];
        if (!type) { reject(new Error('bad-file-type')); return; }
        if (file.size > (audio || video ? MAX_UPLOAD_BYTES : MAX_PHOTO_BYTES)) { reject(new Error(audio || video ? 'file-too-big' : 'photo-too-big')); return; }
        const id = crypto.randomUUID();
        const info = { file, type, extension, duration: 0 };
        if (audio) info.duration = await audioLength(file);
        picked.set(id, info);
        resolve({ id, name: file.name, size: file.size, duration: info.duration, title: file.name.replace(/\.[^.]+$/, '') });
      });
      input.click();
    });
  }

  function audioLength(file) {
    return new Promise((resolve) => {
      const probe = new Audio();
      const url = URL.createObjectURL(file);
      const finish = (value) => { URL.revokeObjectURL(url); resolve(value); };
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => finish(Number.isFinite(probe.duration) ? probe.duration : 0);
      probe.onerror = () => finish(0);
      setTimeout(() => finish(0), 8000);
      probe.src = url;
    });
  }

  async function putFile(token, id) {
    const info = picked.get(id);
    if (!info) throw new Error('pick-again');
    const target = `${session.user.id}/${crypto.randomUUID()}.${info.extension}`;
    await raw(`/storage/v1/object/${BUCKET}/${target}`, { method: 'POST', token, body: info.file, headers: { 'Content-Type': info.type }, timeout: 15 * 60 * 1000 });
    return target;
  }

  const removeFiles = (prefixes, token) => json(`/storage/v1/object/${BUCKET}`, 'DELETE', { prefixes }, {}, token);

  const actions = {
    state: getState,
    async signUp(email, password, acceptedTerms) {
      if (!acceptedTerms) throw new Error('terms-needed');
      const data = await json(`/auth/v1/signup?redirect_to=${encodeURIComponent(`${SITE}confirmed.html`)}`, 'POST', { email, password, data: { terms_accepted_at: new Date().toISOString() } });
      return { signedIn: adoptSession(data) };
    },
    async signIn(email, password) {
      return { signedIn: adoptSession(await json('/auth/v1/token?grant_type=password', 'POST', { email, password })) };
    },
    async signOut() {
      const token = await validToken().catch(() => null);
      if (token) await raw('/auth/v1/logout', { method: 'POST', token }).catch(() => {});
      session = null;
      saveSession();
    },
    async requestReset(email) {
      await json(`/auth/v1/recover?redirect_to=${encodeURIComponent(`${SITE}reset.html`)}`, 'POST', { email: String(email).trim() });
    },
    google() {
      throw new Error('Google sign-in isn’t available yet.');
    },
    async saveArtist({ realName, appName, birthDate, genre, ownsMusic }) {
      const token = await requireToken();
      if (fullYearsSince(birthDate) < MIN_UPLOAD_AGE) throw new Error('under-age');
      if (!ownsMusic) throw new Error('rights-needed');
      const name = String(appName).trim();
      const real = String(realName).trim();
      const style = String(genre).trim();
      if (name.length < 2 || real.length < 2 || !style) throw new Error('form-incomplete');
      const upsert = { Prefer: 'resolution=merge-duplicates' };
      try {
        await json('/rest/v1/artists', 'POST', { id: session.user.id, name, genre: style }, upsert, token);
      } catch (error) {
        if (error.status === 409) throw new Error('name-taken');
        throw error;
      }
      await json('/rest/v1/artist_private', 'POST', { id: session.user.id, real_name: real }, upsert, token);
      return getState();
    },
    pickFile,
    async upload({ audioId, artId, title, genre, ownsMusic, lyrics, allowDownload }) {
      const token = await requireToken();
      if (!ownsMusic) throw new Error('rights-needed');
      const cleanTitle = String(title).trim().slice(0, 120);
      if (!cleanTitle) throw new Error('form-incomplete');
      const duration = Math.round(picked.get(audioId)?.duration || 0);
      const audioPath = await putFile(token, audioId);
      const artPath = artId ? await putFile(token, artId) : null;
      try {
        await json('/rest/v1/tracks', 'POST', { title: cleanTitle, genre: String(genre || '').slice(0, 40), audio_path: audioPath, art_path: artPath, duration, rights_confirmed: true, lyrics: String(lyrics || '').trim().slice(0, 20000) || null, allow_download: allowDownload === true }, {}, token);
      } catch (error) {
        await removeFiles([audioPath, artPath].filter(Boolean), token).catch(() => {});
        if (/daily upload limit/.test(error.message)) throw new Error('daily-limit');
        throw error;
      }
      picked.delete(audioId);
      if (artId) picked.delete(artId);
    },
    async uploadImage(kind, fileId) {
      const token = await requireToken();
      const column = { pic: 'pic_path', cover: 'cover_path' }[kind];
      if (!column) throw new Error('Bad image kind');
      const rows = await raw(`/rest/v1/artists?id=eq.${session.user.id}&select=${column}`, { token });
      const target = await putFile(token, fileId);
      await json(`/rest/v1/artists?id=eq.${session.user.id}`, 'PATCH', { [column]: target }, {}, token);
      picked.delete(fileId);
      const previous = rows?.[0]?.[column];
      if (previous) await removeFiles([previous], token).catch(() => {});
      return getState();
    },
    myTracks: async () => list(`user_id=eq.${session?.user?.id}&order=created_at.desc&limit=100`, await requireToken()),
    pending: async () => list('status=eq.pending&order=created_at.asc&limit=100', await requireToken()),
    async setStatus(id, status) {
      if (!['approved', 'rejected'].includes(status)) throw new Error('Bad status');
      await json(`/rest/v1/tracks?id=eq.${encodeURIComponent(id)}`, 'PATCH', { status }, {}, await requireToken());
    },
    async removeTrack(id) {
      const token = await requireToken();
      const rows = await raw(`/rest/v1/tracks?id=eq.${encodeURIComponent(id)}&select=audio_path,art_path`, { token });
      await raw(`/rest/v1/tracks?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token });
      const prefixes = [rows?.[0]?.audio_path, rows?.[0]?.art_path].filter(Boolean);
      if (prefixes.length) await removeFiles(prefixes, token).catch(() => {});
    },
    countPlay: (id, listener) => json('/rest/v1/rpc/count_play', 'POST', { track: id, listener: listener || null }).catch(() => {}),
    async report({ key, title, artist, reason }) {
      const clean = String(reason || '').trim();
      if (clean.length < 3) throw new Error('reason-needed');
      const token = await validToken().catch(() => null);
      await json('/rest/v1/reports', 'POST', { track_key: String(key).slice(0, 300), title: String(title).slice(0, 300), artist: String(artist).slice(0, 300), reason: clean.slice(0, 500) }, {}, token || undefined);
    },
    reports: async () => raw('/rest/v1/reports?select=id,track_key,title,artist,reason,created_at&order=created_at.asc&limit=100', { token: await requireToken() }),
    clearReport: async (id) => raw(`/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token: await requireToken() }),
    hideTrack: async (key) => json('/rest/v1/hidden_tracks', 'POST', { track_key: key }, { Prefer: 'resolution=ignore-duplicates' }, await requireToken()),
    hidden: async () => (await raw('/rest/v1/hidden_tracks?select=track_key&limit=5000')).map((row) => row.track_key),
    async deleteAccount() {
      const token = await requireToken();
      const listed = await json(`/storage/v1/object/list/${BUCKET}`, 'POST', { prefix: session.user.id, limit: 1000 }, {}, token);
      const prefixes = (listed || []).map((file) => `${session.user.id}/${file.name}`);
      if (prefixes.length) await removeFiles(prefixes, token);
      await json('/rest/v1/rpc/delete_my_account', 'POST', {}, {}, token);
      session = null;
      saveSession();
    },
    async pullData() {
      const rows = await raw(`/rest/v1/user_data?user_id=eq.${session?.user?.id}&select=data`, { token: await requireToken() });
      return rows?.[0]?.data || null;
    },
    async pushData(data) {
      const token = await validToken();
      if (token) await json('/rest/v1/user_data', 'POST', { user_id: session.user.id, data, updated_at: new Date().toISOString() }, { Prefer: 'resolution=merge-duplicates' }, token);
    },
  };

  Object.assign(actions, window.SolamSocial.createSocial({ raw, json, validToken, requireToken, userId: () => session?.user?.id, list }));

  async function searchTracks(term) {
    const clean = safeTerm(term);
    return clean ? list(`status=eq.approved&title=ilike.*${encodeURIComponent(clean)}*&order=plays.desc&limit=25`) : [];
  }

  async function searchArtists(term) {
    const clean = safeTerm(term);
    const filter = clean ? `name=ilike.*${encodeURIComponent(clean)}*&` : '';
    return (await raw(`/rest/v1/artists?${filter}select=${ARTIST_FIELDS}&limit=30`)).map(toArtist);
  }

  async function artistPage(id) {
    const rows = await raw(`/rest/v1/artists?id=eq.${encodeURIComponent(id)}&select=${ARTIST_FIELDS}`);
    if (!rows?.[0]) return null;
    const tracks = await list(`status=eq.approved&user_id=eq.${encodeURIComponent(id)}&order=plays.desc&limit=100`);
    return { ...toArtist(rows[0]), trackCount: tracks.length, tracks, related: [], totalPlays: tracks.reduce((sum, track) => sum + track.plays, 0) };
  }

  window.SolamWebBackend = { actions, searchTracks, searchArtists, artistPage, isOwnFile: (url) => String(url).startsWith(`${config.url}/storage/v1/object/public/${BUCKET}/`) };
})();
