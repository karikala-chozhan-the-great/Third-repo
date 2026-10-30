// Core drawing toolkit: math, easing, stickman rig, props, effects, captions.
// Everything is a pure function of time so frames can be rendered in any order.
(function (G) {
  const W = 1080, H = 1920, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (x, a, b, c, d, e) => { const t = clamp((x - a) / (b - a)); return lerp(c, d, e ? e(t) : t); };
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const easeOutBack = (t, s = 1.9) => { const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  const easeOutElastic = t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 9 - 0.75) * (TAU / 3)) + 1);
  const seg = (t, a, b, e = easeInOut) => e(clamp((t - a) / (b - a)));
  const pulse = (t, a, b) => { const x = clamp((t - a) / (b - a)); return Math.sin(x * Math.PI); };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // keyframes: [[t, v], ...] where v is a number or an object of numbers
  function kf(keys, t, ease = easeInOut) {
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
      if (t >= t0 && t <= t1) {
        const u = ease((t - t0) / (t1 - t0));
        if (typeof v0 === 'number') return lerp(v0, v1, u);
        const o = {}; for (const k in v1) o[k] = lerp(v0[k] === undefined ? v1[k] : v0[k], v1[k], u); return o;
      }
    }
  }

  // ---------- colours ----------
  const C = {
    ink: '#f4f6ff', ink2: '#c9d0f2', navy: '#0a0d2b', face: '#14153a',
    cyan: '#4fd8ff', violet: '#9a7bff', pink: '#ff6fb1', yellow: '#ffd84d', orange: '#ff9a3c',
    red: '#ff5470', green: '#4ee0a0', blue: '#4d8dff', gray: '#aab2d6',
  };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  // ---------- background ----------
  const starRng = rng(7);
  const STARS = Array.from({ length: 150 }, () => ({ x: starRng() * W, y: starRng() * H, r: 0.8 + starRng() * 2.2, p: starRng() * TAU, s: 0.4 + starRng() * 1.6, big: starRng() < 0.07 }));
  function drawBackground(ctx, t, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, o.top || '#060820'); g.addColorStop(0.55, o.mid || '#14103f'); g.addColorStop(1, o.bot || '#241a5e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 760, 50, W / 2, 760, 900);
    glow.addColorStop(0, rgba(o.glow || '#6a4cff', 0.28)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    for (const s of STARS) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      const y = (s.y + t * 6 * s.r) % H;
      ctx.globalAlpha = tw * (o.starAlpha === undefined ? 0.9 : o.starAlpha);
      ctx.fillStyle = '#fff';
      if (s.big) {
        ctx.save(); ctx.translate(s.x, y); ctx.beginPath();
        const r = s.r * 4.2;
        ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r); ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill(); ctx.restore();
      } else { ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- text helpers ----------
  function text(ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 800} ${o.size || 48}px Inter`;
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    ctx.letterSpacing = (o.spacing || 0) + 'px';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur || 30; }
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || 10; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); ctx.shadowBlur = 0; }
    ctx.fillStyle = o.fill || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // pill chip with text, anchored at (cx, cy)
  function chip(ctx, str, cx, cy, o = {}) {
    const size = o.size || 34, padX = o.padX || 30, h = size * 1.9;
    ctx.save();
    ctx.font = `${o.weight || 800} ${size}px Inter`; ctx.letterSpacing = (o.spacing === undefined ? 3 : o.spacing) + 'px';
    const w = ctx.measureText(str).width + padX * 2;
    const k = o.scale === undefined ? 1 : o.scale;
    ctx.translate(cx, cy); ctx.scale(k, k); ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 28; }
    roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,0.10)'; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 2.5; ctx.strokeStyle = o.border || 'rgba(255,255,255,0.28)'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.fill || '#fff';
    ctx.fillText(str, 0, 2);
    ctx.restore();
    return w * k;
  }
  function chapter(ctx, num, label, t, color = C.cyan) {
    const k = seg(t, 0.05, 0.55, easeOutBack);
    if (k <= 0) return;
    chip(ctx, `${num}  ·  ${label}`, W / 2, 330 + (1 - k) * -30, { size: 30, spacing: 5, fill: color, border: rgba(color, 0.55), bg: rgba(color, 0.12), scale: k, alpha: clamp(k) });
  }

  // ---------- primitives ----------
  function glowLine(ctx, pts, color, w, glow = 0.35) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba(color, glow); ctx.lineWidth = w + 12;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color = C.yellow, w = 10, p = 1, head) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 2 || p <= 0) return;
    const a = Math.atan2(dy, dx), hl = head || Math.max(22, w * 2.6);
    const ex = x1 + dx * p, ey = y1 + dy * p, bl = Math.max(0, L * p - hl * 0.7);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 22;
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + Math.cos(a) * bl, y1 + Math.sin(a) * bl); ctx.stroke();
    if (L * p > hl * 0.9) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(a - 0.45) * hl, ey - Math.sin(a - 0.45) * hl);
      ctx.lineTo(ex - Math.cos(a + 0.45) * hl, ey - Math.sin(a + 0.45) * hl);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function ball(ctx, x, y, r, color, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.sx || 1, o.sy || 1);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur || 40; }
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, o.light || '#fff8'); g.addColorStop(0.18, color); g.addColorStop(1, o.dark || 'rgba(10,10,40,0.55)');
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    if (o.stripe) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(0, 0, r * 0.98, -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.98, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke(); }
    ctx.restore();
  }
  function groundShadow(ctx, x, y, w, a = 0.35) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
    g.addColorStop(0, `rgba(0,0,10,${a})`); g.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore();
  }
  function star(ctx, x, y, r, color = C.yellow, rot = 0, pts = 5) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) { const rr = i % 2 ? r * 0.45 : r; const a = (i * Math.PI) / pts - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // radial burst of particles from (x,y) starting at t0
  function burst(ctx, x, y, t, t0, o = {}) {
    const u = (t - t0) / (o.dur || 0.7); if (u < 0 || u > 1) return;
    const n = o.n || 14, R = rng(o.seed || 3);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + R() * 0.5, sp = (o.speed || 220) * (0.5 + R()), gr = o.gravity || 0;
      const px = x + Math.cos(a) * sp * easeOut(u), py = y + Math.sin(a) * sp * easeOut(u) + gr * u * u;
      ctx.globalAlpha = (1 - u) * (o.alpha || 1);
      const col = o.colors ? o.colors[i % o.colors.length] : C.yellow;
      if (o.shape === 'circle') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, (o.size || 8) * (1 - u * 0.6), 0, TAU); ctx.fill(); }
      else star(ctx, px, py, (o.size || 14) * (1 - u * 0.5), col, u * 4 + i);
    }
    ctx.restore();
  }
  // soft dust cloud
  function puff(ctx, x, y, t, t0, o = {}) {
    const u = (t - t0) / (o.dur || 0.8); if (u < 0 || u > 1) return;
    const n = o.n || 7, R = rng(o.seed || 11);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const side = i / (n - 1) * 2 - 1, sp = (o.spread || 90) * (0.6 + R() * 0.6);
      const px = x + side * sp * easeOut(u), py = y - (o.rise || 28) * easeOut(u) * (0.4 + R() * 0.8) + (o.gravity || 0) * u * u;
      const r = (o.size || 24) * (0.6 + R() * 0.6) * (0.5 + u);
      ctx.globalAlpha = (1 - u) * 0.55 * (o.alpha || 1);
      ctx.fillStyle = o.color || '#cfd5ff'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // bouncing y: drop from y0 to ground with restitution e; returns {y, sy (squash), hits:[times]}
  function bounce(t, y0, ground, g, e, maxB = 3) {
    if (t <= 0) return { y: y0, sy: 1, vy: 0, hits: [] };
    const h = ground - y0; let tt = t, v = 0, hits = [], tFall = Math.sqrt((2 * h) / g), acc = tFall;
    if (t < tFall) return { y: y0 + 0.5 * g * t * t, sy: 1, vy: g * t, hits: [] };
    hits.push(tFall); v = g * tFall * e; let y = ground;
    for (let b = 0; b < maxB; b++) {
      const air = (2 * v) / g;
      if (t < acc + air) { const s = t - acc; return { y: ground - (v * s - 0.5 * g * s * s), sy: 1, vy: -(v - g * s), hits }; }
      acc += air; hits.push(acc); v *= e;
    }
    return { y: ground, sy: 1, vy: 0, hits };
  }
  function bounceHits(y0, ground, g, e, maxB = 3) { const out = []; let acc = Math.sqrt((2 * (ground - y0)) / g), v = g * acc * e; out.push(acc); for (let b = 0; b < maxB; b++) { acc += (2 * v) / g; out.push(acc); v *= e; } return out; }

  // ---------- planets & props ----------
  function earth(ctx, x, y, r, t = 0, o = {}) {
    ctx.save(); ctx.translate(x, y);
    // atmosphere
    const at = ctx.createRadialGradient(0, 0, r * 0.96, 0, 0, r * 1.16);
    at.addColorStop(0, 'rgba(110,190,255,0.55)'); at.addColorStop(1, 'rgba(110,190,255,0)');
    ctx.fillStyle = at; ctx.beginPath(); ctx.arc(0, 0, r * 1.16, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    const oc = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    oc.addColorStop(0, '#4aa8ff'); oc.addColorStop(0.55, '#1f67d8'); oc.addColorStop(1, '#0b2a7a');
    ctx.fillStyle = oc; ctx.fillRect(-r, -r, r * 2, r * 2);
    // continents (two wrapped copies slide slowly)
    const shift = ((t * (o.spin === undefined ? 12 : o.spin)) % (r * 2.6));
    for (const off of [-r * 2.6, 0, r * 2.6]) {
      ctx.save(); ctx.translate(off + shift, 0); ctx.fillStyle = '#3fcf86';
      const s = r / 100;
      const blob = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * s, p[1] * s) : ctx.moveTo(p[0] * s, p[1] * s))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3fcf86'; ctx.lineJoin = 'round'; ctx.lineWidth = 16 * s; ctx.stroke(); };
      blob([[-70, -50], [-40, -62], [-12, -48], [-20, -20], [-45, -4], [-62, -18]]);
      blob([[-30, 4], [0, 0], [14, 28], [4, 68], [-14, 78], [-26, 40]]);
      blob([[40, -52], [80, -46], [92, -12], [64, 8], [42, -6], [30, -28]]);
      blob([[56, 36], [84, 30], [92, 56], [66, 64]]);
      ctx.restore();
    }
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 83 + t * 18) % (r * 2.4)) - r * 1.2, cy = (i * 47 % 140 - 70) * (r / 100);
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.28, r * 0.06, 0, 0, TAU); ctx.fill();
    }
    // terminator shade
    const sh = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.4, 0, 0, r * 1.15);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(5,5,40,0.62)');
    ctx.fillStyle = sh; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore(); ctx.restore();
  }
  function moon(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.translate(x, y);
    if (o.glow) { ctx.shadowColor = 'rgba(220,225,255,.6)'; ctx.shadowBlur = o.glow; }
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#f1f1f7'); g.addColorStop(0.6, '#b9bccc'); g.addColorStop(1, '#6d7088');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(80,84,110,0.35)';
    [[-0.3, -0.2, 0.2], [0.35, 0.1, 0.15], [0, 0.45, 0.12], [-0.1, -0.55, 0.1], [0.5, -0.4, 0.09]].forEach(([cx, cy, cr]) => { ctx.beginPath(); ctx.arc(cx * r, cy * r, cr * r, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function apple(ctx, x, y, r = 30, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, '#ff8a8a'); g.addColorStop(0.35, '#ff3d4f'); g.addColorStop(1, '#b3122c');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 1.15, -r * 0.4, r * 0.95, r * 0.25);
    ctx.bezierCurveTo(r * 0.8, r * 0.9, r * 0.3, r * 1.05, 0, r * 0.88);
    ctx.bezierCurveTo(-r * 0.3, r * 1.05, -r * 0.8, r * 0.9, -r * 0.95, r * 0.25);
    ctx.bezierCurveTo(-r * 1.15, -r * 0.4, -r * 0.5, -r * 1.05, 0, -r * 0.55); ctx.fill();
    ctx.strokeStyle = '#6b3a1d'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.quadraticCurveTo(r * 0.05, -r * 0.9, r * 0.22, -r * 1.1); ctx.stroke();
    ctx.fillStyle = '#4ee0a0'; ctx.beginPath(); ctx.ellipse(r * 0.42, -r * 0.88, r * 0.34, r * 0.16, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function lightbulb(ctx, x, y, s, glowA = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 110); gl.addColorStop(0, `rgba(255,230,120,${0.7 * glowA})`); gl.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, -4, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9ccdf'; roundRect(ctx, -14, 22, 28, 20, 5); ctx.fill();
    ctx.strokeStyle = '#fff8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-4, -8, 17, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  }
  function questionMark(ctx, x, y, s, rot, color = C.yellow, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; text(ctx, '?', 0, 0, { size: s, weight: 900, fill: color, glow: color, glowBlur: 24 }); ctx.restore();
  }
  function hammer(ctx, x, y, rot, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#b0793f'; roundRect(ctx, -9, -10, 18, 120, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(ctx, 2, -10, 7, 120, 4); ctx.fill();
    const g = ctx.createLinearGradient(0, -52, 0, -6); g.addColorStop(0, '#e9edf7'); g.addColorStop(0.5, '#9aa3bd'); g.addColorStop(1, '#5d6684');
    ctx.fillStyle = g; roundRect(ctx, -46, -52, 92, 44, 10); ctx.fill();
    ctx.restore();
  }
  function feather(ctx, x, y, rot, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const g = ctx.createLinearGradient(0, -70, 0, 70); g.addColorStop(0, '#fff'); g.addColorStop(1, '#ffb8e1');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -78);
    ctx.bezierCurveTo(46, -50, 40, 28, 4, 62); ctx.bezierCurveTo(-6, 40, -36, 20, -34, -20); ctx.bezierCurveTo(-30, -50, -12, -66, 0, -78); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(2, -74); ctx.quadraticCurveTo(-2, 0, 0, 96); ctx.stroke();
    ctx.strokeStyle = 'rgba(170,110,200,.35)'; ctx.lineWidth = 2;
    for (let i = -5; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * 12); ctx.lineTo(i < 0 ? -26 + Math.abs(i) * 2 : 28 - i * 3, i * 12 - 14); ctx.stroke(); }
    ctx.restore();
  }
  function tree(ctx, x, ground, s = 1, sway = 0) {
    ctx.save(); ctx.translate(x, ground); ctx.scale(s, s);
    const tg = ctx.createLinearGradient(-30, 0, 30, 0); tg.addColorStop(0, '#6b4021'); tg.addColorStop(1, '#4a2a14');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-20, -200, -26, -380); ctx.lineTo(26, -380); ctx.quadraticCurveTo(22, -200, 38, 0); ctx.closePath(); ctx.fill();
    ctx.translate(sway, 0);
    const blobs = [[0, -520, 150], [-120, -450, 105], [120, -450, 108], [-60, -600, 100], [75, -590, 100], [0, -420, 110]];
    ctx.fillStyle = '#2a8650'; blobs.forEach(([bx, by, br]) => { ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#3db874'; blobs.forEach(([bx, by, br]) => { ctx.beginPath(); ctx.arc(bx - 14, by - 16, br * 0.82, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#58d68d'; blobs.slice(0, 5).forEach(([bx, by, br]) => { ctx.beginPath(); ctx.arc(bx - 30, by - 36, br * 0.45, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function slab(ctx, x0, x1, y, depth = 60, color = '#2b2f72', top = '#5b62c9') {
    ctx.save(); const g = ctx.createLinearGradient(0, y, 0, y + depth); g.addColorStop(0, color); g.addColorStop(1, 'rgba(20,20,70,0.2)');
    ctx.fillStyle = g; ctx.fillRect(x0, y, x1 - x0, depth);
    ctx.fillStyle = top; ctx.fillRect(x0, y, x1 - x0, 7); ctx.restore();
  }

  // ---------- stickman rig ----------
  const B = { head: 50, torso: 124, neck: 6, arm1: 64, arm2: 60, leg1: 80, leg2: 78, lw: 15 };
  const IDLE = { lean: 0, head: 0, A1: 0.16, A2: 0.1, B1: 0.16, B2: 0.1, L1: 0.12, L2: -0.05, R1: 0.12, R2: -0.05 };
  // A = arm on viewer's left, B = arm on viewer's right, L/R legs. angles: 0=down, +=outward, PI=up.
  const dir = a => [Math.sin(a), Math.cos(a)];
  function skeleton(pose) {
    const P = Object.assign({}, IDLE, pose);
    const hip = [0, 0], up = [Math.sin(P.lean), -Math.cos(P.lean)];
    const neck = [up[0] * B.torso, up[1] * B.torso];
    const hd = P.lean + P.head, hr = B.head + B.neck;
    const headC = [neck[0] + Math.sin(hd) * hr, neck[1] - Math.cos(hd) * hr];
    const sh = [up[0] * B.torso * 0.92, up[1] * B.torso * 0.92];
    const limb = (o, sg, a1, a2, l1, l2, sgn) => { const A = sg * a1, e = [o[0] + Math.sin(A) * l1, o[1] + Math.cos(A) * l1], b = A + sg * a2; return { o, e, h: [e[0] + Math.sin(b) * l2, e[1] + Math.cos(b) * l2], ang: b }; };
    return {
      P, hip, neck, headC, hd, sh,
      A: limb(sh, -1, P.A1, P.A2, B.arm1, B.arm2), Bm: limb(sh, 1, P.B1, P.B2, B.arm1, B.arm2),
      L: limb(hip, -1, P.L1, P.L2, B.leg1, B.leg2), R: limb(hip, 1, P.R1, P.R2, B.leg1, B.leg2),
    };
  }
  function blink(t, off = 0) { const p = (t + off) % 3.4; return p > 3.28 ? Math.abs(Math.sin(((p - 3.28) / 0.12) * Math.PI)) : 0; }

  function drawFace(ctx, f, t) {
    const look = f.look || [0, 0], bl = blink(t, f.blinkOff || 0), br = f.brow || 0, rs = f.raise || 0;
    ctx.save(); ctx.fillStyle = C.face; ctx.strokeStyle = C.face; ctx.lineCap = 'round';
    // cheeks
    ctx.fillStyle = 'rgba(255,111,177,0.28)';
    ctx.beginPath(); ctx.ellipse(-27, 9, 8, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(27, 9, 8, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.face;
    // eyes
    const wide = f.wide || 0, er = 5.6 + wide * 2.4;
    for (const sx of [-1, 1]) {
      const ex = sx * 15 + look[0] * 1.2, ey = -3 + look[1] * 1.2 - wide * 1.5;
      if (f.eyes === 'happy') { ctx.lineWidth = 4.4; ctx.beginPath(); ctx.arc(ex, ey + 4, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else if (f.eyes === 'x') { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 6, ey - 6); ctx.lineTo(ex + 6, ey + 6); ctx.moveTo(ex + 6, ey - 6); ctx.lineTo(ex - 6, ey + 6); ctx.stroke(); }
      else { ctx.save(); ctx.translate(ex, ey); ctx.scale(1, Math.max(0.1, 1 - bl * 0.92)); ctx.beginPath(); ctx.arc(0, 0, er, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1.8, -2, 1.9, 0, TAU); ctx.fill(); ctx.restore(); }
      // brows: br>0 worried (inner ends up), br<0 angry (inner ends down)
      const by = ey - 14 - rs * 6, inner = -br * 4.5;
      ctx.lineWidth = 3.8; ctx.beginPath();
      ctx.moveTo(ex - 8, by + (sx > 0 ? inner : 0)); ctx.lineTo(ex + 8, by + (sx > 0 ? 0 : inner));
      ctx.stroke();
    }
    // mouth
    const talk = f.talk || 0, m = f.mouth || 'smile';
    ctx.lineWidth = 4.4; ctx.fillStyle = C.face;
    if (talk > 0.06) {
      const w = 11 + talk * 5, h = 3 + talk * 13;
      ctx.beginPath(); ctx.ellipse(0, 17 + h * 0.15, w, h, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7a9c'; ctx.beginPath(); ctx.ellipse(0, 17 + h, w * 0.7, h * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore();
    } else if (m === 'smile') { ctx.beginPath(); ctx.arc(0, 11, 12, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); }
    else if (m === 'grin') { ctx.beginPath(); ctx.moveTo(-14, 12); ctx.quadraticCurveTo(0, 36, 14, 12); ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-14, 11, 28, 6); ctx.restore(); }
    else if (m === 'o') { ctx.beginPath(); ctx.ellipse(0, 20, 7, 9, 0, 0, TAU); ctx.fill(); }
    else if (m === 'flat') { ctx.beginPath(); ctx.moveTo(-9, 20); ctx.lineTo(9, 20); ctx.stroke(); }
    else if (m === 'sad') { ctx.beginPath(); ctx.arc(0, 30, 11, 1.25 * Math.PI, 1.75 * Math.PI); ctx.stroke(); }
    else if (m === 'wobble') { ctx.beginPath(); ctx.moveTo(-12, 20); ctx.quadraticCurveTo(-6, 14, 0, 20); ctx.quadraticCurveTo(6, 26, 12, 20); ctx.stroke(); }
    ctx.restore();
  }

  function drawHatBack(ctx, hat) {
    if (hat === 'wig') {
      ctx.fillStyle = '#e8e6f4'; ctx.strokeStyle = '#b9b5d6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, -6, 62, 64, 0, 0, TAU); ctx.fill(); ctx.stroke();
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(sx * 50, 42, 24, 44, sx * 0.12, 0, TAU); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sx * (46 + (i % 2) * 6), 24 + i * 22, 11, 0, TAU); ctx.stroke(); }
      }
    } else if (hat === 'einstein') {
      ctx.strokeStyle = '#f1f1f5'; ctx.lineCap = 'round';
      const R = rng(21);
      for (let i = 0; i < 17; i++) {
        const a = Math.PI * (1.02 + (i / 16) * 0.96) + (R() - 0.5) * 0.1, l = 26 + R() * 30, wob = (R() - 0.5) * 0.5;
        ctx.lineWidth = 9 + R() * 4; ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 36, Math.sin(a) * 36);
        ctx.quadraticCurveTo(Math.cos(a + wob) * (36 + l * 0.6), Math.sin(a + wob) * (36 + l * 0.6), Math.cos(a + wob * 1.8) * (36 + l), Math.sin(a + wob * 1.8) * (36 + l)); ctx.stroke();
      }
      ctx.fillStyle = '#f1f1f5'; ctx.beginPath(); ctx.ellipse(-46, 6, 13, 24, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(46, 6, 13, 24, -0.2, 0, TAU); ctx.fill();
    }
  }
  function drawHatFront(ctx, hat, f) {
    if (hat === 'wig') {
      ctx.fillStyle = '#e8e6f4'; ctx.strokeStyle = '#b9b5d6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-46, -8); ctx.bezierCurveTo(-48, -62, 48, -62, 46, -8);
      ctx.bezierCurveTo(34, -30, 12, -28, 0, -22); ctx.bezierCurveTo(-12, -28, -34, -30, -46, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const [cx, cy] of [[-30, -34], [-8, -44], [14, -44], [34, -32]]) { ctx.beginPath(); ctx.arc(cx, cy, 9, 0.2, Math.PI * 1.7); ctx.stroke(); }
    } else if (hat === 'einstein') {
      ctx.fillStyle = '#f1f1f5'; ctx.beginPath(); ctx.moveTo(-42, -10); ctx.bezierCurveTo(-40, -50, 40, -50, 42, -10); ctx.bezierCurveTo(26, -26, -26, -26, -42, -10); ctx.fill();
      ctx.fillStyle = '#8c8ca3';
      ctx.beginPath(); ctx.ellipse(-12, 13, 15, 7.5, 0.28, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(12, 13, 15, 7.5, -0.28, 0, TAU); ctx.fill();
    } else if (hat === 'helmet') {
      ctx.save();
      const g = ctx.createRadialGradient(-22, -26, 6, 0, 0, 70); g.addColorStop(0, 'rgba(190,225,255,0.45)'); g.addColorStop(1, 'rgba(110,160,255,0.14)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f2f5ff'; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 52, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
      ctx.restore();
    }
  }

  // main entry. o: {x, ground, lift, pose, face, s, flip, hat, suit, t, hipY?}
  function stick(ctx, o) {
    const sk = skeleton(o.pose || {}), s = o.s || 1, t = o.t || 0, suit = !!o.suit;
    const lw = suit ? 20 : B.lw;
    const ankle = Math.max(sk.L.h[1], sk.R.h[1]);
    const hipY = o.hipY !== undefined ? o.hipY : o.ground - (ankle + lw * 0.5) * s - (o.lift || 0);
    ctx.save(); ctx.translate(o.x, hipY); ctx.scale(s * (o.flip ? -1 : 1), s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const col = o.color || C.ink, far = suit ? '#c3cae3' : C.ink2;
    const poly = (pts, c, w, rim) => {
      if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = w + 9; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    };
    const rim = suit ? 'rgba(80,95,170,0.85)' : 'rgba(120,150,255,0.22)';
    const footOf = (L, sg) => [L.h[0] + sg * 22, L.h[1]];
    ctx.save(); ctx.shadowColor = suit ? 'transparent' : 'rgba(140,160,255,0.35)'; ctx.shadowBlur = 14;
    if (suit) { ctx.fillStyle = '#d6dbef'; roundRect(ctx, sk.sh[0] - 36, sk.sh[1] - 4, 72, 84, 14); ctx.fill(); ctx.fillStyle = '#9aa3c9'; roundRect(ctx, sk.sh[0] - 28, sk.sh[1] + 6, 56, 18, 8); ctx.fill(); }
    if (o.hat === 'wig' || o.hat === 'einstein' || suit) { /* back layer drawn with head below */ }
    // far limbs first
    poly([sk.A.o, sk.A.e, sk.A.h], far, lw, rim);
    poly([sk.L.o, sk.L.e, sk.L.h, footOf(sk.L, -1)], far, lw, rim);
    // torso
    poly([sk.hip, sk.neck], col, lw + 1, rim);
    if (suit) { poly([sk.hip, [sk.sh[0], sk.sh[1] + 20]], '#e9edf7', lw + 10, rim); }
    poly([sk.R.o, sk.R.e, sk.R.h, footOf(sk.R, 1)], col, lw, rim);
    ctx.restore();
    // hands (small circles)
    ctx.fillStyle = suit ? '#fff' : col;
    for (const h of [sk.A.h, sk.Bm.h]) { ctx.beginPath(); ctx.arc(h[0], h[1], lw * 0.62, 0, TAU); ctx.fill(); }
    // head
    ctx.save(); ctx.translate(sk.headC[0], sk.headC[1]); ctx.rotate(sk.hd);
    drawHatBack(ctx, o.hat);
    const hg = ctx.createRadialGradient(-14, -16, 4, 0, 0, B.head + 4);
    hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#dfe4ff');
    ctx.fillStyle = hg; ctx.shadowColor = 'rgba(140,160,255,0.45)'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, 0, B.head, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    drawFace(ctx, Object.assign({ mouth: 'smile' }, o.face || {}), t);
    drawHatFront(ctx, o.hat);
    ctx.restore();
    // near arm over everything
    poly([sk.Bm.o, sk.Bm.e, sk.Bm.h], col, lw, rim);
    ctx.fillStyle = suit ? '#fff' : col; ctx.beginPath(); ctx.arc(sk.Bm.h[0], sk.Bm.h[1], lw * 0.62, 0, TAU); ctx.fill();
    ctx.restore();
    // world-space joints for props
    const fl = o.flip ? -1 : 1, wp = p => [o.x + p[0] * s * fl, hipY + p[1] * s];
    return { hipY, hand: { A: wp(sk.A.h), B: wp(sk.Bm.h) }, head: wp(sk.headC), neck: wp(sk.neck), hip: wp(sk.hip), foot: { L: wp(sk.L.h), R: wp(sk.R.h) }, topY: wp(sk.headC)[1] - B.head * s };
  }

  // world-space joints for a stick() call, without drawing (used to attach props before release)
  function joints(o) {
    const sk = skeleton(o.pose || {}), s = o.s || 1, lw = o.suit ? 20 : B.lw;
    const ankle = Math.max(sk.L.h[1], sk.R.h[1]);
    const hipY = o.hipY !== undefined ? o.hipY : o.ground - (ankle + lw * 0.5) * s - (o.lift || 0);
    const fl = o.flip ? -1 : 1, wp = p => [o.x + p[0] * s * fl, hipY + p[1] * s];
    return { hipY, hand: { A: wp(sk.A.h), B: wp(sk.Bm.h) }, head: wp(sk.headC), neck: wp(sk.neck), foot: { L: wp(sk.L.h), R: wp(sk.R.h) } };
  }

  // idle micro-motion so the character is never frozen
  function idle(t, o = {}) {
    const k = o.k === undefined ? 1 : o.k;
    return { lean: Math.sin(t * 1.7) * 0.012 * k, head: Math.sin(t * 1.1 + 1) * 0.04 * k, A1: 0.16 + Math.sin(t * 1.9) * 0.025 * k, B1: 0.16 + Math.sin(t * 1.9 + 1.2) * 0.025 * k };
  }

  // ---------- captions ----------
  function buildCaptions(tl) {
    const groups = [];
    for (const ln of tl.lines) {
      let cur = [];
      const flush = () => { if (cur.length) { groups.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; } };
      for (const w of ln.words) {
        cur.push(w);
        const endsClause = /[,.!?;:]$/.test(w.w);
        const chars = cur.reduce((a, x) => a + x.w.length + 1, 0);
        if (endsClause || cur.length >= 3 || chars > 17) flush();
      }
      flush();
    }
    return groups;
  }
  function drawCaptions(ctx, groups, t, y = 1450) {
    let gi = -1;
    for (let i = 0; i < groups.length; i++) { if (t >= groups[i].s - 0.03 && (i === groups.length - 1 || t < groups[i + 1].s - 0.03)) { gi = i; break; } }
    if (gi < 0) return;
    const g = groups[gi];
    if (t > g.e + 0.45) return;
    const age = t - g.s + 0.03, pop = easeOutBack(clamp(age / 0.16), 2.2);
    const words = g.words.map(w => w.w.replace(/[.,!?;:]+$/, '').toUpperCase());
    ctx.save();
    let size = 82; ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '1px';
    const sp = 32; let widths = words.map(w => ctx.measureText(w).width);
    let total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    if (total > 900) { size = Math.floor(size * 900 / total); ctx.font = `900 ${size}px Inter`; widths = words.map(w => ctx.measureText(w).width); total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1); }
    ctx.translate(W / 2, y); ctx.scale(0.86 + 0.14 * pop, 0.86 + 0.14 * pop); ctx.globalAlpha = clamp(age / 0.08);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    let x = -total / 2;
    g.words.forEach((w, i) => {
      const active = t >= w.s && t < w.e + 0.02 ;
      const done = t >= w.e;
      const hl = active ? 1 : 0;
      ctx.save();
      const cxw = x + widths[i] / 2; ctx.translate(cxw, 0); const sc = 1 + 0.05 * hl; ctx.scale(sc, sc); ctx.translate(-cxw, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#0a0b26'; ctx.strokeText(words[i], x, 0);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = active ? C.yellow : '#ffffff';
      if (active) { ctx.shadowColor = 'rgba(255,216,77,0.65)'; ctx.shadowBlur = 26; }
      ctx.fillText(words[i], x, 0);
      ctx.restore();
      x += widths[i] + sp;
    });
    ctx.restore();
  }

  Object.assign(G, { W, H, TAU, clamp, lerp, map, easeInOut, easeOut, easeIn, easeOutBack, easeOutElastic, seg, pulse, rng, kf, C, rgba,
    drawBackground, text, roundRect, chip, chapter, glowLine, arrow, ball, groundShadow, star, burst, puff, bounce, bounceHits,
    earth, moon, apple, lightbulb, questionMark, hammer, feather, tree, slab, stick, joints, idle, skeleton, B, buildCaptions, drawCaptions, dir });
})(window.GR = window.GR || {});
