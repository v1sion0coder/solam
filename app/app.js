(() => {
  const api = window.solam;
  const $ = (selector) => document.querySelector(selector);
  const t = window.solamT;
  const isWeb = api.platform === 'web';
  // iPhones ignore volume set by a page, so blending songs and the volume slider can't work there.
  const fixedVolume = (() => {
    const probe = new Audio();
    probe.volume = 0.5;
    return probe.volume !== 0.5;
  })();
  document.body.classList.toggle('web', isWeb);
  const SILENT_AUDIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

  // The browser writes empty parts of a page as the word "null", so they are removed first.
  for (const method of ['append', 'replaceChildren']) {
    const original = Element.prototype[method];
    Element.prototype[method] = function addNodes(...nodes) {
      original.apply(this, nodes.filter((node) => node !== null && node !== undefined && node !== false));
    };
  }

  const STORAGE_KEY = 'solam.settings';
  const DEFAULTS = {
    theme: 'aurora',
    tint: 0.3,
    tintColor: 'auto',
    blur: 22,
    refraction: 28,
    radius: 26,
    quality: 'medium',
    speed: 1,
    brightness: 1,
    rippleOn: true,
    ripple: 1,
    beatOn: true,
    beat: 0.25,
    wobbleOn: true,
    wobble: 0.25,
    shineOn: true,
    shine: 0.25,
    reactive: true,
    volume: 0.85,
    crossfadeOn: true,
    crossfade: 6,
    autoplay: true,
    extraMotion: true,
    language: 'auto',
  };
  const THEMES = [
    ['aurora', 'Aurora', [8, 34, 50]],
    ['ocean', 'Deep Ocean', [2, 36, 58]],
    ['galaxy', 'Galaxy', [18, 14, 52]],
    ['lava', 'Lava', [48, 14, 10]],
    ['neon', 'Neon City', [28, 10, 58]],
    ['album', 'Album Colors', null],
  ];
  const TINTS = {
    auto: ['Auto', null],
    dark: ['Dark', [8, 10, 18]],
    white: ['White', [235, 240, 250]],
    blue: ['Blue', [24, 74, 160]],
    pink: ['Pink', [150, 40, 110]],
  };
  const GENRES = ['Hip hop', 'Electronic', 'Lo-fi', 'House', 'Rock', 'Jazz', 'Ambient'];
  const RECENT_KEY = 'solam.recent';
  const RECENT_LIMIT = 8;
  const MIN_UPLOAD_AGE = 13;
  const MANUAL_FADE_SECONDS = 1.2;
  const SLEEP_FADE_SECONDS = 15;
  const PLAY_COUNT_AFTER_SECONDS = 20;
  const MAX_SKIPS_IN_A_ROW = 5;
  const PREVIEW_VOLUME_SCALE = 0.55;
  const PAGES_FREED_ON_LEAVE = ['artists', 'artist', 'collection', 'library', 'connectors', 'upload', 'account', 'settings'];
  const ICONS = {
    home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
    library: 'M5 4h2v16H5zM10 4h2v16h-2zM15 4.5l2-.5 4 15.5-2 .5z',
    settings: 'm19.4 13 .1-1-.1-1 2-1.6-2-3.4-2.4.9a7 7 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5zM13 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h4v14H7zm6 0h4v14h-4z',
    prev: 'M6 5h2.4v14H6zm3.5 7L19 19V5z',
    next: 'M15.6 5H18v14h-2.4zM5 5v14l9.5-7z',
    mini: 'M3 5h18v14H3zm2 2v10h14V7zm6 5h7v4h-7z',
    close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
    down: 'M6.4 8.4 12 14l5.6-5.6L19 9.8l-7 7-7-7z',
    artists: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6zM18 11a3 3 0 0 0 0-6v6zm1.5 2.2c1.5.9 2.5 2.5 2.5 4.3h-1.5c0-1.6-.8-3-2.2-3.8zM6 11V5a3 3 0 0 0 0 6zm-1.5 2.2-.8.5C2.3 14.5 1.5 15.9 1.5 17.5H0c0-1.8 1-3.4 2.5-4.3z',
    collection: 'M12.1 20.4 12 20.5l-.1-.1C7.1 16.1 4 13.3 4 9.9 4 7.5 5.9 5.6 8.3 5.6c1.4 0 2.7.6 3.7 1.7 1-1.1 2.3-1.7 3.7-1.7C18.100 5.600 20 7.500 20 9.900c0 3.400-3.100 6.200-7.900 10.500z',
    upload: 'M11 16V7.800L7.700 11.100 6.300 9.700 12 4l5.700 5.700-1.400 1.400L13 7.800V16zm-6 4v-5h2v3h10v-3h2v5z',
    premium: 'm12 3 2.700 5.800 6.300.8-4.600 4.300 1.200 6.200L12 17l-5.600 3.100 1.200-6.200L3 9.600l6.300-.8z',
    account: 'M12 12a4.500 4.500 0 1 0 0-9 4.500 4.500 0 0 0 0 9zm-8 9c0-4 3.600-7 8-7s8 3 8 7z',
    heart: 'M12 20.300 10.800 19.200C6.400 15.200 3.500 12.600 3.500 9.300 3.500 6.700 5.600 4.700 8.100 4.700c1.500 0 2.900.7 3.900 1.800 1-1.100 2.400-1.800 3.900-1.800 2.500 0 4.600 2 4.600 4.600 0 3.300-2.900 5.900-7.300 9.900zM8.100 6.500C6.500 6.500 5.300 7.700 5.300 9.300c0 2.400 2.500 4.700 6.700 8.500 4.200-3.800 6.700-6.100 6.700-8.500 0-1.600-1.200-2.800-2.800-2.800-1.300 0-2.500.8-3 2h-1.800c-.5-1.200-1.700-2-3-2z',
    heartFill: 'M12 20.300 10.800 19.200C6.400 15.200 3.500 12.600 3.500 9.300 3.500 6.700 5.600 4.700 8.100 4.700c1.500 0 2.900.7 3.900 1.800 1-1.100 2.400-1.800 3.900-1.800 2.500 0 4.600 2 4.600 4.600 0 3.300-2.900 5.900-7.300 9.900z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
    connectors: 'M8 3h2v5h4V3h2v5h2v4a6 6 0 0 1-5 5.900V22h-2v-4.100A6 6 0 0 1 6 12V8h2zm0 7v2a4 4 0 0 0 8 0v-2z',
    more: 'M5 10.200a1.800 1.800 0 1 0 0 3.600 1.800 1.800 0 0 0 0-3.600zm7 0a1.800 1.800 0 1 0 0 3.600 1.800 1.800 0 0 0 0-3.600zm7 0a1.800 1.800 0 1 0 0 3.600 1.800 1.800 0 0 0 0-3.600z',
    download: 'M11 4h2v9.200l3.300-3.300 1.400 1.400L12 17l-5.700-5.700 1.400-1.400L11 13.200zM5 18h14v2H5z',
    check: 'M12 2.500 14.400 4.300 17.400 4.200 18.300 7.100 20.700 8.900 19.700 11.700 20.700 14.500 18.300 16.300 17.400 19.200 14.400 19.100 12 20.900 9.600 19.100 6.600 19.200 5.700 16.300 3.300 14.500 4.300 11.700 3.300 8.900 5.700 7.100 6.600 4.200 9.600 4.300zM10.800 15.300 16.500 9.600 15.100 8.200 10.800 12.500 8.900 10.600 7.500 12z',
    minimize: 'M4 11.2h16v1.6H4z',
    maximize: 'M5 5h14v14H5zm1.6 1.6v10.8h10.8V6.6z',
  };

  let settings = loadSettings();
  if (isWeb) settings.reactive = false;
  if (fixedVolume) settings.crossfadeOn = false;
  let lightGlassForMemory = false;
  let memoryTrims = 0;
  const engine = new window.ThemeEngine($('#bg'));
  const decks = [$('#audio'), $('#audio2')];
  let audio = decks[0];
  decks.forEach((deck) => deck.setAttribute('playsinline', ''));

  /* ---------- helpers ---------- */

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'onclick' || key === 'oninput' || key === 'onkeydown') element[key] = value;
      else if (key === 'class') element.className = value;
      else if (key === 'text' && props.raw === undefined) element.textContent = t(value, props.values);
      else if (key === 'raw' && value !== undefined) element.textContent = value === null || value === 'null' ? '' : value;
      else if (key === 'text' || key === 'raw' || key === 'values') continue;
      else if (['placeholder', 'title', 'aria-label'].includes(key) && value) element.setAttribute(key, t(value));
      else if (value !== undefined && value !== null && value !== false) element.setAttribute(key, value);
    }
    element.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
    return element;
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ICONS[name]);
    svg.append(path);
    return svg;
  }

  function setIcon(button, name) {
    button.replaceChildren(icon(name));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const whole = Math.floor(seconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = String(whole % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
  }

  let toastTimer = 0;
  function toast(message, values) {
    const element = $('#toast');
    element.textContent = t(message, values);
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 3400);
  }

  // Cover art is stored on several servers. When one is down, try the others, then show no image.
  const artServers = new Set();
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.getAttribute('src')) return;
    const tried = (image.dataset.tried || '').split('|');
    const server = [...artServers].find((origin) => !tried.includes(origin));
    let url = null;
    try {
      url = new URL(image.src);
    } catch {
      // Not a URL we can retry.
    }
    if (server && url?.pathname.startsWith('/content/')) {
      image.dataset.tried = [...tried, server].join('|');
      image.src = server + url.pathname;
    } else {
      image.removeAttribute('src');
      image.style.visibility = 'hidden';
    }
  }, true);

  function setFill(range) {
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 1;
    range.style.setProperty('--fill', `${((Number(range.value) - min) / (max - min)) * 100}%`);
  }

  function wobble(element) {
    if (settings.wobbleOn) window.LiquidGlass.wobble(element, settings.wobble);
  }

  /* ---------- settings ---------- */

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Settings simply won't persist this session.
    }
  }

  function currentTintRgb() {
    const chosen = TINTS[settings.tintColor]?.[1];
    if (chosen) return chosen;
    const theme = THEMES.find(([id]) => id === settings.theme);
    if (theme?.[2]) return theme[2];
    return engine.targetColors[0].map((value) => Math.round(value * 90));
  }

  function applySettings() {
    const root = document.documentElement.style;
    root.setProperty('--tint-rgb', currentTintRgb().join(', '));
    root.setProperty('--tint-a', String(0.02 + settings.tint * 0.72));
    root.setProperty('--radius', `${settings.radius}px`);
    root.setProperty('--shine', String(settings.shineOn ? settings.shine : 0));
    document.documentElement.classList.toggle('calm', !settings.extraMotion);
    document.documentElement.classList.toggle('quality-high', settings.quality === 'high');
    api.setMemoryBudget(settings.quality);
    engine.theme = settings.theme;
    engine.setQuality(settings.quality);
    engine.speed = settings.speed;
    engine.brightness = settings.brightness;
    engine.rippleAmount = settings.rippleOn ? settings.ripple : 0;
    const light = settings.quality === 'low' || (lightGlassForMemory && settings.quality !== 'high');
    document.documentElement.classList.toggle('light-glass', light);
    window.LiquidGlass.configure({
      enabled: !light && settings.refraction > 0,
      refraction: settings.refraction,
      blur: light ? 0 : settings.blur,
    });
    setupAudioReactive();
  }

  function changeSetting(key, value) {
    settings[key] = value;
    saveSettings();
    applySettings();
  }

  /* ---------- system audio analysis for the visuals ---------- */

  const analysis = { context: null, analyser: null, stream: null, data: null, starting: false, slowBass: 0, beat: 0, bass: 0 };

  async function startAnalysis() {
    if (isWeb || analysis.analyser || analysis.starting || !settings.reactive) return;
    analysis.starting = true;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach((track) => track.stop());
      if (!stream.getAudioTracks().length) throw new Error('No system audio track');
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.72;
      context.createMediaStreamSource(new MediaStream(stream.getAudioTracks())).connect(analyser);
      Object.assign(analysis, { context, analyser, stream, data: new Uint8Array(analyser.frequencyBinCount) });
    } catch (error) {
      console.warn('Music-reactive visuals unavailable:', error);
    }
    analysis.starting = false;
  }

  function stopAnalysis() {
    analysis.stream?.getTracks().forEach((track) => track.stop());
    analysis.context?.close();
    Object.assign(analysis, { context: null, analyser: null, stream: null, data: null, bass: 0, beat: 0, slowBass: 0 });
  }

  function setupAudioReactive() {
    if (!settings.reactive) stopAnalysis();
    else if (firstGestureSeen) startAnalysis();
  }

  let firstGestureSeen = false;
  window.addEventListener('pointerdown', () => {
    firstGestureSeen = true;
    startAnalysis();
  }, { capture: true });

  function updateAnalysis() {
    if (analysis.analyser) {
      analysis.analyser.getByteFrequencyData(analysis.data);
      let sum = 0;
      for (let i = 1; i < 9; i++) sum += analysis.data[i];
      analysis.bass = sum / 8 / 255;
      analysis.slowBass += (analysis.bass - analysis.slowBass) * 0.035;
      const spike = Math.max(0, analysis.bass - analysis.slowBass * 1.08) * 3.2;
      analysis.beat = Math.max(spike, analysis.beat * 0.9);
    }
    const strength = settings.beatOn ? settings.beat * 4 * Math.min(1, settings.beat + 0.75) : 0;
    engine.level.bass = analysis.bass * Math.min(1, strength);
    engine.level.beat = analysis.beat * Math.min(1, strength);
    const scale = settings.beatOn ? 1 + analysis.beat * settings.beat * 0.024 : 1;
    pulseTargets.forEach((element) => {
      element.style.transform = scale === 1 ? '' : `scale(${scale.toFixed(4)})`;
    });
  }

  function spectrumBars(count) {
    const bars = new Array(count).fill(0);
    if (!analysis.analyser) return bars;
    const usable = analysis.data.length * 0.62;
    for (let i = 0; i < count; i++) {
      const start = Math.floor((i / count) ** 2 * usable);
      const end = Math.max(start + 1, Math.floor(((i + 1) / count) ** 2 * usable));
      let peak = 0;
      for (let j = start; j < end; j++) peak = Math.max(peak, analysis.data[j]);
      bars[i] = peak / 255;
    }
    return bars;
  }

  /* ---------- player ---------- */

  const NOTHING = { source: null, title: '', artist: '', album: '', art: '', pos: 0, dur: 0, playing: false, badge: '', lossless: false };
  const player = { queue: [], index: -1, np: { ...NOTHING }, seeking: false, sources: [], counted: false, skips: 0 };
  const fade = { timer: 0, active: false, from: null, to: null };
  const sleep = { timer: 0, ends: 0 };

  function localUrl(filePath) {
    return `solam-media://track/?p=${encodeURIComponent(filePath)}`;
  }

  function qualityBadge(track) {
    if (track.source === 'online') return { badge: t('Online'), lossless: false };
    if (track.source === 'solam') return { badge: 'Solam', lossless: false };
    if (track.source === 'preview') return { badge: t('30s preview'), lossless: false };
    if (track.source === 'imported') return { badge: t('Imported'), lossless: false };
    if (track.source === 'free') return { badge: track.format || 'Free', lossless: track.format === 'FLAC' };
    if (track.lossless) {
      const detail = [track.bits ? `${track.bits}-bit` : '', track.sampleRate ? `${(track.sampleRate / 1000).toFixed(1).replace('.0', '')} kHz` : ''].filter(Boolean).join(' / ');
      return { badge: detail ? `${t('Lossless')} ${detail}` : t('Lossless'), lossless: true };
    }
    return { badge: track.bitrate ? `${Math.round(track.bitrate / 1000)} kbps` : String(track.codec || t('File')), lossless: false };
  }

  function targetVolume() {
    return settings.volume * (player.queue[player.index]?.source === 'preview' ? PREVIEW_VOLUME_SCALE : 1);
  }

  function playQueue(queue, index) {
    player.queue = [...queue];
    player.index = index;
    loadCurrent();
  }

  async function loadCurrent(fadeSeconds = settings.crossfadeOn ? MANUAL_FADE_SECONDS : 0) {
    let track = player.queue[player.index];
    if (!track) return;
    if (track.source === 'imported') {
      const asked = track;
      setNowPlaying({ source: 'imported', title: track.title, artist: track.artist, art: '', pos: 0, dur: 0, playing: false, badge: t('Finding song…'), lossless: false });
      const found = await api.matchSong(track.title, track.artist).catch(() => null);
      if (player.queue[player.index] !== asked) return;
      if (!found) {
        toast('{title} isn’t available in Solam.', { title: track.title });
        if (player.queue[player.index + 1] && player.skips < MAX_SKIPS_IN_A_ROW) {
          player.skips += 1;
          step(1);
        } else {
          player.skips = 0;
        }
        return;
      }
      player.queue[player.index] = found;
      track = found;
    }
    recordRecent(track);
    player.counted = false;
    setNowPlaying({
      source: track.source,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      art: track.art || '',
      genre: track.genre || '',
      pos: 0,
      dur: track.duration || 0,
      playing: true,
      ...qualityBadge(track),
    });
    refreshHearts();
    const offline = offlineFiles.get(trackKey(track));
    if (track.source === 'preview' && !offline) {
      // Preview links expire, so saved songs get a fresh one.
      const fresh = await api.previewUrl(track.id).catch(() => null);
      if (player.queue[player.index] !== track) return;
      if (fresh) track.url = fresh;
    }
    const offlineUrl = offline ? await api.offlineUrl(offline.id) : null;
    if (offlineUrl) player.sources = [offlineUrl];
    else player.sources = track.path ? [localUrl(track.path)] : [track.url, ...(track.fallbacks || [])];
    if (settings.autoplay && !player.queue[player.index + 1]) extendQueue(track);
    await playNextSource(track, fadeSeconds);
    if (track.path && !track.art) {
      const art = await api.localArt(track.path);
      if (art && player.queue[player.index] === track) {
        track.art = art;
        setNowPlaying({ art });
      }
    }
  }

  // Keeps the music going with similar songs when the list runs out.
  async function extendQueue(track) {
    try {
      const known = new Set(player.queue.map(trackKey));
      const more = (await api.similar(track.genre || favouriteGenre())).filter((item) => !known.has(trackKey(item)));
      for (let i = more.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [more[i], more[j]] = [more[j], more[i]];
      }
      if (player.queue[player.index] === track) player.queue.push(...more.slice(0, 10));
    } catch {
      // The list just ends here.
    }
  }

  function finishFade() {
    clearInterval(fade.timer);
    if (fade.from) {
      fade.from.pause();
      fade.from.removeAttribute('src');
      fade.from.load();
    }
    if (fade.to) fade.to.volume = targetVolume();
    Object.assign(fade, { active: false, from: null, to: null });
  }

  function startFade(from, to, seconds) {
    Object.assign(fade, { active: true, from, to });
    const started = performance.now();
    const fromVolume = from.volume;
    fade.timer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / (seconds * 1000));
      from.volume = fromVolume * Math.cos((progress * Math.PI) / 2);
      to.volume = targetVolume() * Math.sin((progress * Math.PI) / 2);
      if (progress >= 1) finishFade();
    }, 40);
  }

  // Online songs live on several servers, so a busy one just moves on to the next.
  async function playNextSource(track, fadeSeconds = 0) {
    const source = player.sources.shift();
    if (!source) {
      toast('{title} couldn’t be loaded. Its server may be busy, so try again or pick another.', { title: track.title });
      // Keeps the music going when a song's servers are all down.
      if (player.queue[player.index + 1] && player.skips < MAX_SKIPS_IN_A_ROW) {
        player.skips += 1;
        step(1);
      } else {
        player.skips = 0;
        setNowPlaying({ playing: false });
      }
      return;
    }
    if (fade.active && fadeSeconds > 0) finishFade();
    if (fadeSeconds > 0 && audio.getAttribute('src') && !audio.paused) {
      const outgoing = audio;
      audio = decks[0] === audio ? decks[1] : decks[0];
      audio.volume = 0;
      startFade(outgoing, audio, fadeSeconds);
    } else if (!fade.active) {
      audio.volume = targetVolume();
    }
    audio.src = source;
    try {
      await audio.play();
    } catch (error) {
      // Load failures are handled by the audio element's error event.
      if (error.name === 'NotAllowedError') setNowPlaying({ playing: false });
    }
  }

  function step(direction) {
    const next = player.index + direction;
    if (player.queue[next]) {
      player.index = next;
      loadCurrent();
    }
  }

  function togglePlay() {
    if (!audio.getAttribute('src')) return;
    if (fade.active) finishFade();
    if (audio.paused) audio.play().catch(() => toast('Couldn’t resume playback.'));
    else audio.pause();
  }

  function seekTo(seconds) {
    if (audio.getAttribute('src')) audio.currentTime = seconds;
  }

  decks.forEach((deck) => {
    deck.addEventListener('play', () => {
      if (deck === audio) setNowPlaying({ playing: true });
    });
    deck.addEventListener('pause', () => {
      if (deck === audio) setNowPlaying({ playing: false });
    });
    deck.addEventListener('timeupdate', () => {
      if (deck !== audio) return;
      if (deck.currentTime > 0) player.skips = 0;
      const dur = Number.isFinite(deck.duration) ? deck.duration : player.np.dur;
      setNowPlaying({ pos: deck.currentTime, dur });
      const track = player.queue[player.index];
      if (!player.counted && track?.source === 'solam' && deck.currentTime >= PLAY_COUNT_AFTER_SECONDS) {
        player.counted = true;
        api.server('countPlay', track.id);
      }
      const blend = settings.crossfade;
      if (settings.crossfadeOn && !fade.active && !deck.paused && dur > blend * 3 && dur - deck.currentTime <= blend && player.queue[player.index + 1]) {
        player.index += 1;
        loadCurrent(blend);
      }
    });
    deck.addEventListener('ended', () => {
      if (deck !== audio) return;
      if (player.queue[player.index + 1]) step(1);
      else setNowPlaying({ playing: false });
    });
    deck.addEventListener('error', () => {
      const track = player.queue[player.index];
      if (deck === audio && track && deck.getAttribute('src')) playNextSource(track);
    });
  });

  if (isWeb) {
    window.addEventListener('pointerdown', () => {
      if (audio.getAttribute('src')) return;
      audio.src = SILENT_AUDIO;
      audio.play().then(() => {
        if (audio.src === SILENT_AUDIO) {
          audio.pause();
          audio.removeAttribute('src');
        }
      }).catch(() => {});
    }, { capture: true, once: true });
  }

  function setSleepTimer(minutes) {
    clearTimeout(sleep.timer);
    sleep.ends = 0;
    if (!minutes) return;
    sleep.ends = Date.now() + minutes * 60000;
    sleep.timer = setTimeout(fadeToSleep, minutes * 60000);
  }

  function fadeToSleep() {
    sleep.ends = 0;
    const started = performance.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / (SLEEP_FADE_SECONDS * 1000));
      audio.volume = targetVolume() * (1 - progress);
      if (progress >= 1) {
        clearInterval(timer);
        audio.pause();
        audio.volume = targetVolume();
        toast('The sleep timer stopped the music. Good night!');
      }
    }, 100);
  }

  function setNowPlaying(patch) {
    const previous = player.np;
    const next = { ...previous, ...patch };
    player.np = next;
    const trackChanged = next.title !== previous.title || next.artist !== previous.artist;
    if (trackChanged) {
      onTrackChanged();
      animateSongChange();
    }
    if (next.art !== previous.art) onArtChanged();
    if (trackChanged || next.art !== previous.art) updateLockScreen(next);
    renderPlayer();
  }

  function renderPlayer() {
    const { np } = player;
    $('#np-title').textContent = np.title || t('Pick something to play');
    $('#np-artist').textContent = np.title ? np.artist : t(isWeb ? 'Search for a song or artist' : 'Search for a song or add your own files');
    const badge = $('#np-badge');
    badge.hidden = !np.badge;
    badge.textContent = np.badge;
    badge.classList.toggle('lossless', Boolean(np.lossless));
    const onlyPreview = hasOnlyPreview(player.queue[player.index]);
    $('#np-full').hidden = !onlyPreview;
    $('#bc-full').hidden = !onlyPreview;
    setIcon($('#np-play'), np.playing ? 'pause' : 'play');
    $('#np-pos').textContent = formatTime(np.pos);
    $('#np-dur').textContent = formatTime(np.dur);
    if (!player.seeking) {
      const seek = $('#np-seek');
      seek.value = np.dur ? String(Math.min(1000, (np.pos / np.dur) * 1000)) : '0';
      setFill(seek);
    }
    $('#bc-title').textContent = np.title || t('Nothing playing');
    $('#bc-artist').textContent = np.artist;
    updateLyricsPosition();
    document.querySelectorAll('.track[data-key]').forEach((row) => {
      row.classList.toggle('playing', row.dataset.key === `${np.title}|${np.artist}`);
    });
    api.sendNowPlaying({ title: np.title, artist: np.artist, art: np.art, playing: np.playing, pos: np.pos, dur: np.dur, badge: np.badge });
  }

  function updateLockScreen(np) {
    if (!('mediaSession' in navigator) || !np.title) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: np.title,
      artist: np.artist,
      album: np.album || 'Solam',
      artwork: np.art ? [{ src: np.art, sizes: '480x480' }] : [],
    });
  }

  function animateSongChange() {
    if (!settings.extraMotion) return;
    const melt = [
      { opacity: 0, transform: 'scale(.9)', filter: 'blur(14px) saturate(1.5)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0) saturate(1)' },
    ];
    const rise = [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }];
    const options = { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' };
    $('#np-art img').animate(melt, options);
    $('#bc-img').animate(melt, options);
    $('#np-title').animate(rise, options);
    $('#np-artist').animate(rise, { ...options, delay: 70, fill: 'backwards' });
    $('#bc-title').animate(rise, options);
    $('#bc-artist').animate(rise, { ...options, delay: 70, fill: 'backwards' });
  }

  function setImage(image, source) {
    delete image.dataset.tried;
    image.style.visibility = '';
    if (source) image.src = source;
    else image.removeAttribute('src');
  }

  async function onArtChanged() {
    const { art } = player.np;
    setImage($('#np-art img'), art);
    setImage($('#bc-img'), art);
    if (!art) return;
    const source = art.startsWith('data:') ? art : await api.imageData(art);
    if (source) extractPalette(source);
  }

  function extractPalette(source) {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, 32, 32);
      const { data } = context.getImageData(0, 0, 32, 32);
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        const peak = Math.max(r, g, b);
        const saturation = peak ? (peak - Math.min(r, g, b)) / peak : 0;
        const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
        const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, weight: 0 };
        const weight = 0.2 + saturation * 2 + peak / 510;
        bucket.r += r * weight;
        bucket.g += g * weight;
        bucket.b += b * weight;
        bucket.weight += weight;
        buckets.set(key, bucket);
      }
      const ranked = [...buckets.values()].sort((a, b) => b.weight - a.weight).map((b) => [b.r / b.weight / 255, b.g / b.weight / 255, b.b / b.weight / 255]);
      const palette = ranked.slice(0, 3);
      while (palette.length < 3) palette.push(palette[0] || [0.2, 0.2, 0.4]);
      engine.setAlbumColors(palette);
      const [r, g, b] = palette[0].map((value) => Math.round(value * 255));
      document.documentElement.style.setProperty('--glow', `${r}, ${g}, ${b}`);
      if (settings.theme === 'album') applyTintOnly();
    };
    image.src = source;
  }

  function applyTintOnly() {
    document.documentElement.style.setProperty('--tint-rgb', currentTintRgb().join(', '));
  }

  /* ---------- lyrics ---------- */

  const lyrics = { lines: [], synced: false, token: 0, currentIndex: -1 };

  function parseSynced(text) {
    const lines = [];
    for (const raw of text.split('\n')) {
      const match = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(raw.trim());
      if (match) lines.push({ time: Number(match[1]) * 60 + Number(match[2]), text: match[3].trim() });
    }
    return lines.filter((line) => line.text);
  }

  function showLyricNote(message) {
    const box = $('#bc-lyrics');
    box.classList.remove('plain');
    box.replaceChildren(h('p', { class: 'lyric-note', text: message }));
  }

  async function onTrackChanged() {
    const { title, artist, album, dur } = player.np;
    const token = ++lyrics.token;
    lyrics.lines = [];
    lyrics.synced = false;
    lyrics.currentIndex = -1;
    if (!title) {
      (await api.offlineList().catch(() => [])).forEach((entry) => offlineFiles.set(entry.key, entry));
    api.server('hidden').then((result) => {
      if (result.ok) result.value.forEach((key) => hiddenTracks.add(key));
    });
    checkForUpdate();
    showLyricNote('Lyrics appear here when a song plays.');
      return;
    }
    showLyricNote('Looking for lyrics…');
    const own = player.queue[player.index]?.lyrics;
    const found = own
      ? { synced: /^\s*\[\d+:\d+/.test(own) ? own : '', plain: own }
      : await api.lyrics({ title, artist, album, duration: dur });
    if (token !== lyrics.token) return;
    if (found?.synced) {
      lyrics.lines = parseSynced(found.synced);
      lyrics.synced = lyrics.lines.length > 0;
    }
    const box = $('#bc-lyrics');
    if (lyrics.synced) {
      box.classList.remove('plain');
      box.replaceChildren(...lyrics.lines.map((line) => h('p', { raw: line.text })));
      updateLyricsPosition();
    } else if (found?.plain) {
      box.classList.add('plain');
      box.replaceChildren(...found.plain.split('\n').map((line) => h('p', { raw: line || ' ' })));
    } else {
      showLyricNote('No lyrics found for this song.');
    }
  }

  function updateLyricsPosition() {
    if (!lyrics.synced) return;
    const { pos } = player.np;
    let index = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= pos + 0.15) index = i;
      else break;
    }
    if (index === lyrics.currentIndex) return;
    lyrics.currentIndex = index;
    const box = $('#bc-lyrics');
    [...box.children].forEach((line, i) => {
      line.classList.toggle('current', i === index);
      line.classList.toggle('past', i < index);
    });
    const current = box.children[index];
    if (current) box.scrollTop = current.offsetTop - box.clientHeight / 2 + current.offsetHeight / 2;
  }

  /* ---------- navigation ---------- */

  const PAGES = [
    ['home', 'Home', 'home'],
    ['artists', 'Artists', 'artists'],
    ['collection', 'Library', 'collection'],
    ...(isWeb ? [] : [['library', 'My Music', 'library']]),
    ['connectors', 'Connectors', 'connectors'],
    ['upload', 'Upload', 'upload'],
    ['premium', 'Premium', 'premium'],
  ];
  const nav = {};
  let activePage = 'home';

  function showPage(id) {
    closeBigCover();
    if (activePage !== id && PAGES_FREED_ON_LEAVE.includes(activePage)) {
      $(`#${activePage}`).replaceChildren();
      api.clearPageCache();
    }
    activePage = id;
    document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === `page-${id}`));
    const lit = id === 'artist' ? 'artists' : id;
    Object.entries(nav).forEach(([key, button]) => button.classList.toggle('active', key === lit));
    closeMenu();
    if (id === 'library') renderLibrary();
    if (id === 'home') renderRecent();
    if (id === 'collection') renderCollection();
    if (id === 'connectors') renderConnectors();
    if (id === 'artists') renderArtists();
    if (id === 'upload') renderUpload();
    if (id === 'account') renderAccount();
    if (id === 'settings') {
      if (!$('#settings').firstChild) buildSettings();
      updateMemoryNote();
      api.appVersion().then((version) => {
        const note = document.getElementById('about-version');
        if (note) note.textContent = t('Beta version {version}', { version });
      });
    }
    const glass = $(`#page-${id}`).firstElementChild;
    if (glass) window.LiquidGlass.attach(glass);
    const panel = $(`#page-${id}`).firstElementChild;
    if (panel) wobble(panel);
  }

  function buildDock() {
    const dock = $('#dock');
    const button = ([id, label, iconName]) => {
      const item = h('button', { class: 'dock-item', title: label, 'aria-label': label, onclick: () => showPage(id) }, icon(iconName), h('span', { text: label }));
      nav[id] = item;
      return item;
    };
    dock.append(...PAGES.map(button), h('div', { class: 'dock-spacer' }), button(['account', 'Account', 'account']), button(['settings', 'Settings', 'settings']));
  }

  /* ---------- lists ---------- */

  function trackRow(track, queue, index) {
    const { badge, lossless } = qualityBadge(track);
    (track.artMirrors || []).forEach((server) => artServers.add(server));
    const image = track.thumb || track.art;
    const artistLabel = track.artistId
      ? h('button', { class: 'artist-link', raw: track.artist, onclick: (event) => { event.stopPropagation(); openArtist(track.artistSource, track.artistId); } })
      : h('span', { raw: [track.artist, track.album].filter(Boolean).join(' · ') });
    const isOffline = offlineFiles.has(trackKey(track));
    const heart = h('button', {
      class: 'icon-button heart',
      'data-track': trackKey(track),
      onclick: (event) => {
        event.stopPropagation();
        toggleFavourite(track);
        wobble(heart);
      },
    });
    const on = isFavourite(track);
    heart.classList.toggle('on', on);
    heart.title = t(on ? 'Remove from favourites' : 'Add to favourites');
    heart.setAttribute('aria-label', heart.title);
    setIcon(heart, on ? 'heartFill' : 'heart');
    const row = h('div', {
      class: 'track',
      role: 'button',
      tabindex: 0,
      'data-key': `${track.title}|${track.artist}`,
      onclick: () => playQueue(queue, index),
      onkeydown: (event) => {
        if (event.key === 'Enter' && event.target === row) playQueue(queue, index);
      },
    },
    image ? h('img', { src: image, alt: '', loading: 'lazy', decoding: 'async' }) : h('div', { class: 'blank' }),
    h('div', { class: 'track-text' }, h('strong', {}, isOffline ? h('span', { class: 'offline-mark', title: 'Downloaded' }, icon('download')) : null, h('span', { raw: track.title })), artistLabel),
    track.plays ? h('span', { class: 'plays', text: '{n} plays', values: { n: formatCount(track.plays) } }) : h('span'),
    h('span', { class: `badge${lossless ? ' lossless' : ''}`, raw: badge }),
    heart,
    h('button', {
      class: 'icon-button add',
      title: 'More',
      'aria-label': 'More',
      onclick: (event) => {
        event.stopPropagation();
        showPlaylistMenu(track, event.currentTarget);
      },
    }, icon('more')),
    h('time', { raw: track.duration ? formatTime(track.duration) : '' }));
    row.style.setProperty('--i', Math.min(index, 14));
    return row;
  }

  function trackList(all, limit = 100) {
    const tracks = all.filter((track) => !hiddenTracks.has(trackKey(track)));
    return h('div', { class: 'track-list' }, ...tracks.slice(0, limit).map((track, index) => trackRow(track, tracks, index)));
  }

  function albumCard(album, onOpen) {
    return h('button', { class: 'album', onclick: onOpen },
      h('img', { src: album.art, alt: '', loading: 'lazy', decoding: 'async' }),
      h('strong', { raw: album.title }),
      h('span', { raw: album.artist }));
  }

  async function openArchiveAlbum(album, container, back) {
    container.replaceChildren(h('p', { class: 'empty', text: 'Opening album…' }));
    try {
      const tracks = (await api.archiveAlbum(album.id)).map((track) => ({ ...track, source: 'free' }));
      container.replaceChildren(
        h('div', { class: 'actions' },
          h('button', { class: 'button small', text: 'Back', onclick: back }),
          tracks.length ? h('button', { class: 'button small', text: 'Play all', onclick: () => playQueue(tracks, 0) }) : null),
        h('h2', { class: 'section-title', raw: album.title }),
        tracks.length ? trackList(tracks) : h('p', { class: 'empty', text: 'This album has no playable tracks.' }));
    } catch {
      container.replaceChildren(
        h('button', { class: 'button small', text: 'Back', onclick: back }),
        h('p', { class: 'empty', text: 'Couldn’t open this album. Check your internet connection.' }));
    }
  }

  async function renderArchiveResults(term, container, limit = 30) {
    container.replaceChildren(h('p', { class: 'empty', text: 'Searching free music…' }));
    try {
      const albums = (await api.searchArchive(term)).slice(0, limit);
      const show = () => {
        if (!albums.length) {
          container.replaceChildren(h('p', { class: 'empty', text: 'No free music found for that search.' }));
          return;
        }
        container.replaceChildren(h('div', { class: 'album-grid' }, ...albums.map((album) => albumCard(album, () => openArchiveAlbum(album, container, show)))));
      };
      show();
    } catch {
      container.replaceChildren(h('p', { class: 'empty', text: 'Free music search is unavailable right now. Check your internet connection.' }));
    }
  }

  /* ---------- home ---------- */

  const homeParts = { input: null, results: null, forYou: null, trending: null, recent: null, artists: null, similar: null, albums: null };
  let searchToken = 0;

  function loadRecent() {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function recordRecent(track) {
    const saved = storableTrack(track);
    const recent = loadRecent().filter((item) => trackKey(item) !== trackKey(saved));
    recent.unshift(saved);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
    } catch {
      // Recently played simply won't be remembered.
    }
    if (activePage === 'home') renderRecent();
  }

  function renderRecent() {
    const recent = loadRecent();
    homeParts.recent.replaceChildren(
      ...(recent.length ? [h('h2', { class: 'section-title', text: 'Recently played' }), trackList(recent)] : []));
  }

  function favouriteGenre() {
    const counts = new Map();
    loadRecent().forEach((track) => {
      if (track.genre) counts.set(track.genre, (counts.get(track.genre) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  async function fillSection(container, title, load, render, failure) {
    container.replaceChildren(h('h2', { class: 'section-title', text: title }), h('p', { class: 'empty', text: 'Loading…' }));
    try {
      const items = await load();
      container.replaceChildren(h('h2', { class: 'section-title', text: title }), items.length ? render(items) : h('p', { class: 'empty', text: 'Nothing trending right now.' }));
      renderPlayer();
    } catch {
      container.replaceChildren(h('h2', { class: 'section-title', text: title }), h('p', { class: 'empty', text: failure }));
    }
  }

  function tasteArtists() {
    const fromImports = Object.values(saved.taste || {}).flatMap((taste) => taste.topArtists || []);
    return [...new Set([...fromImports, ...saved.follows.map((artist) => artist.name)])];
  }

  async function loadForYou() {
    const artists = tasteArtists();
    if (!artists.length) {
      homeParts.forYou.replaceChildren();
      return;
    }
    const picks = artists.slice(0, 30).sort(() => Math.random() - 0.5).slice(0, 5);
    fillSection(homeParts.forYou, 'For you', async () => {
      const tracks = (await Promise.all(picks.map((name) => api.artistTop(name).catch(() => [])))).flat();
      return tracks.sort(() => Math.random() - 0.5).slice(0, 10);
    }, (tracks) => trackList(tracks), 'Couldn’t load trending songs. Check your internet connection.');
  }

  function loadDiscover() {
    loadForYou();
    fillSection(homeParts.trending, 'Trending now', api.trending, (tracks) => trackList(tracks), 'Couldn’t load trending songs. Check your internet connection.');
    fillSection(homeParts.artists, 'Popular artists', api.topArtists, (artists) => artistRow(artists.slice(0, 8)), 'Couldn’t load artists. Check your internet connection.');
    fillSection(homeParts.similar, 'Similar songs for you', async () => {
      const played = new Set(loadRecent().map(trackKey));
      return (await api.similar(favouriteGenre())).filter((track) => !played.has(trackKey(track))).slice(-6);
    }, (tracks) => trackList(tracks), 'Couldn’t load trending songs. Check your internet connection.');
    homeParts.albums.replaceChildren(h('h2', { class: 'section-title', text: 'Free albums' }));
    const albums = h('div', {});
    homeParts.albums.append(albums);
    renderArchiveResults('Electronic', albums, 6);
  }

  function buildHome() {
    for (const part of ['results', 'forYou', 'trending', 'recent', 'artists', 'similar', 'albums']) homeParts[part] = h('div', {});
    const input = h('input', {
      class: 'search',
      placeholder: 'Search for a song or artist',
      'aria-label': 'Search all music',
      onkeydown: (event) => {
        if (event.key === 'Enter' && input.value.trim()) searchEverywhere(input.value.trim());
      },
    });
    homeParts.input = input;
    $('#home').append(
      h('h1', { class: 'page-title', text: 'What do you want to hear?' }),
      h('p', { class: 'page-sub', text: 'Free music, no account needed. Just search and press play.' }),
      input,
      h('div', { class: 'chips' }, ...GENRES.map((genre) => h('button', {
        class: 'chip',
        text: genre,
        onclick: () => {
          input.value = genre;
          searchEverywhere(genre);
        },
      }))),
      homeParts.results,
      homeParts.forYou,
      homeParts.trending,
      homeParts.recent,
      homeParts.artists,
      homeParts.similar,
      homeParts.albums);
    renderRecent();
    loadDiscover();
  }

  async function searchEverywhere(term) {
    const token = ++searchToken;
    const needle = term.toLowerCase();
    const local = library.tracks
      .filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(needle))
      .slice(0, 20)
      .map(toLocalTrack);
    const top = h('div', {});
    const songs = h('div', {}, h('p', { class: 'empty', text: 'Searching…' }));
    const artists = h('div', {});
    const freePart = h('div', {});
    homeParts.results.replaceChildren(
      top,
      h('h2', { class: 'section-title', text: 'Songs' }),
      songs,
      artists,
      h('h2', { class: 'section-title', text: 'Albums' }),
      freePart);
    renderArchiveResults(term, freePart, 12);
    let found = { topArtist: null, artists: [], tracks: [] };
    let failed = false;
    try {
      found = await api.search(term);
    } catch {
      failed = true;
    }
    if (token !== searchToken) return;
    if (found.topArtist) {
      top.replaceChildren(h('h2', { class: 'section-title', text: 'Top result' }), topArtistCard(found.topArtist));
    }
    const others = found.artists.filter((artist) => artist.id !== found.topArtist?.id);
    if (others.length) artists.replaceChildren(h('h2', { class: 'section-title', text: 'Artists' }), artistRow(others));
    const merged = [...local, ...found.tracks];
    if (merged.length) songs.replaceChildren(trackList(merged, 80));
    else songs.replaceChildren(h('p', { class: 'empty', text: failed ? 'Search is unavailable right now. Check your internet connection.' : 'No songs found. Try another search.' }));
    renderPlayer();
  }

  /* ---------- your saved music ---------- */

  const DATA_KEY = 'solam.data';
  const offlineFiles = new Map();
  const hiddenTracks = new Set();
  let saved = loadSaved();
  let pushTimer = 0;

  function loadSaved() {
    const empty = { favorites: [], follows: [], playlists: [], taste: {} };
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(DATA_KEY) || '{}') };
    } catch {
      return empty;
    }
  }

  function storeSaved() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(saved));
    } catch {
      toast('Something went wrong. Please try again.');
    }
    clearTimeout(pushTimer);
    if (account.user) pushTimer = setTimeout(() => api.server('pushData', saved), 2500);
  }

  function trackKey(track) {
    return `${track.source}:${track.id || track.path || track.url || track.title}`;
  }

  function storableTrack(track) {
    const copy = { ...track };
    if (String(copy.art || '').startsWith('data:')) copy.art = '';
    return copy;
  }

  const isFavourite = (track) => saved.favorites.some((item) => trackKey(item) === trackKey(track));
  const artistKey = (artist) => `${artist.source}:${artist.id}`;
  const isFollowing = (artist) => saved.follows.some((item) => artistKey(item) === artistKey(artist));

  function toggleFavourite(track) {
    if (isFavourite(track)) saved.favorites = saved.favorites.filter((item) => trackKey(item) !== trackKey(track));
    else saved.favorites.unshift(storableTrack(track));
    storeSaved();
    refreshHearts();
  }

  function refreshHearts() {
    document.querySelectorAll('.heart[data-track]').forEach((button) => {
      const on = saved.favorites.some((item) => trackKey(item) === button.dataset.track);
      button.classList.toggle('on', on);
      setIcon(button, on ? 'heartFill' : 'heart');
      button.title = t(on ? 'Remove from favourites' : 'Add to favourites');
      button.setAttribute('aria-label', button.title);
    });
    const current = player.queue[player.index];
    const main = $('#np-heart');
    main.hidden = !current;
    if (current) {
      const on = isFavourite(current);
      main.classList.toggle('on', on);
      setIcon(main, on ? 'heartFill' : 'heart');
    }
  }

  function toggleFollow(artist) {
    if (isFollowing(artist)) saved.follows = saved.follows.filter((item) => artistKey(item) !== artistKey(artist));
    else saved.follows.unshift({ id: artist.id, source: artist.source, name: artist.name, followers: artist.followers, thumb: artist.thumb, pic: artist.pic, verified: artist.verified, artMirrors: artist.artMirrors });
    storeSaved();
  }

  // Merges what is on this PC with what is saved online, so signing in never loses anything.
  async function syncSaved() {
    const pulled = await api.server('pullData');
    if (!pulled.ok) return;
    const remote = pulled.value || {};
    const merge = (mine = [], theirs = [], key) => {
      const seen = new Set(mine.map(key));
      return [...mine, ...theirs.filter((item) => !seen.has(key(item)))];
    };
    saved.favorites = merge(saved.favorites, remote.favorites, trackKey);
    saved.follows = merge(saved.follows, remote.follows, artistKey);
    saved.taste = { ...(remote.taste || {}), ...(saved.taste || {}) };
    const lists = new Map(saved.playlists.map((list) => [list.id, list]));
    (remote.playlists || []).forEach((list) => {
      const mine = lists.get(list.id);
      if (mine) mine.tracks = merge(mine.tracks, list.tracks, trackKey);
      else saved.playlists.push(list);
    });
    storeSaved();
  }

  /* ---------- playlists ---------- */

  function createPlaylist(name) {
    const list = { id: crypto.randomUUID(), name: name.trim().slice(0, 60), tracks: [] };
    saved.playlists.push(list);
    storeSaved();
    return list;
  }

  function addToPlaylist(list, track) {
    if (!list.tracks.some((item) => trackKey(item) === trackKey(track))) list.tracks.push(storableTrack(track));
    storeSaved();
    toast('Added to {name}.', { name: list.name });
  }

  function closeMenu() {
    document.querySelector('.pop-menu')?.remove();
  }

  function placeMenu(menu, anchor) {
    const box = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(box.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(box.bottom + 6, window.innerHeight - menu.offsetHeight - 12))}px`;
  }

  const FULL_SONG_SERVICES = [
    ['Spotify', (q) => `https://open.spotify.com/search/${q}`],
    ['YouTube Music', (q) => `https://music.youtube.com/search?q=${q}`],
    ['Apple Music', (q) => `https://music.apple.com/search?term=${q}`],
    ['Deezer', (q) => `https://www.deezer.com/search/${q}`],
  ];

  const hasOnlyPreview = (track) => track?.source === 'preview' || track?.source === 'imported';

  // Full songs by famous artists are licensed to these services, so Solam sends people there to hear them.
  function showFullSongMenu(track, anchor) {
    closeMenu();
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    const menu = h('div', { class: 'pop-menu', role: 'menu' },
      h('p', { class: 'pop-title', text: 'Listen to the full song on' }),
      ...FULL_SONG_SERVICES.map(([name, link]) => h('button', {
        raw: name,
        role: 'menuitem',
        onclick: () => {
          api.openLink(link(query));
          closeMenu();
        },
      })));
    document.body.append(menu);
    placeMenu(menu, anchor);
    closeMenuOnTapAway(menu);
  }

  function closeMenuOnTapAway(menu) {
    setTimeout(() => {
      const away = (event) => {
        if (!menu.contains(event.target)) {
          closeMenu();
          window.removeEventListener('pointerdown', away, true);
        }
      };
      window.addEventListener('pointerdown', away, true);
    });
  }

  function canDownload(track) {
    return track.source !== 'local' && track.source !== 'preview' && track.source !== 'imported' && (track.source === 'free' || Boolean(track.downloadable));
  }

  async function downloadTrack(track) {
    toast('Downloading…');
    try {
      const entry = await api.offlineSave(storableTrack(track));
      offlineFiles.set(trackKey(track), entry);
      toast('Downloaded. You can play it without internet.');
      if (activePage === 'collection') renderCollection();
    } catch {
      toast('This song couldn’t be downloaded. Try again later.');
    }
  }

  async function removeDownload(track) {
    const entry = offlineFiles.get(trackKey(track));
    if (!entry) return;
    await api.offlineRemove(entry.id);
    offlineFiles.delete(trackKey(track));
    if (activePage === 'collection') renderCollection();
  }

  function showReportForm(track, menu, anchor) {
    const reason = h('textarea', { class: 'field', rows: 3, maxlength: 500, placeholder: 'What is wrong with this song?', 'aria-label': 'What is wrong with this song?' });
    const send = async () => {
      const result = await api.server('report', { key: trackKey(track), title: track.title, artist: track.artist, reason: reason.value });
      if (result.ok) {
        toast('Thanks. Your report was sent.');
        closeMenu();
      } else {
        toast(errorMessage(result));
      }
    };
    menu.replaceChildren(
      h('p', { class: 'pop-title', text: 'Report this song' }),
      reason,
      h('div', { class: 'actions' }, h('button', { class: 'button small primary', text: 'Send report', onclick: send })));
    placeMenu(menu, anchor);
    reason.focus();
  }

  function showPlaylistMenu(track, anchor) {
    closeMenu();
    const nameInput = h('input', { class: 'field', placeholder: 'Playlist name', 'aria-label': 'Playlist name', maxlength: 60 });
    const create = () => {
      if (!nameInput.value.trim()) return;
      addToPlaylist(createPlaylist(nameInput.value), track);
      closeMenu();
    };
    nameInput.onkeydown = (event) => {
      if (event.key === 'Enter') create();
    };
    const menu = h('div', { class: 'pop-menu', role: 'menu' });
    const isOffline = offlineFiles.has(trackKey(track));
    const item = (text, onclick) => h('button', { text, role: 'menuitem', onclick });
    menu.append(
      hasOnlyPreview(track) ? item('Listen to the full song', () => showFullSongMenu(track, anchor)) : null,
      isOffline ? item('Remove download', () => { removeDownload(track); closeMenu(); }) : null,
      !isOffline && canDownload(track) ? item('Download for offline', () => { downloadTrack(track); closeMenu(); }) : null,
      !isOffline && (track.source === 'preview' || track.source === 'imported') ? h('p', { class: 'pop-note', text: 'Previews can’t be downloaded.' }) : null,
      track.source !== 'local' && track.source !== 'imported' && account.configured ? item('Report this song', () => showReportForm(track, menu, anchor)) : null,
      h('p', { class: 'pop-title', text: 'Add to a playlist' }),
      ...saved.playlists.map((list) => h('button', { raw: list.name, role: 'menuitem', onclick: () => { addToPlaylist(list, track); closeMenu(); } })),
      h('div', { class: 'pop-new' }, nameInput, h('button', { class: 'button small', text: 'Create', onclick: create })));
    document.body.append(menu);
    placeMenu(menu, anchor);
    closeMenuOnTapAway(menu);
  }

  let collectionTab = 'favorites';

  function renderCollection() {
    const container = $('#collection');
    const tab = (id, label) => h('button', {
      class: `chip${collectionTab === id ? ' selected' : ''}`,
      text: label,
      onclick: () => {
        collectionTab = id;
        renderCollection();
      },
    });
    let body;
    if (collectionTab === 'favorites') {
      body = saved.favorites.length ? trackList(saved.favorites) : h('p', { class: 'empty', text: 'Press the heart on any song to save it here.' });
    } else if (collectionTab === 'downloads') {
      const downloads = [...offlineFiles.values()].map((entry) => entry.track);
      const megabytes = Math.round([...offlineFiles.values()].reduce((sum, entry) => sum + entry.size, 0) / 1048576);
      body = downloads.length
        ? h('div', {}, h('p', { class: 'status-note', text: '{n} MB on this PC', values: { n: megabytes } }), trackList(downloads))
        : h('p', { class: 'empty', text: 'Open the … menu on a song to download it, if the artist allows it.' });
    } else if (collectionTab === 'artists') {
      body = saved.follows.length ? artistGrid(saved.follows) : h('p', { class: 'empty', text: 'Follow an artist to see them here.' });
    } else {
      body = playlistsView();
    }
    container.replaceChildren(
      h('h1', { class: 'page-title', text: 'Library' }),
      h('p', { class: 'page-sub', text: 'Your favourites, playlists and followed artists. They stay on this PC, or sign in to save them online.' }),
      h('div', { class: 'chips' }, tab('favorites', 'Favourites'), tab('playlists', 'Playlists'), tab('downloads', 'Downloads'), tab('artists', 'Artists')),
      body);
    renderPlayer();
    refreshHearts();
  }

  function playlistsView() {
    const nameInput = h('input', { class: 'field', placeholder: 'Playlist name', 'aria-label': 'Playlist name', maxlength: 60 });
    const create = () => {
      if (!nameInput.value.trim()) return;
      createPlaylist(nameInput.value);
      renderCollection();
    };
    nameInput.onkeydown = (event) => {
      if (event.key === 'Enter') create();
    };
    return h('div', {},
      h('div', { class: 'actions' }, nameInput, h('button', { class: 'button', text: 'Create', onclick: create })),
      saved.playlists.length ? null : h('p', { class: 'empty', text: 'No playlists yet.' }),
      ...saved.playlists.map((list) => h('section', { class: 'setting-group' },
        h('div', { class: 'group-head' },
          h('h3', { raw: list.name }),
          list.tracks.length ? h('button', { class: 'button small', text: 'Play all', onclick: () => playQueue(list.tracks, 0) }) : null,
          h('button', {
            class: 'button small',
            text: 'Delete',
            onclick: () => {
              saved.playlists = saved.playlists.filter((item) => item.id !== list.id);
              storeSaved();
              renderCollection();
            },
          })),
        list.tracks.length ? trackList(list.tracks) : h('p', { class: 'empty', text: 'This playlist is empty. Open the … menu on a song to add it.' }))));
  }

  /* ---------- artists ---------- */

  function formatCount(value) {
    return new Intl.NumberFormat(window.solamLanguage, { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
  }

  function artistCard(artist) {
    (artist.artMirrors || []).forEach((server) => artServers.add(server));
    const image = artist.thumb || artist.pic;
    return h('button', { class: 'artist-card', onclick: () => openArtist(artist.source, artist.id) },
      image ? h('img', { src: image, alt: '', loading: 'lazy', decoding: 'async' }) : h('div', { class: 'blank round', raw: artist.name.charAt(0).toUpperCase() }),
      h('strong', { raw: artist.name }),
      h('span', { text: artist.source === 'solam' ? (artist.genre ? '' : 'Solam artist') : '{n} followers', values: { n: formatCount(artist.followers) }, raw: artist.source === 'solam' && artist.genre ? artist.genre : undefined }));
  }

  const artistRow = (artists) => h('div', { class: 'artist-row' }, ...artists.map(artistCard));
  const artistGrid = (artists) => h('div', { class: 'artist-grid' }, ...artists.map(artistCard));

  function topArtistCard(artist) {
    (artist.artMirrors || []).forEach((server) => artServers.add(server));
    const image = artist.pic || artist.thumb;
    return h('button', { class: 'top-artist', onclick: () => openArtist(artist.source, artist.id) },
      image ? h('img', { src: image, alt: '', decoding: 'async' }) : h('div', { class: 'blank round', raw: artist.name.charAt(0).toUpperCase() }),
      h('div', {},
        h('strong', { raw: artist.name }),
        artist.verified ? icon('check') : null,
        h('span', { text: '{n} followers', values: { n: formatCount(artist.followers) } })));
  }

  async function renderArtists(term = '') {
    const container = $('#artists');
    const results = h('div', {}, h('p', { class: 'empty', text: 'Loading…' }));
    const search = h('input', {
      class: 'search',
      placeholder: 'Search all artists',
      'aria-label': 'Search all artists',
      value: term,
      onkeydown: (event) => {
        if (event.key === 'Enter') renderArtists(search.value.trim());
      },
    });
    container.replaceChildren(
      h('h1', { class: 'page-title', text: 'Artists' }),
      h('p', { class: 'page-sub', text: 'Every artist in one place.' }),
      search,
      saved.follows.length && !term ? h('h2', { class: 'section-title', text: 'Artists you follow' }) : null,
      saved.follows.length && !term ? artistRow(saved.follows) : null,
      results);
    try {
      if (term) {
        const found = await api.searchArtists(term);
        results.replaceChildren(found.length ? artistGrid(found) : h('p', { class: 'empty', text: 'No artists found.' }));
        return;
      }
      const [own, top] = await Promise.all([api.solamArtists().catch(() => []), api.topArtists()]);
      results.replaceChildren(
        own.length ? h('h2', { class: 'section-title', text: 'Solam artists' }) : null,
        own.length ? artistGrid(own) : null,
        h('h2', { class: 'section-title', text: 'All artists' }),
        artistGrid(top));
    } catch {
      results.replaceChildren(h('p', { class: 'empty', text: 'Couldn’t load artists. Check your internet connection.' }));
    }
  }

  async function openArtist(source, id) {
    showPage('artist');
    const container = $('#artist');
    container.replaceChildren(h('p', { class: 'empty', text: 'Loading…' }));
    container.scrollTop = 0;
    let artist = null;
    try {
      artist = await api.artist(source, id);
    } catch {
      artist = null;
    }
    if (activePage !== 'artist') return;
    if (!artist) {
      container.replaceChildren(h('button', { class: 'button small', text: 'Back', onclick: () => showPage('artists') }), h('p', { class: 'empty', text: 'Couldn’t open this artist.' }));
      return;
    }
    (artist.artMirrors || []).forEach((server) => artServers.add(server));
    const followButton = h('button', {
      class: `button follow${isFollowing(artist) ? ' on' : ''}`,
      text: isFollowing(artist) ? 'Following' : 'Follow',
      onclick: () => {
        toggleFollow(artist);
        followButton.textContent = t(isFollowing(artist) ? 'Following' : 'Follow');
        followButton.classList.toggle('on', isFollowing(artist));
        wobble(followButton);
      },
    });
    const banner = h('div', { class: 'artist-banner' },
      artist.cover ? h('img', { class: 'banner-image', src: artist.cover, alt: '', decoding: 'async' }) : null,
      h('div', { class: 'banner-shade' }),
      h('div', { class: 'banner-content' },
        artist.pic ? h('img', { class: 'banner-pic', src: artist.pic, alt: '', decoding: 'async' }) : h('div', { class: 'banner-pic blank round', raw: artist.name.charAt(0).toUpperCase() }),
        h('div', { class: 'banner-text' },
          h('h1', {}, h('span', { raw: artist.name }), artist.verified ? icon('check') : null),
          artist.genre ? h('p', { raw: artist.genre }) : null,
          h('div', { class: 'stats' },
            statBlock(formatCount(artist.followers), 'Followers'),
            artist.previewsOnly ? null : statBlock(formatCount(artist.totalPlays), artist.partialPlays ? 'Total plays on top songs' : 'Total plays'),
            artist.previewsOnly ? null : statBlock(formatCount(artist.trackCount), 'Songs')),
          h('div', { class: 'actions' },
            artist.tracks.length ? h('button', { class: 'button primary', text: 'Play all', onclick: () => playQueue(artist.tracks, 0) }) : null,
            followButton))));
    container.replaceChildren(
      h('button', { class: 'button small back', text: 'Back', onclick: () => showPage('artists') }),
      banner,
      artist.bio ? h('p', { class: 'artist-bio', raw: artist.bio }) : null,
      artist.previewsOnly ? h('p', { class: 'notice', text: 'This artist’s full songs aren’t available in Solam, so these are 30-second previews.' }) : null,
      h('h2', { class: 'section-title', text: 'Songs' }),
      artist.tracks.length ? trackList(artist.tracks, 60) : h('p', { class: 'empty', text: 'This artist has no songs to play yet.' }),
      artist.related?.length ? h('h2', { class: 'section-title', text: 'Similar artists' }) : null,
      artist.related?.length ? artistRow(artist.related) : null);
    renderPlayer();
  }

  const statBlock = (value, label) => h('div', { class: 'stat' }, h('strong', { raw: value }), h('span', { text: label }));

  /* ---------- connectors ---------- */

  const MAX_ARTIST_MATCHES = 40;
  const CONNECTORS = [
    {
      id: 'spotify',
      name: 'Spotify',
      link: 'https://www.spotify.com/account/privacy/',
      linkText: 'Open Spotify privacy page',
      steps: ['On Spotify’s privacy page, ask for your data. Spotify emails it, which can take a few days.', 'Unzip the file you get.', 'Choose the files named StreamingHistory, YourLibrary and Playlist.'],
    },
    {
      id: 'youtube',
      name: 'YouTube Music',
      link: 'https://takeout.google.com/',
      linkText: 'Open Google Takeout',
      steps: ['In Google Takeout, select only YouTube and YouTube Music, and choose JSON for your history.', 'Unzip the file you get.', 'Choose watch-history.json and subscriptions.csv.'],
    },
    {
      id: 'apple',
      name: 'Apple Music',
      link: 'https://privacy.apple.com/',
      linkText: 'Open Apple privacy page',
      steps: ['On Apple’s privacy page, ask for a copy of your Apple Media Services data. It can take a few days.', 'Unzip the file you get.', 'Choose Apple Music Library Tracks.json and Apple Music Play Activity.csv.'],
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      link: 'https://soundcloud.com/you/library',
      linkText: 'Open your SoundCloud library',
      steps: ['SoundCloud has no simple download, so use the box below.', 'Type or paste your favourite songs, one per line, like: Artist - Song'],
    },
  ];

  function readTextFiles(fileList) {
    return Promise.all([...fileList].map(async (file) => ({ name: file.name, text: await file.text() })));
  }

  async function saveImport(service, result, status) {
    const playlists = saved.playlists.filter((list) => list.importedFrom !== service.id);
    const toTrack = (song) => ({ source: 'imported', id: `${song.artist}|${song.title}`, title: song.title, artist: song.artist, album: '', art: '', thumb: '', duration: 0 });
    result.playlists.forEach((list) => playlists.push({ id: crypto.randomUUID(), name: list.name, importedFrom: service.id, tracks: list.tracks.map(toTrack) }));
    if (result.recents.length) playlists.push({ id: crypto.randomUUID(), name: t('Recently played on {service}', { service: service.name }), importedFrom: service.id, tracks: result.recents.map(toTrack) });
    saved.playlists = playlists;

    saved.follows = saved.follows.filter((artist) => artist.importedFrom !== service.id);
    let followed = 0;
    const names = result.follows.slice(0, MAX_ARTIST_MATCHES);
    for (let i = 0; i < names.length; i++) {
      status.textContent = t('Finding artists: {done} of {total}', { done: i + 1, total: names.length });
      const artist = await api.matchArtist(names[i]).catch(() => null);
      if (artist && !isFollowing(artist)) {
        saved.follows.push({ id: artist.id, source: artist.source, name: artist.name, followers: artist.followers, thumb: artist.thumb, pic: artist.pic, importedFrom: service.id });
        followed += 1;
      }
    }
    saved.taste = { ...(saved.taste || {}), [service.id]: { topArtists: result.topArtists, songs: playlists.filter((list) => list.importedFrom === service.id).reduce((sum, list) => sum + list.tracks.length, 0), artists: followed, lists: playlists.filter((list) => list.importedFrom === service.id).length } };
    storeSaved();
    loadForYou();
  }

  function removeImport(service) {
    saved.playlists = saved.playlists.filter((list) => list.importedFrom !== service.id);
    saved.follows = saved.follows.filter((artist) => artist.importedFrom !== service.id);
    const taste = { ...(saved.taste || {}) };
    delete taste[service.id];
    saved.taste = taste;
    storeSaved();
    loadForYou();
  }

  function connectorCard(service) {
    const status = h('p', { class: 'status-note', role: 'status' });
    const steps = h('ol', { class: 'steps', hidden: 'hidden' }, ...service.steps.map((step) => h('li', { text: step })));
    const paste = h('textarea', { class: 'field', rows: 4, placeholder: 'Artist - Song', 'aria-label': 'Paste songs, one per line' });
    const runImport = async (files) => {
      status.textContent = t('Reading your files…');
      try {
        const result = window.SolamImport.importFiles(files, service.id);
        const nothing = !result.playlists.length && !result.recents.length && !result.follows.length;
        if (nothing) {
          status.textContent = t('Solam couldn’t find any songs in that. Check that you chose the right files.');
          return;
        }
        await saveImport(service, result, status);
        renderConnectors();
        toast('Imported from {service}. See Library and For you on Home.', { service: service.name });
      } catch {
        status.textContent = t('Something went wrong. Please try again.');
      }
    };
    const fileInput = h('input', { type: 'file', multiple: 'multiple', accept: '.json,.csv,.txt', class: 'hidden', 'aria-label': 'Choose your files' });
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length) runImport(await readTextFiles(fileInput.files));
    });
    const taste = saved.taste?.[service.id];
    return h('div', { class: 'setting-group connector-card', 'data-service': service.id },
      h('div', { class: 'group-head' },
        h('h3', { raw: service.name }),
        h('span', { class: `badge${taste ? ' lossless' : ''}`, text: taste ? 'Connected' : 'Not connected' })),
      taste ? h('p', { class: 'status-note', text: '{songs} songs, {lists} lists and {artists} artists imported.', values: taste }) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'button primary', text: service.id === 'soundcloud' ? 'Choose a text file' : 'Choose your files', onclick: () => fileInput.click() }),
        h('button', { class: 'button', text: 'How to get them', onclick: () => { steps.hidden = !steps.hidden; } }),
        taste ? h('button', { class: 'button', text: 'Remove', onclick: () => { removeImport(service); renderConnectors(); } }) : null),
      fileInput,
      steps,
      h('button', { class: 'chip link-chip', raw: t(service.linkText), onclick: () => api.openLink(service.link) }),
      h('div', { class: 'form-row' }, h('label', { text: 'Or paste songs, one per line' }), paste),
      h('div', { class: 'actions' }, h('button', {
        class: 'button small',
        text: 'Add these songs',
        onclick: () => {
          if (paste.value.trim()) runImport([{ name: `${service.name}.txt`, text: paste.value }]);
        },
      })),
      status);
  }

  function renderConnectors() {
    $('#connectors').replaceChildren(
      h('h1', { class: 'page-title', text: 'Connectors' }),
      h('p', { class: 'page-sub', text: 'Bring your playlists, followed artists and listening history into Solam. Solam never asks for your passwords, and your files are read only on this device.' }),
      h('p', { class: 'notice', text: 'Imported songs play as 30-second previews, or fuller versions when Solam has them. These services don’t let other apps play your full music.' }),
      ...CONNECTORS.map(connectorCard));
  }

  /* ---------- premium ---------- */

  function buildPremium() {
    const perks = [
      ['Song transitions', 'Songs melt smoothly into each other. Free for everyone until Premium launches.'],
      ['Extra themes', 'More animated themes, only for Premium.'],
      ['Bigger uploads', 'Upload more of your songs to the world.'],
      ['Offline downloads', 'Listen without internet, where artists allow it. Free during the beta.'],
      ['Animated profile', 'Video profile pictures and banners.'],
    ];
    $('#premium').append(
      h('div', { class: 'premium-hero' },
        h('span', { class: 'premium-star' }, icon('premium')),
        h('h1', { class: 'page-title', text: 'Solam Premium' }),
        h('p', { class: 'page-sub', text: 'Even more from Solam. Premium isn’t on sale yet.' }),
        h('button', { class: 'button primary soon', disabled: 'disabled', text: 'Coming Soon!' })),
      h('div', { class: 'perks' },
        ...perks.map(([title, text]) => h('div', { class: 'perk' }, h('strong', { text: title }), h('span', { text }))),
        h('div', { class: 'perk more' }, h('strong', { text: 'And more!' }))));
  }

  /* ---------- account ---------- */

  const account = { configured: false, user: null, artist: null, isAdmin: false, google: false };
  const ERRORS = {
    'under-age': 'You must be 13 or older to upload music.',
    'rights-needed': 'Please confirm that you own this music.',
    'form-incomplete': 'Please answer all 5 questions.',
    'name-taken': 'That app name is already taken.',
    'file-too-big': 'That file is over the 50 MB limit.',
    'bad-file-type': 'That file type isn’t supported.',
    'daily-limit': 'You reached today’s limit of 10 songs.',
    'pick-again': 'Please choose the file again.',
    'terms-needed': 'Please accept the Terms and Privacy Policy.',
    'photo-too-big': 'That photo is over the 5 MB limit.',
    'reason-needed': 'Please say what is wrong with this song.',
  };

  function errorMessage(result) {
    return ERRORS[result.error] || (result.error && /[A-Za-z]/.test(result.error) && !result.error.startsWith('not-') ? result.error : 'Something went wrong. Please try again.');
  }

  async function refreshAccount() {
    const result = await api.server('state');
    if (result.ok) Object.assign(account, result.value);
    nav.review?.classList.toggle('hidden', !account.isAdmin);
    return account;
  }

  function serverOffNote() {
    return h('p', { class: 'notice', text: 'Online accounts aren’t switched on yet. Everything else in Solam works without them.' });
  }

  async function renderAccount() {
    const container = $('#account');
    await refreshAccount();
    const head = [
      h('h1', { class: 'page-title', text: 'Account' }),
      h('p', { class: 'page-sub', text: 'You only need an account to upload music or save your playlists online. Everything else works without one.' }),
    ];
    if (!account.configured) {
      container.replaceChildren(...head, serverOffNote());
      return;
    }
    if (account.user) {
      const reviewBox = h('div', {});
      container.replaceChildren(...head,
        h('div', { class: 'setting-group' },
          h('p', { text: 'Signed in as {email}', values: { email: account.user.email || '' } }),
          h('p', { class: 'status-note', text: 'Your favourites and playlists are saved online.' }),
          h('div', { class: 'actions' }, h('button', {
            class: 'button',
            text: 'Sign out',
            onclick: async () => {
              await api.server('signOut');
              renderAccount();
            },
          }))),
        reviewBox,
        deleteAccountBox());
      if (account.isAdmin) renderReview(reviewBox);
      return;
    }
    const email = h('input', { class: 'field', type: 'email', placeholder: 'Email', 'aria-label': 'Email', autocomplete: 'email' });
    const password = h('input', { class: 'field', type: 'password', placeholder: 'Password', 'aria-label': 'Password', autocomplete: 'current-password' });
    const message = h('p', { class: 'status-note', role: 'status' });
    const acceptTerms = h('input', { type: 'checkbox' });
    const finish = async (result) => {
      password.value = '';
      if (!result.ok) {
        message.textContent = errorMessage(result);
        return;
      }
      if (result.value?.signedIn) {
        await refreshAccount();
        await syncSaved();
        renderAccount();
      } else {
        message.textContent = t('Check your email to confirm your account, then sign in.');
      }
    };
    const submit = (action) => {
      if (!email.value.includes('@') || password.value.length < 8) {
        message.textContent = t('Enter your email and a password of at least 8 characters.');
        return;
      }
      if (action === 'signUp' && !acceptTerms.checked) {
        message.textContent = t('Please accept the Terms and Privacy Policy.');
        return;
      }
      api.server(action, email.value.trim(), password.value, acceptTerms.checked).then(finish);
    };
    container.replaceChildren(...head,
      h('div', { class: 'setting-group auth' },
        email,
        password,
        h('label', { class: 'check' }, acceptTerms, h('span', { text: 'To create an account, I accept the rules below. I’m 13 or older, or have permission from a parent or guardian.' })),
        legalLinks(),
        h('div', { class: 'actions' },
          h('button', { class: 'button primary', text: 'Sign in', onclick: () => submit('signIn') }),
          h('button', { class: 'button', text: 'Create account', onclick: () => submit('signUp') }),
          h('button', {
            class: 'button',
            text: 'Forgot password?',
            onclick: async () => {
              if (!email.value.includes('@')) {
                message.textContent = t('Type your email above first.');
                return;
              }
              const result = await api.server('requestReset', email.value.trim());
              message.textContent = result.ok ? t('If this email has an account, a reset link is on its way. Check spam too.') : errorMessage(result);
            },
          }),
          account.google && h('button', {
            class: 'button',
            text: 'Continue with Google',
            onclick: () => {
              message.textContent = t('Waiting for your browser…');
              api.server('google').then(finish);
            },
          })),
        message));
  }

  function legalLinks() {
    return h('div', { class: 'actions' },
      h('button', { class: 'chip', text: 'Terms', onclick: () => api.openSite('terms.html') }),
      h('button', { class: 'chip', text: 'Privacy Policy', onclick: () => api.openSite('privacy.html') }));
  }

  function deleteAccountBox() {
    const box = h('div', { class: 'setting-group' });
    const ask = () => {
      box.replaceChildren(
        h('h3', { text: 'Delete your account?' }),
        h('p', { class: 'status-note', text: 'This permanently removes your songs, photos, names and online playlists. It can’t be undone.' }),
        h('div', { class: 'actions' },
          h('button', {
            class: 'button danger',
            text: 'Yes, delete everything',
            onclick: async () => {
              const result = await api.server('deleteAccount');
              if (result.ok) {
                toast('Your account was deleted.');
                renderAccount();
              } else {
                toast(errorMessage(result));
              }
            },
          }),
          h('button', { class: 'button', text: 'Keep my account', onclick: () => box.replaceChildren(start) })));
    };
    const start = h('button', { class: 'button', text: 'Delete my account', onclick: ask });
    box.append(start);
    return box;
  }

  async function renderReports(box) {
    const result = await api.server('reports');
    const reports = result.ok ? result.value : [];
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Reports' }),
      reports.length ? null : h('p', { class: 'empty', text: 'Nothing has been reported.' }),
      ...reports.map((report) => h('div', { class: 'review-row' },
        h('div', { class: 'track-text wrap' }, h('strong', { raw: `${report.title} · ${report.artist}` }), h('span', { raw: report.reason })),
        h('button', {
          class: 'button small primary',
          text: 'Hide song',
          onclick: async () => {
            const done = await api.server('hideTrack', report.track_key);
            if (report.track_key.startsWith('solam:')) await api.server('setStatus', report.track_key.slice(6), 'rejected');
            if (!done.ok) toast(errorMessage(done));
            hiddenTracks.add(report.track_key);
            await api.server('clearReport', report.id);
            renderReports(box);
          },
        }),
        h('button', {
          class: 'button small',
          text: 'Dismiss',
          onclick: async () => {
            await api.server('clearReport', report.id);
            renderReports(box);
          },
        }))));
  }

  async function renderReview(box) {
    const result = await api.server('pending');
    const tracks = result.ok ? result.value : [];
    const reportsBox = h('div', {});
    renderReports(reportsBox);
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Review songs' }),
      h('p', { class: 'status-note', text: 'Every upload waits here until you approve it.' }),
      tracks.length ? null : h('p', { class: 'empty', text: result.ok ? 'Nothing is waiting for review.' : errorMessage(result) }),
      ...tracks.map((track) => {
        const decide = async (status) => {
          const done = await api.server('setStatus', track.id, status);
          if (!done.ok) toast(errorMessage(done));
          renderReview(box);
        };
        return h('div', { class: 'review-row' },
          h('div', { class: 'track-text' }, h('strong', { raw: track.title }), h('span', { raw: `${track.artist}${track.genre ? ` · ${track.genre}` : ''}` })),
          h('button', { class: 'button small', text: 'Listen', onclick: () => playQueue([track], 0) }),
          h('button', { class: 'button small primary', text: 'Approve', onclick: () => decide('approved') }),
          h('button', { class: 'button small', text: 'Reject', onclick: () => decide('rejected') }));
      }),
      reportsBox);
  }

  /* ---------- upload ---------- */

  function labelled(question, hint, control) {
    return h('div', { class: 'form-row' }, h('label', { text: question }), control, hint ? h('small', { text: hint }) : null);
  }

  function ageFrom(dateText) {
    const born = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(born.getTime())) return -1;
    const now = new Date();
    let years = now.getFullYear() - born.getFullYear();
    if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) years--;
    return years;
  }

  async function renderUpload() {
    const container = $('#upload');
    await refreshAccount();
    const head = [
      h('h1', { class: 'page-title', text: 'Upload your music' }),
      h('p', { class: 'page-sub', text: 'Share your songs with everyone on Solam. You need an account, and you must be 13 or older.' }),
    ];
    if (!account.configured) {
      container.replaceChildren(...head, serverOffNote());
    } else if (!account.user) {
      container.replaceChildren(...head, h('button', { class: 'button primary', text: 'Sign in to upload', onclick: () => showPage('account') }));
    } else if (!account.artist) {
      container.replaceChildren(...head, artistForm());
    } else {
      container.replaceChildren(...head, profileSection(), uploadForm(), await uploadsList());
    }
  }

  function artistForm() {
    const realName = h('input', { class: 'field', maxlength: 80, autocomplete: 'name', 'aria-label': '1. What is your real name?' });
    const appName = h('input', { class: 'field', maxlength: 40, 'aria-label': '2. What name do you want in the app?' });
    const birth = h('input', { class: 'field', type: 'date', max: new Date().toISOString().slice(0, 10), 'aria-label': '3. What is your date of birth?' });
    const genre = h('input', { class: 'field', maxlength: 40, 'aria-label': '4. What genre is your music?' });
    const owns = h('input', { type: 'checkbox' });
    const message = h('p', { class: 'status-note', role: 'alert' });
    const form = h('div', { class: 'setting-group' },
      h('h3', { text: 'About you' }),
      h('p', { class: 'status-note', text: 'Answer these 5 questions once before your first upload.' }),
      labelled('1. What is your real name?', 'Kept private. Other people never see it.', realName),
      labelled('2. What name do you want in the app?', 'Everyone sees this name on your songs.', appName),
      labelled('3. What is your date of birth?', 'Only used to check that you are 13 or older. It isn’t saved.', birth),
      labelled('4. What genre is your music?', '', genre),
      labelled('5. Do you own the music you upload?', '', h('label', { class: 'check' }, owns, h('span', { text: 'Yes, I made it or have the right to share it.' }))),
      message,
      h('div', { class: 'actions' }, h('button', {
        class: 'button primary',
        text: 'Continue',
        onclick: async () => {
          if (realName.value.trim().length < 2 || appName.value.trim().length < 2 || !birth.value || !genre.value.trim() || !owns.checked) {
            message.textContent = t('Please answer all 5 questions.');
            return;
          }
          if (ageFrom(birth.value) < MIN_UPLOAD_AGE) {
            form.replaceChildren(h('h3', { text: 'You must be 13 or older to upload music.' }), h('p', { class: 'status-note', text: 'You can still listen to everything in Solam.' }));
            return;
          }
          const result = await api.server('saveArtist', { realName: realName.value, appName: appName.value, birthDate: birth.value, genre: genre.value, ownsMusic: owns.checked });
          if (result.ok) renderUpload();
          else message.textContent = errorMessage(result);
        },
      })));
    return form;
  }

  function profileSection() {
    const change = (kind, label) => {
      const button = h('button', {
        class: 'button',
        text: label,
        onclick: async () => {
          const picked = await api.server('pickFile', 'art');
          if (!picked.ok) {
            toast(errorMessage(picked));
            return;
          }
          if (!picked.value) return;
          button.disabled = true;
          const result = await api.server('uploadImage', kind, picked.value.id);
          button.disabled = false;
          if (result.ok) renderUpload();
          else toast(errorMessage(result));
        },
      });
      return button;
    };
    const { artist } = account;
    return h('div', { class: 'setting-group' },
      h('h3', { text: 'Your artist profile' }),
      h('div', { class: 'profile-preview' },
        artist.cover ? h('img', { class: 'banner-image', src: artist.cover, alt: '' }) : null,
        artist.pic ? h('img', { class: 'profile-pic', src: artist.pic, alt: '' }) : h('div', { class: 'profile-pic blank round', raw: artist.name.charAt(0).toUpperCase() }),
        h('strong', { raw: artist.name })),
      h('p', { class: 'status-note', text: 'Photos only: JPG, PNG or WEBP, up to 5 MB.' }),
      h('div', { class: 'actions' }, change('pic', 'Change profile picture'), change('cover', 'Change banner')),
      h('p', { class: 'locked-row' }, icon('premium'), h('span', { text: 'Animated (video) picture and banner: Premium. Coming Soon!' })));
  }

  function uploadForm() {
    const chosen = { audio: null, art: null };
    const lyricsBox = h('textarea', { class: 'field', rows: 6, maxlength: 20000, placeholder: 'Paste your lyrics here', 'aria-label': 'Lyrics (optional)' });
    const allowDownload = h('input', { type: 'checkbox' });
    const title = h('input', { class: 'field', maxlength: 120, 'aria-label': 'Song title' });
    const genre = h('input', { class: 'field', maxlength: 40, value: account.artist.genre || '', 'aria-label': 'Genre' });
    const owns = h('input', { type: 'checkbox' });
    const message = h('p', { class: 'status-note', role: 'status' });
    const picker = (kind, label) => {
      const name = h('span', { class: 'status-note' });
      return h('div', { class: 'actions' }, h('button', {
        class: 'button',
        text: label,
        onclick: async () => {
          const result = await api.server('pickFile', kind);
          if (!result.ok) {
            message.textContent = errorMessage(result);
          } else if (result.value) {
            chosen[kind] = result.value;
            name.textContent = result.value.name;
            if (kind === 'audio' && !title.value) title.value = result.value.title;
          }
        },
      }), name);
    };
    const send = h('button', {
      class: 'button primary',
      text: 'Upload',
      onclick: async () => {
        if (!chosen.audio || !title.value.trim()) {
          message.textContent = t('Choose a song and give it a title.');
          return;
        }
        if (!owns.checked) {
          message.textContent = t('Please confirm that you own this music.');
          return;
        }
        send.disabled = true;
        message.textContent = t('Uploading…');
        const result = await api.server('upload', { audioId: chosen.audio.id, artId: chosen.art?.id, title: title.value, genre: genre.value, ownsMusic: true, lyrics: lyricsBox.value, allowDownload: allowDownload.checked });
        send.disabled = false;
        if (result.ok) {
          toast('Uploaded! It goes public once it is approved.');
          renderUpload();
        } else {
          message.textContent = errorMessage(result);
        }
      },
    });
    return h('div', { class: 'setting-group' },
      h('h3', { text: 'Upload a song' }),
      h('p', { class: 'status-note', text: 'Songs go public after approval. Up to 50 MB each and 10 songs a day.' }),
      picker('audio', 'Choose song file'),
      picker('art', 'Choose cover (optional)'),
      labelled('Song title', '', title),
      labelled('Genre', '', genre),
      labelled('Lyrics (optional)', 'Most small artists’ songs have no lyrics anywhere else, so people only see them if you add them. Timed lines like [00:12.00] scroll with the song.', lyricsBox),
      h('label', { class: 'check' }, allowDownload, h('span', { text: 'Let people download this song for offline listening.' })),
      h('label', { class: 'check' }, owns, h('span', { text: 'I own this music or have the right to share it.' })),
      message,
      h('div', { class: 'actions' }, send));
  }

  async function uploadsList() {
    const result = await api.server('myTracks');
    const tracks = result.ok ? result.value : [];
    const labels = { pending: 'Waiting for approval', approved: 'Public', rejected: 'Rejected' };
    return h('div', {},
      h('h2', { class: 'section-title', text: 'Your uploads' }),
      tracks.length ? null : h('p', { class: 'empty', text: 'You haven’t uploaded anything yet.' }),
      ...tracks.map((track) => h('div', { class: 'review-row' },
        h('div', { class: 'track-text' }, h('strong', { raw: track.title }), h('span', { text: '{n} plays', values: { n: formatCount(track.plays) } })),
        h('span', { class: `badge status-${track.status}`, text: labels[track.status] }),
        h('button', {
          class: 'button small',
          text: 'Delete',
          onclick: async () => {
            const done = await api.server('removeTrack', track.id);
            if (!done.ok) toast(errorMessage(done));
            renderUpload();
          },
        }))));
  }

  /* ---------- library ---------- */

  let library = { folders: [], tracks: [] };

  function toLocalTrack(track) {
    return { ...track, source: 'local' };
  }

  function renderLibrary() {
    const container = $('#library');
    const results = h('div', {});
    const draw = (filter) => {
      const needle = filter.toLowerCase();
      const tracks = library.tracks
        .filter((track) => !needle || `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(needle))
        .sort((a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.title.localeCompare(b.title))
        .map(toLocalTrack);
      if (!library.tracks.length) results.replaceChildren(h('p', { class: 'empty', text: 'Add a folder with your music. FLAC and WAV files play at full lossless quality.' }));
      else if (!tracks.length) results.replaceChildren(h('p', { class: 'empty', text: 'Nothing matches that search.' }));
      else results.replaceChildren(trackList(tracks));
    };
    const search = h('input', { class: 'search', placeholder: 'Search your music', 'aria-label': 'Search your music', oninput: () => draw(search.value) });
    const addButton = h('button', {
      class: 'button',
      text: 'Add music folder',
      onclick: async () => {
        addButton.textContent = t('Reading your music…');
        addButton.disabled = true;
        try {
          library = await api.addFolder();
          renderLibrary();
        } catch {
          addButton.textContent = t('Add music folder');
          addButton.disabled = false;
          toast('Couldn’t read that folder.');
        }
      },
    });
    container.replaceChildren(
      h('h1', { class: 'page-title', text: 'My Music' }),
      h('p', { class: 'page-sub', text: 'Your own files are the one place Solam can play true top quality, with no service limits.' }),
      h('div', { class: 'actions' }, addButton),
      ...library.folders.map((folder) => h('div', { class: 'folder-row' },
        h('span', { raw: folder }),
        h('button', { class: 'button small', text: 'Remove', onclick: async () => { library = await api.removeFolder(folder); renderLibrary(); } }))),
      library.tracks.length ? search : null,
      h('div', { class: 'section-title', text: '{n} tracks', values: { n: library.tracks.length } }),
      results);
    draw('');
  }

  /* ---------- settings page ---------- */

  function buildSettings() {
    const container = $('#settings');

    const slider = (key, label, hint, min, max, step, format) => {
      const output = h('output', { text: format(settings[key]) });
      const range = h('input', {
        type: 'range', min, max, step, value: settings[key], 'aria-label': label,
        oninput: () => {
          const value = Number(range.value);
          setFill(range);
          output.textContent = format(value);
          changeSetting(key, value);
        },
      });
      setFill(range);
      return h('div', { class: 'setting' }, h('label', {}, t(label), hint ? h('small', { text: hint }) : null), range, output);
    };

    const toggle = (key, label, hint) => {
      const button = h('button', {
        class: 'toggle', role: 'switch', 'aria-checked': String(settings[key]), 'aria-label': label,
        onclick: () => {
          changeSetting(key, !settings[key]);
          button.setAttribute('aria-checked', String(settings[key]));
        },
      });
      return h('div', { class: 'setting' }, h('label', {}, t(label), hint ? h('small', { text: hint }) : null), button, h('span'));
    };

    const segmented = (key, label, hint, choices) => {
      const buttons = choices.map(([value, text]) => {
        const button = h('button', {
          text,
          class: settings[key] === value ? 'on' : '',
          onclick: () => {
            changeSetting(key, value);
            buttons.forEach((other) => other.classList.toggle('on', other === button));
          },
        });
        return button;
      });
      return h('div', { class: 'setting' }, h('label', {}, t(label), hint ? h('small', { text: hint }) : null), h('div', { class: 'segmented' }, ...buttons), h('span'));
    };

    const percent = (value) => `${Math.round(value * 100)}%`;
    const pixels = (value) => `${value}px`;
    const times = (value) => `${value.toFixed(2)}x`;

    const themeCards = THEMES.map(([id, label]) => {
      const card = h('button', {
        class: `theme-card theme-${id}${settings.theme === id ? ' on' : ''}`,
        text: label,
        onclick: () => {
          changeSetting('theme', id);
          themeCards.forEach((other) => other.classList.toggle('on', other === card));
          wobble(card);
        },
      });
      return card;
    });

    const languageChooser = () => {
      const pick = (value, label) => h('button', {
        text: label,
        class: settings.language === value ? 'on' : '',
        onclick: () => {
          settings.language = value;
          saveSettings();
          api.reload();
        },
      });
      return h('div', { class: 'setting' }, h('label', { text: 'Language' }), h('div', { class: 'segmented' }, pick('auto', 'Auto'), pick('en', 'English'), pick('ru', 'Русский')), h('span'));
    };
    const sleepChoices = () => {
      let chosen = 0;
      const buttons = [0, 15, 30, 60, 90].map((minutes) => {
        const button = h('button', {
          text: minutes ? '{n} min' : 'Off',
          values: { n: minutes },
          class: minutes === 0 ? 'on' : '',
          onclick: () => {
            chosen = minutes;
            setSleepTimer(chosen);
            buttons.forEach((other) => other.classList.toggle('on', other === button));
          },
        });
        return button;
      });
      return h('div', { class: 'setting' }, h('label', { text: 'Sleep timer' }, h('small', { text: 'Music fades out and stops after this time' })), h('div', { class: 'segmented' }, ...buttons), h('span'));
    };
    const sourceRow = (name, text) => h('div', { class: 'source-row' }, h('strong', { text: name }), h('span', { text }));
    container.append(
      h('h1', { class: 'page-title', text: 'Settings' }),
      h('p', { class: 'page-sub', text: 'Make Solam look exactly how you want. Changes apply right away.' }),

      h('div', { class: 'setting-group' },
        languageChooser()),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Playback' }),
        fixedVolume ? null : toggle('crossfadeOn', 'Song transitions (Premium, free for now)', 'Blends the end of a song into the next one'),
        fixedVolume ? null : slider('crossfade', 'Transition length', '', 1, 12, 1, (value) => `${value}s`),
        toggle('autoplay', 'Autoplay similar songs', 'Keeps the music going when your list ends'),
        sleepChoices()),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Liquid Glass' }),
        slider('tint', 'Clear to tinted', 'Left is clear glass, right is deeply tinted', 0, 1, 0.01, percent),
        segmented('tintColor', 'Tint color', '', Object.entries(TINTS).map(([id, [name]]) => [id, name])),
        slider('blur', 'Frost', 'How blurry the background looks through the glass', 0, 50, 1, pixels),
        slider('refraction', 'Edge bending', 'How much the glass edges bend the background', 0, 80, 1, pixels),
        slider('radius', 'Corner roundness', '', 8, 44, 1, pixels)),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Animated Themes' }),
        h('div', { class: 'theme-grid' }, ...themeCards),
        slider('speed', 'Animation speed', '', 0, 2.5, 0.05, times),
        slider('brightness', 'Theme brightness', '', 0.4, 1.4, 0.01, percent)),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Effects Quality' }),
        segmented('quality', 'Quality', 'Low saves power. Medium suits most PCs. High looks sharpest.', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']])),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Glass Motion' }),
        toggle('extraMotion', 'Extra animations', 'Pages, lists, song changes and the moving cover'),
        toggle('rippleOn', 'Mouse ripples', 'The background bends and ripples around your mouse'),
        slider('ripple', 'Ripple strength', '', 0.1, 2, 0.05, percent),
        toggle('beatOn', 'Pulse to the beat', ''),
        slider('beat', 'Pulse strength', '', 0.05, 1, 0.01, percent),
        toggle('wobbleOn', 'Liquid wobble', 'Panels wobble when they open'),
        slider('wobble', 'Wobble strength', '', 0.05, 1, 0.01, percent),
        toggle('shineOn', 'Reflections', 'Light moves softly across the glass'),
        slider('shine', 'Reflection strength', '', 0.05, 1, 0.01, percent)),

      isWeb ? null : h('div', { class: 'setting-group' },
        h('h3', { text: 'Music-Reactive Visuals' }),
        toggle('reactive', 'React to music', 'Listens to your PC’s sound, on your PC only. Nothing is recorded or sent. All PC sound counts, not just Solam.')),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'Sound Quality' }),
        sourceRow('My Music', 'Your file’s full quality, including lossless FLAC and WAV'),
        sourceRow('Albums', 'FLAC when the album has it, otherwise MP3'),
        sourceRow('Online songs', 'Streaming quality set by the artist’s upload'),
        sourceRow('Solam songs', 'The file the artist uploaded, including FLAC')),

      isWeb ? null : h('div', { class: 'setting-group' },
        h('h3', { text: 'Memory' }),
        h('p', { id: 'memory-note', class: 'memory-reading', text: 'Measuring…' }),
        h('p', { class: 'status-note', text: 'Limit: 300 MB on Low and Medium, 500 MB on High. Solam lightens its effects if it goes over.' })),

      h('div', { class: 'setting-group' },
        h('h3', { text: 'About Solam' }),
        h('p', { id: 'about-version', class: 'status-note', text: 'Beta version' }),
        h('p', { class: 'status-note', text: 'This is a beta version, so some things may not work yet.' }),
        h('p', { class: 'status-note', raw: t('Help: {email}', { email: 'salam0support@gmail.com' }) }),
        legalLinks()),

      h('div', { class: 'actions' }, h('button', {
        class: 'button',
        text: 'Reset all settings',
        onclick: () => {
          settings = { ...DEFAULTS };
          saveSettings();
          container.replaceChildren();
          buildSettings();
          applySettings();
          toast('Settings reset to defaults.');
        },
      })));
  }

  /* ---------- big cover ---------- */

  let idleTimer = 0;
  function openBigCover() {
    document.body.classList.add('big');
    $('#bigcover').setAttribute('aria-hidden', 'false');
    markActive();
  }
  function closeBigCover() {
    document.body.classList.remove('big', 'idle');
    $('#bigcover').setAttribute('aria-hidden', 'true');
  }
  function markActive() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (document.body.classList.contains('big')) document.body.classList.add('idle');
    }, 3500);
  }

  function tiltCover(event) {
    const image = $('#bc-img');
    if (!settings.extraMotion || !document.body.classList.contains('big')) return;
    const box = image.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / box.width));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / box.height));
    image.style.transform = `perspective(900px) rotateY(${(x * 13).toFixed(2)}deg) rotateX(${(-y * 13).toFixed(2)}deg) scale(1.02)`;
    image.style.setProperty('--shine-x', `${50 + x * 50}%`);
  }

  /* ---------- memory ---------- */

  let lastMemory = null;

  function updateMemoryNote() {
    const note = document.getElementById('memory-note');
    if (note && lastMemory) note.textContent = t('Using about {used} MB of {budget} MB', lastMemory);
  }

  /* ---------- drawing the visualizers ---------- */

  function fitCanvas(canvas) {
    const ratio = window.devicePixelRatio;
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return ratio;
  }

  function drawBars() {
    const canvas = $('#np-viz');
    if (!canvas.clientWidth) return;
    const ratio = fitCanvas(canvas);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const bars = spectrumBars(22);
    const gap = 3 * ratio;
    const width = (canvas.width - gap * (bars.length - 1)) / bars.length;
    context.fillStyle = 'rgba(255,255,255,.78)';
    bars.forEach((value, i) => {
      const height = Math.max(2 * ratio, value * canvas.height * 0.95);
      context.beginPath();
      context.roundRect(i * (width + gap), (canvas.height - height) / 2, width, height, width / 2);
      context.fill();
    });
  }

  function drawRing() {
    const canvas = $('#bc-viz');
    if (!document.body.classList.contains('big')) return;
    const ratio = fitCanvas(canvas);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const image = $('#bc-img');
    const size = (image.clientWidth || 300) * ratio;
    const bars = spectrumBars(48);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = size * 0.67;
    context.lineCap = 'round';
    context.lineWidth = Math.max(2, size * 0.008);
    context.strokeStyle = 'rgba(255,255,255,.66)';
    for (let side = 0; side < 2; side++) {
      bars.forEach((value, i) => {
        const fraction = (i + 0.5) / bars.length;
        const angle = -Math.PI / 2 + (side ? -1 : 1) * fraction * Math.PI;
        const length = size * 0.012 + value * size * 0.15;
        context.beginPath();
        context.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        context.lineTo(cx + Math.cos(angle) * (radius + length), cy + Math.sin(angle) * (radius + length));
        context.stroke();
      });
    }
  }

  const pulseTargets = [];
  let miniOpen = false;
  let miniFrame = 0;

  function animate() {
    requestAnimationFrame(animate);
    updateAnalysis();
    drawBars();
    drawRing();
    if (miniOpen && ++miniFrame % 3 === 0) api.sendSpectrum(spectrumBars(26));
  }

  // The animation loop pauses while the window is minimized, so keep the mini player's bars alive.
  setInterval(() => {
    if (miniOpen && document.hidden) {
      updateAnalysis();
      api.sendSpectrum(spectrumBars(26));
    }
  }, 66);

  /* ---------- shine and ripples ---------- */

  let lastRipple = { x: 0, y: 0, at: 0 };
  let shinePending = null;

  window.addEventListener('pointermove', (event) => {
    engine.pointer(event.clientX, event.clientY);
    markActive();
    tiltCover(event);
    const moved = Math.hypot(event.clientX - lastRipple.x, event.clientY - lastRipple.y);
    if (moved > 90 && event.timeStamp - lastRipple.at > 150) {
      engine.ripple(event.clientX, event.clientY, 0.65);
      lastRipple = { x: event.clientX, y: event.clientY, at: event.timeStamp };
    }
    if (!shinePending) {
      requestAnimationFrame(() => {
        const point = shinePending;
        shinePending = null;
        document.querySelectorAll('.glass').forEach((panel) => {
          const box = panel.getBoundingClientRect();
          panel.style.setProperty('--mx', `${point.x - box.left}px`);
          panel.style.setProperty('--my', `${point.y - box.top}px`);
        });
      });
    }
    shinePending = { x: event.clientX, y: event.clientY };
  });

  window.addEventListener('pointerdown', (event) => engine.ripple(event.clientX, event.clientY, 1.4));

  /* ---------- wiring ---------- */

  function runCommand(command) {
    if (command === 'toggle') togglePlay();
    else if (command === 'next') step(1);
    else if (command === 'prev') step(-1);
    else if (command?.seek !== undefined) seekTo(command.seek);
  }

  function wire() {
    setIcon($('#win-min'), 'minimize');
    setIcon($('#win-max'), 'maximize');
    setIcon($('#win-close'), 'close');
    setIcon($('#np-prev'), 'prev');
    setIcon($('#np-next'), 'next');
    setIcon($('#np-mini'), 'mini');
    setIcon($('#bigcover-close'), 'down');
    setIcon($('#np-heart'), 'heart');
    for (const selector of ['#np-full', '#bc-full']) {
      $(selector).textContent = t('Listen to the full song');
      $(selector).onclick = (event) => {
        const track = player.queue[player.index];
        if (track) showFullSongMenu(track, event.currentTarget);
      };
    }
    $('#np-heart').onclick = () => {
      const track = player.queue[player.index];
      if (track) {
        toggleFavourite(track);
        wobble($('#np-heart'));
      }
    };
    document.querySelectorAll('[data-t]').forEach((element) => {
      element.setAttribute(element.dataset.t, t(element.getAttribute(element.dataset.t)));
    });
    $('#win-min').onclick = api.minimize;
    $('#win-max').onclick = api.maximize;
    $('#win-close').onclick = api.close;
    $('#np-play').onclick = togglePlay;
    $('#np-prev').onclick = () => step(-1);
    $('#np-next').onclick = () => step(1);
    $('#np-mini').onclick = api.toggleMini;
    $('#bigcover-close').onclick = closeBigCover;
    $('#np-art').onclick = () => {
      wobble($('#player'));
      if (document.body.classList.contains('big')) closeBigCover();
      else openBigCover();
    };

    const seek = $('#np-seek');
    seek.oninput = () => {
      player.seeking = true;
      setFill(seek);
      $('#np-pos').textContent = formatTime((Number(seek.value) / 1000) * player.np.dur);
    };
    seek.onchange = () => {
      player.seeking = false;
      if (player.np.dur) seekTo((Number(seek.value) / 1000) * player.np.dur);
    };

    const volume = $('#np-volume');
    volume.value = settings.volume;
    setFill(volume);
    decks.forEach((deck) => { deck.volume = settings.volume; });
    volume.oninput = () => {
      setFill(volume);
      settings.volume = Number(volume.value);
      if (!fade.active) audio.volume = targetVolume();
      saveSettings();
    };

    window.addEventListener('keydown', (event) => {
      const typing = event.target.matches('input:not([type="range"])');
      if (typing) return;
      if (event.code === 'Space' && !event.target.matches('button')) {
        event.preventDefault();
        togglePlay();
      } else if (event.key === 'Escape') {
        closeBigCover();
      } else if (event.ctrlKey && event.key === 'ArrowRight') {
        step(1);
      } else if (event.ctrlKey && event.key === 'ArrowLeft') {
        step(-1);
      }
    });

    api.onCommand(runCommand);
    api.onMiniState((open) => {
      miniOpen = open;
      $('#np-mini').classList.toggle('active', open);
      if (open) setTimeout(renderPlayer, 300);
    });
    api.onMaximized((maximized) => setIcon($('#win-max'), maximized ? 'mini' : 'maximize'));

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
    }
  }

  async function checkForUpdate() {
    try {
      const [current, latest] = await Promise.all([api.appVersion(), api.latestVersion()]);
      if (latest && latest !== current) {
        const notice = $('#update-notice');
        notice.hidden = false;
        notice.textContent = t('A new version of Solam is ready. Click to download.');
        notice.onclick = () => api.openSite('');
      }
    } catch {
      // Being offline is fine: the check just runs again next time.
    }
  }

  if (isWeb) {
    engine.maxRatio = 0.8;
    engine.minFrameMs = 33;
  }

  async function init() {
    pulseTargets.push($('#dock'), $('#player'));
    wire();
    buildDock();
    buildHome();
    buildPremium();
    api.onMemoryReport((report) => {
      lastMemory = report;
      updateMemoryNote();
      if (report.trim) {
        api.clearPageCache();
        engine.lighten();
        // PCs without a separate graphics card may need blur-free glass to stay inside the limit.
        memoryTrims += 1;
        if (memoryTrims >= 2 && !lightGlassForMemory) {
          lightGlassForMemory = true;
          applySettings();
        }
      }
    });
    showLyricNote('Lyrics appear here when a song plays.');
    ['#dock', '#player', '#bc-lyrics'].forEach((selector) => window.LiquidGlass.attach($(selector)));
    applySettings();
    renderPlayer();
    showPage('home');
    animate();
    try {
      library = await api.getLibrary();
    } catch {
      toast('Couldn’t read your music library.');
    }
    await refreshAccount();
    if (account.user) syncSaved();
  }

  init();
})();
