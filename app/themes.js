// Animated backgrounds: one WebGL fragment shader per theme, sharing a common prelude.
(() => {
  const VERTEX = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  const PRELUDE = `
  precision highp float;
  uniform vec2 uRes, uMouse;
  uniform float uT, uClock, uBass, uBeat, uBright, uRipAmt;
  uniform vec4 uRip[8];
  uniform vec3 uA, uB, uC;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
    return v;
  }
  vec2 liquid(vec2 uv){
    float aspect = uRes.x / uRes.y;
    vec2 q = vec2(uv.x * aspect, uv.y), offset = vec2(0.0);
    for (int i = 0; i < 8; i++) {
      vec4 r = uRip[i];
      float age = uClock - r.z;
      if (r.w <= 0.0 || age < 0.0 || age > 2.4) continue;
      vec2 d = q - vec2(r.x * aspect, r.y);
      float dist = length(d) + 0.0001, front = age * 0.42, band = dist - front;
      float wave = sin(band * 46.0) * exp(-band * band * 90.0) * exp(-age * 2.0);
      offset += d / dist * wave * r.w * 0.022;
    }
    vec2 toMouse = q - vec2(uMouse.x * aspect, uMouse.y);
    float near = exp(-dot(toMouse, toMouse) * 16.0);
    offset -= toMouse * near * 0.05;
    offset *= uRipAmt;
    return uv + vec2(offset.x / aspect, offset.y);
  }
  vec3 theme(vec2 uv);
  void main(){
    vec2 uv = liquid(gl_FragCoord.xy / uRes);
    vec2 screen = gl_FragCoord.xy / uRes;
    vec3 c = theme(uv) * uBright * (1.0 + uBeat * 0.18);
    c += c * c * 0.55;
    vec2 light = (screen - uMouse) * vec2(uRes.x / uRes.y, 1.0);
    c += (c + 0.035) * exp(-dot(light, light) * 7.0) * 0.5;
    vec2 edge = screen - 0.5;
    c *= 1.0 - dot(edge, edge) * 0.72;
    c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
    c = pow(clamp(c, 0.0, 1.0), vec3(0.92));
    c += (hash(gl_FragCoord.xy + uClock) - 0.5) / 96.0;
    gl_FragColor = vec4(c, 1.0);
  }`;

  const stars = `
  float stars(vec2 uv, float density, float t){
    vec2 g = uv * density, id = floor(g), f = fract(g) - 0.5;
    float h = hash(id);
    if (h < 0.86) return 0.0;
    vec2 at = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
    float tw = 0.55 + 0.45 * sin(t * (1.0 + h * 3.0) + h * 40.0);
    return smoothstep(0.09, 0.0, length(f - at * 0.7)) * tw;
  }`;

  const SHADERS = {
    aurora: stars + `
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT * 0.35;
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec3 c = mix(vec3(0.012, 0.03, 0.075), vec3(0.01, 0.018, 0.045), uv.y);
      c += stars(p, 70.0, uT) * vec3(0.8, 0.9, 1.0) * smoothstep(0.2, 0.9, uv.y);
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float wave = fbm(vec2(p.x * 1.25 + fi * 3.7, t * 0.5 + fi));
        float y = 0.34 + 0.15 * fi + (wave - 0.5) * 0.65;
        float d = uv.y - y;
        float curtain = smoothstep(-0.03, 0.02, d) * exp(-max(d, 0.0) * (5.0 + fi));
        float rays = 0.45 + 0.75 * fbm(vec2(p.x * 16.0 + wave * 5.0 + fi * 11.0, t * 0.8));
        vec3 tone = mix(vec3(0.08, 0.95, 0.58), vec3(0.42, 0.24, 1.0), clamp(fi / 3.0 + (wave - 0.5), 0.0, 1.0));
        c += tone * curtain * rays * (0.42 + uBass * 0.3);
      }
      return c;
    }`,
    ocean: `
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT * 0.45;
      vec2 p = vec2(uv.x * aspect, uv.y) * 5.0;
      vec2 w = p; float caustic = 0.0, amp = 1.0;
      for (int i = 0; i < 5; i++) {
        float n = float(i) + 1.0;
        w += vec2(sin(w.y * 0.9 + t * 0.7 + n), cos(w.x * 0.8 - t * 0.55 + n * 1.7)) * (0.72 / n);
        caustic += amp / (0.55 + 3.5 * abs(sin(w.x + w.y)));
        amp *= 0.72;
      }
      caustic = pow(caustic * 0.2, 2.1);
      vec3 c = mix(vec3(0.0, 0.03, 0.09), vec3(0.0, 0.29, 0.44), pow(uv.y, 1.5));
      float rays = fbm(vec2((uv.x - 0.5) / max(1.25 - uv.y, 0.15) * 4.5 + t * 0.14, t * 0.08));
      c += vec3(0.1, 0.5, 0.62) * smoothstep(0.42, 0.85, rays) * pow(uv.y, 2.0) * 0.7;
      c += vec3(0.1, 0.7, 0.78) * caustic * (0.14 + uv.y * 0.32) * (1.0 + uBass * 0.4);
      return c;
    }`,
    galaxy: stars + `
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT * 0.05;
      vec2 p = (uv - vec2(0.56, 0.52)) * vec2(aspect, 1.0);
      p.y *= 1.55;
      float r = length(p), a = atan(p.y, p.x);
      float arms = 0.5 + 0.5 * sin(a * 2.0 + log(r + 0.05) * 4.4 - t * 2.4);
      float gas = fbm(vec2(a * 1.4 + log(r + 0.06) * 2.7 - t, r * 3.0 + t));
      float body = pow(arms, 2.2) * gas * exp(-r * 1.65) * 2.8;
      vec3 c = vec3(0.012, 0.006, 0.035);
      c += mix(vec3(0.17, 0.2, 0.92), vec3(0.95, 0.17, 0.65), gas) * body;
      c += vec3(1.0, 0.76, 0.54) * exp(-r * 8.5) * (1.05 + uBass * 0.5);
      vec2 q = uv * vec2(aspect, 1.0);
      c += stars(q + t * 0.3, 44.0, uT) * 0.95;
      c += stars(q * 1.9 - t * 0.2, 60.0, uT * 1.2) * vec3(0.7, 0.8, 1.0) * 0.65;
      return c;
    }`,
    lava: `
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT * 0.1;
      vec2 p = vec2(uv.x * aspect, uv.y * 1.2) * 2.1;
      vec2 warp = vec2(fbm(p + vec2(t, -t * 0.55)), fbm(p + vec2(5.2 - t * 0.7, 1.3 + t)));
      float heat = fbm(p + warp * 2.5 + vec2(0.0, -t * 1.5));
      float pool = smoothstep(0.34, 0.68, heat);
      vec3 c = mix(vec3(0.028, 0.01, 0.018), vec3(0.42, 0.018, 0.012), pool);
      c = mix(c, vec3(1.0, 0.27, 0.025), smoothstep(0.52, 0.72, heat));
      c = mix(c, vec3(1.0, 0.76, 0.27), smoothstep(0.7, 0.83, heat) * (0.85 + uBass * 0.15));
      return c * (0.86 + uBass * 0.14);
    }`,
    neon: `
    float skyline(float x, float scale, float seed, float lift){
      float id = floor(x * scale);
      return lift + 0.28 * pow(hash(vec2(id, seed)), 1.45);
    }
    vec3 city(vec2 p, float t){
      vec3 c = mix(vec3(0.42, 0.02, 0.48), vec3(0.018, 0.016, 0.1), smoothstep(0.1, 0.9, p.y));
      c += vec3(0.95, 0.08, 0.62) * exp(-pow((p.y - 0.28) * 5.0, 2.0)) * 0.35;
      float far = skyline(p.x + t * 0.008, 18.0, 2.0, 0.24);
      if (p.y < far) c = vec3(0.11, 0.035, 0.24);
      float near = skyline(p.x - t * 0.014, 9.0, 5.0, 0.13);
      if (p.y < near) {
        c = vec3(0.02, 0.012, 0.075);
        vec2 win = vec2((p.x - t * 0.014) * 70.0, p.y * 88.0);
        float lit = step(0.74, hash(floor(win))) * step(0.22, fract(win.x)) * step(0.28, fract(win.y));
        float flick = 0.68 + 0.32 * sin(t * 0.4 + hash(floor(win)) * 50.0);
        c += mix(vec3(0.05, 0.75, 1.0), vec3(1.0, 0.1, 0.72), hash(floor(win / 4.0))) * lit * flick * 0.78;
      }
      return c;
    }
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT;
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec3 c;
      if (uv.y > 0.12) c = city(p, t);
      else {
        vec2 rp = vec2(p.x + (noise(vec2(p.x * 42.0, t * 1.3)) - 0.5) * 0.035, 0.24 - uv.y);
        c = city(rp, t) * (0.42 + uv.y * 2.2);
      }
      for (int i = 0; i < 3; i++) {
        float fi = float(i), scale = 110.0 + fi * 80.0;
        vec2 r = vec2(p.x + p.y * 0.1, p.y * (2.2 + fi) + t * (1.25 + fi * 0.4));
        vec2 cell = vec2(floor(r.x * scale), floor(r.y + hash(vec2(floor(r.x * scale), fi))));
        float streak = step(0.965, hash(cell)) * smoothstep(0.0, 0.42, fract(r.y)) * smoothstep(0.82, 0.42, fract(r.y));
        c += vec3(0.48, 0.65, 1.0) * streak * (0.28 - fi * 0.06);
      }
      return c * (1.0 + uBass * 0.14);
    }`,
    album: `
    vec3 theme(vec2 uv){
      float aspect = uRes.x / uRes.y, t = uT * 0.12;
      vec2 p = vec2(uv.x * aspect, uv.y) * 1.7;
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
      float f = fbm(p + q * 2.4 + vec2(t * 0.55, -t * 0.25));
      vec3 c = mix(uA, uB, smoothstep(0.25, 0.62, f));
      c = mix(c, uC, smoothstep(0.42, 0.78, q.x));
      c *= 0.5 + 0.55 * f + uBass * 0.08;
      return c;
    }`,
  };

  const QUALITY = {
    low: { scale: 0.35, frameMs: 1000 / 30 },
    medium: { scale: 0.5, frameMs: 1000 / 60 },
    high: { scale: 1, frameMs: 0 },
  };

  class ThemeEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
      this.programs = {};
      this.theme = 'aurora';
      this.quality = QUALITY.medium;
      this.memoryScale = 1;
      this.maxRatio = Infinity;
      this.minFrameMs = 0;
      this.speed = 1;
      this.brightness = 1;
      this.rippleAmount = 1;
      this.colors = [[0.2, 0.1, 0.5], [0.05, 0.45, 0.6], [0.6, 0.15, 0.45]];
      this.targetColors = this.colors.map((color) => color.slice());
      this.ripples = Array.from({ length: 8 }, () => [0, 0, -10, 0]);
      this.rippleIndex = 0;
      this.mouse = [-5, -5];
      this.level = { bass: 0, beat: 0 };
      this.sceneTime = 0;
      this.clock = 0;
      this.lastFrame = 0;
      this.lastDraw = 0;
      if (!this.gl) return;
      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), this.gl.STATIC_DRAW);
      window.addEventListener('resize', () => this.resize());
      this.resize();
      requestAnimationFrame((now) => this.frame(now));
    }

    compile(name) {
      const { gl } = this;
      const shader = (type, source) => {
        const unit = gl.createShader(type);
        gl.shaderSource(unit, source);
        gl.compileShader(unit);
        if (!gl.getShaderParameter(unit, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(unit)}`);
        return unit;
      };
      const program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, PRELUDE + SHADERS[name]));
      gl.bindAttribLocation(program, 0, 'p');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(program)}`);
      const uniforms = {};
      for (const key of ['uRes', 'uMouse', 'uT', 'uClock', 'uBass', 'uBeat', 'uBright', 'uRipAmt', 'uA', 'uB', 'uC']) uniforms[key] = gl.getUniformLocation(program, key);
      uniforms.uRip = gl.getUniformLocation(program, 'uRip');
      return { program, uniforms };
    }

    resize() {
      const ratio = Math.min(this.maxRatio, window.devicePixelRatio * this.quality.scale) * this.memoryScale;
      this.canvas.width = Math.max(2, Math.round(window.innerWidth * ratio));
      this.canvas.height = Math.max(2, Math.round(window.innerHeight * ratio));
      this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    setQuality(name) {
      this.quality = QUALITY[name] || QUALITY.medium;
      this.resize();
    }

    // Called when Solam goes over its memory budget.
    lighten() {
      this.memoryScale = Math.max(0.5, this.memoryScale * 0.85);
      this.resize();
    }

    setAlbumColors(colors) {
      this.targetColors = colors;
    }

    pointer(x, y) {
      this.mouse = [x / window.innerWidth, 1 - y / window.innerHeight];
    }

    ripple(x, y, strength) {
      this.ripples[this.rippleIndex] = [x / window.innerWidth, 1 - y / window.innerHeight, this.clock, strength];
      this.rippleIndex = (this.rippleIndex + 1) % this.ripples.length;
    }

    frame(now) {
      requestAnimationFrame((next) => this.frame(next));
      const frameMs = Math.max(this.quality.frameMs, this.minFrameMs);
      if (frameMs && now - this.lastDraw < frameMs - 1) return;
      const delta = Math.min(0.1, (now - (this.lastFrame || now)) / 1000);
      this.lastFrame = now;
      this.lastDraw = now;
      this.clock += delta;
      this.sceneTime += delta * this.speed;
      for (let i = 0; i < 3; i++) {
        for (let c = 0; c < 3; c++) this.colors[i][c] += (this.targetColors[i][c] - this.colors[i][c]) * Math.min(1, delta * 1.5);
      }
      this.draw();
    }

    draw() {
      const { gl } = this;
      if (!this.programs[this.theme]) {
        try {
          this.programs[this.theme] = this.compile(this.theme);
        } catch (error) {
          console.error('Theme failed to compile', error);
          this.theme = 'album';
          return;
        }
      }
      const { program, uniforms: u } = this.programs[this.theme];
      gl.useProgram(program);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
      gl.uniform1f(u.uT, this.sceneTime);
      gl.uniform1f(u.uClock, this.clock);
      gl.uniform1f(u.uBass, this.level.bass);
      gl.uniform1f(u.uBeat, this.level.beat);
      gl.uniform1f(u.uBright, this.brightness);
      gl.uniform1f(u.uRipAmt, this.rippleAmount);
      gl.uniform4fv(u.uRip, this.ripples.flat());
      gl.uniform3fv(u.uA, this.colors[0]);
      gl.uniform3fv(u.uB, this.colors[1]);
      gl.uniform3fv(u.uC, this.colors[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  window.ThemeEngine = ThemeEngine;
})();
