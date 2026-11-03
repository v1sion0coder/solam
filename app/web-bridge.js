// Gives the phone version the same "solam" helpers that the Windows app gets from its main process.
(() => {
  const SITE = 'https://v1sion0coder.github.io/solam/';
  const MAX_OFFLINE_BYTES = 200 * 1024 * 1024;
  const OFFLINE_CACHE = 'solam-offline';
  const OFFLINE_INDEX = 'solam.offline';
  const JSONP_TIMEOUT_MS = 12000;
  const UPDATE_CHECK_EVERY_MS = 60 * 60 * 1000;
  const SAFE_LINKS = /^https:\/\/([a-z0-9-]+\.)*(spotify\.com|google\.com|apple\.com|soundcloud\.com|youtube\.com|deezer\.com)\//;
  const backend = window.SolamWebBackend;
  const noop = () => {};

  async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  // The preview catalog doesn't allow direct browser requests, so it answers through a script tag.
  let jsonpCount = 0;
  function fetchCatalogJson(url) {
    return new Promise((resolve, reject) => {
      const name = `solamJsonp${Date.now()}${jsonpCount++}`;
      const script = document.createElement('script');
      const finish = () => {
        clearTimeout(timer);
        delete window[name];
        script.remove();
      };
      const timer = setTimeout(() => {
        finish();
        reject(new Error('Catalog timed out'));
      }, JSONP_TIMEOUT_MS);
      window[name] = (data) => {
        finish();
        resolve(data);
      };
      script.onerror = () => {
        finish();
        reject(new Error('Catalog unavailable'));
      };
      script.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${name}`;
      document.head.append(script);
    });
  }

  const music = window.SolamMusic.createMusic({ fetchJson, fetchCatalogJson, getBackend: () => backend });

  function readIndex() {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_INDEX) || '{}');
    } catch {
      return {};
    }
  }

  function writeIndex(index) {
    localStorage.setItem(OFFLINE_INDEX, JSON.stringify(index));
  }

  async function offlineId(key) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
    return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  async function imageData(url) {
    if (!String(url).startsWith('https://')) return null;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function offlineSave(track) {
    const url = await music.offlineDownloadUrl(track, backend);
    const response = await fetch(url);
    if (!response.ok) throw new Error('download-failed');
    if (Number(response.headers.get('content-length')) > MAX_OFFLINE_BYTES) throw new Error('file-too-big');
    const blob = await response.blob();
    const key = `${track.source}:${track.id}`;
    const id = await offlineId(key);
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.put(`offline/${id}`, new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg' } }));
    const art = track.thumb || track.art ? await imageData(track.thumb || track.art) : null;
    const entry = { id, key, size: blob.size, track: { ...track, fallbacks: [], artMirrors: [], art: art || '', thumb: art || '' } };
    const index = readIndex();
    index[id] = entry;
    writeIndex(index);
    return entry;
  }

  // Asks the website for the newest version, and tells the app when this copy is older.
  let tellUpdate = noop;
  let offeredVersion = null;
  async function checkForNewVersion() {
    try {
      const response = await fetch('../version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (version && version !== window.SOLAM_VERSION && version !== offeredVersion) {
        offeredVersion = version;
        tellUpdate({ state: 'available', version });
      }
    } catch {
      // Being offline is fine: it checks again later.
    }
  }

  // Fetches the new app files, then reopens the app on them.
  async function installNewVersion() {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
    } catch {
      // Reloading still fetches the newest files.
    }
    window.location.reload();
  }

  window.solam = {
    platform: 'web',
    minimize: noop, maximize: noop, close: noop, onMaximized: noop,
    reload: () => window.location.reload(),
    toggleMini: noop, closeMini: noop, focusMain: noop, onMiniState: noop,
    sendNowPlaying: noop, sendSpectrum: noop, sendCommand: noop, onNowPlaying: noop, onSpectrum: noop, onCommand: noop,
    getLibrary: async () => ({ folders: [], tracks: [] }),
    addFolder: async () => ({ folders: [], tracks: [] }),
    removeFolder: async () => ({ folders: [], tracks: [] }),
    localArt: async () => null,
    search: (term) => music.searchAll(term),
    trending: () => music.trending(),
    similar: (genre) => music.similar(genre),
    topArtists: () => music.topArtists(),
    searchArtists: (term) => music.searchArtists(String(term)),
    solamArtists: () => backend.searchArtists(''),
    artist: (source, id) => music.loadArtist(source, id),
    previewUrl: (id) => music.previewUrl(id),
    matchSong: (title, artist) => music.matchSong(title, artist),
    matchArtist: (name) => music.matchArtist(name),
    artistTop: (name) => music.artistTop(name),
    offlineList: async () => Object.values(readIndex()),
    offlineSave,
    offlineRemove: async (id) => {
      const index = readIndex();
      delete index[id];
      writeIndex(index);
      await (await caches.open(OFFLINE_CACHE)).delete(`offline/${id}`);
    },
    offlineUrl: async (id) => {
      const stored = await (await caches.open(OFFLINE_CACHE)).match(`offline/${id}`);
      return stored ? URL.createObjectURL(await stored.blob()) : null;
    },
    onUpdateState: (callback) => {
      tellUpdate = callback;
      checkForNewVersion();
      setInterval(checkForNewVersion, UPDATE_CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkForNewVersion();
      });
    },
    downloadUpdate: installNewVersion,
    installUpdate: installNewVersion,
    appVersion: async () => window.SOLAM_VERSION,
    latestVersion: async () => window.SOLAM_VERSION,
    openSite: (page) => window.open(SITE + page, '_blank', 'noopener'),
    openLink: (url) => {
      if (SAFE_LINKS.test(String(url))) window.open(url, '_blank', 'noopener');
    },
    server: async (name, ...args) => {
      try {
        return { ok: true, value: await backend.actions[name](...args) };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    setMemoryBudget: noop,
    onMemoryReport: noop,
    clearPageCache: noop,
    searchArchive: (term) => music.searchArchive(String(term)),
    archiveAlbum: (id) => music.loadArchiveAlbum(String(id)),
    lyrics: (track) => music.loadLyrics(track).catch(() => null),
    imageData,
  };
})();
