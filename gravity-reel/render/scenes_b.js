// Scenes 5-8: Newton, Moon (hammer & feather), Einstein (spacetime), call to action.
(function (G) {
  const { W, H, TAU, clamp, lerp, seg, easeOut, easeInOut, easeOutBack, easeOutElastic, easeIn, kf, C, rgba, stick, joints, text, chip, chapter, arrow, ball, star, burst, puff, bounce, bounceHits, slab, earth, moon, apple, lightbulb, hammer, feather, tree, roundRect, P, wob } = G;
  const lookAt = (from, to, k = 3.6) => { const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy) || 1; return [dx / d * k, dy / d * k]; };

  // =============== 5. NEWTON ===============
  const NW = { gy: 1130, nx: 650, s: 0.82, tx: 830, ax: 650, ay: 585, ar: 32, g: 2600 };
  const newtonHeadTop = () => joints({ x: NW.nx, ground: NW.gy, s: NW.s, pose: P({ head: 0 }) }).head[1] - 50 * NW.s;
  G.scenes.push({
    id: 'newton',
    mark: T => ({ nm: T.w('h', 'Newton'), rel: T.w('h', 'force') + 0.05, also: T.w('h', 'also'), moon: T.w('h', 'Moon') }),
    events(T, m) {
      const top = newtonHeadTop() - NW.ar, tf = Math.sqrt((2 * (top - NW.ay)) / NW.g);
      return [{ t: 0.25, type: 'pop', gain: 0.6 }, { t: m.nm, type: 'pop', gain: 0.8 }, { t: m.rel - 0.1, type: 'rustle' }, { t: m.rel + tf, type: 'bonk' }, { t: m.rel + tf + 0.12, type: 'ding' }, { t: m.also, type: 'whoosh', gain: 0.6 }, { t: m.moon, type: 'pop' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '05', 'ISAAC NEWTON', t, C.yellow);
      const ph = seg(t, m.also - 0.2, m.also + 0.4, easeInOut);
      // ---------- phase 1: apple tree ----------
      if (ph < 1) {
        ctx.save(); ctx.translate(-ph * 760, 0); ctx.globalAlpha *= 1 - ph;
        slab(ctx, -100, 1180, NW.gy, 70);
        const shake = t > m.rel - 0.35 && t < m.rel ? Math.sin(t * 70) * 7 : 0;
        tree(ctx, NW.tx, NW.gy, 0.95, shake);
        // branch
        ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(NW.tx - 20, NW.gy - 330); ctx.quadraticCurveTo(NW.tx - 120, NW.gy - 400, NW.ax + shake, NW.ay - 36); ctx.stroke();
        ctx.fillStyle = '#3db874'; ctx.beginPath(); ctx.ellipse(NW.ax + 26 + shake, NW.ay - 50, 22, 10, -0.5, 0, TAU); ctx.fill();
        const top = newtonHeadTop() - NW.ar, tf = Math.sqrt((2 * (top - NW.ay)) / NW.g), th = m.rel + tf;
        // apple
        if (t < m.rel) apple(ctx, NW.ax + shake, NW.ay, NW.ar, Math.sin(t * 60) * 0.1 * (shake ? 1 : 0));
        else if (t < th) apple(ctx, NW.ax, NW.ay + 0.5 * NW.g * (t - m.rel) ** 2, NW.ar, (t - m.rel) * 3);
        else { const b = bounce(t - th, top, NW.gy - NW.ar, NW.g, 0.42); apple(ctx, NW.ax + (t - th) * 150, b.y, NW.ar, (t - th) * 6); }
        const hit = t - th;
        // Newton
        const looking = t < th;
        const dip = hit > 0 && hit < 0.22 ? Math.sin((hit / 0.22) * Math.PI) * 14 : 0;
        const pose = hit > 0.25 ? P({ A1: 2.7, A2: 0.2, B1: 0.3, B2: 0.2, head: 0 }) : P({ A1: 0.25, B1: 0.25, head: looking ? 0.12 : 0.25 });
        const nj = stick(ctx, { x: NW.nx - 10, ground: NW.gy, s: NW.s, t, hat: 'wig', lift: -dip, pose: Object.assign({}, pose, wob(t)),
          face: { talk, look: looking ? [3, -3.6] : [0, 0], eyes: hit > 0 && hit < 0.5 ? 'x' : hit >= 0.5 ? 'happy' : undefined, mouth: hit > 0.5 ? 'grin' : 'smile', raise: looking ? 0.8 : 0 } });
        if (hit > 0 && hit < 0.5) burst(ctx, NW.ax, top + 10, t, th, { n: 9, speed: 120, size: 16, colors: [C.yellow, '#fff'], dur: 0.5, seed: 4 });
        if (hit > 0.05) { const k = seg(t, th + 0.1, th + 0.5, easeOutElastic); lightbulb(ctx, nj.head[0] + 8, nj.head[1] - 130 + (1 - k) * 40, k, 0.7 + 0.3 * Math.sin(t * 9)); }
        chip(ctx, 'ISAAC NEWTON · 1687', 330, 760, { size: 27, spacing: 3, fill: C.yellow, border: rgba(C.yellow, 0.6), bg: 'rgba(40,30,0,0.65)', scale: seg(t, m.nm, m.nm + 0.4, easeOutBack), alpha: seg(t, m.nm, m.nm + 0.2) });
        ctx.restore();
      }
      // ---------- phase 2: Earth & Moon ----------
      if (ph > 0) {
        ctx.save(); ctx.translate((1 - ph) * 700, 0); ctx.globalAlpha *= ph;
        const ex = 540, ey = 790, er = 160, orb = 345, t2 = t - m.also;
        const th = -2.5 + 1.35 * t2, mx = ex + orb * Math.cos(th), my = ey + orb * Math.sin(th);
        ctx.save(); ctx.setLineDash([6, 18]); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, ey, orb, 0, TAU); ctx.stroke(); ctx.restore();
        earth(ctx, ex, ey, er, t, { spin: 14 });
        // apple on top of Earth
        const ak = seg(t, m.also + 0.2, m.also + 0.7, easeOutBack);
        if (ak > 0) { apple(ctx, ex, ey - er - 44 * ak, 28 * ak, 0); arrow(ctx, ex, ey - er - 10, ex, ey - er + 85, C.cyan, 8, ak); }
        // gravity & velocity arrows on the Moon
        const ux = (ex - mx) / orb, uy = (ey - my) / orb, vx = -uy * -1, vy = ux * -1;
        const pk = seg(t, m.moon - 0.2, m.moon + 0.4, easeOut);
        arrow(ctx, mx + ux * 62, my + uy * 62, mx + ux * 175, my + uy * 175, C.cyan, 9, pk);
        arrow(ctx, mx - uy * 62 * -1, my + ux * 62 * -1, mx - uy * 170 * -1, my + ux * 170 * -1, C.yellow, 8, pk * 0.0 + pk);
        moon(ctx, mx, my, 50, { glow: 40 });
        chip(ctx, 'SAME FORCE  ·  SAME GRAVITY', 540, 1215, { size: 30, spacing: 3, fill: C.cyan, border: rgba(C.cyan, 0.6), bg: 'rgba(0,30,50,0.7)', scale: seg(t, m.also + 0.4, m.also + 0.9, easeOutBack), alpha: seg(t, m.also + 0.4, m.also + 0.6) });
        chip(ctx, 'THE MOON IS FALLING AROUND EARTH', 540, 465, { size: 24, spacing: 3, fill: '#fff', scale: seg(t, m.moon - 0.3, m.moon + 0.2, easeOutBack), alpha: seg(t, m.moon - 0.3, m.moon) });
        stick(ctx, { x: 140, ground: 1190, s: 0.72, t, hat: 'wig', pose: Object.assign(P({ B1: 2.3, B2: 0.2 }), wob(t)), face: { talk, look: [3, -3] } });
        ctx.restore();
      }
    },
  });

  // =============== 6. MOON: HAMMER & FEATHER ===============
  const MN = { gy: 1130, ax: 540, s: 1.0, g: 520 };
  const mnPose = P({ A1: 1.5, A2: 0, B1: 1.5, B2: 0, L1: 0.18, R1: 0.18 });
  const mnJ = () => joints({ x: MN.ax, ground: MN.gy, s: MN.s, pose: mnPose, suit: true });
  G.scenes.push({
    id: 'moon',
    mark: T => ({ wild: T.w('i', 'wild'), air: T.w('j', 'air'), ham: T.w('j', 'hammer'), fea: T.w('j', 'feather'), fall: T.w('j', 'fall') - 0.05, same: T.w('j', 'same'), end: T.le('j') }),
    events(T, m) {
      const j = mnJ(), y0 = j.hand.B[1] + 15, tf = Math.sqrt((2 * (MN.gy - y0)) / MN.g);
      return [{ t: 0.2, type: 'pop', gain: 0.6 }, { t: m.wild, type: 'sparkle' }, { t: m.air, type: 'pop' }, { t: m.fall, type: 'swish' }, { t: m.fall + tf, type: 'thud', gain: 0.8 }, { t: m.fall + tf + 0.02, type: 'thud', gain: 0.6 }, { t: m.same, type: 'ding' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '06', 'ON THE MOON', t, C.gray);
      // earth in the sky + moon ground
      earth(ctx, 850, 600, 78, t, { spin: 6 });
      const gg = ctx.createRadialGradient(540, 1100, 200, 540, 2250, 1180); gg.addColorStop(0, '#c8cbdc'); gg.addColorStop(0.25, '#9a9db6'); gg.addColorStop(1, '#4f5272');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(540, 2250, 1130, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(60,62,90,0.35)';
      [[170, 1230, 70, 18], [440, 1330, 110, 24], [760, 1260, 90, 20], [940, 1180, 55, 14], [640, 1400, 120, 26]].forEach(([x, y, rx, ry]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); });
      G.groundShadow ? 0 : 0;
      const jn = mnJ(), y0 = jn.hand.B[1] + 15, tf = Math.sqrt((2 * (MN.gy - y0)) / MN.g), tr = m.fall, d = t - tr;
      const hx = jn.hand.B[0] + 8, fx = jn.hand.A[0] - 8;
      const itemY = (bottomOff, rot, x, lieRot, lieY) => {
        // returns draw params for an item whose bottom starts at y0
        if (d < 0) return { x, y: y0 - bottomOff, rot };
        if (d < tf) return { x, y: y0 - bottomOff + 0.5 * MN.g * d * d, rot };
        const u = easeOut(clamp((d - tf) / 0.3)); return { x, y: lerp(MN.gy - bottomOff, lieY, u), rot: lerp(rot, lieRot, u) };
      };
      // equal-time comparison lines
      for (const f of [0.3, 0.55, 0.8]) {
        const dd = tf * f; if (d < dd || d > tf + 0.8) continue;
        const y = y0 - 95 + 0.5 * MN.g * dd * dd + 95;
        ctx.save(); ctx.strokeStyle = rgba(C.yellow, 0.55 * clamp(1 - (d - dd) / 0.9 + 0.3)); ctx.setLineDash([10, 12]); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(fx - 30, y); ctx.lineTo(hx + 30, y); ctx.stroke(); ctx.restore();
      }
      // astronaut
      const done = d > tf;
      const pose = d < 0 ? mnPose : kf([[tr, mnPose], [tr + 0.35, P({ A1: 0.5, B1: 0.5, L1: 0.18, R1: 0.18 })], [tr + tf, P({ A1: 0.5, B1: 0.5, L1: 0.18, R1: 0.18 })], [tr + tf + 0.3, P({ A1: 2.6, A2: 0.3, B1: 2.6, B2: 0.3, L1: 0.3, R1: 0.3 })]], t);
      stick(ctx, { x: MN.ax, ground: MN.gy, s: MN.s, t, suit: true, hat: 'helmet', pose: Object.assign({}, pose, wob(t, 0.6)), face: { talk, look: d > 0 && !done ? [0, 3.6] : [0, 0], mouth: done ? 'grin' : 'smile', wide: t < m.wild + 1 ? 1 : 0.3 } });
      // items
      const hp = itemY(95, -0.1, hx, -1.45, MN.gy - 26), fp = itemY(95, 0.18, fx, 1.35, MN.gy - 14);
      const hHeldRot = d < 0 ? -0.1 + Math.sin(t * 2) * 0.02 : hp.rot, fHeldRot = d < 0 ? 0.18 + Math.sin(t * 2.3) * 0.03 : fp.rot;
      hammer(ctx, hp.x, hp.y, hHeldRot, 1); feather(ctx, fp.x, fp.y + 14, fHeldRot, 1);
      if (d > tf - 0.01 && d < tf + 0.9) { puff(ctx, hx, MN.gy - 6, t, tr + tf, { n: 7, spread: 80, size: 18, dur: 0.9, gravity: 40, seed: 2, color: '#d8dbec' }); puff(ctx, fx, MN.gy - 6, t, tr + tf, { n: 7, spread: 80, size: 18, dur: 0.9, gravity: 40, seed: 3, color: '#d8dbec' }); }
      // labels
      chip(ctx, 'NO AIR', 270, 560, { size: 34, spacing: 5, fill: C.cyan, border: rgba(C.cyan, 0.7), bg: 'rgba(0,30,50,0.7)', scale: seg(t, m.air, m.air + 0.4, easeOutBack), alpha: seg(t, m.air, m.air + 0.2) });
      chip(ctx, 'SAME SPEED', 790, 960, { size: 34, spacing: 5, fill: C.yellow, border: rgba(C.yellow, 0.7), bg: 'rgba(40,30,0,0.7)', scale: seg(t, m.same - 0.1, m.same + 0.4, easeOutBack), alpha: seg(t, m.same - 0.1, m.same + 0.1) });
      chip(ctx, 'APOLLO 15 · 1971', 540, 1235, { size: 26, spacing: 4, fill: '#fff', bg: 'rgba(15,15,50,0.75)', alpha: seg(t, m.ham, m.ham + 0.4), scale: 1 });
      if (done) text(ctx, 'LANDED TOGETHER!', 540, 460, { size: 62, weight: 900, fill: '#fff', stroke: '#0a0b26', strokeW: 14, glow: C.yellow, glowBlur: 26, alpha: seg(t, tr + tf, tr + tf + 0.25), });
    },
  });

  // =============== 7. EINSTEIN: SPACETIME ===============
  const F = 900, D0 = 3.2, PH = 1.0, cph = Math.cos(PH), sph = Math.sin(PH), CX = 560, CY = 700, HALF = 1.3;
  const proj = (x, Y, z) => { const up = Y * cph + z * sph, dep = z * cph - Y * sph + D0, k = F / dep; return [CX + x * k, CY - up * k, dep, k]; };
  const well = (r, D) => -D / Math.sqrt(1 + (r / 0.3) ** 2);
  G.scenes.push({
    id: 'einstein',
    mark: T => ({ k: T.w('k', 'Einstein'), mass: T.w('l', 'mass'), bends: T.w('l', 'bends'), space: T.w('l', 'space'), obj: T.w('l', 'objects'), follow: T.w('l', 'follow'), curve: T.w('l', 'curve') }),
    events(T, m) {
      return [{ t: 0.2, type: 'pop', gain: 0.6 }, { t: m.k, type: 'pop', gain: 0.8 }, { t: m.mass + 0.3, type: 'thud', gain: 1 }, { t: m.bends, type: 'swish' }, { t: m.space, type: 'pop' }, { t: m.obj, type: 'sparkle' }, { t: m.curve, type: 'ding' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '07', 'ALBERT EINSTEIN', t, C.violet);
      const D = 0.8 * seg(t, m.mass + 0.3, m.mass + 1.5, easeOutBack) * (t > m.mass + 0.3 ? 1 : 0);
      const N = 23, M = 64;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 2.6;
      const line = (pf) => {
        let prev = null;
        for (let j = 0; j < M; j++) {
          const u = j / (M - 1), [x, z] = pf(u), r = Math.hypot(x, z), Y = well(r, D), p = proj(x, Y, z);
          if (prev) {
            const dip = clamp(-Y / 0.8), a = lerp(0.95, 0.3, clamp((p[2] - 2.4) / 1.6));
            const col = [lerp(79, 255, dip), lerp(216, 111, dip), lerp(255, 177, dip)].map(Math.round);
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a * 0.9})`; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
          }
          prev = p;
        }
      };
      for (let i = 0; i < N; i++) { const c = -HALF + (2 * HALF * i) / (N - 1); line(u => [c, -HALF + 2 * HALF * u]); line(u => [-HALF + 2 * HALF * u, c]); }
      ctx.restore();
      // objects: sun + planet (depth sorted)
      const objs = [];
      const sunK = seg(t, m.mass - 0.15, m.mass + 0.3, easeIn);
      const sunY = lerp(1.7, well(0, D) + 0.19, sunK), sp = proj(0, sunY, 0);
      if (t > m.mass - 0.3) objs.push({ dep: sp[2], draw: () => { const r = 0.19 * sp[3]; const gl = ctx.createRadialGradient(sp[0], sp[1], r * 0.5, sp[0], sp[1], r * 3.2); gl.addColorStop(0, rgba(C.yellow, 0.55)); gl.addColorStop(1, rgba(C.yellow, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sp[0], sp[1], r * 3.2, 0, TAU); ctx.fill(); ball(ctx, sp[0], sp[1], r, '#ffd24d', { glow: C.orange, glowBlur: 30, light: '#fff9' }); } });
      const tau = t - m.obj, pk = seg(t, m.obj - 0.1, m.obj + 0.35, easeOutBack);
      const orbitAt = tt => { const r = lerp(1.05, 0.5, clamp(tt / 4.2)), a = -0.5 + 2.0 * tt + 0.25 * tt * tt; return [r * Math.cos(a), r * Math.sin(a), r]; };
      if (pk > 0) {
        for (let q = 18; q >= 1; q--) { const [x, z, r] = orbitAt(Math.max(0, tau - q * 0.035)), p = proj(x, well(r, D) + 0.11, z); objs.push({ dep: p[2] + 5, draw: () => { ctx.save(); ctx.globalAlpha *= (1 - q / 19) * 0.55; ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(p[0], p[1], 0.05 * p[3] * (1 - q / 24), 0, TAU); ctx.fill(); ctx.restore(); } }); }
        const [x, z, r] = orbitAt(Math.max(0, tau)), p = proj(x, well(r, D) + 0.11, z);
        objs.push({ dep: p[2], draw: () => earth(ctx, p[0], p[1], 0.11 * p[3] * pk, t, { spin: 20 }) });
      }
      objs.sort((a, b) => b.dep - a.dep).forEach(o => o.draw());
      chip(ctx, 'SPACETIME', 560, 470, { size: 34, spacing: 8, fill: C.cyan, border: rgba(C.cyan, 0.7), bg: 'rgba(0,25,50,0.7)', glow: rgba(C.cyan, 0.4), scale: seg(t, m.space, m.space + 0.4, easeOutBack), alpha: seg(t, m.space, m.space + 0.2) });
      chip(ctx, 'MASS BENDS SPACETIME', 560, 1195, { size: 28, spacing: 4, fill: C.pink, border: rgba(C.pink, 0.6), bg: 'rgba(50,10,40,0.7)', scale: seg(t, m.bends, m.bends + 0.4, easeOutBack), alpha: seg(t, m.bends, m.bends + 0.2) });
      // Einstein
      const pose = Object.assign(P({ B1: 2.0 + Math.sin(t * 2) * 0.05, B2: 0.25, A1: 0.25 }), wob(t));
      stick(ctx, { x: 150, ground: 1190, s: 0.85, t, hat: 'einstein', pose, face: { talk, look: [3, -2], raise: 0.4 } });
      chip(ctx, 'ALBERT EINSTEIN · 1915', 255, 760, { size: 25, spacing: 3, fill: C.violet, border: rgba(C.violet, 0.7), bg: 'rgba(25,15,60,0.75)', scale: seg(t, m.k, m.k + 0.4, easeOutBack), alpha: seg(t, m.k, m.k + 0.2) });
    },
  });

  // =============== 8. CTA ===============
  const bowl = x => 1030 + 130 * Math.exp(-(((x - 540) / 250) ** 2));
  G.scenes.push({
    id: 'cta',
    mark: T => ({ never: T.w('m', 'never') - 0.15, just: T.w('m', "you're", 1) - 0.1, curve: T.w('m', 'curve') - 0.25, fol: T.w('n', 'Follow'), sci: T.w('n', 'science') }),
    events(T, m) {
      const J = [m.never, m.just, m.curve].flatMap(j => [{ t: j + 0.15, type: 'boing' }, { t: j + 0.85, type: 'thud', gain: 0.6 }]);
      return [...J, { t: m.fol, type: 'pop' }, { t: m.fol + 0.2, type: 'sparkle' }, { t: m.sci + 0.35, type: 'ding' }, { t: m.sci + 0.35, type: 'burst' }];
    },
    draw(ctx, S) {
      const { t, talk, m } = S;
      chapter(ctx, '08', 'THE BIG IDEA', t, C.cyan);
      // spacetime sheet bowl
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 5; k >= 0; k--) {
        const off = -k * 42 + (k ? 0 : 0); ctx.strokeStyle = k ? rgba(C.violet, 0.5 - k * 0.07) : C.cyan; ctx.lineWidth = k ? 3 : 8; ctx.shadowColor = C.cyan; ctx.shadowBlur = k ? 0 : 24;
        ctx.beginPath(); for (let x = 20; x <= 1060; x += 10) { const y = bowl(x) + off * (1 - 0.35 * Math.exp(-(((x - 540) / 250) ** 2))); x === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      }
      ctx.restore();
      // jumps follow the curve
      const jumps = [{ t0: m.never, xa: 540, xb: 800, h: 190 }, { t0: m.just, xa: 800, xb: 290, h: 240 }, { t0: m.curve, xa: 290, xb: 540, h: 190 }], dur = 0.9;
      let x = 540, lift = 0, air = false, crouch = 0;
      for (const j of jumps) {
        const u = (t - j.t0) / dur;
        if (u >= 1) x = j.xb;
        else if (u >= 0) { x = lerp(j.xa, j.xb, easeInOut(clamp((u - 0.12) / 0.76))); lift = j.h * 4 * clamp((u - 0.12) / 0.76) * (1 - clamp((u - 0.12) / 0.76)); air = u > 0.12 && u < 0.88; crouch = u < 0.12 ? u / 0.12 : u > 0.88 ? (1 - u) / 0.12 * 0.7 : 0; }
        // trail
        if (u > 0.1) { ctx.save(); ctx.setLineDash([2, 16]); ctx.lineCap = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = rgba(C.yellow, 0.85 * (1 - clamp((u - 1) / 1.6))); ctx.shadowColor = C.yellow; ctx.shadowBlur = 14; ctx.beginPath();
          const n = 40; for (let q = 0; q <= n; q++) { const s = q / n, xx = lerp(j.xa, j.xb, s); if (s > clamp((u - 0.12) / 0.76)) break; const yy = lerp(bowl(j.xa), bowl(j.xb), s) - 50 - j.h * 4 * s * (1 - s) - 130; q ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore(); }
      }
      // slope tilt of the figure
      const slope = (bowl(x + 6) - bowl(x - 6)) / 12, tilt = Math.atan(slope) * 0.6;
      const pose = air ? P({ A1: 2.5, A2: 0.3, B1: 2.5, B2: 0.3, L1: 0.55, L2: -0.9, R1: 0.55, R2: -0.9 }) : (crouch > 0 ? P({ A1: 0.5, B1: 0.5, L1: 0.55 * crouch, L2: -1.0 * crouch, R1: 0.55 * crouch, R2: -1.0 * crouch }) : Object.assign(P({}), wob(t)));
      const fol = t > m.fol - 0.1;
      const wavePose = fol ? Object.assign(P({ B1: 2.55 + Math.sin(t * 8) * 0.3, B2: 0.5, A1: 0.2 }), wob(t)) : pose;
      groundShadowSafe(ctx, x, bowl(x) + 6, 70 - lift * 0.1);
      ctx.save(); ctx.translate(x, bowl(x)); ctx.rotate(tilt * (air ? 0.3 : 1)); ctx.translate(-x, -bowl(x));
      stick(ctx, { x, ground: bowl(x), lift, s: 0.95, t, pose: wavePose, face: { talk, mouth: 'grin', eyes: air ? 'happy' : undefined, look: [0, 0] } });
      ctx.restore();
      // FOLLOW button
      const bk = seg(t, m.fol, m.fol + 0.55, easeOutElastic);
      if (bk > 0) {
        const clicked = t > m.sci + 0.35, pul = 1 + 0.03 * Math.sin(t * 6) * (clicked ? 0 : 1) + (clicked ? 0.1 * Math.max(0, 1 - (t - m.sci - 0.35) * 4) : 0);
        ctx.save(); ctx.translate(540, 560); ctx.scale(bk * pul, bk * pul);
        const g = ctx.createLinearGradient(-280, 0, 280, 0);
        if (clicked) { g.addColorStop(0, '#2fd18a'); g.addColorStop(1, '#4fd8ff'); } else { g.addColorStop(0, '#ff5fa2'); g.addColorStop(1, '#8a6bff'); }
        ctx.shadowColor = clicked ? C.green : C.pink; ctx.shadowBlur = 44; roundRect(ctx, -290, -75, 580, 150, 75); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.stroke();
        if (clicked) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-248, 2); ctx.lineTo(-222, 30); ctx.lineTo(-172, -26); ctx.stroke(); text(ctx, 'FOLLOWING', 58, 4, { size: 56, weight: 900 }); }
        else { text(ctx, '+', -190, 0, { size: 90, weight: 900 }); text(ctx, 'FOLLOW', 40, 4, { size: 66, weight: 900 }); }
        ctx.restore();
        chip(ctx, 'FOR MORE SCIENCE', 540, 705, { size: 30, spacing: 6, fill: '#fff', scale: seg(t, m.fol + 0.2, m.fol + 0.6, easeOutBack), alpha: seg(t, m.fol + 0.2, m.fol + 0.4) });
        // cursor
        const cu = seg(t, m.fol + 0.45, m.sci + 0.3, easeInOut), tap = Math.max(0, 1 - Math.abs(t - (m.sci + 0.35)) * 8);
        if (cu > 0 && t < m.sci + 1.4) { const cx = lerp(860, 600, cu), cy = lerp(900, 590, cu); ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - tap * 0.15, 1 - tap * 0.15); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#14153a'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 62); ctx.lineTo(16, 48); ctx.lineTo(30, 78); ctx.lineTo(44, 71); ctx.lineTo(30, 42); ctx.lineTo(52, 40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        burst(ctx, 540, 560, t, m.sci + 0.35, { n: 18, speed: 380, size: 16, colors: [C.yellow, C.pink, C.cyan, '#fff'], dur: 1.0, seed: 17 });
      }
    },
  });
  function groundShadowSafe(ctx, x, y, w) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, 'rgba(0,0,15,0.4)'); g.addColorStop(1, 'rgba(0,0,15,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore(); }
})(window.GR);
