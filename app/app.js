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
    transitionStyle: 'auto',
    autoplay: true,
    extraMotion: true,
    language: 'auto',
    welcomed: false,
    seenNews: '',
    discordOn: true,
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
  const SECONDS_PER_LYRIC_LETTER = 0.085;
  const MIN_LINE_SECONDS = 1.5;
  const LAST_LINE_SECONDS = 5;
  const PREVIEW_VOLUME_SCALE = 0.55;
  const SITE = 'https://v1sion0coder.github.io/solam/';
  const FREE_DOWNLOADS = 10;
  const WHATS_NEW_VERSION = '0.9.13';
  const AI_KEY = 'solam.ai';
  const AI_SAVED_MESSAGES = 40;
  const AI_SENT_MESSAGES = 12;
  const AI_NAME = 'Solam AI';
  const FREE_FADE_SECONDS = 2;
  const MIX_TICK_MS = 250;
  const SILENCE_LEVEL = 0.006;
  const SILENT_TICKS_TO_MOVE_ON = 6;
  const SILENCE_CHECK_LAST_SECONDS = 30;
  const MIN_TRIM = 0.7;
  const MAX_TRIM = 1.35;
  const LISTENER_KEY = 'solam.listener';
  const INBOX_KEY = 'solam.inbox';
  const INBOX_LIMIT = 30;
  const INBOX_CHECK_MS = 60 * 60 * 1000;
  const LIGHT_GLASS_OVER_BUDGET = 1.4;
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
    mail: 'M3 5h18v14H3zm2.400 2 6.600 5 6.600-5zM5 8.500V17h14V8.500l-7 5.300z',
    bell: 'M12 22a2.500 2.500 0 0 0 2.400-2h-4.800A2.500 2.500 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.500-6.800V3.500a1.500 1.500 0 0 0-3 0v.700A7 7 0 0 0 5 11v5l-2 2v1h18v-1z',
    menu: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
    share: 'M18 16a3 3 0 0 0-2.200 1l-7-4a3 3 0 0 0 0-2l7-4A3 3 0 1 0 15 5v.3l-7 4a3 3 0 1 0 0 5.400l7 4V19a3 3 0 1 0 3-3z',
    repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z',
    shuffle: 'M10.6 9.2 5.400 4 4 5.400l5.200 5.200zM14.500 4l2 2L4 18.600 5.400 20 17.900 7.500l2 2V4zm.300 9.400-1.400 1.400 3.100 3.100-2 2H20v-5.500l-2 2z',
    spark: 'M12 2.500 14 9l6.500 2-6.500 2-2 6.500-2-6.500-6.500-2L10 9zM19 2l.8 2.200L22 5l-2.200.8L19 8l-.8-2.200L16 5l2.200-.8z',
    send: 'M3 20.500 21.500 12 3 3.500V10l11 2-11 2z',
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
  // Windows lets Premium transitions shape the sound, which browsers only allow when the song's server agrees.
  if (!isWeb) decks.forEach((deck) => { deck.crossOrigin = 'anonymous'; });

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

  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement) event.target.classList.add('shown');
  }, true);

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
    syncGlass();
  }

  function changeSetting(key, value) {
    settings[key] = value;
    saveSettings();
    applySettings();
    if (key === 'discordOn') updateDiscord();
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
  const player = { queue: [], index: -1, np: { ...NOTHING }, seeking: false, sources: [], counted: false, skips: 0, repeat: 'off', shuffle: false, unshuffled: null };
  const fade = { timer: 0, active: false, from: null, to: null };
  const sleep = { timer: 0, ends: 0, minutes: 0 };

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

  /* ---------- premium transitions ---------- */

  const mix = { context: null, decks: new Map(), samples: new Float32Array(1024), timer: 0, quietTicks: 0, reference: 0 };
  const TRANSITION_STYLES = [['auto', 'Auto'], ['smooth', 'Smooth'], ['dj', 'DJ mix'], ['echo', 'Echo out']];
  const richTransitions = () => !isWeb && hasPremium() && Boolean(window.AudioContext);
  const transitionSeconds = () => (hasPremium() ? settings.crossfade : FREE_FADE_SECONDS);

  function wireDeck(deck) {
    if (mix.decks.has(deck)) return mix.decks.get(deck);
    mix.context ||= new AudioContext({ latencyHint: 'playback' });
    const { context } = mix;
    const filter = (type, frequency) => {
      const node = context.createBiquadFilter();
      node.type = type;
      node.frequency.value = frequency;
      return node;
    };
    const gain = (value) => {
      const node = context.createGain();
      node.gain.value = value;
      return node;
    };
    const node = {
      source: context.createMediaElementSource(deck),
      high: filter('highpass', 20),
      low: filter('lowpass', 20000),
      trim: gain(1),
      level: gain(deck.volume),
      echoSend: gain(0),
      echoFeedback: gain(0.45),
      echoLevel: gain(1),
      delay: context.createDelay(2),
      meter: context.createAnalyser(),
      average: 0,
      measured: 0,
    };
    node.delay.delayTime.value = 0.36;
    node.meter.fftSize = mix.samples.length;
    node.source.connect(node.high);
    node.high.connect(node.low);
    node.low.connect(node.trim);
    node.trim.connect(node.level);
    node.trim.connect(node.meter);
    node.level.connect(context.destination);
    node.low.connect(node.echoSend);
    node.echoSend.connect(node.delay);
    node.delay.connect(node.echoFeedback);
    node.echoFeedback.connect(node.delay);
    node.delay.connect(node.echoLevel);
    node.echoLevel.connect(context.destination);
    deck.volume = 1;
    mix.decks.set(deck, node);
    if (!mix.timer) mix.timer = setInterval(listenToMix, MIX_TICK_MS);
    return node;
  }

  function setDeckLevel(deck, value) {
    const node = mix.decks.get(deck);
    if (node) node.level.gain.value = value;
    else deck.volume = value;
  }

  const deckLevel = (deck) => mix.decks.get(deck)?.level.gain.value ?? deck.volume;

  function deckLoudness(node) {
    node.meter.getFloatTimeDomainData(mix.samples);
    let sum = 0;
    for (const sample of mix.samples) sum += sample * sample;
    return Math.sqrt(sum / mix.samples.length);
  }

  // Matches each new song's volume to the last one, and moves on when a song ends in silence.
  function listenToMix() {
    const node = mix.decks.get(audio);
    if (!node || audio.paused || !richTransitions()) return;
    const loudness = deckLoudness(node);
    if (loudness > SILENCE_LEVEL) {
      node.measured += 1;
      node.average += (loudness - node.average) * Math.max(0.03, 1 / node.measured);
      if (mix.reference && node.measured > 12) {
        const wanted = Math.max(MIN_TRIM, Math.min(MAX_TRIM, mix.reference / node.average));
        node.trim.gain.setTargetAtTime(wanted, mix.context.currentTime, 2);
      }
    }
    // A song that is still loading is silent too, and that must not count as the song having ended.
    const reallyPlaying = !audio.seeking && audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    mix.quietTicks = loudness < SILENCE_LEVEL && reallyPlaying ? mix.quietTicks + 1 : 0;
    const left = (Number.isFinite(audio.duration) ? audio.duration : 0) - audio.currentTime;
    if (mix.quietTicks >= SILENT_TICKS_TO_MOVE_ON && left > 0.5 && left < SILENCE_CHECK_LAST_SECONDS && !fade.active && settings.crossfadeOn && player.repeat === 'off' && player.queue[player.index + 1]) {
      mix.quietTicks = 0;
      player.index += 1;
      loadCurrent(Math.min(2, transitionSeconds()));
    }
  }

  function chooseStyle(track) {
    if (settings.transitionStyle !== 'auto') return settings.transitionStyle;
    const genre = String(track?.genre || '');
    if (/hip|rap|trap|house|techno|electr|dance|edm|dnb|drum|bass|club/i.test(genre)) return 'dj';
    if (/rock|metal|punk|grunge/i.test(genre)) return 'echo';
    return 'smooth';
  }

  const between = (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start)));
  const sweep = (from, to, amount) => from * (to / from) ** amount;

  // Returns how loud each song is at this moment, and shapes their sound for the chosen style.
  function shapeTransition(from, to, progress, style) {
    const out = mix.decks.get(from);
    const incoming = mix.decks.get(to);
    if (style === 'dj' && out && incoming) {
      // A DJ swaps the bass halfway, so two basslines never fight each other.
      const swap = between(progress, 0.42, 0.58);
      incoming.high.frequency.value = sweep(320, 20, swap);
      out.high.frequency.value = sweep(20, 1400, between(progress, 0.42, 1));
      return [Math.cos(between(progress, 0.3, 1) * Math.PI * 0.5), Math.sin(between(progress, 0, 0.45) * Math.PI * 0.5)];
    }
    if (style === 'echo' && out && incoming) {
      // The old song repeats into the distance while the new one rises underneath.
      out.echoSend.gain.value = 0.8 * between(progress, 0.2, 0.42);
      return [1 - between(progress, 0.38, 0.52), Math.sin(between(progress, 0.4, 0.85) * Math.PI * 0.5)];
    }
    if (out) out.low.frequency.value = sweep(20000, 3000, between(progress, 0.25, 1));
    return [Math.cos((progress * Math.PI) / 2), Math.sin((progress * Math.PI) / 2)];
  }

  function resetDeckSound(deck) {
    const node = mix.decks.get(deck);
    if (!node) return;
    node.high.frequency.value = 20;
    node.low.frequency.value = 20000;
    node.echoSend.gain.value = 0;
  }

  function targetVolume() {
    return settings.volume * (player.queue[player.index]?.source === 'preview' ? PREVIEW_VOLUME_SCALE : 1);
  }

  function playQueue(queue, index) {
    player.queue = [...queue];
    player.index = index;
    player.unshuffled = null;
    if (player.shuffle) shuffleUpcoming();
    if (player.repeat === 'once') setRepeat('off');
    loadCurrent();
  }

  function shuffleUpcoming() {
    player.unshuffled = [...player.queue];
    const upcoming = player.queue.slice(player.index + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    player.queue = [...player.queue.slice(0, player.index + 1), ...upcoming];
  }

  function toggleShuffle() {
    player.shuffle = !player.shuffle;
    if (player.shuffle) {
      shuffleUpcoming();
    } else if (player.unshuffled) {
      const current = player.queue[player.index];
      const added = player.queue.filter((track) => !player.unshuffled.includes(track));
      player.queue = [...player.unshuffled, ...added];
      player.index = Math.max(0, player.queue.indexOf(current));
      player.unshuffled = null;
    }
    const button = $('#np-shuffle');
    button.classList.toggle('on', player.shuffle);
    button.setAttribute('aria-pressed', String(player.shuffle));
    popIn(button.firstElementChild);
    toast(player.shuffle ? 'Shuffle on.' : 'Shuffle off.');
  }

  function setRepeat(mode) {
    player.repeat = mode;
    const button = $('#np-repeat');
    button.classList.toggle('on', mode !== 'off');
    button.dataset.mark = mode === 'once' ? '1' : '∞';
    button.title = t(mode === 'once' ? 'Repeat: one more time' : mode === 'always' ? 'Repeat: forever' : 'Repeat');
    button.setAttribute('aria-label', button.title);
  }

  function cycleRepeat() {
    const next = { off: 'once', once: 'always', always: 'off' }[player.repeat];
    setRepeat(next);
    popIn($('#np-repeat svg'));
    toast({ off: 'Repeat off.', once: 'This song plays one more time.', always: 'This song repeats forever.' }[next]);
  }

  // Plays the same song again when repeat is on, and says whether it did.
  function replayIfRepeating() {
    if (player.repeat === 'off') return false;
    if (player.repeat === 'once') setRepeat('off');
    player.counted = false;
    audio.currentTime = 0;
    audio.play().catch(() => setNowPlaying({ playing: false }));
    return true;
  }

  async function loadCurrent(fadeSeconds = transitionsOn() ? MANUAL_FADE_SECONDS : 0) {
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
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
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
      const unheard = async (genre) => (await api.similar(genre)).filter((item) => !known.has(trackKey(item)));
      let more = await unheard(track.genre || favouriteGenre());
      // A rare genre can have nothing similar, and the music should still keep going.
      if (!more.length) more = await unheard('');
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
    if (fade.from) resetDeckSound(fade.from);
    if (fade.to) {
      resetDeckSound(fade.to);
      setDeckLevel(fade.to, targetVolume());
    }
    Object.assign(fade, { active: false, from: null, to: null });
  }

  function startFade(from, to, seconds, style) {
    Object.assign(fade, { active: true, from, to });
    const started = performance.now();
    const fromVolume = deckLevel(from);
    fade.timer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / (seconds * 1000));
      const [outgoing, incoming] = shapeTransition(from, to, progress, style);
      setDeckLevel(from, fromVolume * outgoing);
      setDeckLevel(to, targetVolume() * incoming);
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
      if (richTransitions()) {
        wireDeck(outgoing);
        wireDeck(audio);
        mix.reference = mix.decks.get(outgoing).average;
        Object.assign(mix.decks.get(audio), { average: 0, measured: 0 });
        mix.decks.get(audio).trim.gain.value = 1;
      }
      setDeckLevel(audio, 0);
      // Short jumps from pressing Next stay simple, because a full DJ mix needs time.
      startFade(outgoing, audio, fadeSeconds, richTransitions() && fadeSeconds >= 3 ? chooseStyle(track) : 'smooth');
    } else if (!fade.active) {
      if (richTransitions()) {
        wireDeck(audio);
        Object.assign(mix.decks.get(audio), { average: 0, measured: 0 });
        mix.decks.get(audio).trim.gain.value = 1;
        mix.reference = 0;
      }
      setDeckLevel(audio, targetVolume());
    }
    mix.quietTicks = 0;
    mix.context?.resume();
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
      if (player.repeat === 'once') setRepeat('off');
      player.index = next;
      loadCurrent();
    }
  }

  function togglePlay() {
    if (!audio.getAttribute('src')) return;
    if (fade.active) finishFade();
    mix.context?.resume();
    if (audio.paused) audio.play().catch(() => toast('Couldn’t resume playback.'));
    else audio.pause();
  }

  function seekTo(seconds) {
    if (audio.getAttribute('src')) audio.currentTime = seconds;
  }

  decks.forEach((deck) => {
    deck.addEventListener('play', () => {
      if (deck === audio && deck.src !== SILENT_AUDIO) setNowPlaying({ playing: true });
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
        api.server('countPlay', track.id, listenerId());
      }
      const blend = transitionSeconds();
      if (player.repeat === 'off' && transitionsOn() && !fade.active && !deck.paused && dur > blend * 3 && dur - deck.currentTime <= blend && player.queue[player.index + 1]) {
        player.index += 1;
        loadCurrent(blend);
      }
    });
    deck.addEventListener('ended', () => {
      if (deck !== audio || replayIfRepeating()) return;
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
    sleep.minutes = minutes;
    if (!minutes) return;
    sleep.ends = Date.now() + minutes * 60000;
    sleep.timer = setTimeout(fadeToSleep, minutes * 60000);
  }

  function fadeToSleep() {
    sleep.ends = 0;
    sleep.minutes = 0;
    const started = performance.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / (SLEEP_FADE_SECONDS * 1000));
      setDeckLevel(audio, targetVolume() * (1 - progress));
      if (progress >= 1) {
        clearInterval(timer);
        audio.pause();
        setDeckLevel(audio, targetVolume());
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
    if (trackChanged || next.playing !== previous.playing || next.art !== previous.art) updateDiscord();
    renderPlayer();
  }

  let lastPlayIcon = null;

  // A small springy bounce for things the person just pressed.
  function popIn(element, from = 0.72) {
    if (!element || !settings.extraMotion) return;
    element.animate([{ transform: `scale(${from})` }, { transform: 'scale(1.08)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }

  function updateDiscord() {
    const { np } = player;
    api.discordUpdate(settings.discordOn ? premium.settings.discordId : null, { title: np.title, artist: np.artist, art: np.art, playing: np.playing, pos: audio.currentTime || np.pos, dur: np.dur });
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
    if (lastPlayIcon !== np.playing) {
      lastPlayIcon = np.playing;
      setIcon($('#np-play'), np.playing ? 'pause' : 'play');
      popIn($('#np-play svg'));
    }
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
    document.querySelectorAll('[data-key]').forEach((row) => {
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
      { opacity: 0, transform: 'scale(.94)' },
      { opacity: 1, transform: 'scale(1)' },
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

  // A random number that lets artists count listeners without knowing who they are.
  function listenerId() {
    try {
      let id = localStorage.getItem(LISTENER_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(LISTENER_KEY, id);
      }
      return id;
    } catch {
      return null;
    }
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
    setImage($('#bc-bg'), art);
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

  const WORD_TIME = /<(\d+):(\d+(?:\.\d+)?)>/g;

  // Artists can time each word exactly, like <00:12.50>word. Otherwise each word's time is worked out from its length.
  function timedWords(line, nextTime) {
    const parts = line.text.split(/(?=<\d+:\d+(?:\.\d+)?>)/);
    const exact = [];
    for (const part of parts) {
      const match = /^<(\d+):(\d+(?:\.\d+)?)>(.*)$/.exec(part);
      if (match) match[3].trim().split(/\s+/).filter(Boolean).forEach((text) => exact.push({ text, time: Number(match[1]) * 60 + Number(match[2]) }));
    }
    if (exact.length) return exact;
    const pieces = line.text.split(/\s+/).filter(Boolean);
    const letters = pieces.reduce((sum, word) => sum + word.length + 1, 0);
    const end = nextTime ?? line.time + LAST_LINE_SECONDS;
    const sung = Math.max(MIN_LINE_SECONDS, Math.min(end - line.time, letters * SECONDS_PER_LYRIC_LETTER));
    let done = 0;
    return pieces.map((text) => {
      const word = { text, time: line.time + (done / letters) * sung };
      done += text.length + 1;
      return word;
    }).map((word, i, all) => ({ ...word, end: all[i + 1]?.time ?? line.time + sung }));
  }

  function parseSynced(text) {
    const lines = [];
    for (const raw of text.split('\n')) {
      const match = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(raw.trim());
      if (match) lines.push({ time: Number(match[1]) * 60 + Number(match[2]), text: match[3].trim() });
    }
    const usable = lines.filter((line) => line.text.replace(WORD_TIME, '').trim());
    usable.forEach((line, i) => {
      line.words = timedWords(line, usable[i + 1]?.time);
      line.text = line.words.map((word) => word.text).join(' ');
    });
    return usable;
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
      showLyricNote('Lyrics appear here when a song plays.');
      return;
    }
    showLyricNote('Looking for lyrics…');
    const own = player.queue[player.index]?.lyrics;
    const found = own
      ? { synced: /^\s*\[\d+:\d+/.test(own) ? own : '', plain: own }
      : await api.lyrics({ title, artist, album, duration: dur });
    if (token !== lyrics.token) return;
    // A preview is a short clip from inside the song, so timed lyrics wouldn't line up with it.
    const isPreview = hasOnlyPreview(player.queue[player.index]);
    if (found?.synced && !isPreview) {
      lyrics.lines = parseSynced(found.synced);
      lyrics.synced = lyrics.lines.length > 0;
    }
    const plainText = String(found?.plain || found?.synced || '').replace(/^\s*\[[^\]]*\]\s*/gm, '');
    const box = $('#bc-lyrics');
    if (lyrics.synced) {
      box.classList.remove('plain');
      box.replaceChildren(...lyrics.lines.map((line) => h('p', { onclick: () => seekTo(line.time) }, ...line.words.map((word) => h('span', { class: 'word', raw: `${word.text} ` })))));
      updateLyricsPosition();
    } else if (plainText.trim()) {
      box.classList.add('plain');
      box.replaceChildren(
        isPreview ? h('p', { class: 'lyric-note', text: 'This is a 30-second preview, so the lyrics can’t follow along.' }) : null,
        ...plainText.split('\n').map((line) => h('p', { raw: line || ' ' })));
    } else {
      showLyricNote('No lyrics found for this song.');
    }
  }

  function updateLyricsPosition() {
    if (!lyrics.synced) return;
    const pos = audio.getAttribute('src') ? audio.currentTime : player.np.pos;
    let index = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= pos + 0.15) index = i;
      else break;
    }
    const box = $('#bc-lyrics');
    if (index !== lyrics.currentIndex) {
      lyrics.currentIndex = index;
      [...box.children].forEach((line, i) => {
        line.classList.toggle('current', i === index);
        line.classList.toggle('past', i < index);
      });
      lyrics.wordIndex = -1;
      const current = box.children[index];
      if (current) box.scrollTop = current.offsetTop - box.clientHeight / 2 + current.offsetHeight / 2;
    }
    const line = lyrics.lines[index];
    if (!line) return;
    const { words } = line;
    let spoken = -1;
    for (let i = 0; i < words.length; i++) {
      if (words[i].time <= pos) spoken = i;
      else break;
    }
    const spans = box.children[index]?.children;
    if (!spans) return;
    if (spoken !== lyrics.wordIndex) {
      lyrics.wordIndex = spoken;
      [...spans].forEach((span, i) => {
        span.classList.toggle('said', i < spoken);
        span.classList.toggle('saying', i === spoken);
      });
    }
    if (spoken >= 0) {
      const word = words[spoken];
      const end = word.end ?? words[spoken + 1]?.time ?? word.time + 0.6;
      spans[spoken].style.setProperty('--sweep', `${(Math.min(1, (pos - word.time) / Math.max(0.05, end - word.time)) * 100).toFixed(1)}%`);
    }
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
    ['assistant', 'Solam AI', 'spark'],
  ];
  // A phone has room for five buttons, so the rest live behind More.
  const PHONE_DOCK = ['home', 'artists', 'collection', 'upload'];
  const PHONE_MORE = [['assistant', 'Solam AI', 'spark'], ['connectors', 'Connectors', 'connectors'], ['premium', 'Premium', 'premium'], ['account', 'Account', 'account'], ['settings', 'Settings', 'settings']];
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
    closeSheet();
    if (id === 'premium') renderPremium();
    if (id === 'assistant') renderAssistant();
    document.body.classList.toggle('on-assistant', id === 'assistant');
    const lit = id === 'artist' ? 'artists' : isWeb && PHONE_MORE.some(([page]) => page === id) ? 'more' : id;
    Object.entries(nav).forEach(([key, button]) => button.classList.toggle('active', key === lit));
    moveDockGlider();
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
    if (panel && settings.quality === 'high') wobble(panel);
    syncGlass();
  }

  function moveDockGlider() {
    const glider = document.getElementById('dock-glider');
    const active = document.querySelector('.dock-item.active');
    if (!glider) return;
    glider.style.opacity = active ? '1' : '0';
    if (!active) return;
    glider.style.width = `${active.offsetWidth}px`;
    glider.style.height = `${active.offsetHeight}px`;
    glider.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  }

  function buildDock() {
    const dock = $('#dock');
    dock.append(h('span', { id: 'dock-glider', 'aria-hidden': 'true' }));
    window.addEventListener('resize', moveDockGlider);
    const button = ([id, label, iconName]) => {
      const item = h('button', { class: 'dock-item', title: label, 'aria-label': label, onclick: () => showPage(id) }, icon(iconName), h('span', { text: label }));
      nav[id] = item;
      return item;
    };
    if (isWeb) {
      const more = h('button', { class: 'dock-item', title: 'More', 'aria-label': 'More', onclick: showMoreSheet }, icon('menu'), h('span', { text: 'More' }));
      nav.more = more;
      dock.append(...PAGES.filter(([id]) => PHONE_DOCK.includes(id)).map(button), more);
      return;
    }
    dock.append(...PAGES.map(button), h('div', { class: 'dock-spacer' }), button(['account', 'Account', 'account']), button(['settings', 'Settings', 'settings']));
  }

  /* ---------- lists ---------- */

  function trackRow(track, queue, index, context) {
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
        popIn(heart.firstElementChild, 0.6);
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
        showPlaylistMenu(track, event.currentTarget, context);
      },
    }, icon('more')),
    h('time', { raw: track.duration ? formatTime(track.duration) : '' }));
    row.style.setProperty('--i', Math.min(index, 14));
    return row;
  }

  function trackList(all, pageSize = 100, context) {
    const tracks = all.filter((track) => !hiddenTracks.has(trackKey(track)));
    const list = h('div', { class: 'track-list' });
    let shown = 0;
    const more = h('button', {
      class: 'button small show-more',
      text: 'Show more',
      onclick: () => addPage(),
    });
    function addPage() {
      more.remove();
      tracks.slice(shown, shown + pageSize).forEach((track, offset) => list.append(trackRow(track, tracks, shown + offset, context)));
      shown += pageSize;
      if (shown < tracks.length) list.append(more);
      renderPlayer();
      refreshHearts();
    }
    addPage();
    return list;
  }

  function albumCard(album, onOpen) {
    return h('button', { class: 'album', onclick: onOpen },
      h('img', { src: album.art, alt: '', loading: 'lazy', decoding: 'async' }),
      h('strong', { raw: album.title }),
      h('span', { raw: album.artist }),
      album.license ? h('span', { class: 'album-license', raw: album.license }) : null);
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
        album.license ? h('p', { class: 'free-note', raw: `${album.artist} · ${album.license}` }) : null,
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
    const recent = loadRecent().filter((track) => !hiddenTracks.has(trackKey(track)));
    homeParts.recent.replaceChildren(
      ...(recent.length ? [h('h2', { class: 'section-title', text: 'Recently played' }), h('div', { class: 'quick-grid' }, ...recent.slice(0, 6).map((track, i) => quickTile(track, recent, i)))] : []));
  }

  function quickTile(track, queue, index) {
    const image = track.thumb || track.art;
    return h('button', { class: 'quick-tile', 'data-key': `${track.title}|${track.artist}`, onclick: () => playQueue(queue, index) },
      image ? h('img', { src: image, alt: '', loading: 'lazy', decoding: 'async' }) : h('div', { class: 'blank' }),
      h('span', { raw: track.title }));
  }

  function songTile(track, queue, index) {
    (track.artMirrors || []).forEach((server) => artServers.add(server));
    const image = track.thumb || track.art;
    return h('div', { class: 'song-tile', role: 'button', tabindex: 0, 'data-key': `${track.title}|${track.artist}`, onclick: () => playQueue(queue, index), onkeydown: (event) => { if (event.key === 'Enter') playQueue(queue, index); } },
      h('div', { class: 'tile-art' },
        image ? h('img', { src: image, alt: '', loading: 'lazy', decoding: 'async' }) : h('div', { class: 'blank' }),
        h('span', { class: 'tile-play' }, icon('play'))),
      h('strong', { raw: track.title }),
      h('span', { raw: track.artist }));
  }

  function songShelf(all, extra) {
    const tracks = all.filter((track) => !hiddenTracks.has(trackKey(track)));
    return h('div', { class: 'shelf' }, ...tracks.map((track, i) => songTile(track, tracks, i)), extra);
  }

  function favouriteGenre() {
    const counts = new Map();
    loadRecent().forEach((track) => {
      if (track.genre) counts.set(track.genre, (counts.get(track.genre) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  async function fillSection(container, title, load, render, failure) {
    container.replaceChildren(h('h2', { class: 'section-title', text: title }), h('div', { class: 'shelf skeletons', 'aria-label': t('Loading…') }, ...[0, 1, 2, 3, 4, 5].map(() => h('i', { class: 'skeleton-tile' }))));
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
    }, (tracks) => songShelf(tracks), 'Couldn’t load trending songs. Check your internet connection.');
  }

  // Small artists are shown first on Home, which is why uploading to Solam is worth it.
  async function loadNewSongs() {
    const result = await api.server('newTracks');
    const tracks = result.ok ? result.value : [];
    homeParts.newSongs.replaceChildren(
      h('h2', { class: 'section-title', text: 'New from Solam artists' }),
      songShelf(tracks, h('button', { class: 'song-tile invite-tile', onclick: () => showPage('upload') },
        h('div', { class: 'tile-art' }, icon('upload')),
        h('strong', { text: 'Your song here' }),
        h('span', { text: 'Upload your music' }))));
    renderPlayer();
  }

  function loadDiscover() {
    loadForYou();
    loadNewSongs();
    fillSection(homeParts.trending, 'Trending now', api.trending, (tracks) => h('div', {}, songShelf(tracks.slice(0, 8)), tracks.length > 8 ? trackList(tracks.slice(8)) : null), 'Couldn’t load trending songs. Check your internet connection.');
    fillSection(homeParts.artists, 'Popular artists', api.topArtists, (artists) => artistRow(artists.slice(0, 8)), 'Couldn’t load artists. Check your internet connection.');
    fillSection(homeParts.similar, 'Similar songs for you', async () => {
      const played = new Set(loadRecent().map(trackKey));
      return (await api.similar(favouriteGenre())).filter((track) => !played.has(trackKey(track))).slice(-6);
    }, (tracks) => trackList(tracks), 'Couldn’t load trending songs. Check your internet connection.');
    loadFreeMusic();
  }

  const FREE_PAGE_SIZE = 12;

  // Music checked to be free to share. Today's pick changes every day, so Home keeps feeling new.
  async function loadFreeMusic() {
    const box = homeParts.albums;
    box.replaceChildren(h('h2', { class: 'section-title', text: 'Free to share' }), h('div', { class: 'shelf skeletons' }, ...[0, 1, 2, 3, 4, 5].map(() => h('i', { class: 'skeleton-tile' }))));
    let all = [];
    try {
      all = await api.freeAlbums();
    } catch {
      all = [];
    }
    if (!all.length) {
      box.replaceChildren(h('h2', { class: 'section-title', text: 'Free to share' }), h('p', { class: 'empty', text: 'Couldn’t load free music. Check your internet connection.' }));
      return;
    }
    const day = Math.floor(Date.now() / 86400000);
    const mixed = [...all].sort((a, b) => dailyOrder(a.id, day) - dailyOrder(b.id, day));
    const genres = [...new Set(all.map((album) => album.genre))].sort();
    const songCount = all.reduce((sum, album) => sum + (album.songs || 0), 0);
    let genre = '';
    let shown = FREE_PAGE_SIZE;
    const content = h('div', {});
    const chips = h('div', { class: 'chips free-genres' });
    const draw = () => {
      chips.replaceChildren(...['', ...genres].map((name) => h('button', {
        class: `chip${name === genre ? ' selected' : ''}`,
        text: name || 'All',
        onclick: () => {
          genre = name;
          shown = FREE_PAGE_SIZE;
          draw();
        },
      })));
      const list = mixed.filter((album) => !genre || album.genre === genre);
      content.replaceChildren(
        h('div', { class: 'album-grid' }, ...list.slice(0, shown).map((album) => albumCard(album, () => openArchiveAlbum(album, content, draw)))),
        shown < list.length ? h('button', { class: 'button small show-more', text: 'Show more', onclick: () => { shown += FREE_PAGE_SIZE; draw(); } }) : null);
    };
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Free to share' }),
      h('p', { class: 'free-note', text: '{albums} albums and {songs} songs whose artists let anyone share them.', values: { albums: formatCount(all.length), songs: formatCount(songCount) } }),
      chips,
      content);
    draw();
  }

  function dailyOrder(id, day) {
    let mixed = day;
    for (const letter of id) mixed = (mixed * 31 + letter.charCodeAt(0)) % 1000003;
    return mixed;
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 18) return 'Good evening';
    return hour < 12 ? 'Good morning' : 'Good afternoon';
  }

  function buildHome() {
    for (const part of ['results', 'newSongs', 'forYou', 'trending', 'recent', 'artists', 'similar', 'albums']) homeParts[part] = h('div', {});
    const discover = h('div', {}, homeParts.recent, homeParts.newSongs, homeParts.forYou, homeParts.trending, homeParts.artists, homeParts.similar, homeParts.albums);
    const showDiscover = () => {
      searchToken += 1;
      homeParts.results.replaceChildren();
      discover.hidden = false;
    };
    const input = h('input', {
      class: 'search',
      type: 'search',
      placeholder: 'Search for a song or artist',
      'aria-label': 'Search all music',
      onkeydown: (event) => {
        if (event.key === 'Enter' && input.value.trim()) searchEverywhere(input.value.trim());
      },
      oninput: () => {
        if (!input.value.trim()) showDiscover();
      },
    });
    homeParts.input = input;
    homeParts.discover = discover;
    $('#home').append(
      h('div', { class: 'home-hero' },
        h('h1', { class: 'page-title', text: greeting() }),
        h('p', { class: 'page-sub', text: 'Free music, no ads. Search and press play.' }),
        input,
        h('div', { class: 'chips genre-row' }, ...GENRES.map((genre) => h('button', {
          class: 'chip',
          text: genre,
          onclick: () => {
            input.value = genre;
            searchEverywhere(genre);
          },
        })))),
      homeParts.results,
      discover);
    renderRecent();
    loadDiscover();
  }

  async function searchEverywhere(term) {
    const token = ++searchToken;
    homeParts.discover.hidden = true;
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
    if (artist.source === 'solam' && account.user) api.server('setFollow', artist.id, !isFollowing(artist));
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
    saved.follows.filter((artist) => artist.source === 'solam').forEach((artist) => api.server('setFollow', artist.id, true));
    loadSharedLists();
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
    if (!premium.active && premiumOnSale() && offlineFiles.size >= FREE_DOWNLOADS) {
      toast('You can keep {n} songs offline for free. Premium removes the limit.', { n: FREE_DOWNLOADS });
      showPage('premium');
      return;
    }
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

  function showReportChoice(track, menu, anchor) {
    menu.replaceChildren(
      h('p', { class: 'pop-title', text: 'Report this song' }),
      h('button', { text: 'Report a problem', role: 'menuitem', onclick: () => showReportForm(track, menu, anchor) }),
      h('button', { text: 'Report for copyright', role: 'menuitem', onclick: () => { closeMenu(); showCopyrightForm(track); } }));
    placeMenu(menu, anchor);
  }

  // Asks for what a rights owner needs to give, so the song can be checked and they can be answered.
  function showCopyrightForm(track) {
    const name = h('input', { class: 'field', maxlength: 100, autocomplete: 'name', placeholder: 'Your name or company', 'aria-label': 'Your name or company' });
    const email = h('input', { class: 'field', type: 'email', maxlength: 150, autocomplete: 'email', placeholder: 'Email', 'aria-label': 'Email', value: account.user?.email || '' });
    const work = h('textarea', { class: 'field', rows: 3, maxlength: 500, placeholder: 'What is your work, and where can it be found?', 'aria-label': 'What is your work, and where can it be found?' });
    const promise = h('input', { type: 'checkbox' });
    const message = h('p', { class: 'status-note', role: 'alert' });
    const send = h('button', {
      class: 'button primary',
      text: 'Send copyright report',
      onclick: async () => {
        if (name.value.trim().length < 2 || !email.value.includes('@') || work.value.trim().length < 5) {
          message.textContent = t('Please fill in your name, email and your work.');
          return;
        }
        if (!promise.checked) {
          message.textContent = t('Please confirm that this report is true.');
          return;
        }
        send.disabled = true;
        const result = await api.server('report', { key: trackKey(track), title: track.title, artist: track.artist, reason: work.value, kind: 'copyright', contact: `${name.value.trim()} <${email.value.trim()}>` });
        send.disabled = false;
        if (result.ok) {
          closeSheet();
          toast('Thanks. Your report was sent.');
        } else {
          message.textContent = errorMessage(result);
        }
      },
    });
    openSheet('Report for copyright',
      h('p', { class: 'status-note', raw: `${track.title} · ${track.artist}` }),
      name,
      email,
      work,
      h('label', { class: 'check' }, promise, h('span', { text: 'I own this work or act for the owner, and this report is true.' })),
      message,
      h('div', { class: 'actions' }, send));
  }

  /* ---------- deleting your own songs ---------- */

  const isMySong = (track) => track.source === 'solam' && Boolean(account.user) && track.artistId === account.user.id;

  function askToDeleteSong(track) {
    const remove = h('button', {
      class: 'button danger',
      text: 'Yes, delete this song',
      onclick: async () => {
        remove.disabled = true;
        const result = await api.server('removeTrack', track.id);
        remove.disabled = false;
        if (!result.ok) {
          toast(errorMessage(result));
          return;
        }
        closeSheet();
        toast('Your song was deleted.');
        hiddenTracks.add(trackKey(track));
        if (player.queue[player.index] && trackKey(player.queue[player.index]) === trackKey(track)) {
          if (player.queue[player.index + 1]) step(1);
          else audio.pause();
        }
        if (activePage === 'upload') renderUpload();
        else if (activePage === 'artist') openArtist('solam', account.user.id);
        else if (activePage === 'collection') renderCollection();
        if (homeParts.newSongs) loadNewSongs();
      },
    });
    openSheet('Delete this song?',
      h('p', { class: 'status-note', raw: track.title }),
      h('p', { class: 'status-note', text: 'This permanently removes the song, its cover and its plays from Solam. It can’t be undone.' }),
      h('div', { class: 'actions' }, remove, h('button', { class: 'button', text: 'Keep it', onclick: closeSheet })));
  }

  function showReportForm(track, menu, anchor) {
    const reason = h('textarea', { class: 'field', rows: 3, maxlength: 500, placeholder: 'What is wrong with this song?', 'aria-label': 'What is wrong with this song?' });
    const send = async () => {
      const result = await api.server('report', { key: trackKey(track), title: track.title, artist: track.artist, reason: reason.value, kind: 'problem' });
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

  function showPlaylistMenu(track, anchor, context) {
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
      item('Play next', () => { playNext(track); closeMenu(); }),
      item('Add to queue', () => { addToQueue(track); closeMenu(); }),
      item('Share', () => { closeMenu(); showShareSheet(track); }),
      track.licenseUrl ? h('button', { raw: t('License: {name}', { name: track.license }), role: 'menuitem', onclick: () => { api.openLink(track.licenseUrl); closeMenu(); } }) : null,
      item('Comments', () => { closeMenu(); showComments(track); }),
      context ? item(context.removeLabel, () => { context.onRemove(track); closeMenu(); }) : null,
      isMySong(track) ? item('Delete my song', () => { closeMenu(); askToDeleteSong(track); }) : null,
      hasOnlyPreview(track) ? item('Listen to the full song', () => showFullSongMenu(track, anchor)) : null,
      isOffline ? item('Remove download', () => { removeDownload(track); closeMenu(); }) : null,
      !isOffline && canDownload(track) ? item('Download for offline', () => { downloadTrack(track); closeMenu(); }) : null,
      !isOffline && (track.source === 'preview' || track.source === 'imported') ? h('p', { class: 'pop-note', text: 'Previews can’t be downloaded.' }) : null,
      track.source !== 'local' && track.source !== 'imported' && account.configured ? item('Report this song', () => showReportChoice(track, menu, anchor)) : null,
      h('p', { class: 'pop-title', text: 'Add to a playlist' }),
      ...saved.playlists.map((list) => h('button', { raw: list.name, role: 'menuitem', onclick: () => { addToPlaylist(list, track); closeMenu(); } })),
      ...sharedLists.map((list) => h('button', { raw: `${list.name} (${t('Shared')})`, role: 'menuitem', onclick: () => { addToSharedList(list, track); closeMenu(); } })),
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
      const downloadNote = !premium.active && premiumOnSale() ? t('{used} of {n} free songs', { used: downloads.length, n: FREE_DOWNLOADS }) : '';
      body = downloads.length
        ? h('div', {}, h('p', { class: 'status-note', raw: [t(isWeb ? '{n} MB on this device' : '{n} MB on this PC', { n: megabytes }), downloadNote].filter(Boolean).join(' · ') }), trackList(downloads))
        : h('p', { class: 'empty', text: 'Open the … menu on a song to download it, if the artist allows it.' });
    } else if (collectionTab === 'artists') {
      body = saved.follows.length ? artistGrid(saved.follows) : h('p', { class: 'empty', text: 'Follow an artist to see them here.' });
    } else {
      body = playlistsView();
    }
    container.replaceChildren(
      h('h1', { class: 'page-title', text: 'Library' }),
      h('p', { class: 'page-sub', text: isWeb ? 'Your favourites, playlists and followed artists. Sign in to save them online.' : 'Your favourites, playlists and followed artists. They stay on this PC, or sign in to save them online.' }),
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
      saved.playlists.length || sharedLists.length ? null : h('p', { class: 'empty', text: 'No playlists yet.' }),
      ...sharedLists.map(sharedListView),
      ...saved.playlists.map((list) => h('section', { class: 'setting-group' },
        h('div', { class: 'group-head' },
          h('h3', { raw: list.name }),
          list.tracks.length ? h('button', { class: 'button small', text: 'Play all', onclick: () => playQueue(list.tracks, 0) }) : null,
          list.importedFrom ? null : h('button', { class: 'button small', text: 'Share with friends', onclick: () => shareList(list) }),
          h('button', {
            class: 'button small',
            text: 'Delete',
            onclick: () => {
              saved.playlists = saved.playlists.filter((item) => item.id !== list.id);
              storeSaved();
              renderCollection();
            },
          })),
        list.tracks.length ? trackList(list.tracks, 100, { removeLabel: 'Remove from this playlist', onRemove: (track) => { list.tracks = list.tracks.filter((item) => trackKey(item) !== trackKey(track)); storeSaved(); renderCollection(); } }) : h('p', { class: 'empty', text: 'This playlist is empty. Open the … menu on a song to add it.' }))));
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
    if (source === 'solam') {
      const stats = await api.server('artistStats', id);
      if (activePage !== 'artist') return;
      if (stats.ok && stats.value) Object.assign(artist, { followers: Number(stats.value.followers), monthlyListeners: Number(stats.value.monthly_listeners) });
    }
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
      artist.cover ? profileMedia(artist.cover, 'banner-image') : null,
      h('div', { class: 'banner-shade' }),
      h('div', { class: 'banner-content' },
        artist.pic ? profileMedia(artist.pic, 'banner-pic') : h('div', { class: 'banner-pic blank round', raw: artist.name.charAt(0).toUpperCase() }),
        h('div', { class: 'banner-text' },
          h('h1', {}, h('span', { raw: artist.name }), artist.verified ? icon('check') : null),
          artist.genre ? h('p', { raw: artist.genre }) : null,
          h('div', { class: 'stats' },
            statBlock(formatCount(artist.followers), 'Followers'),
            artist.monthlyListeners ? statBlock(formatCount(artist.monthlyListeners), 'Monthly listeners') : null,
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
    const recentName = t('Recently played on {service}', { service: service.name });
    const replaced = new Set([...result.playlists.map((list) => list.name), ...(result.recents.length ? [recentName] : [])]);
    const playlists = saved.playlists.filter((list) => list.importedFrom !== service.id || !replaced.has(list.name));
    const toTrack = (song) => ({ source: 'imported', id: `${song.artist}|${song.title}`, title: song.title, artist: song.artist, album: '', art: '', thumb: '', duration: 0 });
    result.playlists.forEach((list) => playlists.push({ id: crypto.randomUUID(), name: list.name, importedFrom: service.id, tracks: list.tracks.map(toTrack) }));
    if (result.recents.length) playlists.push({ id: crypto.randomUUID(), name: recentName, importedFrom: service.id, tracks: result.recents.map(toTrack) });
    saved.playlists = playlists;

    const earlier = saved.taste?.[service.id];
    const names = result.follows.slice(0, MAX_ARTIST_MATCHES);
    for (let i = 0; i < names.length; i++) {
      status.textContent = t('Finding artists: {done} of {total}', { done: i + 1, total: names.length });
      const artist = await api.matchArtist(names[i]).catch(() => null);
      if (artist && !isFollowing(artist)) {
        saved.follows.push({ id: artist.id, source: artist.source, name: artist.name, followers: artist.followers, thumb: artist.thumb, pic: artist.pic, importedFrom: service.id });
      }
    }
    saved.taste = { ...(saved.taste || {}), [service.id]: { topArtists: [...new Set([...result.topArtists, ...(earlier?.topArtists || [])])], songs: playlists.filter((list) => list.importedFrom === service.id).reduce((sum, list) => sum + list.tracks.length, 0), artists: saved.follows.filter((artist) => artist.importedFrom === service.id).length, lists: playlists.filter((list) => list.importedFrom === service.id).length } };
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
    const typed = h('div', { class: 'typed-songs', hidden: 'hidden' },
      paste,
      h('div', { class: 'actions' }, h('button', {
        class: 'button small',
        text: 'Add these songs',
        onclick: () => {
          if (paste.value.trim()) runImport([{ name: `${service.name}.txt`, text: paste.value }]);
        },
      })));
    const details = h('div', { class: 'connector-body', hidden: 'hidden' },
      h('ol', { class: 'steps' }, ...service.steps.map((step) => h('li', { text: step }))),
      h('div', { class: 'actions' },
        h('button', { class: 'button', raw: t(service.linkText), onclick: () => api.openLink(service.link) }),
        service.id === 'soundcloud' ? null : h('button', { class: 'button primary', text: 'Choose your files', onclick: () => fileInput.click() }),
        h('button', { class: 'button', text: 'Type songs instead', onclick: () => { typed.hidden = !typed.hidden; } }),
        taste ? h('button', { class: 'button', text: 'Remove', onclick: () => { removeImport(service); renderConnectors(); } }) : null),
      typed);
    if (service.id === 'soundcloud') typed.hidden = false;
    return h('div', { class: 'setting-group connector-card', 'data-service': service.id },
      h('button', { class: 'connector-head', 'aria-label': service.name, onclick: () => { details.hidden = !details.hidden; } },
        h('strong', { raw: service.name }),
        h('span', { class: `badge${taste ? ' lossless' : ''}`, text: taste ? 'Imported' : 'Not imported yet' }),
        icon('down')),
      taste ? h('p', { class: 'status-note', text: '{songs} songs, {lists} lists and {artists} artists imported.', values: taste }) : null,
      fileInput,
      details,
      status);
  }

  const LINK_ERRORS = {
    'link-not-valid': 'That doesn’t look like a link.',
    'link-not-playlist': 'That link isn’t a playlist.',
    'playlist-private': 'This playlist is private or doesn’t exist.',
    'link-needs-files': 'That app doesn’t let other apps read its playlists from a link. Use the steps below to import your files instead.',
    'link-not-supported': 'Paste a link from Deezer or Audius.',
  };

  function playlistLinkBox() {
    const input = h('input', { class: 'search', type: 'url', placeholder: 'Paste a playlist link', 'aria-label': 'Paste a playlist link' });
    const status = h('p', { class: 'status-note', role: 'status' });
    const add = h('button', {
      class: 'button primary',
      text: 'Bring it in',
      onclick: async () => {
        if (!input.value.trim()) return;
        add.disabled = true;
        status.textContent = t('Reading your playlist…');
        const result = await api.playlistLink(input.value).catch((error) => ({ error: error.message }));
        add.disabled = false;
        if (result.error) {
          status.textContent = t(LINK_ERRORS[result.error] || 'Couldn’t read that playlist. Check your internet connection.');
          return;
        }
        const tracks = result.tracks.map(storableTrack);
        saved.playlists.push({ id: crypto.randomUUID(), name: result.name.slice(0, 60), tracks });
        storeSaved();
        input.value = '';
        status.textContent = t('{name} was added to Library with {n} songs.', { name: result.name, n: tracks.length });
        popIn(add);
      },
    });
    return h('div', { class: 'setting-group' },
      h('h3', { text: 'Paste a playlist link' }),
      h('p', { class: 'status-note', text: 'Works with public Deezer and Audius playlists.' }),
      h('div', { class: 'actions' }, input, add),
      status);
  }

  function renderConnectors() {
    $('#connectors').replaceChildren(
      h('h1', { class: 'page-title', text: 'Connectors' }),
      h('p', { class: 'page-sub', text: 'Bring your playlists and artists from other apps. Tap a service to start.' }),
      playlistLinkBox(),
      ...CONNECTORS.map(connectorCard),
      h('p', { class: 'status-note', text: 'Solam never asks for your passwords. Imported songs play as 30-second previews, or in full when Solam has them.' }));
  }

  /* ---------- premium ---------- */

  const premium = { active: false, until: null, provider: null, request: null, settings: { checkoutUrl: null, manageUrl: null, price: '$3.99', bankOn: false } };
  const premiumOnSale = () => Boolean(premium.settings.checkoutUrl || premium.settings.bankOn);
  // Until Premium goes on sale nobody can buy it, so its features stay free for everyone.
  const hasPremium = () => premium.active || !premiumOnSale();
  const transitionsOn = () => settings.crossfadeOn;
  const NEW_PERKS = [
    ['Pro song transitions', 'DJ mixes, echo outs, matched volume and no silence between songs, on Windows. Free accounts get a simple fade.'],
    ['Play next', 'Pick the song that comes right after this one.'],
    ['Up next', 'See your queue, add songs and remove them.'],
  ];
  const PERKS = [
    ['Unlimited downloads', 'Keep as many songs offline as you want, where artists allow it. Free accounts keep 10.'],
    ['Animated profile', 'Animated profile pictures and banners: GIF or video.'],
    ['Bigger uploads', 'Upload 30 songs a day instead of 10.'],
  ];
  const COMING_PERKS = [
    ['New themes', 'More animated backgrounds, only for Premium.'],
    ['Equalizer', 'Shape the sound to fit your headphones.'],
    ['Your year in music', 'Your top songs and artists, ready to share.'],
    ['Listen together', 'Play the same song with friends at the same moment.'],
    ['Lyrics translation', 'Read what a song means in your language.'],
  ];

  async function refreshPremium() {
    const [state, config, request] = await Promise.all([api.server('premiumState'), api.server('appSettings'), api.server('myPremiumRequest')]);
    if (state.ok) Object.assign(premium, state.value);
    if (config.ok) premium.settings = config.value;
    updateDiscord();
    premium.request = request.ok ? request.value : null;
    celebrateNewPremium();
    document.body.classList.toggle('has-premium', premium.active);
    if (activePage === 'premium') renderPremium();
  }

  function openCheckout() {
    if (!account.user) {
      toast('Sign in first, so Premium goes to your account.');
      showPage('account');
      return;
    }
    const link = new URL(premium.settings.checkoutUrl);
    link.searchParams.set('checkout[custom][user_id]', account.user.id);
    if (account.user.email) link.searchParams.set('checkout[email]', account.user.email);
    api.openLink(link.toString());
    toast('Finish paying in your browser. Premium switches on by itself.');
  }

  const perkCards = (perks, soon) => h('div', { class: 'perks' }, ...perks.map(([title, text], i) => h('div', { class: 'perk', style: `animation-delay:${i * 50}ms` },
    h('strong', { text: title }),
    soon ? h('span', { class: 'badge soon-badge', text: 'Coming Soon!' }) : null,
    h('span', { class: 'perk-text', text }))));

  function renderPremium() {
    const until = premium.until ? new Date(premium.until).toLocaleDateString(window.solamLanguage) : '';
    let status;
    const bank = !premium.settings.checkoutUrl && premium.settings.bankOn;
    const waiting = premium.request?.paid_at;
    if (premium.active) {
      status = h('div', {},
        h('p', { class: 'page-sub', text: 'You have Premium until {date}. Thank you for supporting Solam!', values: { date: until } }),
        premium.settings.manageUrl && premium.provider === 'lemonsqueezy' ? h('button', { class: 'button', text: 'Manage or cancel', onclick: () => api.openLink(premium.settings.manageUrl) }) : null,
        bank ? h('button', { class: 'button', text: waiting ? 'Waiting for your payment' : 'Add another month', onclick: showBankPayment }) : null);
    } else if (bank) {
      status = h('div', {},
        h('p', { class: 'page-sub', text: '{price} for one month. It never renews by itself.', values: { price: premium.settings.price } }),
        h('button', { class: 'button primary soon', text: waiting ? 'Waiting for your payment' : 'Get Premium', onclick: showBankPayment }),
        h('p', { class: 'status-note', text: 'Paid by bank transfer, then switched on by hand, usually within a day.' }));
    } else if (premiumOnSale()) {
      status = h('div', {},
        h('p', { class: 'page-sub', text: '{price} a month. Cancel any time.', values: { price: premium.settings.price } }),
        h('button', { class: 'button primary soon', text: 'Get Premium', onclick: openCheckout }),
        h('p', { class: 'status-note', text: 'Payment is handled by Lemon Squeezy. Solam never sees your card.' }));
    } else {
      status = h('div', {},
        h('p', { class: 'page-sub', text: 'Premium isn’t on sale yet, so its features are free for everyone for now.' }),
        h('button', { class: 'button primary soon', disabled: 'disabled', text: 'Coming Soon!' }));
    }
    $('#premium').replaceChildren(
      h('div', { class: 'premium-hero' },
        h('span', { class: 'premium-star' }, icon('premium')),
        h('h1', { class: 'page-title', text: 'Solam Premium' }),
        status),
      h('h2', { class: 'section-title', text: 'New in Premium' }),
      perkCards(NEW_PERKS),
      h('h2', { class: 'section-title', text: 'Also in Premium' }),
      perkCards(PERKS),
      h('h2', { class: 'section-title', text: 'Coming soon' }),
      perkCards(COMING_PERKS, true));
  }

  /* ---------- account ---------- */

  const account = { configured: false, user: null, artist: null, profile: null, isAdmin: false, google: false };
  const ERRORS = {
    'under-age': 'You must be 13 or older to upload music.',
    'rights-needed': 'Please confirm that you own this music.',
    'form-incomplete': 'Please answer all 5 questions.',
    'name-taken': 'That app name is already taken.',
    'file-too-big': 'That file is over the 50 MB limit.',
    'bad-file-type': 'That file type isn’t supported.',
    'daily-limit': 'You reached today’s upload limit.',
    'pick-again': 'Please choose the file again.',
    'not-signed-in': 'Please sign in again.',
    'not-allowed': 'This song can’t be downloaded.',
    'Invalid login credentials': 'Wrong email or password.',
    'Email not confirmed': 'Please confirm your email first. Check your inbox and spam.',
    'User already registered': 'This email already has an account. Try signing in.',
    'email rate limit exceeded': 'Too many emails were sent. Please try again in an hour.',
    'too many reports right now': 'Too many reports right now. Please try again later.',
    'Password should be at least 6 characters.': 'Enter your email and a password of at least 8 characters.',
    'terms-needed': 'Please accept the Terms and Privacy Policy.',
    'photo-too-big': 'That photo is over the 5 MB limit.',
    'reason-needed': 'Please say what is wrong with this song.',
    'comment-empty': 'Write something first.',
    'bank-details-incomplete': 'Enter a full IBAN, the name on the account, and a price.',
    'too many payment requests': 'Too many payment attempts today. Please try again tomorrow.',
    'comment name taken': 'An artist already uses that name. Choose another.',
    'too many comments': 'You’re commenting too fast. Please try again in a few minutes.',
    'message-too-short': 'Please write a little more.',
    'too many messages right now': 'Too many messages right now. Please try again later.',
  };

  function errorMessage(result) {
    return t(ERRORS[result.error] || 'Something went wrong. Please try again.');
  }

  async function refreshAccount() {
    const result = await api.server('state');
    if (result.ok) Object.assign(account, result.value);
    nav.review?.classList.toggle('hidden', !account.isAdmin);
    await refreshPremium();
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
          premium.active ? h('p', { class: 'status-note', text: 'Premium is active.' }) : null,
          h('div', { class: 'actions' }, h('button', {
            class: 'button',
            text: 'Sign out',
            onclick: async () => {
              await api.server('signOut');
              clearAi();
              renderAccount();
            },
          }))),
        profileSection(),
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
        checkInbox();
        openPendingLink();
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
                clearAi();
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
      ...[...reports].sort((a, b) => Number(b.kind === 'copyright') - Number(a.kind === 'copyright')).map((report) => h('div', { class: 'review-row' },
        h('div', { class: 'track-text wrap' }, report.kind === 'copyright' ? h('span', { class: 'badge status-rejected report-kind', text: 'Copyright' }) : null, h('strong', { raw: `${report.title} · ${report.artist}` }), h('span', { raw: report.reason }), report.contact ? h('span', { raw: report.contact }) : null),
        h('button', {
          class: 'button small primary',
          text: report.track_key.startsWith('comment:') ? 'Delete comment' : 'Hide song',
          onclick: async () => {
            if (report.track_key.startsWith('comment:')) {
              await api.server('deleteComment', report.track_key.slice(8));
              await api.server('clearReport', report.id);
              renderReports(box);
              return;
            }
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
    const adminBox = h('div', {});
    renderAdminTools(adminBox);
    const paymentBox = h('div', {});
    renderPaymentAdmin(paymentBox);
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Review songs' }),
      h('p', { class: 'status-note', text: 'Every upload waits here until you approve it.' }),
      tracks.length ? null : h('p', { class: 'empty', text: result.ok ? 'Nothing is waiting for review.' : errorMessage(result) }),
      ...[...tracks].sort((a, b) => (b.checkNotes?.length || 0) - (a.checkNotes?.length || 0)).map((track) => {
        const decide = async (status) => {
          const done = await api.server('setStatus', track.id, status);
          if (!done.ok) toast(errorMessage(done));
          renderReview(box);
        };
        const famous = h('span', { class: 'check-note' });
        checkFamousSong(track, famous);
        return h('div', { class: 'review-row' },
          h('div', { class: 'track-text' }, h('strong', { raw: track.title }), h('span', { raw: `${track.artist}${track.genre ? ` · ${track.genre}` : ''}` }), ...(track.checkNotes || []).map((note) => h('span', { class: 'check-note', text: note })), famous),
          h('button', { class: 'button small', text: 'Listen', onclick: () => playQueue([track], 0) }),
          h('button', { class: 'button small primary', text: 'Approve', onclick: () => decide('approved') }),
          h('button', { class: 'button small', text: 'Reject', onclick: () => decide('rejected') }));
      }),
      paymentBox,
      reportsBox,
      adminBox);
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
      container.replaceChildren(...head, await statsPanel(), profileSection(), uploadForm(), await uploadsList());
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
    const change = (kind, label, fileKind = 'art') => {
      const button = h('button', {
        class: 'button',
        text: label,
        onclick: async () => {
          const picked = await api.server('pickFile', fileKind);
          if (!picked.ok) {
            toast(errorMessage(picked));
            return;
          }
          if (!picked.value) return;
          button.disabled = true;
          const result = await api.server('uploadImage', kind, picked.value.id);
          button.disabled = false;
          if (!result.ok) toast(errorMessage(result));
          else if (activePage === 'account') renderAccount();
          else renderUpload();
        },
      });
      return button;
    };
    const artist = account.artist || { ...account.profile, name: saved.displayName || account.user?.email?.split('@')[0] || '' };
    return h('div', { class: 'setting-group' },
      h('h3', { text: account.artist ? 'Your artist profile' : 'Your profile' }),
      h('div', { class: 'profile-preview' },
        artist.cover ? profileMedia(artist.cover, 'banner-image') : null,
        artist.pic ? profileMedia(artist.pic, 'profile-pic') : h('div', { class: 'profile-pic blank round', raw: artist.name.charAt(0).toUpperCase() }),
        h('strong', { raw: artist.name })),
      h('p', { class: 'status-note', text: premium.active ? 'Photos: JPG, PNG or WEBP, up to 5 MB. Animated: GIF, MP4 or WEBM, up to 50 MB.' : 'Photos only: JPG, PNG or WEBP, up to 5 MB.' }),
      h('div', { class: 'actions' }, change('pic', 'Change profile picture'), change('cover', 'Change banner')),
      premium.active
        ? h('div', { class: 'actions' }, change('pic', 'Use an animated picture', 'video'), change('cover', 'Use an animated banner', 'video'))
        : h('button', { class: 'locked-row', onclick: () => showPage('premium') }, icon('premium'), h('span', { text: 'Animated (video) picture and banner: Premium.' })));
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
      h('p', { class: 'status-note', text: premium.active ? 'Songs go public after approval. Up to 50 MB each and 30 songs a day.' : 'Songs go public after approval. Up to 50 MB each and 10 songs a day.' }),
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
          onclick: () => askToDeleteSong({ ...track, artistId: account.user.id }),
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
      if (!library.tracks.length) results.replaceChildren();
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
    const folders = library.folders.length ? h('details', { class: 'folders' },
      h('summary', { text: '{n} music folders', values: { n: library.folders.length } }),
      ...library.folders.map((folder) => h('div', { class: 'folder-row' },
        h('span', { raw: folder }),
        h('button', { class: 'button small', text: 'Remove', onclick: async () => { library = await api.removeFolder(folder); renderLibrary(); } })))) : null;
    container.replaceChildren(
      h('h1', { class: 'page-title', text: 'My Music' }),
      library.tracks.length
        ? h('p', { class: 'page-sub', text: '{n} songs from your PC, at full quality.', values: { n: library.tracks.length } })
        : h('p', { class: 'page-sub', text: 'Play the music files on your PC, at full quality.' }),
      library.tracks.length ? h('div', { class: 'actions' }, search, addButton) : h('div', { class: 'big-empty' }, icon('library'), addButton),
      folders,
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
      return h('div', { class: 'setting' }, h('label', { text: 'Language' }), h('div', { class: 'segmented' }, pick('auto', 'Auto'), pick('en', 'English'), pick('ru', 'Русский'), pick('es', 'Español'), pick('pt', 'Português'), pick('pt-BR', 'Português (Brasil)'), pick('de', 'Deutsch')), h('span'));
    };
    const sleepChoices = () => {
      const buttons = [0, 15, 30, 60, 90].map((minutes) => {
        const button = h('button', {
          text: minutes ? '{n} min' : 'Off',
          values: { n: minutes },
          class: minutes === sleep.minutes ? 'on' : '',
          onclick: () => {
            setSleepTimer(minutes);
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
        fixedVolume ? null : toggle('crossfadeOn', 'Song transitions', hasPremium() ? 'Blends the end of a song into the next one' : 'A simple 2-second fade. Premium adds DJ mixes and longer blends.'),
        richTransitions() ? segmented('transitionStyle', 'Transition style', 'Auto picks the best style for each song’s genre', TRANSITION_STYLES) : null,
        fixedVolume || !hasPremium() ? null : slider('crossfade', 'Transition length', '', 1, 12, 1, (value) => `${value}s`),
        toggle('autoplay', 'Autoplay similar songs', 'Keeps the music going when your list ends'),
        isWeb ? null : toggle('discordOn', 'Show on Discord', 'Your Discord status shows the song you’re playing'),
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
        h('div', { class: 'actions' }, h('button', { class: 'button', text: 'Contact support', onclick: showSupportForm }), h('button', { class: 'button', text: 'Replay the welcome tour', onclick: showWelcome }), h('button', { class: 'button', text: 'See what’s new', onclick: showWhatsNew })),
        legalLinks()),

      h('div', { class: 'actions' }, h('button', {
        class: 'button',
        text: 'Reset all settings',
        onclick: () => {
          settings = { ...DEFAULTS, welcomed: true, seenNews: WHATS_NEW_VERSION };
          saveSettings();
          container.replaceChildren();
          buildSettings();
          applySettings();
          toast('Settings reset to defaults.');
        },
      })));
  }

  /* ---------- sheets ---------- */

  function closeSheet() {
    const sheet = document.getElementById('sheet');
    if (!sheet) return;
    sheet.removeAttribute('id');
    sheet.classList.add('sheet-closing');
    setTimeout(() => sheet.remove(), settings.extraMotion ? 220 : 0);
  }

  function openSheet(title, ...children) {
    closeSheet();
    closeMenu();
    const body = h('div', { class: 'sheet-body' }, ...children);
    const sheet = h('div', { id: 'sheet', class: 'sheet', role: 'dialog', 'aria-label': title },
      h('div', { class: 'sheet-back', onclick: closeSheet }),
      h('div', { class: 'sheet-panel glass' },
        h('div', { class: 'sheet-head' },
          h('h2', { text: title }),
          h('button', { class: 'icon-button', title: 'Close', 'aria-label': 'Close', onclick: closeSheet }, icon('close'))),
        body));
    document.body.append(sheet);
    return body;
  }

  function showMoreSheet() {
    openSheet('More',
      ...PHONE_MORE.map(([id, label, iconName]) => h('button', { class: 'sheet-row', onclick: () => showPage(id) }, icon(iconName), h('span', { text: label }))),
      h('button', { class: 'sheet-row', onclick: showSupportForm }, icon('mail'), h('span', { text: 'Contact support' })));
  }

  /* ---------- welcome tour ---------- */

  const WELCOME_STEPS = [
    ['Welcome to Solam', 'Free music behind liquid glass, with no ads and no limit on skips.', 'sun'],
    ['Find something to play', 'Search for any song or artist. Independent artists play in full. Famous songs play as 30-second previews, with a button to hear the rest.', 'search'],
    ['Make it yours', 'Choose an animated theme and how clear the glass looks in Settings. Save favourites and share playlists with friends.', 'glass'],
    ['Make music?', 'Upload your songs for free. New songs from Solam artists are shown first on Home.', 'upload'],
  ];
  const WELCOME_LEAVE_MS = 340;
  const WELCOME_CLOSE_MS = 620;
  const WELCOME_REVEAL_MS = 1100;
  const WELCOME_SWIPE_PX = 50;

  function welcomeScene(kind) {
    const scene = h('div', { class: `wt-scene wt-${kind}`, 'aria-hidden': 'true' });
    if (kind === 'sun') {
      scene.append(
        h('span', { class: 'wt-ring' }), h('span', { class: 'wt-ring' }), h('span', { class: 'wt-ring' }),
        h('span', { class: 'wt-orb' }, ...[0, 1, 2, 3, 4].map(() => h('i', { class: 'wt-bar' }))));
    } else if (kind === 'search') {
      scene.append(
        h('span', { class: 'wt-pill' }, h('i', { class: 'wt-typing' }), h('i', { class: 'wt-caret' })),
        h('span', { class: 'wt-tiles' }, ...[0, 1, 2].map(() => h('i', { class: 'wt-tile' }, h('b')))));
    } else if (kind === 'glass') {
      scene.append(...[0, 1, 2].map(() => h('span', { class: 'wt-card' })), h('span', { class: 'wt-shine' }));
    } else if (kind === 'fresh') {
      scene.append(h('span', { class: 'wn-screen' },
        h('span', { class: 'wn-line' }), h('span', { class: 'wn-line short' }),
        h('span', { class: 'wn-row' }, ...[0, 1, 2].map(() => h('i'))),
        h('span', { class: 'wn-row' }, ...[0, 1, 2].map(() => h('i'))),
        h('span', { class: 'wn-menu' }, h('b'))));
    } else if (kind === 'lens') {
      scene.append(h('span', { class: 'wn-sky' }, h('i', { class: 'wn-stripes' }), h('span', { class: 'wn-lens' }, h('i', { class: 'wn-stripes' }))));
    } else if (kind === 'social') {
      scene.append(
        h('span', { class: 'wn-bubble' }, h('i'), h('i')), h('span', { class: 'wn-bubble two' }, h('i'), h('i')),
        h('span', { class: 'wn-qr' }, ...Array.from({ length: 25 }, (_, i) => h('i', { style: `--n:${(i * 7) % 25};opacity:${[1, 2, 3, 7, 9, 12, 15, 17, 21, 22].includes(i) ? 0.12 : 1}` }))));
    } else if (kind === 'mix') {
      scene.append(
        h('span', { class: 'wn-disc' }), h('span', { class: 'wn-disc two' }),
        h('span', { class: 'wn-wave' }, ...Array.from({ length: 11 }, (_, i) => h('i', { style: `--n:${i}` }))));
    } else if (kind === 'profile') {
      scene.append(h('span', { class: 'wn-card' }, h('span', { class: 'wn-banner' }), h('span', { class: 'wn-ring' }), h('span', { class: 'wn-face' }, icon('account')), h('span', { class: 'wn-line' }), h('span', { class: 'wn-line short' })));
    } else if (kind === 'languages') {
      scene.append(h('span', { class: 'wn-words' }, ...['Hello', 'Привет', 'Hola', 'Olá', 'Hallo'].map((word, i) => h('i', { raw: word, style: `--n:${i}` }))));
    } else {
      scene.append(
        h('span', { class: 'wt-phone' }, h('i', { class: 'wt-slot' }), h('i', { class: 'wt-slot' }), h('i', { class: 'wt-slot' })),
        h('span', { class: 'wt-song' }, icon('play')),
        h('span', { class: 'wt-arrow' }, icon('upload')));
    }
    return scene;
  }

  const WHATS_NEW_STEPS = [
    ['Meet Solam AI', 'Ask for playlists, music, better settings or anything else. It always asks before changing things.', 'social'],
    ['Lyrics, word by word', 'Each word now lights up as it’s sung, on a cover that melts into the background.', 'languages'],
    ['Bring your playlists', 'Paste a Deezer or Audius playlist link in Connectors, and it’s in your Library.', 'search'],
    ['Show it on Discord', 'On Windows, your Discord status can show the song you’re playing.', 'mix'],
  ];

  const showWelcome = () => showTour(WELCOME_STEPS, 'Start listening');
  const showWhatsNew = () => showTour(WHATS_NEW_STEPS, 'Got it');

  function showTour(steps, lastLabel) {
    let step = 0;
    const content = h('div', { class: 'wt-content' });
    const bars = steps.map(() => h('i', {}, h('b')));
    const next = h('button', { id: 'welcome-next', class: 'button primary wt-next' });
    const skip = h('button', { id: 'welcome-skip', class: 'button wt-skip', text: 'Skip' });
    const overlay = h('div', { id: 'welcome' }, h('div', { class: 'wt-panel' }, content, h('div', { class: 'wt-progress' }, ...bars), h('div', { class: 'wt-actions' }, next, skip)));
    const finish = () => {
      settings.welcomed = true;
      settings.seenNews = WHATS_NEW_VERSION;
      saveSettings();
      window.removeEventListener('keydown', keys);
      overlay.classList.add('closing');
      document.body.classList.remove('wt-open');
      document.body.classList.add('wt-reveal');
      setTimeout(() => overlay.remove(), WELCOME_CLOSE_MS);
      setTimeout(() => {
        document.body.classList.remove('wt-reveal');
        syncGlass();
      }, WELCOME_REVEAL_MS);
    };
    const draw = (direction) => {
      const [title, text, scene] = steps[step];
      const last = step === steps.length - 1;
      const old = content.firstElementChild;
      if (old) {
        old.classList.add(direction < 0 ? 'wt-leave-back' : 'wt-leave');
        old.setAttribute('aria-hidden', 'true');
        setTimeout(() => old.remove(), WELCOME_LEAVE_MS);
      }
      content.append(h('div', { class: `wt-step${direction < 0 ? ' wt-from-left' : ''}` },
        welcomeScene(scene),
        h('h1', { class: 'wt-title', text: title }),
        h('p', { class: 'wt-text', text })));
      bars.forEach((bar, i) => {
        bar.classList.toggle('done', i < step);
        bar.classList.toggle('on', i === step);
      });
      next.textContent = t(last ? lastLabel : 'Next');
      next.classList.toggle('wt-go', last);
      skip.classList.toggle('wt-gone', last);
    };
    const move = (direction) => {
      if (direction > 0 && step === steps.length - 1) {
        finish();
        return;
      }
      if (direction < 0 && step === 0) return;
      step += direction;
      draw(direction);
    };
    function keys(event) {
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        move(1);
      } else if (event.key === 'ArrowLeft') {
        move(-1);
      }
    }
    next.onclick = () => move(1);
    skip.onclick = finish;
    let swipeStart = null;
    overlay.addEventListener('pointerdown', (event) => { swipeStart = event.clientX; });
    overlay.addEventListener('pointerup', (event) => {
      if (swipeStart === null) return;
      const moved = event.clientX - swipeStart;
      swipeStart = null;
      if (Math.abs(moved) > WELCOME_SWIPE_PX) move(moved < 0 ? 1 : -1);
    });
    window.addEventListener('keydown', keys);
    document.getElementById('welcome')?.remove();
    closeSheet();
    document.body.classList.add('wt-open');
    document.body.append(overlay);
    draw(1);
  }

  /* ---------- play next and up next ---------- */

  function requirePremium() {
    if (hasPremium()) return true;
    toast('This is part of Premium.');
    showPage('premium');
    return false;
  }

  function playNext(track) {
    if (!requirePremium()) return;
    if (player.index < 0) {
      playQueue([track], 0);
      return;
    }
    player.queue.splice(player.index + 1, 0, track);
    toast('{title} plays next.', { title: track.title });
  }

  function addToQueue(track) {
    if (!requirePremium()) return;
    if (player.index < 0) {
      playQueue([track], 0);
      return;
    }
    player.queue.push(track);
    toast('Added to your queue.');
  }

  function showUpNext() {
    const body = openSheet('Up next');
    const draw = () => {
      const next = player.queue.slice(player.index + 1, player.index + 51);
      body.replaceChildren(next.length ? null : h('p', { class: 'empty', text: 'Nothing is queued. Open the … menu on a song and choose Play next.' }),
        ...next.map((track, offset) => h('div', { class: 'review-row' },
          h('div', { class: 'track-text' }, h('strong', { raw: track.title }), h('span', { raw: track.artist })),
          hasPremium() ? h('button', {
            class: 'button small',
            text: 'Remove',
            onclick: () => {
              player.queue.splice(player.index + 1 + offset, 1);
              draw();
            },
          }) : null)));
    };
    draw();
  }

  /* ---------- sharing ---------- */

  function shareLinkFor(track) {
    if (track.source === 'solam') return `${SITE}app/#solam=${track.id}`;
    return `${SITE}app/#song=${encodeURIComponent(`${track.title}|${track.artist}`)}`;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast('Link copied.');
    } catch {
      toast('Couldn’t copy the link. Please copy it by hand.');
    }
  }

  function drawQr(canvas, value, size) {
    // Names in bank codes can have letters outside English.
    if (window.qrcode.stringToBytesFuncs?.['UTF-8']) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    const code = window.qrcode(0, 'M');
    code.addData(value);
    code.make();
    const count = code.getModuleCount();
    const cell = Math.floor(size / (count + 8));
    const margin = Math.floor((size - cell * count) / 2);
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#0a0c1c';
    for (let row = 0; row < count; row++) {
      for (let column = 0; column < count; column++) {
        if (code.isDark(row, column)) context.fillRect(margin + column * cell, margin + row * cell, cell, cell);
      }
    }
    return canvas;
  }

  function loadImage(source) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }

  function wrapText(context, value, maxWidth, maxLines) {
    const lines = [];
    let line = '';
    for (const word of String(value).split(/\s+/)) {
      const attempt = line ? `${line} ${word}` : word;
      if (context.measureText(attempt).width <= maxWidth || !line) line = attempt;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
    }
    return lines;
  }

  // Draws a tall picture for stories: cover, song name and a code that opens the song.
  async function makeStoryPicture(track, link) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    const glow = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '120, 170, 255';
    const sky = context.createLinearGradient(0, 0, 0, 1920);
    sky.addColorStop(0, `rgb(${glow})`);
    sky.addColorStop(0.65, '#0a0c1c');
    context.fillStyle = sky;
    context.fillRect(0, 0, 1080, 1920);
    const source = track.art || track.thumb;
    const data = source ? (source.startsWith('data:') ? source : await api.imageData(source).catch(() => null)) : null;
    const art = data ? await loadImage(data) : null;
    context.save();
    context.beginPath();
    context.roundRect(140, 240, 800, 800, 56);
    context.clip();
    if (art) context.drawImage(art, 140, 240, 800, 800);
    else {
      context.fillStyle = 'rgba(255,255,255,.14)';
      context.fillRect(140, 240, 800, 800);
    }
    context.restore();
    context.strokeStyle = 'rgba(255,255,255,.55)';
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(140, 240, 800, 800, 56);
    context.stroke();
    context.textAlign = 'center';
    context.fillStyle = '#fff';
    context.font = '700 68px "Segoe UI", -apple-system, system-ui, sans-serif';
    const lines = wrapText(context, track.title, 860, 2);
    lines.forEach((line, i) => context.fillText(line, 540, 1140 + i * 80));
    context.fillStyle = 'rgba(255,255,255,.75)';
    context.font = '44px "Segoe UI", -apple-system, system-ui, sans-serif';
    context.fillText(wrapText(context, track.artist, 860, 1)[0] || '', 540, 1150 + lines.length * 80);
    const qr = drawQr(document.createElement('canvas'), link, 300);
    context.save();
    context.beginPath();
    context.roundRect(390, 1370, 300, 300, 28);
    context.clip();
    context.drawImage(qr, 390, 1370);
    context.restore();
    context.fillStyle = '#fff';
    context.font = '600 44px "Segoe UI", -apple-system, system-ui, sans-serif';
    context.fillText(t('Listen on Solam'), 540, 1750);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function shareStoryPicture(track, link, button) {
    button.disabled = true;
    const blob = await makeStoryPicture(track, link);
    button.disabled = false;
    if (!blob) {
      toast('Something went wrong. Please try again.');
      return;
    }
    const file = new File([blob], 'solam-story.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
    } else {
      saveBlob(blob, 'solam-story.png');
      toast('Picture saved.');
    }
  }

  function showShareSheet(track) {
    const link = shareLinkFor(track);
    const story = h('button', { class: 'button', text: 'Picture for stories', onclick: () => shareStoryPicture(track, link, story) });
    openSheet('Share',
      h('p', { class: 'status-note', raw: `${track.title} · ${track.artist}` }),
      h('canvas', { class: 'qr-code', 'aria-label': 'QR code' }),
      h('div', { class: 'actions' },
        navigator.share ? h('button', { class: 'button primary', text: 'Share link', onclick: () => navigator.share({ title: track.title, url: link }).catch(() => {}) }) : null,
        h('button', { class: navigator.share ? 'button' : 'button primary', text: 'Copy link', onclick: () => copyText(link) }),
        story));
    drawQr(document.querySelector('#sheet .qr-code'), link, 420);
  }

  function showInviteSheet(list) {
    const link = `${SITE}app/#playlist=${list.id}`;
    openSheet('Invite friends',
      h('p', { class: 'status-note', text: 'Anyone with this link can see {name} and add songs to it.', values: { name: list.name } }),
      h('canvas', { class: 'qr-code', 'aria-label': 'QR code' }),
      h('div', { class: 'actions' },
        navigator.share ? h('button', { class: 'button primary', text: 'Share link', onclick: () => navigator.share({ title: list.name, url: link }).catch(() => {}) }) : null,
        h('button', { class: navigator.share ? 'button' : 'button primary', text: 'Copy link', onclick: () => copyText(link) })));
    drawQr(document.querySelector('#sheet .qr-code'), link, 420);
  }

  let pendingLink = null;

  async function openLinkFromAddress() {
    const match = /^#(solam|song|playlist)=(.+)$/.exec(window.location.hash);
    if (!match) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    const [, kind, value] = match;
    if (kind === 'playlist') {
      if (!account.user) {
        pendingLink = value;
        toast('Sign in to join this playlist.');
        showPage('account');
        return;
      }
      pendingLink = value;
      openPendingLink();
      return;
    }
    let track = null;
    if (kind === 'solam') {
      const found = await api.server('trackById', value);
      track = found.ok ? found.value : null;
    } else {
      const [title, artist] = decodeURIComponent(value).split('|');
      track = await api.matchSong(title, artist || '').catch(() => null);
    }
    if (!track) {
      toast('This song isn’t available right now.');
      return;
    }
    playQueue([track], 0);
    openBigCover();
  }

  async function openPendingLink() {
    if (!pendingLink || !account.user) return;
    const id = pendingLink;
    pendingLink = null;
    const joined = await api.server('joinPlaylist', id);
    if (!joined.ok || !joined.value) {
      toast('This playlist doesn’t exist anymore.');
      return;
    }
    await loadSharedLists();
    collectionTab = 'playlists';
    showPage('collection');
    toast('You joined this playlist.');
  }

  /* ---------- shared playlists ---------- */

  let sharedLists = [];

  async function loadSharedLists() {
    const result = await api.server('sharedPlaylists');
    sharedLists = result.ok ? result.value : [];
    if (activePage === 'collection' && collectionTab === 'playlists') renderCollection();
  }

  // Only what is needed to play the song again, so friends' lists stay small.
  function sharedTrack(track) {
    const { source, id, title, artist, album, url, thumb, art, duration, genre, artistId, artistSource, path, format, downloadable, license, licenseUrl } = storableTrack(track);
    return { key: trackKey(track), license, licenseUrl, source, id, title, artist, album, url, thumb: thumb || art, art: art || thumb, duration, genre, artistId, artistSource, path, format, downloadable, fallbacks: (track.fallbacks || []).slice(0, 2) };
  }

  async function shareList(list) {
    if (!account.user) {
      toast('Sign in to share a playlist.');
      showPage('account');
      return;
    }
    const playable = list.tracks.filter((track) => track.source !== 'local');
    const result = await api.server('shareNewPlaylist', list.name, playable.map(sharedTrack));
    if (!result.ok) {
      toast(errorMessage(result));
      return;
    }
    saved.playlists = saved.playlists.filter((item) => item.id !== list.id);
    storeSaved();
    await loadSharedLists();
    const created = sharedLists.find((item) => item.id === result.value);
    if (created) showInviteSheet(created);
  }

  async function addToSharedList(list, track) {
    const result = await api.server('playlistAdd', list.id, sharedTrack(track));
    toast(result.ok ? 'Added to {name}.' : errorMessage(result), { name: list.name });
    if (result.ok) loadSharedLists();
  }

  function sharedListView(list) {
    return h('section', { class: 'setting-group' },
      h('div', { class: 'group-head' },
        h('h3', { raw: list.name }),
        h('span', { class: 'badge lossless', text: '{n} people', values: { n: list.members } }),
        list.tracks.length ? h('button', { class: 'button small', text: 'Play all', onclick: () => playQueue(list.tracks, 0) }) : null,
        h('button', { class: 'button small', text: 'Invite', onclick: () => showInviteSheet(list) }),
        h('button', {
          class: 'button small',
          text: list.isOwner ? 'Delete' : 'Leave',
          onclick: async () => {
            await api.server(list.isOwner ? 'deleteSharedPlaylist' : 'leavePlaylist', list.id);
            loadSharedLists();
          },
        })),
      list.tracks.length
        ? trackList(list.tracks, 100, { removeLabel: 'Remove from this playlist', onRemove: async (track) => { await api.server('playlistRemove', list.id, track.key || trackKey(track)); loadSharedLists(); } })
        : h('p', { class: 'empty', text: 'This playlist is empty. Open the … menu on a song to add it.' }));
  }

  /* ---------- comments ---------- */

  function timeAgo(when) {
    const days = Math.floor((Date.now() - new Date(when).getTime()) / 86400000);
    return days < 1 ? t('Today') : new Date(when).toLocaleDateString(window.solamLanguage);
  }

  function reportComment(comment) {
    return api.server('report', { key: `comment:${comment.id}`, title: t('Comment'), artist: comment.author, reason: comment.body.length >= 3 ? comment.body : t('Reported comment') })
      .then((result) => toast(result.ok ? 'Thanks. Your report was sent.' : errorMessage(result)));
  }

  async function showComments(track) {
    const key = trackKey(track);
    const list = h('div', { class: 'comment-list' }, h('p', { class: 'empty', text: 'Loading…' }));
    const load = async () => {
      const result = await api.server('comments', key);
      if (!result.ok) {
        list.replaceChildren(h('p', { class: 'empty', text: 'Comments are unavailable right now.' }));
        return;
      }
      list.replaceChildren(result.value.length ? null : h('p', { class: 'empty', text: 'No comments yet. Be the first!' }),
        ...result.value.map((comment) => h('div', { class: 'comment' },
          h('div', { class: 'comment-head' }, h('strong', { raw: comment.author }), h('span', { raw: timeAgo(comment.created_at) })),
          h('p', { raw: comment.body }),
          h('div', { class: 'comment-tools' },
            comment.user_id === account.user?.id || account.isAdmin ? h('button', {
              text: 'Delete',
              onclick: async () => {
                await api.server('deleteComment', comment.id);
                load();
              },
            }) : null,
            comment.user_id === account.user?.id ? null : h('button', { text: 'Report', onclick: () => reportComment(comment) })))));
    };
    let form;
    if (!account.user) {
      form = h('button', { class: 'button primary', text: 'Sign in to comment', onclick: () => showPage('account') });
    } else {
      const name = account.artist ? null : h('input', { class: 'field', maxlength: 40, placeholder: 'Your name', 'aria-label': 'Your name', value: saved.displayName || '' });
      const input = h('textarea', { class: 'field', rows: 2, maxlength: 500, placeholder: 'Write a comment', 'aria-label': 'Write a comment' });
      form = h('div', { class: 'comment-form' }, name, input, h('button', {
        class: 'button primary',
        text: 'Post',
        onclick: async () => {
          if (name && name.value.trim().length < 2) {
            toast('Choose a name of at least 2 letters.');
            return;
          }
          if (name) {
            saved.displayName = name.value.trim();
            storeSaved();
          }
          const result = await api.server('addComment', key, account.artist?.name || saved.displayName, input.value);
          if (result.ok) {
            input.value = '';
            load();
          } else {
            toast(errorMessage(result));
          }
        },
      }));
    }
    openSheet('Comments', h('p', { class: 'status-note', raw: `${track.title} · ${track.artist}` }), form, list);
    load();
  }

  /* ---------- support ---------- */

  function showSupportForm() {
    const message = h('textarea', { class: 'field', rows: 5, maxlength: 2000, placeholder: 'What happened?', 'aria-label': 'What happened?' });
    const contact = h('input', { class: 'field', maxlength: 200, type: 'email', placeholder: 'Email, if you want an answer', 'aria-label': 'Email, if you want an answer', value: account.user?.email || '' });
    const send = h('button', {
      class: 'button primary',
      text: 'Send',
      onclick: async () => {
        send.disabled = true;
        const result = await api.server('sendSupport', { contact: contact.value, body: message.value, version: await api.appVersion() });
        send.disabled = false;
        if (result.ok) {
          closeSheet();
          toast('Thanks. Your message was sent.');
        } else {
          toast(errorMessage(result));
        }
      },
    });
    openSheet('Contact support', message, contact, h('div', { class: 'actions' }, send));
  }

  /* ---------- notifications ---------- */

  function loadInbox() {
    try {
      const stored = JSON.parse(localStorage.getItem(INBOX_KEY) || 'null');
      if (stored?.checked) return { unread: 0, items: [], ...stored };
    } catch {
      // Starts again from an empty inbox.
    }
    return { checked: Date.now(), unread: 0, items: [] };
  }

  function storeInbox(inbox) {
    try {
      localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
    } catch {
      // Notifications simply won't be remembered.
    }
    const button = $('#inbox-button');
    button.classList.toggle('has-new', inbox.unread > 0);
    button.dataset.count = inbox.unread > 9 ? '9+' : String(inbox.unread);
  }

  async function checkInbox() {
    const inbox = loadInbox();
    const since = inbox.checked;
    const found = [];
    const news = await api.server('news');
    if (news.ok) news.value.filter((item) => new Date(item.created_at).getTime() > since).forEach((item) => found.push({ id: `news:${item.id}`, title: item.title, text: item.body }));
    const artists = saved.follows.filter((artist) => artist.source === 'solam').map((artist) => artist.id);
    if (artists.length) {
      const songs = await api.server('followedNew', artists, since);
      if (songs.ok) songs.value.forEach((track) => found.push({ id: `song:${track.id}`, title: t('New song from {artist}', { artist: track.artist }), text: track.title, track: storableTrack(track) }));
    }
    if (account.user) {
      const results = await api.server('uploadResults', since);
      if (results.ok) results.value.forEach((track) => found.push({ id: `upload:${track.id}:${track.status}`, title: t(track.status === 'approved' ? 'Your song was approved' : 'Your song wasn’t approved'), text: track.title }));
    }
    const known = new Set(inbox.items.map((item) => item.id));
    const fresh = found.filter((item) => !known.has(item.id));
    inbox.items = [...fresh, ...inbox.items].slice(0, INBOX_LIMIT);
    inbox.unread += fresh.length;
    inbox.checked = Date.now();
    storeInbox(inbox);
    if (!isWeb && document.hidden && fresh[0] && window.Notification) new Notification(fresh[0].title, { body: fresh[0].text, silent: true });
  }

  function showInbox() {
    const inbox = loadInbox();
    inbox.unread = 0;
    storeInbox(inbox);
    openSheet('Notifications', inbox.items.length ? null : h('p', { class: 'empty', text: 'Nothing new. New songs from artists you follow and news about Solam show up here.' }),
      ...inbox.items.map((item) => h('button', {
        class: 'inbox-row',
        onclick: () => {
          if (!item.track) return;
          closeSheet();
          playQueue([item.track], 0);
        },
      }, h('strong', { raw: item.title }), item.text ? h('span', { raw: item.text }) : null)));
  }

  /* ---------- artist numbers ---------- */

  async function statsPanel() {
    const [stats, mine] = await Promise.all([api.server('artistStats', account.artist.id), api.server('myTracks')]);
    if (!stats.ok || !stats.value) return null;
    const top = (mine.ok ? mine.value : []).filter((track) => track.status === 'approved').sort((a, b) => b.plays - a.plays).slice(0, 3);
    return h('div', { class: 'setting-group' },
      h('h3', { text: 'Your listeners' }),
      h('div', { class: 'stats' },
        statBlock(formatCount(Number(stats.value.total_plays)), 'Total plays'),
        statBlock(formatCount(Number(stats.value.monthly_listeners)), 'Monthly listeners'),
        statBlock(formatCount(Number(stats.value.followers)), 'Followers')),
      top.length ? h('h3', { class: 'stats-top', text: 'Top songs' }) : null,
      ...top.map((track) => h('div', { class: 'review-row' },
        h('div', { class: 'track-text' }, h('strong', { raw: track.title })),
        h('span', { class: 'plays', text: '{n} plays', values: { n: formatCount(track.plays) } }))));
  }

  function profileMedia(url, className) {
    if (/\.(mp4|webm)$/i.test(url)) {
      const video = h('video', { class: className, loop: 'loop', playsinline: 'playsinline' });
      // Browsers only start a video by themselves when it is silent, and this must be set before it loads.
      video.muted = true;
      video.autoplay = true;
      video.src = url;
      return video;
    }
    return h('img', { class: className, src: url, alt: '', decoding: 'async' });
  }

  /* ---------- admin tools ---------- */

  // Warns when a famous song already has this title. It can't prove anything, so the admin decides.
  async function checkFamousSong(track, note) {
    const found = await api.search(track.title).catch(() => null);
    const same = found?.tracks?.find((item) => item.source === 'preview' && item.title.toLowerCase() === track.title.toLowerCase());
    if (same) note.textContent = t('A famous song has this title: {artist}', { artist: same.artist });
  }

  function discordAdminBox() {
    const field = h('input', { class: 'field', inputmode: 'numeric', maxlength: 22, 'aria-label': 'Discord application ID', value: premium.settings.discordId || '' });
    return h('div', { class: 'setting-group' },
      h('h3', { text: 'Discord status' }),
      labelled('Discord application ID', 'Everyone’s Discord status switches on as soon as this is saved.', field),
      h('div', { class: 'actions' }, h('button', {
        class: 'button',
        text: 'Save',
        onclick: async () => {
          const result = await api.server('saveDiscordId', field.value);
          toast(result.ok ? 'Saved.' : errorMessage(result));
          refreshPremium();
        },
      })));
  }

  async function renderAdminTools(box) {
    const support = await api.server('supportMessages');
    const news = await api.server('news');
    const checkout = h('input', { class: 'field', placeholder: 'https://yourstore.lemonsqueezy.com/buy/…', 'aria-label': 'Checkout link', value: premium.settings.checkoutUrl || '' });
    const manage = h('input', { class: 'field', placeholder: 'https://yourstore.lemonsqueezy.com/billing', 'aria-label': 'Manage link', value: premium.settings.manageUrl || '' });
    const price = h('input', { class: 'field', maxlength: 20, 'aria-label': 'Price', value: premium.settings.price || '' });
    const giftEmail = h('input', { class: 'field', type: 'email', placeholder: 'Email', 'aria-label': 'Email' });
    const newsTitle = h('input', { class: 'field', maxlength: 120, placeholder: 'Title', 'aria-label': 'Title' });
    const newsBody = h('textarea', { class: 'field', rows: 2, maxlength: 1000, placeholder: 'Message', 'aria-label': 'Message' });
    const gift = async (days) => {
      const result = await api.server('grantPremium', giftEmail.value, days);
      if (!result.ok) toast(errorMessage(result));
      else toast(result.value ? 'Done.' : 'No account has that email.');
    };
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Premium setup' }),
      h('div', { class: 'setting-group' },
        labelled('Checkout link', 'Premium goes on sale as soon as this is saved.', checkout),
        labelled('Manage link', '', manage),
        labelled('Price', '', price),
        h('div', { class: 'actions' }, h('button', {
          class: 'button primary',
          text: 'Save',
          onclick: async () => {
            const result = await api.server('saveAppSettings', { checkoutUrl: checkout.value.trim(), manageUrl: manage.value.trim(), price: price.value.trim() });
            toast(result.ok ? 'Saved.' : errorMessage(result));
            refreshPremium();
          },
        })),
        labelled('Give someone Premium', '', giftEmail),
        h('div', { class: 'actions' },
          h('button', { class: 'button', text: 'Give 1 month', onclick: () => gift(31) }),
          h('button', { class: 'button', text: 'Give 1 year', onclick: () => gift(366) }),
          h('button', { class: 'button', text: 'Take back', onclick: () => gift(0) }))),
      discordAdminBox(),
      h('h2', { class: 'section-title', text: 'App news' }),
      h('div', { class: 'setting-group' },
        newsTitle,
        newsBody,
        h('div', { class: 'actions' }, h('button', {
          class: 'button primary',
          text: 'Send to everyone',
          onclick: async () => {
            const result = await api.server('postNews', newsTitle.value, newsBody.value);
            toast(result.ok ? 'Saved.' : errorMessage(result));
            if (result.ok) renderAdminTools(box);
          },
        })),
        ...(news.ok ? news.value : []).map((item) => h('div', { class: 'review-row' },
          h('div', { class: 'track-text' }, h('strong', { raw: item.title })),
          h('button', { class: 'button small', text: 'Delete', onclick: async () => { await api.server('removeNews', item.id); renderAdminTools(box); } })))),
      h('h2', { class: 'section-title', text: 'Support messages' }),
      support.ok && support.value.length ? null : h('p', { class: 'empty', text: 'No messages.' }),
      ...(support.ok ? support.value : []).map((item) => h('div', { class: 'review-row' },
        h('div', { class: 'track-text wrap' }, h('strong', { raw: item.contact || t('No email given') }), h('span', { raw: item.body })),
        h('button', { class: 'button small', text: 'Done', onclick: async () => { await api.server('clearSupport', item.id); renderAdminTools(box); } }))));
  }

  /* ---------- Solam AI ---------- */

  const AI_SUGGESTIONS = ['Make me a chill playlist', 'Which settings suit my PC?', 'What can you do?'];
  const AI_ERRORS = {
    'ai-limit': 'You’ve used all your Solam AI messages for today. They come back tomorrow, and Premium has many more.',
    'ai-busy': 'Solam AI is very busy right now. Please try again in a minute.',
    'ai-not-ready': 'Solam AI isn’t switched on yet. Please try again later.',
    'ai-failed': 'Solam AI couldn’t answer just now. Please try again.',
  };
  const AI_SETTINGS = {
    theme: (value) => THEMES.some(([id]) => id === value) && value,
    quality: (value) => ['low', 'medium', 'high'].includes(value) && value,
    tint: (value) => numberBetween(value, 0, 1),
    blur: (value) => numberBetween(value, 0, 50),
    refraction: (value) => numberBetween(value, 0, 80),
    radius: (value) => numberBetween(value, 8, 44),
    speed: (value) => numberBetween(value, 0, 2.5),
    brightness: (value) => numberBetween(value, 0.4, 1.4),
    crossfade: (value) => numberBetween(value, 1, 12),
  };
  const AI_SWITCHES = ['crossfadeOn', 'autoplay', 'extraMotion', 'rippleOn', 'beatOn', 'wobbleOn', 'shineOn', 'discordOn'];
  const AI_SETTING_NAMES = {
    theme: 'Theme', quality: 'Quality', tint: 'Clear to tinted', blur: 'Frost', refraction: 'Edge bending', radius: 'Corner roundness', speed: 'Animation speed', brightness: 'Theme brightness', crossfade: 'Transition length',
    crossfadeOn: 'Song transitions', autoplay: 'Autoplay similar songs', extraMotion: 'Extra animations', rippleOn: 'Mouse ripples', beatOn: 'Pulse to the beat', wobbleOn: 'Liquid wobble', shineOn: 'Reflections', discordOn: 'Show on Discord',
  };
  const ai = { messages: loadAi(), busy: false, left: null, box: null };

  function numberBetween(value, min, max) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : false;
  }

  // The AI sometimes writes true and false as words.
  const aiSwitch = (value) => (value === true || value === 'true' ? true : value === false || value === 'false' ? false : null);

  // The chat stays on this device, so the next person to sign in here must not see it.
  function clearAi() {
    ai.messages = [];
    ai.left = null;
    storeAi();
  }

  function aiSettingAllowed({ key, value }) {
    if (key === 'discordOn' && isWeb) return false;
    if (key === 'crossfade' && !hasPremium()) return false;
    if (AI_SWITCHES.includes(key)) return aiSwitch(value) !== null;
    return Boolean(AI_SETTINGS[key]) && AI_SETTINGS[key](value) !== false;
  }

  function describeSetting({ key, value }) {
    const name = t(AI_SETTING_NAMES[key]);
    if (AI_SWITCHES.includes(key)) return t(aiSwitch(value) ? 'Turn {name} on' : 'Turn {name} off', { name });
    const shown = key === 'theme' ? t(THEMES.find(([id]) => id === value)[1]) : key === 'quality' ? t(value[0].toUpperCase() + value.slice(1)) : String(value);
    return t('Change {name} to {to}', { name, to: shown });
  }

  function loadAi() {
    try {
      const stored = JSON.parse(localStorage.getItem(AI_KEY) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function storeAi() {
    ai.messages = ai.messages.slice(-AI_SAVED_MESSAGES);
    try {
      localStorage.setItem(AI_KEY, JSON.stringify(ai.messages));
    } catch {
      // The chat simply won't be there next time.
    }
  }

  function aiContext() {
    return {
      language: window.solamLanguage,
      device: isWeb ? 'phone or browser' : 'Windows PC',
      page: activePage,
      nowPlaying: player.np.title ? `${player.np.title} by ${player.np.artist}` : null,
      playlists: saved.playlists.slice(0, 25).map((list) => ({ name: list.name, songs: list.tracks.length })),
      favourites: saved.favorites.length,
      following: saved.follows.slice(0, 10).map((artist) => artist.name),
      premium: premium.active,
      settings: { theme: settings.theme, quality: settings.quality, tint: settings.tint, blur: settings.blur, extraMotion: settings.extraMotion, crossfadeOn: settings.crossfadeOn, autoplay: settings.autoplay },
      memory: lastMemory,
      cores: navigator.hardwareConcurrency || null,
      deviceMemoryGb: navigator.deviceMemory || null,
      screen: `${window.screen.width}x${window.screen.height}`,
    };
  }

  const findList = (name) => saved.playlists.find((list) => list.name.toLowerCase() === String(name).trim().toLowerCase());

  function aiSongs(songs) {
    return (Array.isArray(songs) ? songs : []).slice(0, 40).filter((song) => song?.title && song?.artist).map((song) => ({
      source: 'imported', id: `${song.artist}|${song.title}`, title: String(song.title).slice(0, 120), artist: String(song.artist).slice(0, 80), album: '', art: '', thumb: '', duration: 0,
    }));
  }

  // Says in plain words what an action will do, or returns null when it can't be done.
  function describeAction({ name, args = {} }) {
    const list = args.playlist ? findList(args.playlist) : null;
    if (name === 'make_playlist') return aiSongs(args.songs).length && args.name ? t('Create the playlist “{name}” with {n} songs', { name: args.name, n: aiSongs(args.songs).length }) : null;
    if (name === 'add_to_playlist') return list && aiSongs(args.songs).length ? t('Add {n} songs to “{name}”', { name: list.name, n: aiSongs(args.songs).length }) : null;
    if (name === 'rename_playlist') return list && args.name ? t('Rename “{name}” to “{to}”', { name: list.name, to: args.name }) : null;
    if (name === 'sort_playlist') return list ? t(args.by === 'artist' ? 'Sort “{name}” by artist' : 'Sort “{name}” by song title', { name: list.name }) : null;
    if (name === 'remove_duplicates') return list ? t('Remove repeated songs from “{name}”', { name: list.name }) : null;
    if (name === 'delete_playlist') return list ? t('Delete the playlist “{name}”', { name: list.name }) : null;
    if (name === 'play_music') return args.query ? t('Play {name}', { name: args.query }) : null;
    if (name === 'change_setting') return aiSettingAllowed(args) ? describeSetting(args) : null;
    return null;
  }

  async function runAction({ name, args = {} }) {
    const list = args.playlist ? findList(args.playlist) : null;
    if (name === 'make_playlist') {
      saved.playlists.push({ id: crypto.randomUUID(), name: String(args.name).slice(0, 60), tracks: aiSongs(args.songs) });
    } else if (name === 'add_to_playlist') {
      aiSongs(args.songs).forEach((track) => { if (!list.tracks.some((item) => trackKey(item) === trackKey(track))) list.tracks.push(track); });
    } else if (name === 'rename_playlist') {
      list.name = String(args.name).slice(0, 60);
    } else if (name === 'sort_playlist') {
      const field = args.by === 'artist' ? 'artist' : 'title';
      list.tracks.sort((a, b) => String(a[field]).localeCompare(String(b[field])));
    } else if (name === 'remove_duplicates') {
      const seen = new Set();
      list.tracks = list.tracks.filter((track) => {
        const key = `${track.title}|${track.artist}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else if (name === 'delete_playlist') {
      saved.playlists = saved.playlists.filter((item) => item !== list);
    } else if (name === 'play_music') {
      const found = await api.search(String(args.query));
      if (!found.tracks.length) throw new Error('not-found');
      playQueue(found.tracks, 0);
      return;
    } else if (name === 'change_setting') {
      changeSetting(args.key, AI_SWITCHES.includes(args.key) ? aiSwitch(args.value) : AI_SETTINGS[args.key](args.value));
      // The settings page draws its controls once, so it is redrawn to show the new value.
      $('#settings').replaceChildren();
      if (activePage === 'settings') buildSettings();
      return;
    }
    storeSaved();
    if (activePage === 'collection') renderCollection();
  }

  function actionCard(message, action) {
    const text = describeAction(action);
    if (!text) return null;
    const answer = async (yes) => {
      action.state = yes ? 'working' : 'no';
      drawAi();
      if (yes) {
        try {
          await runAction(action);
          action.state = 'done';
        } catch {
          action.state = 'failed';
        }
      }
      storeAi();
      drawAi();
    };
    const songs = aiSongs(action.args?.songs);
    const labels = { done: 'Done', no: 'Not done', failed: 'That didn’t work', working: 'Working…' };
    return h('div', { class: `ai-card${action.state ? ' answered' : ''}` },
      h('strong', { raw: text }),
      songs.length ? h('ul', { class: 'ai-songs' }, ...songs.slice(0, 6).map((song) => h('li', { raw: `${song.title} · ${song.artist}` })), songs.length > 6 ? h('li', { text: 'and {n} more', values: { n: songs.length - 6 } }) : null) : null,
      action.state ? h('span', { class: `ai-state ${action.state}`, text: labels[action.state] }) : h('div', { class: 'actions' },
        h('button', { class: 'button small primary', text: 'Yes, do it', onclick: () => answer(true) }),
        h('button', { class: 'button small', text: 'No', onclick: () => answer(false) })));
  }

  function aiBubble(message) {
    const assistant = message.role === 'assistant';
    return h('div', { class: `ai-row ${assistant ? 'from-ai' : 'from-you'}` },
      assistant ? h('span', { class: 'ai-mark' }, icon('spark')) : null,
      h('div', { class: 'ai-content' },
        message.content ? h('div', { class: `ai-bubble${message.failed ? ' failed' : ''}`, raw: message.content }) : null,
        ...(message.actions || []).map((action) => actionCard(message, action))));
  }

  function drawAi() {
    const box = ai.box;
    if (!box || !box.isConnected) return;
    const list = box.querySelector('.ai-messages');
    const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    const empty = !ai.messages.length;
    list.replaceChildren(
      empty ? h('div', { class: 'ai-hello' },
        h('span', { class: 'ai-hello-mark' }, icon('spark')),
        h('h2', { text: 'How can I help?' }),
        h('p', { text: 'Playlists, music, settings or any question. I always ask before changing anything.' }),
        h('div', { class: 'ai-suggestions' }, ...AI_SUGGESTIONS.map((text) => h('button', { class: 'chip', text, onclick: () => sendToAi(t(text)) })))) : null,
      ...ai.messages.map(aiBubble),
      ai.busy ? h('div', { class: 'ai-row from-ai' }, h('span', { class: 'ai-mark' }, icon('spark')), h('div', { class: 'ai-typing' }, h('i'), h('i'), h('i'))) : null);
    if (atEnd || ai.busy) list.scrollTop = list.scrollHeight;
    const left = box.querySelector('.ai-left');
    left.textContent = ai.left === null ? '' : t('{n} messages left today', { n: ai.left });
  }

  async function sendToAi(text) {
    const clean = String(text).trim();
    if (!clean || ai.busy) return;
    ai.messages.push({ role: 'user', content: clean.slice(0, 1500) });
    ai.busy = true;
    storeAi();
    drawAi();
    const history = ai.messages.filter((message) => message.content && !message.failed).slice(-AI_SENT_MESSAGES).map(({ role, content }) => ({ role, content }));
    const result = await api.server('askAi', history, aiContext());
    ai.busy = false;
    if (result.ok) {
      ai.left = result.value.left ?? ai.left;
      const actions = (result.value.actions || []).filter((action) => describeAction(action));
      ai.messages.push({ role: 'assistant', content: result.value.reply || (actions.length ? '' : t('Sorry, I don’t have an answer for that.')), actions });
    } else {
      ai.messages.push({ role: 'assistant', failed: true, content: t(AI_ERRORS[result.error] || (result.error === 'not-signed-in' ? 'Please sign in again.' : AI_ERRORS['ai-failed'])) });
    }
    storeAi();
    drawAi();
  }

  function aiChat() {
    if (!account.user) {
      return h('div', { class: 'ai-chat' }, h('div', { class: 'ai-messages' }, h('div', { class: 'ai-hello' },
        h('span', { class: 'ai-hello-mark' }, icon('spark')),
        h('h2', { raw: AI_NAME }),
        h('p', { text: 'Sign in for free to chat with Solam AI.' }),
        h('button', { class: 'button primary', text: 'Sign in', onclick: () => showPage('account') }))));
    }
    const input = h('textarea', { class: 'ai-input', rows: 1, maxlength: 1500, placeholder: 'Ask Solam AI', 'aria-label': 'Ask Solam AI' });
    const submit = () => {
      const text = input.value;
      input.value = '';
      input.style.height = '';
      sendToAi(text);
    };
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(120, input.scrollHeight)}px`;
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });
    const box = h('div', { class: 'ai-chat' },
      h('div', { class: 'ai-messages', role: 'log' }),
      h('div', { class: 'ai-compose' },
        input,
        h('button', { class: 'icon-button ai-send', title: 'Send', 'aria-label': 'Send', onclick: submit }, icon('send'))),
      h('div', { class: 'ai-foot' },
        h('span', { class: 'ai-left' }),
        ai.messages.length ? h('button', { text: 'Clear chat', onclick: () => { ai.messages = []; storeAi(); if (activePage === 'assistant') renderAssistant(); else showAiSheet(); } }) : null,
        h('span', { text: 'Solam AI can make mistakes. Don’t share private information.' })));
    ai.box = box;
    return box;
  }

  function renderAssistant() {
    $('#assistant').replaceChildren(aiChat());
    drawAi();
  }

  function showAiSheet() {
    openSheet(AI_NAME, aiChat());
    document.querySelector('#sheet .sheet-panel').classList.add('ai-panel');
    drawAi();
  }

  /* ---------- paying by bank transfer ---------- */

  const formatIban = (iban) => String(iban).replace(/(.{4})/g, '$1 ').trim();

  // The standard code European banking apps can scan, which fills in the whole transfer.
  function bankQrText(details, code) {
    return ['BCD', '002', '1', 'SCT', '', details.account_name, details.iban, `EUR${Number(details.amount).toFixed(2)}`, '', '', code].join('\n');
  }

  function copyRow(label, value, shown = value) {
    const button = h('button', {
      class: 'pay-copy',
      title: 'Copy',
      'aria-label': label,
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(value);
          button.classList.add('copied');
          setTimeout(() => button.classList.remove('copied'), 1400);
        } catch {
          toast('Couldn’t copy that. Please copy it by hand.');
        }
      },
    }, h('small', { text: label }), h('strong', { raw: shown }), h('span', { class: 'pay-copy-state', text: 'Copy' }), h('span', { class: 'pay-copied', text: 'Copied' }));
    return button;
  }

  async function showBankPayment() {
    if (!account.user) {
      toast('Sign in first, so Premium goes to your account.');
      showPage('account');
      return;
    }
    const body = openSheet('Get Premium', h('div', { class: 'pay-loading' }, h('i'), h('i'), h('i')));
    const [details, existing] = await Promise.all([api.server('paymentDetails'), api.server('myPremiumRequest')]);
    let request = existing.ok ? existing.value : null;
    if (!request) {
      const started = await api.server('startPremiumRequest');
      if (!started.ok) {
        toast(errorMessage(started));
        closeSheet();
        return;
      }
      request = started.value;
    }
    if (!details.ok || !details.value?.iban || !request) {
      toast('Something went wrong. Please try again.');
      closeSheet();
      return;
    }
    premium.request = request;
    const showWaiting = () => {
      body.replaceChildren(h('div', { class: 'pay-step pay-waiting' },
        h('span', { class: 'pay-orbit' }, h('i'), h('i'), h('i'), icon('premium')),
        h('h3', { text: 'Waiting for your payment' }),
        h('p', { class: 'status-note', text: 'Transfers can take up to a day or two. Premium switches on by itself once your payment is checked. You can close this.' }),
        copyRow('Your code', request.code),
        h('div', { class: 'actions' }, h('button', { class: 'button', text: 'Close', onclick: closeSheet }))));
    };
    if (request.paid_at) {
      showWaiting();
      return;
    }
    const value = details.value;
    const qr = h('canvas', { class: 'qr-code pay-qr', 'aria-label': 'QR code' });
    const paid = h('button', {
      class: 'button primary pay-done',
      text: 'I’ve paid',
      onclick: async () => {
        paid.disabled = true;
        const done = await api.server('markPremiumPaid', request.id);
        paid.disabled = false;
        if (!done.ok) {
          toast(errorMessage(done));
          return;
        }
        request.paid_at = new Date().toISOString();
        showWaiting();
        if (activePage === 'premium') renderPremium();
      },
    });
    body.replaceChildren(h('div', { class: 'pay-step' },
      h('div', { class: 'pay-amount' }, h('strong', { raw: premium.settings.price }), h('span', { text: 'for one month of Premium' })),
      h('p', { class: 'status-note pay-hint', text: 'Scan this with your banking app, or copy the details below.' }),
      qr,
      copyRow('IBAN', value.iban, formatIban(value.iban)),
      copyRow('Name', value.account_name),
      copyRow('Amount', Number(value.amount).toFixed(2), premium.settings.price),
      copyRow('Payment reference', request.code),
      h('p', { class: 'pay-warning', text: 'Always include the payment reference. It’s how your payment reaches your account.' }),
      paid));
    drawQr(qr, bankQrText(value, request.code), 420);
  }

  const CELEBRATED_KEY = 'solam.premiumCelebrated';

  function celebrateNewPremium() {
    if (!premium.active || !premium.until || premium.provider === 'lemonsqueezy') return;
    let seen = null;
    try {
      seen = localStorage.getItem(CELEBRATED_KEY);
      localStorage.setItem(CELEBRATED_KEY, premium.until);
    } catch {
      return;
    }
    if (seen === premium.until) return;
    const pieces = Array.from({ length: 34 }, (_, i) => h('i', { style: `--x:${(i * 37) % 100}%;--d:${(i * 53) % 700}ms;--h:${(i * 47) % 360}` }));
    const overlay = h('div', { id: 'celebrate', role: 'status', onclick: () => overlay.remove() }, ...pieces,
      h('div', { class: 'celebrate-card glass' },
        h('span', { class: 'premium-star' }, icon('premium')),
        h('h1', { class: 'page-title', text: 'Premium is on!' }),
        h('p', { class: 'page-sub', text: 'Thank you for supporting Solam.' })));
    document.body.append(overlay);
    setTimeout(() => overlay.remove(), 4200);
  }

  async function renderPaymentAdmin(box) {
    const [details, requests] = await Promise.all([api.server('paymentDetails'), api.server('premiumRequests')]);
    const value = details.ok && details.value ? details.value : {};
    const iban = h('input', { class: 'field', autocomplete: 'off', maxlength: 42, placeholder: 'LT00 0000 0000 0000 0000', 'aria-label': 'Your IBAN', value: value.iban ? formatIban(value.iban) : '' });
    const name = h('input', { class: 'field', autocomplete: 'off', maxlength: 70, 'aria-label': 'Name on the account', value: value.account_name || '' });
    const amount = h('input', { class: 'field', inputmode: 'decimal', maxlength: 8, 'aria-label': 'Price in euros', value: value.amount ? String(value.amount) : '3.99' });
    const save = async (enabled) => {
      const result = await api.server('saveBankDetails', { iban: iban.value, accountName: name.value, amount: amount.value, enabled });
      toast(result.ok ? (enabled ? 'Premium is on sale.' : 'Premium is off sale.') : errorMessage(result));
      if (result.ok) {
        await refreshPremium();
        renderPaymentAdmin(box);
      }
    };
    const list = requests.ok ? requests.value : [];
    box.replaceChildren(
      h('h2', { class: 'section-title', text: 'Premium payments' }),
      list.length ? null : h('p', { class: 'empty', text: 'No payments are waiting.' }),
      ...list.map((item) => h('div', { class: 'review-row pay-request' },
        h('div', { class: 'track-text wrap' }, h('strong', { raw: item.code }), h('span', { raw: item.email })),
        h('button', { class: 'button small primary', text: 'Activate 1 month', onclick: async () => { const r = await api.server('decidePremiumRequest', item.id, true, 31); if (!r.ok) toast(errorMessage(r)); renderPaymentAdmin(box); } }),
        h('button', { class: 'button small', text: 'Not paid', onclick: async () => { const r = await api.server('decidePremiumRequest', item.id, false, 0); if (!r.ok) toast(errorMessage(r)); renderPaymentAdmin(box); } }))),
      h('p', { class: 'status-note', text: 'Check your bank for the code before you press Activate.' }),
      h('div', { class: 'setting-group' },
        h('h3', { text: 'Your bank details' }),
        h('p', { class: 'notice', text: 'Everyone who opens the payment screen will see this IBAN and name, and paying can show them your real name.' }),
        labelled('Your IBAN', '', iban),
        labelled('Name on the account', '', name),
        labelled('Price in euros', '', amount),
        h('div', { class: 'actions' },
          h('button', { class: 'button primary', text: premium.settings.bankOn ? 'Save' : 'Put Premium on sale', onclick: () => save(true) }),
          premium.settings.bankOn ? h('button', { class: 'button', text: 'Take off sale', onclick: () => save(false) }) : null)));
  }

  /* ---------- glass bending on iPhone ---------- */

  let glassTimer = 0;

  function measureGlass() {
    if (window.LiquidGlass.canBend) return;
    if (document.body.classList.contains('wt-open')) {
      engine.setGlass([], 0);
      return;
    }
    const selectors = document.body.classList.contains('big') ? ['#player', '#bc-lyrics'] : ['#dock', '#player', '.page.active > .glass'];
    const boxes = selectors.map((selector) => document.querySelector(selector)).filter(Boolean).map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, bottom: box.bottom, width: box.width, height: box.height, radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 20 };
    }).filter((box) => box.width > 0 && box.height > 0);
    engine.setGlass(boxes, settings.quality === 'low' ? 0 : settings.refraction);
  }

  // Panels move while they animate in, so they are measured right away and again once they settle.
  function syncGlass() {
    measureGlass();
    clearTimeout(glassTimer);
    glassTimer = setTimeout(measureGlass, 560);
  }

  /* ---------- big cover ---------- */

  let idleTimer = 0;
  function openBigCover() {
    document.body.classList.add('big');
    $('#bigcover').setAttribute('aria-hidden', 'false');
    markActive();
    syncGlass();
  }
  function closeBigCover() {
    document.body.classList.remove('big', 'idle');
    $('#bigcover').setAttribute('aria-hidden', 'true');
    syncGlass();
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
    if (document.body.classList.contains('big')) updateLyricsPosition();
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
        document.querySelectorAll('#dock, #player, .page.active > .glass, #bc-lyrics').forEach((panel) => {
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
    setIcon($('#np-repeat'), 'repeat');
    setIcon($('#np-shuffle'), 'shuffle');
    $('#np-repeat').onclick = cycleRepeat;
    $('#np-shuffle').onclick = toggleShuffle;
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
    setIcon($('#inbox-button'), 'bell');
    setIcon($('#ai-orb'), 'spark');
    $('#ai-orb').onclick = showAiSheet;
    $('#inbox-button').onclick = showInbox;
    $('#bc-next').textContent = t('Up next');
    $('#bc-comments').textContent = t('Comments');
    $('#bc-share').textContent = t('Share');
    $('#bc-next').onclick = showUpNext;
    $('#bc-comments').onclick = () => { const track = player.queue[player.index]; if (track) showComments(track); };
    $('#bc-share').onclick = () => { const track = player.queue[player.index]; if (track) showShareSheet(track); };
    $('#np-heart').onclick = () => {
      const track = player.queue[player.index];
      if (track) {
        toggleFavourite(track);
        popIn($('#np-heart svg'), 0.6);
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
    decks.forEach((deck) => setDeckLevel(deck, settings.volume));
    volume.oninput = () => {
      setFill(volume);
      settings.volume = Number(volume.value);
      if (!fade.active) setDeckLevel(audio, targetVolume());
      saveSettings();
    };

    window.addEventListener('keydown', (event) => {
      const typing = event.target.matches('input:not([type="range"]), textarea');
      if (typing) return;
      if (event.code === 'Space' && !event.target.matches('button')) {
        event.preventDefault();
        togglePlay();
      } else if (event.key === 'Escape') {
        if (document.getElementById('sheet')) closeSheet();
        else closeBigCover();
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

  // Everyone is told about a new version, and it installs from inside the app.
  function showUpdate(update) {
    // On Windows updates arrive quietly and install when Solam closes, so the next open is already new.
    if (!isWeb && update.state !== 'error') {
      if (update.state === 'ready') {
        const notice = $('#update-notice');
        notice.hidden = false;
        notice.textContent = t('Update ready. Click to restart now.');
        notice.onclick = () => api.installUpdate();
      }
      return;
    }
    const box = $('#update-box');
    const title = $('#update-title');
    const note = $('#update-note');
    const action = $('#update-action');
    const later = $('#update-later');
    if (update.state === 'error') {
      if (box.hidden) checkForUpdate();
      else {
        note.textContent = t('The update couldn’t finish. Please try again later.');
        action.hidden = true;
        later.hidden = false;
      }
      return;
    }
    box.hidden = false;
    later.textContent = t('Later');
    later.onclick = () => { box.hidden = true; };
    if (update.state === 'available') {
      title.textContent = t('A new version of Solam is ready');
      note.textContent = t(isWeb ? 'Update now to get the newest version {version}. Your music and settings stay.' : 'Update now to get the newest version {version}. You don’t need to install a new program, and your music and settings stay.', { version: update.version });
      action.hidden = false;
      action.disabled = false;
      action.textContent = t('Update now');
      action.onclick = () => {
        action.disabled = true;
        note.textContent = isWeb ? t('Updating…') : t('Downloading the update: {percent}%', { percent: 0 });
        later.textContent = t('Hide');
        api.downloadUpdate();
      };
    } else if (update.state === 'downloading') {
      note.textContent = t('Downloading the update: {percent}%', { percent: update.percent });
    } else if (update.state === 'ready') {
      title.textContent = t('The update is ready');
      note.textContent = t('Solam will close, update and open again. This takes a few seconds.');
      action.disabled = false;
      action.hidden = false;
      action.textContent = t('Restart and update');
      action.onclick = () => api.installUpdate();
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
    engine.maxRatio = 1.25;
    engine.minFrameMs = 33;
  }

  async function init() {
    pulseTargets.push($('#dock'), $('#player'));
    wire();
    buildDock();
    (await api.offlineList().catch(() => [])).forEach((entry) => offlineFiles.set(entry.key, entry));
    api.server('hidden').then((result) => {
      if (result.ok && result.value.length) {
        result.value.forEach((key) => hiddenTracks.add(key));
        if (activePage === 'home') loadDiscover();
      }
    });
    api.onUpdateState(showUpdate);
    buildHome();
    api.onMemoryReport((report) => {
      lastMemory = report;
      updateMemoryNote();
      if (report.trim) {
        api.clearPageCache();
        engine.lighten();
        // PCs without a separate graphics card may need blur-free glass to stay inside the limit.
        memoryTrims += 1;
        if (memoryTrims >= 2 && report.used > report.budget * LIGHT_GLASS_OVER_BUDGET && !lightGlassForMemory) {
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
    window.addEventListener('resize', syncGlass);
    window.addEventListener('focus', () => { if (account.user) refreshPremium(); });
    window.addEventListener('hashchange', openLinkFromAddress);
    if (!settings.welcomed) showWelcome();
    else if (settings.seenNews !== WHATS_NEW_VERSION) showWhatsNew();
    try {
      library = await api.getLibrary();
    } catch {
      toast('Couldn’t read your music library.');
    }
    await refreshAccount();
    if (account.user) syncSaved();
    checkInbox();
    setInterval(checkInbox, INBOX_CHECK_MS);
    openLinkFromAddress();
  }

  init();
})();
