// Light "clean comedy" toolkit: ink stickman, speech bubbles, comic SFX text, props, captions.
(function (G) {
  const { W, H, TAU, clamp, lerp, seg, easeOut, easeInOut, easeOutBack, easeOutElastic, rng, roundRect, skeleton, B } = G;
  const L = {
    ink: '#1b1c2e', white: '#ffffff', bg0: '#FFFAEC', bg1: '#FFEBC6', coral: '#FF5A5F', sun: '#FFC93C', teal: '#14B8A6', blue: '#3B82F6',
    purple: '#8B5CF6', green: '#22C55E', pink: '#FF7AB6', ground: '#EFD9A8', groundDark: '#D9BE84', moon: '#D9D5EA', moonDark: '#B9B3D3', sky: '#BFE3FF',
  };
  G.L = L;
  const BASE = { lean: 0, head: 0, A1: 0.16, A2: 0.1, B1: 0.16, B2: 0.1, L1: 0.12, L2: -0.05, R1: 0.12, R2: -0.05 };
  const P = o => Object.assign({}, BASE, o);
  const wob = (t, k = 1) => ({ lean: Math.sin(t * 1.7) * 0.012 * k, head: Math.sin(t * 1.1 + 1) * 0.04 * k });
  const lookAt = (from, to, k = 4) => { const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy) || 1; return [dx / d * k, dy / d * k]; };
  const walk = (ph, k = 1) => ({ R1: 0.5 * Math.sin(ph) * k, L1: 0.5 * Math.sin(ph) * k, R2: -0.7 * Math.max(0, -Math.sin(ph)) * k, L2: -0.7 * Math.max(0, Math.sin(ph)) * k, B1: -0.45 * Math.sin(ph) * k + 0.1, A1: 0.45 * Math.sin(ph) * k + 0.1, lean: 0.04 });
  Object.assign(G, { BASE, P, wob, lookAt, walk });

  // ---------- background ----------
  function drawBackground2(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.bg0); g.addColorStop(1, L.bg1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W / 2, 800, 100, W / 2, 800, 1000); r.addColorStop(0, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  function ground2(ctx, y, o = {}) {
    const x0 = o.x0 === undefined ? -30 : o.x0, x1 = o.x1 === undefined ? W + 30 : o.x1;
    ctx.save(); ctx.fillStyle = o.color || L.ground; ctx.fillRect(x0, y, x1 - x0, o.depth || 80);
    ctx.fillStyle = o.dark || L.groundDark; ctx.fillRect(x0, y + 8, x1 - x0, 8);
    ctx.strokeStyle = L.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
  }
  function shadow2(ctx, x, y, w, a = 0.16) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); ctx.fillStyle = `rgba(27,28,46,${a})`; ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore(); }

  // ---------- text-ish ----------
  function inkText(ctx, str, x, y, o = {}) {
    ctx.save(); ctx.font = `${o.weight || 800} ${o.size || 40}px Inter`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = (o.spacing || 0) + 'px';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = o.fill || L.ink; ctx.fillText(str, x, y); ctx.restore();
  }
  function comic(ctx, str, x, y, o = {}) {
    const k = o.k === undefined ? 1 : o.k; if (k <= 0.01) return;
    const size = o.size || 110, sh = o.shake ? [Math.sin(o.t * 80) * o.shake, Math.cos(o.t * 70) * o.shake] : [0, 0];
    ctx.save(); ctx.translate(x + sh[0], y + sh[1]); ctx.rotate(o.rot === undefined ? -0.08 : o.rot); ctx.scale(k, k); ctx.globalAlpha *= clamp(k * 2);
    ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.letterSpacing = '2px';
    ctx.fillStyle = 'rgba(27,28,46,0.22)'; ctx.fillText(str, 6, 9);
    ctx.lineWidth = size * 0.2; ctx.strokeStyle = L.ink; ctx.strokeText(str, 0, 0);
    ctx.lineWidth = size * 0.07; ctx.strokeStyle = '#fff'; ctx.strokeText(str, 0, 0);
    ctx.fillStyle = o.fill || L.coral; ctx.fillText(str, 0, 0); ctx.restore();
  }
  function tag(ctx, str, x, y, o = {}) {
    const k = o.k === undefined ? 1 : o.k; if (k <= 0.01) return 0;
    const size = o.size || 30, pad = o.pad || 26, h = size * 1.85;
    ctx.save(); ctx.font = `800 ${size}px Inter`; ctx.letterSpacing = (o.spacing === undefined ? 1.5 : o.spacing) + 'px';
    const w = ctx.measureText(str).width + pad * 2;
    ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(k, k); ctx.globalAlpha *= clamp(k * 2);
    ctx.fillStyle = 'rgba(27,28,46,0.18)'; roundRect(ctx, -w / 2 + 4, -h / 2 + 6, w, h, 14); ctx.fill();
    roundRect(ctx, -w / 2, -h / 2, w, h, 14); ctx.fillStyle = o.bg || '#fff'; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = L.ink; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.fill || L.ink; ctx.fillText(str, 0, 2); ctx.restore();
    return w;
  }
  function speech(ctx, str, x, y, o = {}) {
    const k = o.k === undefined ? 1 : o.k; if (k <= 0.01) return;
    const size = o.size || 38, lines = str.split('\n'), lh = size * 1.2;
    ctx.save(); ctx.font = `800 ${size}px Inter`; const tw = Math.max(...lines.map(l => ctx.measureText(l).width)), w = tw + 56, h = lines.length * lh + 36;
    const tail = o.tail || [x, y + h / 2 + 70];
    ctx.translate(tail[0], tail[1]); ctx.scale(k, k); ctx.translate(-tail[0], -tail[1]); ctx.globalAlpha *= clamp(k * 2);
    const bx = x - w / 2, by = y - h / 2;
    ctx.lineWidth = 5; ctx.strokeStyle = L.ink; ctx.lineJoin = 'round'; ctx.fillStyle = '#fff';
    ctx.beginPath(); roundRect(ctx, bx, by, w, h, 26); ctx.fill(); ctx.stroke();
    // tail
    const ang = Math.atan2(tail[1] - y, tail[0] - x), bxm = clamp(tail[0], bx + 50, bx + w - 50), bym = tail[1] > y ? by + h : by;
    ctx.beginPath(); ctx.moveTo(bxm - 22, bym); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(bxm + 22, bym); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bxm - 20, bym); ctx.lineTo(bxm + 20, bym); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.fill || L.ink; ctx.letterSpacing = '0.5px';
    lines.forEach((l, i) => ctx.fillText(l, x, y - ((lines.length - 1) * lh) / 2 + i * lh + 2)); ctx.restore();
  }

  // ---------- stickman ----------
  function blink(t, off = 0) { const p = (t + off) % 3.6; return p > 3.48 ? Math.abs(Math.sin(((p - 3.48) / 0.12) * Math.PI)) : 0; }
  function face2(ctx, f, t) {
    const look = f.look || [0, 0], bl = blink(t, f.blinkOff || 0), ink = L.ink, kind = f.eyes || 'normal', br = f.brow || 0, rs = f.raise || 0;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.fillStyle = ink;
    if (f.blush) { ctx.fillStyle = `rgba(255,90,95,${0.4 * f.blush})`; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 32, 12, 10, 6.5, 0, 0, TAU); ctx.fill(); } }
    for (const sx of [-1, 1]) {
      const ex = sx * 18, ey = -5; ctx.fillStyle = ink; ctx.strokeStyle = ink;
      if (kind === 'happy') { ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, ey + 6, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else if (kind === 'closed') { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 9, ey + 2); ctx.lineTo(ex + 9, ey + 2); ctx.stroke(); }
      else if (kind === 'x') { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 8, ey - 8); ctx.lineTo(ex + 8, ey + 8); ctx.moveTo(ex + 8, ey - 8); ctx.lineTo(ex - 8, ey + 8); ctx.stroke(); }
      else if (kind === 'spiral') { ctx.lineWidth = 3.5; ctx.beginPath(); for (let a = 0; a < 12; a += 0.4) { const r = 1.2 + a * 0.85, an = a + t * 8 * (sx); a ? ctx.lineTo(ex + Math.cos(an) * r, ey + Math.sin(an) * r) : ctx.moveTo(ex + Math.cos(an) * r, ey + Math.sin(an) * r); } ctx.stroke(); }
      else {
        const wide = kind === 'wide', R = wide ? 14 : 11.5, pr = wide ? 3.6 : 5.4;
        ctx.save(); ctx.translate(ex, ey); ctx.scale(1, Math.max(0.08, 1 - bl * 0.94));
        ctx.fillStyle = '#fff'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.stroke();
        const lk = wide ? 0.4 : 1; ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(clamp(look[0] * lk, -4.5, 4.5), clamp(look[1] * lk, -4.5, 4.5), pr, 0, TAU); ctx.fill();
        ctx.restore();
        if (kind === 'half') { ctx.fillStyle = '#f1f1f6'; ctx.beginPath(); ctx.rect(ex - 14, ey - 15, 28, 14); ctx.fill(); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(ex - 13, ey - 1); ctx.lineTo(ex + 13, ey - 1); ctx.stroke(); }
      }
      // brows
      const by = ey - 19 - rs * 8, inner = -br * 6; ctx.lineWidth = 4.8; ctx.strokeStyle = ink; ctx.beginPath();
      ctx.moveTo(ex - 11, by + (sx > 0 ? inner : 0)); ctx.lineTo(ex + 11, by + (sx > 0 ? 0 : inner)); ctx.stroke();
    }
    // mouth
    const talk = f.noTalk ? 0 : f.talk || 0, m = f.mouth || 'smile'; ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.fillStyle = ink;
    const open = (rx, ry, y) => { ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, TAU); ctx.fillStyle = ink; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7a9c'; ctx.beginPath(); ctx.ellipse(0, y + ry * 0.75, rx * 0.7, ry * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); };
    if (m === 'scream') open(17, 22, 30);
    else if (talk > 0.06) open(11 + talk * 6, 3 + talk * 13, 24 + talk * 5);
    else if (m === 'smile') { ctx.beginPath(); ctx.arc(0, 14, 15, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    else if (m === 'grin') { ctx.beginPath(); ctx.moveTo(-17, 15); ctx.quadraticCurveTo(0, 44, 17, 15); ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-17, 14, 34, 7); ctx.restore(); }
    else if (m === 'smirk') { ctx.beginPath(); ctx.moveTo(-12, 26); ctx.quadraticCurveTo(4, 30, 17, 17); ctx.stroke(); }
    else if (m === 'flat') { ctx.beginPath(); ctx.moveTo(-11, 26); ctx.lineTo(11, 26); ctx.stroke(); }
    else if (m === 'frown') { ctx.beginPath(); ctx.arc(0, 38, 14, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
    else if (m === 'o') { ctx.beginPath(); ctx.ellipse(0, 26, 8, 11, 0, 0, TAU); ctx.fill(); }
    else if (m === 'wavy') { ctx.beginPath(); ctx.moveTo(-15, 26); ctx.quadraticCurveTo(-8, 18, 0, 26); ctx.quadraticCurveTo(8, 34, 15, 26); ctx.stroke(); }
    else if (m === 'teeth') { roundRect(ctx, -17, 18, 34, 17, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 35); ctx.moveTo(-8.5, 18); ctx.lineTo(-8.5, 35); ctx.moveTo(8.5, 18); ctx.lineTo(8.5, 35); ctx.stroke(); }
    if (f.sweat) { const k = f.sweat, dy = ((t * 70) % 40) * 0.5; ctx.fillStyle = '#7CC8FF'; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); const sx0 = 48, sy0 = -34 + dy * k; ctx.moveTo(sx0, sy0 - 13); ctx.quadraticCurveTo(sx0 + 12, sy0 + 3, sx0, sy0 + 10); ctx.quadraticCurveTo(sx0 - 12, sy0 + 3, sx0, sy0 - 13); ctx.fill(); ctx.stroke(); }
    if (f.tear) { ctx.fillStyle = '#7CC8FF'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 22, 12 + ((t * 90) % 30), 4, 8 * f.tear, 0, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
  function hatBack(ctx, hat) {
    if (hat === 'wig') {
      ctx.fillStyle = '#F4F1FB'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -6, 64, 66, 0, 0, TAU); ctx.fill(); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 52, 44, 25, 46, sx * 0.12, 0, TAU); ctx.fill(); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(sx * (48 + (i % 2) * 6), 26 + i * 22, 11, 0, TAU); ctx.stroke(); } ctx.lineWidth = 5; }
    } else if (hat === 'einstein') {
      const R = rng(21), spikes = [];
      for (let i = 0; i < 17; i++) { const a = Math.PI * (1.02 + (i / 16) * 0.96) + (R() - 0.5) * 0.1, l = 26 + R() * 30, wob2 = (R() - 0.5) * 0.5, w = 10 + R() * 4; spikes.push([a, l, wob2, w]); }
      ctx.lineCap = 'round';
      for (const [col, extra] of [[L.ink, 6], ['#F4F1FB', 0]]) for (const [a, l, w2, w] of spikes) { ctx.strokeStyle = col; ctx.lineWidth = w + extra; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 38, Math.sin(a) * 38); ctx.quadraticCurveTo(Math.cos(a + w2) * (38 + l * 0.6), Math.sin(a + w2) * (38 + l * 0.6), Math.cos(a + w2 * 1.8) * (38 + l), Math.sin(a + w2 * 1.8) * (38 + l)); ctx.stroke(); }
      ctx.fillStyle = '#F4F1FB'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 48, 6, 13, 24, sx * 0.2, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
  }
  function hatFront(ctx, hat) {
    if (hat === 'wig') {
      ctx.fillStyle = '#F4F1FB'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-48, -8); ctx.bezierCurveTo(-50, -66, 50, -66, 48, -8); ctx.bezierCurveTo(34, -32, 12, -30, 0, -24); ctx.bezierCurveTo(-12, -30, -34, -32, -48, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3.5; for (const [cx, cy] of [[-30, -36], [-8, -46], [14, -46], [34, -34]]) { ctx.beginPath(); ctx.arc(cx, cy, 9, 0.2, Math.PI * 1.7); ctx.stroke(); }
    } else if (hat === 'einstein') {
      ctx.fillStyle = '#F4F1FB'; ctx.strokeStyle = L.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-44, -10); ctx.bezierCurveTo(-42, -54, 42, -54, 44, -10); ctx.bezierCurveTo(28, -28, -28, -28, -44, -10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6b6b84'; ctx.strokeStyle = L.ink; ctx.lineWidth = 3; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 13, 15, 16, 8, -sx * 0.28, 0, TAU); ctx.fill(); ctx.stroke(); }
    } else if (hat === 'helmet') {
      const g = ctx.createRadialGradient(-22, -26, 6, 0, 0, 72); g.addColorStop(0, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(150,200,255,0.3)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 68, 0, TAU); ctx.fill(); ctx.strokeStyle = L.ink; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 54, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
    }
  }

  // o: {x, ground | hipY, lift, pose, face, s, flip, hat, suit, t, rot, bump}
  function stick2(ctx, o) {
    const sk = skeleton(o.pose || {}), s = o.s || 1, t = o.t || 0, suit = !!o.suit, lw = suit ? 17 : 14;
    const ankle = Math.max(sk.L.h[1], sk.R.h[1]);
    const hipY = o.hipY !== undefined ? o.hipY : o.ground - (ankle + lw * 0.5) * s - (o.lift || 0);
    ctx.save(); ctx.translate(o.x, hipY); if (o.rot) ctx.rotate(o.rot); ctx.scale(s * (o.flip ? -1 : 1) * (o.sx || 1), s * (o.sy || 1));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (pts, w) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
    const limb = (pts, w) => { if (suit) { ctx.strokeStyle = L.ink; ctx.lineWidth = w + 9; line(pts); ctx.strokeStyle = '#fff'; ctx.lineWidth = w; line(pts); } else { ctx.strokeStyle = L.ink; ctx.lineWidth = w; line(pts); } };
    const foot = (l, sg) => [l.h[0] + sg * 22, l.h[1]];
    if (suit) { ctx.fillStyle = '#E8EAF4'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; roundRect(ctx, sk.sh[0] - 38, sk.sh[1] - 4, 76, 90, 16); ctx.fill(); ctx.stroke(); }
    limb([sk.A.o, sk.A.e, sk.A.h], lw); limb([sk.L.o, sk.L.e, sk.L.h, foot(sk.L, -1)], lw);
    limb([sk.hip, sk.neck], lw); limb([sk.R.o, sk.R.e, sk.R.h, foot(sk.R, 1)], lw);
    for (const h of [sk.A.h, sk.Bm.h]) { ctx.beginPath(); ctx.arc(h[0], h[1], lw * 0.62, 0, TAU); ctx.fillStyle = suit ? '#fff' : L.ink; ctx.fill(); if (suit) { ctx.lineWidth = 4; ctx.strokeStyle = L.ink; ctx.stroke(); } }
    // head
    ctx.save(); ctx.translate(sk.headC[0], sk.headC[1]); ctx.rotate(sk.hd);
    hatBack(ctx, o.hat);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = L.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, B.head, 0, TAU); ctx.fill(); ctx.stroke();
    if (o.bump) { const k = o.bump; ctx.fillStyle = '#FF8E8E'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(30, -44, 17 * k, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(30, -44, 8 * k, 3.4, 5.2); ctx.stroke(); }
    face2(ctx, o.face || {}, t); hatFront(ctx, o.hat);
    ctx.restore();
    limb([sk.Bm.o, sk.Bm.e, sk.Bm.h], lw);
    ctx.beginPath(); ctx.arc(sk.Bm.h[0], sk.Bm.h[1], lw * 0.62, 0, TAU); ctx.fillStyle = suit ? '#fff' : L.ink; ctx.fill(); if (suit) { ctx.lineWidth = 4; ctx.strokeStyle = L.ink; ctx.stroke(); }
    ctx.restore();
    const fl = o.flip ? -1 : 1, wp = p => [o.x + p[0] * s * fl, hipY + p[1] * s];
    return { hipY, head: wp(sk.headC), hand: { A: wp(sk.A.h), B: wp(sk.Bm.h) }, foot: { L: wp(sk.L.h), R: wp(sk.R.h) } };
  }

  // ---------- props ----------
  function phone(ctx, x, y, rot, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(o.sc || 1.3, o.sc || 1.3); const w = 50, h = 92;
    ctx.fillStyle = 'rgba(27,28,46,0.18)'; roundRect(ctx, -w / 2 + 4, -h / 2 + 6, w, h, 12); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = L.ink; roundRect(ctx, -w / 2, -h / 2, w, h, 12); ctx.fillStyle = o.back ? '#4B5563' : '#1f2937'; ctx.fill(); ctx.stroke();
    if (!o.back) {
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#c4b5fd'); ctx.fillStyle = g; roundRect(ctx, -w / 2 + 5, -h / 2 + 9, w - 10, h - 18, 6); ctx.fill();
      if (o.cracked) { ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (const [a, b, c, d] of [[-4, 8, -22, -34], [-4, 8, 18, -20], [-4, 8, 20, 36], [-4, 8, -20, 34], [-4, 8, 2, 40], [-12, -14, -20, -4], [10, -4, 20, 4]]) { ctx.moveTo(a, b); ctx.lineTo(c, d); } ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.9)'; roundRect(ctx, -16, -26, 32, 12, 6); ctx.fill(); roundRect(ctx, -10, -6, 26, 12, 6); ctx.fill(); }
    } else { ctx.fillStyle = '#9CA3AF'; ctx.beginPath(); ctx.arc(-10, -h / 2 + 18, 7, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function earth2(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(27,28,46,0.15)'; ctx.beginPath(); ctx.arc(8, 12, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#58A6FF'; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.fillStyle = '#4ADE80'; const s = r / 100;
    for (const pts of [[[-70, -50], [-35, -66], [-5, -45], [-20, -12], [-55, -8]], [[10, 10], [45, 0], [60, 40], [30, 78], [5, 50]], [[30, -70], [75, -55], [70, -20], [38, -26]], [[-72, 20], [-45, 14], [-40, 52], [-66, 56]]]) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * s, p[1] * s) : ctx.moveTo(p[0] * s, p[1] * s))); ctx.closePath(); ctx.fill(); ctx.lineJoin = 'round'; ctx.strokeStyle = '#4ADE80'; ctx.lineWidth = 14 * s; ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.09, -0.6, 0, TAU); ctx.fill();
    ctx.restore(); ctx.lineWidth = 9; ctx.strokeStyle = L.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    // face
    const fs = r / 250, m = o.mouth || 'smirk'; ctx.save(); ctx.translate(o.fx === undefined ? 20 * fs * 4 : o.fx, o.fy === undefined ? -10 * fs : o.fy); ctx.scale(fs * 1.6, fs * 1.6);
    if (o.glasses !== false) { ctx.fillStyle = L.ink; roundRect(ctx, -62, -28, 56, 36, 10); ctx.fill(); roundRect(ctx, 6, -28, 56, 36, 10); ctx.fill(); ctx.fillRect(-8, -22, 16, 6); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-54, -22, 14, 5); ctx.fillRect(14, -22, 14, 5); }
    ctx.strokeStyle = L.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.fillStyle = L.ink;
    if (m === 'smirk') { ctx.beginPath(); ctx.moveTo(-26, 34); ctx.quadraticCurveTo(6, 44, 36, 24); ctx.stroke(); }
    else if (m === 'o') { ctx.beginPath(); ctx.ellipse(0, 36, 12, 16, 0, 0, TAU); ctx.fill(); }
    else if (m === 'grin') { ctx.beginPath(); ctx.arc(0, 20, 28, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }
  function banana(ctx, x, y, rot, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = L.ink; ctx.fillStyle = '#FFD93D';
    ctx.beginPath(); ctx.moveTo(-50, -12); ctx.quadraticCurveTo(-10, 38, 54, -22); ctx.quadraticCurveTo(58, -30, 50, -32); ctx.quadraticCurveTo(0, 8, -42, -28); ctx.quadraticCurveTo(-54, -26, -50, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5a1a'; ctx.beginPath(); ctx.arc(-48, -24, 5, 0, TAU); ctx.fill(); ctx.restore();
  }
  function ballBasket(ctx, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#FF8A3D'; ctx.strokeStyle = L.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.quadraticCurveTo(-r * 0.2, 0, -r * 0.7, r * 0.7); ctx.moveTo(r * 0.7, -r * 0.7); ctx.quadraticCurveTo(r * 0.2, 0, r * 0.7, r * 0.7); ctx.stroke(); ctx.restore();
  }
  function bowling(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = L.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#4b5072'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.2, r * 0.12, -0.7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0b0c18'; for (const [dx, dy] of [[0.1, -0.15], [0.4, -0.05], [0.2, 0.25]]) { ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.11, 0, TAU); ctx.fill(); } ctx.restore();
  }
  function dazed(ctx, x, y, t, r = 62) {
    for (let i = 0; i < 3; i++) { const a = t * 4 + (i * TAU) / 3; G.star(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35, 13, L.sun, a); ctx.save(); ctx.strokeStyle = L.ink; ctx.lineWidth = 2.5; ctx.restore(); }
  }
  function bulb(ctx, x, y, s, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = L.sun; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { const an = -Math.PI / 2 + i * 0.5, r0 = 52, r1 = 78 + Math.sin(a * 9 + i) * 5; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); ctx.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); ctx.stroke(); }
    ctx.fillStyle = L.sun; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -4, 34, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#C9CCDF'; roundRect(ctx, -16, 26, 32, 22, 6); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // ---------- captions ----------
  function drawCaptions2(ctx, groups, t, y = 1450) {
    let gi = -1;
    for (let i = 0; i < groups.length; i++) { if (t >= groups[i].s - 0.03 && (i === groups.length - 1 || t < groups[i + 1].s - 0.03)) { gi = i; break; } }
    if (gi < 0) return; const g = groups[gi]; if (t > g.e + 0.45) return;
    const age = t - g.s + 0.03, pop = easeOutBack(clamp(age / 0.16), 2.2);
    const words = g.words.map(w => w.w.replace(/[.,!?;:]+$/, '').toUpperCase());
    ctx.save(); let size = 84; ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '1px';
    const sp = 30; let widths = words.map(w => ctx.measureText(w).width), total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    if (total > 900) { size = Math.floor(size * 900 / total); ctx.font = `900 ${size}px Inter`; widths = words.map(w => ctx.measureText(w).width); total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1); }
    ctx.translate(W / 2, y); ctx.scale(0.88 + 0.12 * pop, 0.88 + 0.12 * pop); ctx.globalAlpha = clamp(age / 0.08);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    let x = -total / 2;
    g.words.forEach((w, i) => {
      const active = t >= w.s && t < w.e + 0.02;
      if (active) { ctx.save(); ctx.translate(x + widths[i] / 2, 0); ctx.rotate(-0.025); ctx.fillStyle = L.sun; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; roundRect(ctx, -widths[i] / 2 - 14, -size * 0.58, widths[i] + 28, size * 1.16, 16); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#fff'; if (!active) ctx.strokeText(words[i], x, 3);
      ctx.fillStyle = L.ink; ctx.fillText(words[i], x, 3); x += widths[i] + sp;
    });
    ctx.restore();
  }

  Object.assign(G, { drawBackground2, ground2, shadow2, inkText, comic, tag, speech, stick2, phone, earth2, banana, ballBasket, bowling, dazed, bulb, drawCaptions2 });
})(window.GR);
