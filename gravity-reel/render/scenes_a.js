// Scenes 1-4: hook, mass attracts mass, Earth zoom-out, acceleration.
(function (G) {
  const { W, H, TAU, clamp, lerp, map, seg, easeOut, easeInOut, easeOutBack, easeOutElastic, kf, C, rgba, stick, joints, text, chip, chapter, arrow, ball, star, burst, puff, bounce, bounceHits, slab, earth, roundRect, glowLine } = G;
  const BASE = { lean: 0, head: 0, A1: 0.16, A2: 0.1, B1: 0.16, B2: 0.1, L1: 0.12, L2: -0.05, R1: 0.12, R2: -0.05 };
  const P = o => Object.assign({}, BASE, o);
  const wob = (t, k = 1) => ({ lean: Math.sin(t * 1.7) * 0.012 * k, head: Math.sin(t * 1.1 + 1) * 0.04 * k });
  G.scenes = G.scenes || [];
  G.BASE = BASE; G.P = P; G.wob = wob;

  function rays(ctx, x, y, R, t, color, n = 14, a = 0.16) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.25);
    for (let i = 0; i < n; i++) {
      ctx.rotate(TAU / n); const g = ctx.createLinearGradient(0, 0, R, 0); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, -R * 0.08); ctx.lineTo(R, R * 0.08); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  const gradText = (ctx, x0, x1, c0, c1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  const lookAt = (from, to, k = 3.6) => { const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy) || 1; return [dx / d * k, dy / d * k]; };

  // =============== 1. HOOK ===============
  const HK = { gy: 1130, sx: 360, s: 1.05, g: 2600, e: 0.45, r: 38 };
  const hold = P({ B1: 2.35, B2: -0.35, A1: 0.22 });
  const relax = P({ B1: 0.5, B2: 0.2, A1: 0.3, A2: 0.3 });
  const shrug = P({ A1: 0.95, A2: 1.55, B1: 0.95, B2: 1.55, head: 0.1 });
  const cheer = P({ A1: 2.65, A2: 0.35, B1: 2.65, B2: 0.35, lean: -0.04, L1: 0.3, R1: 0.3, L2: -0.1, R2: -0.1 });
  const ballHeld = () => { const j = joints({ x: HK.sx, ground: HK.gy, s: HK.s, pose: hold }); return [j.hand.B[0] + 6, j.hand.B[1] - 30]; };

  G.scenes.push({
    id: 'hook',
    mark: T => ({ tr: T.w('a', 'fall') - 0.04, fl: T.w('a', 'floating'), ans: T.w('b', 'answer'), grav: T.w('b', 'gravity') }),
    events(T, m) {
      const [, by0] = ballHeld(), gy = HK.gy - HK.r;
      const ev = [{ t: m.tr, type: 'swish' }, { t: m.fl, type: 'pop' }, { t: m.ans - 0.05, type: 'burst' }, { t: m.grav, type: 'slam' }, { t: 0.15, type: 'pop', gain: 0.6 }];
      bounceHits(by0, gy, HK.g, HK.e).forEach((h, i) => ev.push({ t: m.tr + h, type: 'thud', gain: 1 - 0.28 * i }));
      return ev;
    },
    draw(ctx, S) {
      const { t, talk, m } = S, [bx0, by0] = ballHeld(), gy = HK.gy - HK.r;
      chapter(ctx, '01', 'THE BIG QUESTION', t + 0.6);
      // shake on title slam
      const sk = clamp(1 - (t - m.grav) / 0.4) * (t > m.grav ? 1 : 0);
      ctx.save(); ctx.translate(Math.sin(t * 90) * 7 * sk, Math.cos(t * 77) * 7 * sk);
      slab(ctx, 40, 1040, HK.gy, 70);

      // headline
      const out = seg(t, m.ans + 0.1, m.ans + 0.55, easeInOut), hin = 1;
      if (out < 1) {
        ctx.save(); ctx.translate(0, -out * 90 + (1 - hin) * 60); ctx.globalAlpha *= (1 - out) * clamp(hin * 2);
        const g = gradText(ctx, 160, 920, '#ffffff', '#9fe6ff');
        text(ctx, 'WHY DO THINGS', W / 2, 480, { size: 104, weight: 900, fill: g, stroke: '#0a0b26', strokeW: 16, glow: C.cyan, glowBlur: 24 });
        text(ctx, 'FALL DOWN?', W / 2, 600, { size: 128, weight: 900, fill: C.yellow, stroke: '#0a0b26', strokeW: 18, glow: C.yellow, glowBlur: 30 });
        ctx.restore();
      }
      // thought bubble
      const bu = seg(t, m.fl, m.fl + 0.55, easeOutElastic), bo = seg(t, m.ans, m.ans + 0.2, easeOut);
      if (bu > 0 && bo < 1) {
        const cx = 800, cy = 880, sc = bu * (1 + bo * 0.4); ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha *= 1 - bo;
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4;
        const blobs = [[0, 0, 150], [-110, -30, 90], [110, -30, 92], [-60, -100, 80], [60, -105, 82], [-70, 80, 80], [70, 82, 82]];
        ctx.beginPath(); blobs.forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }); ctx.fill();
        for (const [x, y, r] of [[-185, 175, 26], [-232, 230, 15]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); }
        // mini floating stickman
        const f = Math.sin(t * 2.2);
        stick(ctx, { x: 0, ground: 0, hipY: 28 - f * 10 - (t - m.fl) * 4 % 30 * 0, s: 0.42, t,
          pose: P({ A1: 2.2 + Math.sin(t * 6) * 0.5, A2: 0.2, B1: 2.2 + Math.sin(t * 6 + 2) * 0.5, B2: 0.2, L1: 0.5 + Math.sin(t * 5) * 0.3, R1: 0.5 + Math.sin(t * 5 + 1.5) * 0.3, lean: Math.sin(t * 2) * 0.25 }),
          face: { mouth: 'o', wide: 1 } });
        ctx.restore();
      }
      // character
      const pose = kf([[0, hold], [m.tr, hold], [m.tr + 0.4, relax], [m.tr + 1.15, relax], [m.tr + 1.55, shrug], [m.ans - 0.2, shrug], [m.ans + 0.15, cheer], [m.ans + 0.4, cheer]], t);
      const hop = Math.max(0, Math.sin(clamp((t - m.grav + 0.05) / 0.5) * Math.PI)) * 46;
      const ballNow = t < m.tr ? { y: by0, sy: 1, hits: [] } : bounce(t - m.tr, by0, gy, HK.g, HK.e);
      const lk = t < m.tr ? [1.5, -3.2] : lookAt([HK.sx, 760], [bx0, ballNow.y], 3.4);
      const happy = t > m.ans;
      const pp = Object.assign({}, pose, wob(t), happy ? {} : {});
      stick(ctx, { x: HK.sx, ground: HK.gy, s: HK.s, lift: hop, pose: pp, t, face: { talk, look: happy ? [0, 0] : lk, mouth: happy ? 'grin' : 'smile', brow: t > m.tr + 1.5 && !happy ? 0.8 : 0, raise: happy ? 0.6 : 0, wide: t < m.tr ? 0 : 0.5 } });
      // ball
      let sy = 1;
      if (t >= m.tr) for (const h of ballNow.hits) { const d = t - m.tr - h; if (d >= 0 && d < 0.13) sy = Math.min(sy, 1 - 0.3 * Math.sin((d / 0.13) * Math.PI)); }
      const by = t < m.tr ? by0 : ballNow.y;
      ball(ctx, t < m.tr ? bx0 : bx0, by + HK.r * (1 - sy), HK.r, C.orange, { sy, sx: 1 / sy, glow: C.orange, glowBlur: 28, rot: (t - m.tr) * 2, stripe: true });
      if (t >= m.tr) ballNow.hits.forEach((h, i) => puff(ctx, bx0, HK.gy - 4, t, m.tr + h, { n: 6, spread: 70 - i * 14, size: 18 - i * 3, dur: 0.6, seed: 5 + i, alpha: 1 - i * 0.25 }));
      // question marks around head when shrugging
      const qs = seg(t, m.tr + 1.5, m.tr + 1.9, easeOutBack) * (1 - seg(t, m.ans - 0.1, m.ans + 0.15));
      if (qs > 0) [[-70, -80, -0.3, 62], [30, -125, 0.2, 74], [100, -60, 0.4, 56]].forEach(([dx, dy, r, s], i) => {
        const hd = joints({ x: HK.sx, ground: HK.gy, s: HK.s, pose: shrug }).head;
        G.questionMark(ctx, hd[0] + dx, hd[1] + dy + Math.sin(t * 3 + i) * 6, s * qs, r + Math.sin(t * 2 + i) * 0.1, C.yellow, clamp(qs));
      });

      // GRAVITY title
      const tu = seg(t, m.grav - 0.05, m.grav + 0.32, easeOutBack);
      if (tu > 0) {
        rays(ctx, W / 2, 560, 620, t, C.cyan, 16, 0.22 * clamp(tu));
        ctx.save(); ctx.translate(W / 2, 580 + Math.sin(t * 2.4) * 5); const sc = lerp(2.6, 1, tu); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(tu * 2.5);
        const g = gradText(ctx, -420, 420, '#7ff0ff', '#b79bff');
        text(ctx, 'GRAVITY', 0, 0, { size: 190, weight: 900, fill: g, stroke: '#0a0b26', strokeW: 28, glow: C.violet, glowBlur: 50 });
        ctx.restore();
        burst(ctx, W / 2, 580, t, m.grav, { n: 18, speed: 420, size: 18, colors: [C.yellow, C.cyan, C.pink, '#fff'], dur: 0.9, seed: 9 });
      }
      ctx.restore();
    },
  });

  // =============== 2. MASS ATTRACTS MASS ===============
  G.scenes.push({
    id: 'mass',
    mark: T => ({ pulls: T.w('c', 'pulls'), ev2: T.w('c', 'every', 1), d0: T.ls('d'), d1: T.le('d'), more: T.w('d', 'more'), strong: T.w('d', 'stronger'), cEnd: T.le('c') }),
    events(T, m) {
      return [{ t: 0.25, type: 'pop', gain: 0.6 }, { t: m.pulls, type: 'swish' }, { t: m.ev2, type: 'pop' }, { t: m.ev2 + 0.18, type: 'pop', gain: 0.8 }, { t: m.ev2 + 0.36, type: 'pop', gain: 0.7 },
        { t: m.d0 + 0.1, type: 'whoosh', gain: 0.5 }, { t: m.strong, type: 'ding' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '02', 'MASS ATTRACTS MASS', t, C.pink);
      // --- balls
      const ph2 = seg(t, m.d0 - 0.1, m.d0 + 0.5, easeInOut);
      const drift = 70 * seg(t, m.pulls, m.cEnd, easeInOut);
      const mass = lerp(1, 5, seg(t, m.more, m.d1 - 0.2, easeInOut)) * ph2 + (1 - ph2) * 1;
            const rr = lerp(78, 42 + (mass - 1) * 19, ph2);
      const ay = lerp(730, 700, ph2), ax = lerp(300 + drift, 310, ph2), bx = lerp(780 - drift, 770, ph2);
      // network of extra bodies
      const net = seg(t, m.ev2, m.ev2 + 0.5) * (1 - seg(t, m.d0 - 0.3, m.d0 + 0.1));
      const bodies = [[ax, ay, rr, C.blue, 'm'], [bx, ay, rr, C.pink, 'm'], [540, 500, 44, C.yellow, ''], [540, 985, 40, C.green, ''], [150, 520, 30, C.orange, ''], [940, 520, 30, C.violet, '']];
      if (net > 0) {
        ctx.save(); ctx.setLineDash([4, 16]); ctx.lineDashOffset = -t * 40; ctx.lineCap = 'round'; ctx.lineWidth = 4;
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          ctx.strokeStyle = `rgba(255,255,255,${0.3 * net})`; ctx.beginPath(); ctx.moveTo(bodies[i][0], bodies[i][1]); ctx.lineTo(bodies[j][0], bodies[j][1]); ctx.stroke();
        }
        ctx.restore();
      }
      if (ph2 < 1) bodies.slice(2).forEach(([x, y, rad, col], i) => {
        const k = seg(t, m.ev2 + i * 0.18, m.ev2 + i * 0.18 + 0.5, easeOutElastic) * (1 - ph2);
        if (k > 0) ball(ctx, x, y + Math.sin(t * 2 + i) * 6, rad * k, col, { glow: col, glowBlur: 26 });
      });
      // pull arrows between A and B
      const ap = seg(t, m.pulls, m.pulls + 0.5, easeOut), lenA = lerp(100, 55 + mass * 20, ph2), wA = lerp(11, 5 + mass * 1.7, ph2);
      if (ap > 0) {
        arrow(ctx, ax + rr + 22, ay, ax + rr + 22 + lenA, ay, C.yellow, wA, ap);
        arrow(ctx, bx - rr - 22, ay, bx - rr - 22 - lenA, ay, C.yellow, wA, ap);
      }
      ball(ctx, ax, ay, rr, C.blue, { glow: C.blue, glowBlur: 40 }); ball(ctx, bx, ay, rr, C.pink, { glow: C.pink, glowBlur: 40 });
      const lab = seg(t, 0.2, 0.7, easeOutBack);
      text(ctx, 'm', ax, ay + 2, { size: 64 + ph2 * (mass - 1) * 8, weight: 900, fill: '#fff', alpha: lab });
      text(ctx, 'm', bx, ay + 2, { size: 64 + ph2 * (mass - 1) * 8, weight: 900, fill: '#fff', alpha: lab });
      if (net > 0.3) chip(ctx, 'EVERYTHING PULLS EVERYTHING', 540, 800, { size: 26, spacing: 3, fill: '#fff', alpha: net, scale: 0.5 + net * 0.5, bg: 'rgba(20,16,70,0.7)' });

      // --- pull meter (phase 2)
      if (ph2 > 0) {
        ctx.save(); ctx.globalAlpha *= ph2;
        const mx = 360, mw = 580, my = 990, fill = 0.12 + 0.88 * ((mass - 1) / 4);
        text(ctx, 'PULL STRENGTH', mx, my - 44, { size: 26, spacing: 5, align: 'left', fill: C.ink2 });
        text(ctx, `MASS ×${mass.toFixed(1)}`, mx + mw, my - 44, { size: 26, spacing: 3, align: 'right', fill: C.pink });
        roundRect(ctx, mx, my - 18, mw, 38, 19); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        const g = ctx.createLinearGradient(mx, 0, mx + mw, 0); g.addColorStop(0, C.yellow); g.addColorStop(1, C.red);
        ctx.shadowColor = C.orange; ctx.shadowBlur = 24; roundRect(ctx, mx, my - 18, Math.max(38, mw * fill), 38, 19); ctx.fillStyle = g; ctx.fill();
        ctx.restore();
        chip(ctx, 'MORE MASS  =  STRONGER PULL', 540, 1075, { size: 30, spacing: 3, fill: C.yellow, border: rgba(C.yellow, 0.6), bg: rgba(C.yellow, 0.1), glow: rgba(C.yellow, 0.4), scale: seg(t, m.strong - 0.1, m.strong + 0.4, easeOutBack), alpha: seg(t, m.strong - 0.1, m.strong + 0.2) });
      }

      // narrator
      const pt = ph2 < 0.5 ? P({ B1: 2.5, B2: 0.1, A1: 0.2 }) : P({ B1: 2.0 + Math.sin(t * 3) * 0.08, B2: 0.2, A1: 0.22 });
      stick(ctx, { x: 160, ground: 1195, s: 0.92, t, pose: Object.assign(pt, wob(t)), face: { talk, look: [3, -3], mouth: 'smile' } });
    },
  });

  // =============== 3. EARTH ===============
  G.scenes.push({
    id: 'earth',
    mark: T => ({ pulls: T.w('e', 'pulls'), toward: T.w('e', 'toward'), center: T.w('e', 'center'), f0: T.ls('f'), people: T.w('f', 'people'), other: T.w('f', 'other'), fall: T.w('f', 'fall') }),
    events(T, m) {
      return [{ t: 0.2, type: 'pop', gain: 0.6 }, { t: m.pulls, type: 'swish' }, { t: m.toward - 0.1, type: 'whoosh' }, { t: m.center, type: 'ding' },
        ...[0, 1, 2, 3, 4].map(i => ({ t: m.people + 0.15 + i * 0.16, type: 'pop', gain: 0.6 })), { t: m.fall, type: 'pop' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '03', 'WHY WE STAY ON EARTH', t, C.green);
      const u = seg(t, m.toward - 0.1, m.center + 0.9, easeInOut);
      const R = lerp(1300, 270, u), cx = 540, cy = lerp(1090 + 1300, 850, u);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      earth(ctx, cx, cy, R, t, { spin: 10 + u * 4 });
      ctx.restore();
      // people on the planet
      const person = (ang, s, o = {}) => {
        const px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang + Math.PI / 2);
        stick(ctx, { x: 0, ground: 0, s, t: t + (o.off || 0), pose: o.pose || Object.assign(P({}), wob(t + (o.off || 0))), face: Object.assign({ mouth: 'smile', blinkOff: o.off || 0 }, o.face || {}) });
        ctx.restore();
        // gravity arrow toward centre
        if (o.arrow !== false) {
          const a0 = 18, L = o.arrowLen === undefined ? 100 : o.arrowLen, p = o.arrowP === undefined ? 1 : o.arrowP;
          const sx = cx + (R - a0) * Math.cos(ang), sy = cy + (R - a0) * Math.sin(ang);
          arrow(ctx, sx, sy, cx + (R - a0 - L) * Math.cos(ang), cy + (R - a0 - L) * Math.sin(ang), C.cyan, o.aw || 9, p);
        }
      };
      const s0 = lerp(1.05, 0.5, u);
      const arrowP0 = seg(t, m.pulls, m.pulls + 0.5, easeOut);
      const L0 = lerp(230, 130, u);
      person(-Math.PI / 2, s0, { pose: Object.assign(P({ B1: 0.5 + seg(t, m.pulls - 0.3, m.pulls + 0.3) * 0.2 }), wob(t)), face: { talk, look: [0, 2] }, arrowLen: L0, arrowP: arrowP0, aw: lerp(14, 8, u) });
      // the others appear with a pop
      const angs = [-Math.PI / 2 + 1.05, -Math.PI / 2 + 2.1, Math.PI / 2, -Math.PI / 2 - 2.1, -Math.PI / 2 - 1.05];
      angs.forEach((a, i) => {
        const k = seg(t, m.people + 0.1 + i * 0.16, m.people + 0.1 + i * 0.16 + 0.5, easeOutElastic);
        if (k <= 0) return;
        const wave = a === Math.PI / 2;
        person(a, 0.5 * k, { off: i, arrowP: k, arrowLen: 130, aw: 8, pose: wave ? Object.assign(P({ B1: 2.6 + Math.sin(t * 7) * 0.35, B2: 0.5 }), wob(t)) : undefined,
          face: wave ? { mouth: 'grin', eyes: 'happy' } : { look: [0, 2] } });
      });
      // core glow
      const cg = seg(t, m.center, m.center + 0.5, easeOutBack);
      if (u > 0.6) {
        const k = clamp((u - 0.6) / 0.4);
        const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 + Math.sin(t * 4) * 8); gl.addColorStop(0, rgba(C.orange, 0.95 * k)); gl.addColorStop(1, rgba(C.orange, 0));
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 100, 0, TAU); ctx.fill();
      }
      if (cg > 0) chip(ctx, 'CENTER OF EARTH', cx, cy + 1, { size: 24, spacing: 3, fill: '#fff', bg: 'rgba(40,20,0,0.65)', border: rgba(C.orange, 0.8), scale: cg, alpha: cg });
    },
  });

  // =============== 4. ACCELERATION ===============
  const AC = { cliffR: 490, top: 720, sx: 410, s: 0.8, bx: 0, gy: 1170, r: 24 };
  const acPose = P({ B1: 1.3, B2: -0.12, A1: 0.3, lean: 0.05 });
  function acBall() { const j = joints({ x: AC.sx, ground: AC.top, s: AC.s, pose: acPose }); return [j.hand.B[0] + 8, j.hand.B[1] - 2]; }
  G.scenes.push({
    id: 'accel',
    mark: T => {
      const rel = T.w('g', 'speeds'), land = T.le('g') - 0.3, k = 3 / (land - rel);
      return { rel, land, k, every: T.w('g', 'every'), drop: T.w('g', 'Drop') };
    },
    events(T, m) {
      return [{ t: 0.2, type: 'pop', gain: 0.6 }, { t: m.rel, type: 'swish' }, ...[1, 2, 3].map(n => ({ t: m.rel + n / m.k, type: 'tick' })), { t: m.land, type: 'thud' }, { t: m.land + 0.15, type: 'ding' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S, [bx, by0] = acBall();
      chapter(ctx, '04', 'FALLING FASTER', t, C.orange);
      // cliff
      const cg = ctx.createLinearGradient(0, AC.top, 0, AC.gy); cg.addColorStop(0, '#3a3f93'); cg.addColorStop(1, '#1c1f5a');
      ctx.fillStyle = cg; ctx.fillRect(40, AC.top, AC.cliffR - 40, AC.gy - AC.top + 40);
      ctx.fillStyle = '#6a72dc'; ctx.fillRect(40, AC.top, AC.cliffR - 40, 8);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 4;
      for (let y = AC.top + 70; y < AC.gy; y += 70) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(AC.cliffR, y); ctx.stroke(); }
      slab(ctx, 40, 1040, AC.gy, 60);
      // metre ruler on cliff edge
      const tau = m.k * (t - m.rel), tc = clamp(tau, 0, 3.0), landed = tau >= 3;
      const gy = AC.gy - AC.r, ppm = (gy - by0) / (0.5 * 9.8 * 9);
      const yAt = ta => by0 + 0.5 * 9.8 * ta * ta * ppm;
      // ghosts
      ctx.save(); ctx.globalAlpha *= 0.3;
      for (let q = 0.5; q <= 3.01; q += 0.5) if (tau > q) ball(ctx, bx, yAt(q), AC.r, C.orange);
      ctx.restore();
      // tick labels
      [1, 2, 3].forEach(n => {
        const k = seg(tau, n - 0.02, n + 0.25, easeOutBack); if (k <= 0) return;
        const y = yAt(n);
        ctx.save(); ctx.strokeStyle = rgba(C.yellow, 0.5 * k); ctx.setLineDash([8, 10]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + 38, y); ctx.lineTo(640, y); ctx.stroke(); ctx.restore();
        chip(ctx, `${n} s   →   ${(9.8 * n).toFixed(1)} m/s`, 840, y, { size: 29, spacing: 2, fill: '#fff', border: rgba(C.yellow, 0.7), bg: 'rgba(40,30,0,0.65)', scale: k, alpha: clamp(k), glow: rgba(C.yellow, 0.35) });
      });
      // speed readout
      const rk = seg(t, m.rel - 0.2, m.rel + 0.3, easeOutBack);
      if (rk > 0) {
        ctx.save(); ctx.translate(790, 470); ctx.scale(rk, rk);
        roundRect(ctx, -230, -78, 460, 156, 28); ctx.fillStyle = 'rgba(10,10,50,0.78)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = rgba(landed ? C.yellow : C.cyan, 0.7); ctx.stroke();
        const v = 9.8 * tc;
        text(ctx, landed ? 'ACCELERATION  (g)' : 'SPEED', 0, -42, { size: 24, spacing: 5, fill: C.ink2 });
        const pop = landed ? 1 + 0.12 * Math.max(0, 1 - (t - m.land) * 5) : 1;
        ctx.scale(pop, pop);
        text(ctx, landed ? '9.8 m/s²' : `${v.toFixed(1)} m/s`, 0, 16, { size: 78, weight: 900, fill: landed ? C.yellow : '#fff', glow: landed ? C.yellow : C.cyan, glowBlur: 26 });
        ctx.restore();
      }
      // narrator on cliff
      const pose = t < m.rel ? acPose : kf([[m.rel, acPose], [m.rel + 0.4, P({ B1: 0.4, A1: 0.3, lean: 0.07 })], [m.rel + 1.2, P({ B1: 0.4, A1: 0.3, lean: 0.07 })]], t);
      const ballPos = by0 + (t < m.rel ? 0 : 0);
      stick(ctx, { x: AC.sx, ground: AC.top, s: AC.s, t, pose: Object.assign({}, pose, t < m.rel ? {} : wob(t, 0.5)), face: { talk, look: lookAt([AC.sx, 560], [bx, tau > 0 ? yAt(tc) : by0], 3.4), mouth: landed ? 'grin' : 'smile', wide: tau > 0 ? 0.6 : 0 } });
      // ball
      if (tau < 3) {
        const y = tau <= 0 ? by0 : yAt(tau), v = 9.8 * clamp(tau, 0, 3);
        if (tau > 0.1) arrow(ctx, bx, y + AC.r + 12, bx, y + AC.r + 12 + v * 3.2, C.cyan, 9, 1);
        ball(ctx, bx, y, AC.r, C.orange, { glow: C.orange, glowBlur: 34, stripe: true, rot: tau * 3 });
      } else {
        const d = t - m.land; const sy = d < 0.14 ? 1 - 0.3 * Math.sin((d / 0.14) * Math.PI) : 1;
        ball(ctx, bx, gy + AC.r * (1 - sy), AC.r, C.orange, { glow: C.orange, glowBlur: 34, sy, sx: 1 / sy, stripe: true });
        puff(ctx, bx, AC.gy - 4, t, m.land, { n: 7, spread: 100, size: 22, dur: 0.7 });
      }
    },
  });
})(window.GR);
