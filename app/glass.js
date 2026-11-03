// Liquid glass: each panel gets its own SVG lens map that bends the background near its rim.
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MAP_SCALE = 0.35;
  const NEUTRAL = 128;
  const FROST_WITHOUT_LENS = 0.4;
  const options = { refraction: 28, blur: 22, enabled: true };
  // iPhones blur the glass but can't bend it, and a bending filter would switch the blur off too.
  const CAN_BEND = !/iPhone|iPad|iPod|Macintosh.*Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent);
  const setBackdrop = (element, value) => {
    element.style.backdropFilter = value;
    element.style.webkitBackdropFilter = value;
  };
  const panels = new Map();
  const lensMaps = new Map();
  let nextId = 0;
  let defs = null;

  function roundedDistance(x, y, width, height, radius) {
    const qx = Math.abs(x - width / 2) - (width / 2 - radius);
    const qy = Math.abs(y - height / 2) - (height / 2 - radius);
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
    return radius - outside - Math.min(Math.max(qx, qy), 0);
  }

  function buildLensMap(width, height, radius) {
    const w = Math.max(4, Math.round(width * MAP_SCALE));
    const h = Math.max(4, Math.round(height * MAP_SCALE));
    const r = Math.min(radius * MAP_SCALE, Math.min(w, h) / 2);
    const bezel = Math.max(5, Math.min(w, h) * 0.2, r * 0.75);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    const image = context.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const inside = roundedDistance(x + 0.5, y + 0.5, w, h, r);
        let red = NEUTRAL;
        let green = NEUTRAL;
        if (inside > 0 && inside < bezel) {
          const dx = roundedDistance(x + 1.5, y + 0.5, w, h, r) - roundedDistance(x - 0.5, y + 0.5, w, h, r);
          const dy = roundedDistance(x + 0.5, y + 1.5, w, h, r) - roundedDistance(x + 0.5, y - 0.5, w, h, r);
          const length = Math.hypot(dx, dy) || 1;
          const falloff = (1 - inside / bezel) ** 2;
          red += (dx / length) * falloff * 127;
          green += (dy / length) * falloff * 127;
        }
        const pixel = (y * w + x) * 4;
        image.data[pixel] = red;
        image.data[pixel + 1] = green;
        image.data[pixel + 2] = NEUTRAL;
        image.data[pixel + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function ensureDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    defs = document.createElementNS(SVG_NS, 'defs');
    svg.append(defs);
    document.body.append(svg);
    return defs;
  }

  function render(panel) {
    const { element, filter } = panel;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (!width || !height) return;
    // Without the bending filter the background draws the bend itself, so less frost keeps it visible.
    const frost = CAN_BEND ? options.blur : options.blur * FROST_WITHOUT_LENS;
    const blur = `blur(${frost}px) saturate(165%)`;
    if (!options.enabled || !CAN_BEND) {
      filter.replaceChildren();
      setBackdrop(element, options.blur > 0 ? blur : 'none');
      return;
    }
    const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 20;
    const sizeKey = `${width}x${height}x${radius}`;
    if (panel.sizeKey !== sizeKey) {
      panel.sizeKey = sizeKey;
      if (!lensMaps.has(sizeKey)) {
        if (lensMaps.size >= 6) lensMaps.delete(lensMaps.keys().next().value);
        lensMaps.set(sizeKey, buildLensMap(width, height, radius));
      }
      panel.map = lensMaps.get(sizeKey);
    }
    filter.setAttribute('width', width);
    filter.setAttribute('height', height);
    const lens = document.createElementNS(SVG_NS, 'feImage');
    lens.setAttribute('href', panel.map);
    lens.setAttribute('x', 0);
    lens.setAttribute('y', 0);
    lens.setAttribute('width', width);
    lens.setAttribute('height', height);
    lens.setAttribute('preserveAspectRatio', 'none');
    lens.setAttribute('result', 'lens');
    const displace = document.createElementNS(SVG_NS, 'feDisplacementMap');
    displace.setAttribute('in', 'SourceGraphic');
    displace.setAttribute('in2', 'lens');
    displace.setAttribute('scale', options.refraction * 2.4);
    displace.setAttribute('xChannelSelector', 'R');
    displace.setAttribute('yChannelSelector', 'G');
    filter.replaceChildren(lens, displace);
    setBackdrop(element, `${blur} url(#${filter.id})`);
  }

  function attach(element) {
    if (panels.has(element)) return;
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.id = `lens-${nextId++}`;
    filter.setAttribute('x', 0);
    filter.setAttribute('y', 0);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    ensureDefs().append(filter);
    const panel = { element, filter, map: null, sizeKey: '', timer: 0 };
    panels.set(element, panel);
    new ResizeObserver(() => {
      clearTimeout(panel.timer);
      panel.timer = setTimeout(() => render(panel), 90);
    }).observe(element);
    render(panel);
  }

  function configure(next) {
    Object.assign(options, next);
    panels.forEach(render);
  }

  function wobble(element, amount) {
    if (!amount) return;
    const push = 0.05 * amount;
    element.animate([
      { transform: 'scale(1, 1)' },
      { transform: `scale(${1 + push}, ${1 - push * 0.8})`, offset: 0.25 },
      { transform: `scale(${1 - push * 0.45}, ${1 + push * 0.4})`, offset: 0.55 },
      { transform: `scale(${1 + push * 0.15}, ${1 - push * 0.12})`, offset: 0.8 },
      { transform: 'scale(1, 1)' },
    ], { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }

  window.LiquidGlass = { attach, configure, wobble, canBend: CAN_BEND };
})();
