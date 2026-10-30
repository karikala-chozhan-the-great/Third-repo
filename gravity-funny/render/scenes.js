// Seven comedy scenes. Everything is a pure function of time; beats are keyed to spoken words.
(function (G) {
  const { W, H, TAU, clamp, lerp, seg, easeOut, easeInOut, easeIn, easeOutBack, easeOutElastic, kf, bounce, bounceHits, puff, burst, roundRect, P, wob, lookAt, walk, L,
    stick2, ground2, shadow2, comic, tag, speech, phone, earth2, banana, ballBasket, bowling, dazed, bulb, inkText, apple, tree, joints } = G;
  G.scenes = G.scenes || [];
  const ev = (t, type, gain) => ({ t, type, gain });
  // chunky arrow with ink outline
  function arrow2(ctx, x1, y1, x2, y2, color, w, p = 1) {
    const dx = x2 - x1, dy = y2 - y1, Ln = Math.hypot(dx, dy); if (Ln < 4 || p <= 0) return; const a = Math.atan2(dy, dx), hl = Math.max(30, w * 2.4), ex = x1 + dx * p, ey = y1 + dy * p, bl = Math.max(0, Ln * p - hl * 0.6);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [c, ww] of [[L.ink, w + 9], [color, w]]) { ctx.strokeStyle = c; ctx.lineWidth = ww; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + Math.cos(a) * bl, y1 + Math.sin(a) * bl); ctx.stroke(); }
    if (Ln * p > hl) { ctx.fillStyle = color; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(a - 0.5) * hl, ey - Math.sin(a - 0.5) * hl); ctx.lineTo(ex - Math.cos(a + 0.5) * hl, ey - Math.sin(a + 0.5) * hl); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  const pop = (t, t0, d = 0.4) => seg(t, t0, t0 + d, easeOutBack);
  const DUST = '#CDB98A';

  // =============== 1. PHONE ===============
  const PH = { gy: 1180, sx: 400, s: 1.3, g: 2800 };
  const holdP = P({ B1: 2.45, B2: -0.5, A1: 0.2 });
  const shock = P({ A1: 2.6, A2: 0.6, B1: 2.6, B2: 0.6, L1: 0.3, R1: 0.3, lean: -0.05 });
  const reach = P({ B1: 0.55, B2: 0.35, A1: 0.2, lean: 0.12 });
  const phonePos0 = () => { const j = joints({ x: PH.sx, ground: PH.gy, s: PH.s, pose: holdP }); return [j.hand.B[0] + 16, j.hand.B[1] - 44]; };
  G.scenes.push({
    id: 'phone',
    mark: T => ({ rel: T.w('a', 'always') + 0.05, noth: T.w('b', 'nothing'), phys: T.w('b', 'physics') }),
    events(T, m) {
      const [, y0] = phonePos0(), hits = bounceHits(y0, PH.gy - 34, PH.g, 0.3, 2), e = [ev(0.1, 'pop'), ev(m.rel, 'slip')];
      hits.forEach((h, i) => e.push(ev(m.rel + h, i ? 'plop' : 'crack', 1 - 0.3 * i)));
      e.push(ev(m.rel + hits[0] + 0.2, 'pop'), ev(m.noth, 'swish'), ev(m.phys, 'boing'));
      return e;
    },
    draw(ctx, S) {
      const { t, talk, m } = S, [px0, py0] = phonePos0(), gyP = PH.gy - 34, tf = Math.sqrt((2 * (gyP - py0)) / PH.g), th = m.rel + tf;
      ground2(ctx, PH.gy); shadow2(ctx, PH.sx, PH.gy + 5, 90);
      // title
      const tOut = seg(t, m.rel - 0.25, m.rel + 0.25, easeInOut);
      if (tOut < 1) { ctx.save(); ctx.globalAlpha *= 1 - tOut; comic(ctx, 'GRAVITY', W / 2, 400 - tOut * 120, { size: 200, fill: L.sun, k: pop(t, 0.02, 0.45), rot: -0.05 }); ctx.restore(); }
      // phone state
      const restX = px0 + (th - m.rel) * 40; let ph = { x: px0, y: py0, rot: 0.15 + Math.sin(t * 2) * 0.02, back: false, cracked: false };
      if (t >= m.rel && t < m.noth) { const b = bounce(t - m.rel, py0, gyP, PH.g, 0.3), d = clamp((b.y - py0) / (gyP - py0)); ph = { x: px0 + (t - m.rel) * 40, y: b.y, rot: lerp(0.15, 7.85, d), back: d > 0.5, cracked: t > th }; }
      else if (t >= m.noth) { const u = seg(t, m.noth + 0.1, m.noth + 0.7, easeInOut); ph = { x: lerp(restX, px0, u), y: lerp(gyP, py0, u) - Math.sin(u * Math.PI) * 60, rot: lerp(7.85, 6.43, u), back: u < 0.5, cracked: true }; }
      const pose = kf([[0, holdP], [m.rel, holdP], [m.rel + 0.25, shock], [th + 0.7, shock], [m.noth - 0.05, P({})], [m.noth + 0.2, reach], [m.noth + 0.8, holdP]], t);
      const sinceHit = t - th, shocked = t > m.rel + 0.15 && sinceHit < 0.9, deadpan = t > m.noth + 0.6;
      const hd = [PH.sx, 820];
      const fc = { talk, look: t < m.rel ? lookAt(hd, [ph.x, ph.y], 4) : [0, 3], mouth: shocked ? 'scream' : deadpan ? 'flat' : t < m.rel ? 'smirk' : 'frown', eyes: shocked ? 'wide' : deadpan ? 'half' : t < m.rel ? 'normal' : 'wide', brow: shocked ? 0.9 : 0, raise: t < m.rel ? 0.2 : 0 };
      const j = stick2(ctx, { x: PH.sx, ground: PH.gy, s: PH.s, t, pose: Object.assign({}, pose, wob(t, 0.5)), face: fc });
      phone(ctx, ph.x, ph.y, ph.rot, ph);
      if (t > th) { comic(ctx, 'CRACK!', px0 + 250, PH.gy - 230, { size: 120, fill: L.coral, k: pop(t, th, 0.25) * (1 - seg(t, th + 0.8, th + 1.2)), rot: 0.08, shake: 5 * (1 - seg(t, th, th + 0.4)), t }); }
      speech(ctx, 'NOOOOO!', 640, 650, { tail: [j.head[0] + 60, j.head[1] - 10], k: pop(t, th + 0.15, 0.3) * (1 - seg(t, th + 1.2, th + 1.5)) });
      const sk = pop(t, m.phys, 0.7);
      if (sk > 0) { const k = easeOutElastic(clamp((t - m.phys) / 0.7)); ctx.save(); ctx.translate(850, PH.gy); ctx.scale(1, k);
        ctx.fillStyle = '#B5793A'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; roundRect(ctx, -9, -250, 18, 250, 4); ctx.fill(); ctx.stroke();
        ctx.translate(0, -300); roundRect(ctx, -170, -70, 340, 140, 18); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(850, PH.gy - 300 * k); ctx.scale(k > 0.1 ? 1 : 0, 1); inkText(ctx, 'NOT SORRY.', 0, -16, { size: 50, weight: 900 }); inkText(ctx, '— GRAVITY', 0, 30, { size: 36, fill: L.coral, weight: 900 }); ctx.restore(); }
    },
  });

  // =============== 2. PULL ===============
  const E = { x: 800, y: 990, r: 250 }, PS = { s: 1.0, start: [150, 600] };
  const standHipY = (s, pose) => joints({ x: 0, ground: 0, s, pose: pose || P({}) }).hipY;
  G.scenes.push({
    id: 'pull',
    mark: T => ({ pulls: T.w('c', 'pulls'), yes: T.w('c', 'Yes'), even: T.w('c', 'even'), back: T.w('d', 'back'), heavy: T.w('d', 'heavier'), moving: T.w('d', 'moving') }),
    events(T, m) { const tl = m.moving + 0.1; return [ev(0.15, 'pop', 0.6), ev(m.pulls, 'swish'), ev(m.yes, 'boing'), ev(m.back, 'pop'), ev(m.heavy, 'pop'), ev(tl - 0.9, 'whoosh', 0.6), ev(tl, 'splat'), ev(tl + 0.25, 'pop')]; },
    draw(ctx, S) {
      const { t, talk, m } = S, tl = m.moving + 0.1, tS = tl - 0.9, u = clamp((t - tS) / 0.9);
      const dir = (() => { const dx = PS.start[0] - E.x, dy = PS.start[1] - E.y, d = Math.hypot(dx, dy); return [dx / d, dy / d]; })();
      const sp = [E.x + dir[0] * E.r, E.y + dir[1] * E.r], rho = Math.atan2(dir[0], -dir[1]) * 0 + Math.atan2(-(-dir[0]), -dir[1]);
      const hy = standHipY(PS.s), land = [sp[0] - hy * Math.sin(rho), sp[1] + hy * Math.cos(rho)];
      const landed = t >= tl, sinceL = t - tl;
      // Earth
      const wobE = t > tS && t < tl ? Math.sin(t * 60) * 1.2 : 0, bump = landed ? Math.sin(clamp(sinceL / 0.3) * Math.PI) * 8 : 0;
      earth2(ctx, E.x + wobE, E.y + bump, E.r, { mouth: landed && sinceL < 0.7 ? 'o' : 'smirk' });
      // stickman (floating, flying, landed)
      const bob = Math.sin(t * 2.2) * 10;
      if (!landed) {
        const hip = t < tS ? [PS.start[0], PS.start[1] + bob] : [lerp(PS.start[0], land[0], easeIn(u)), lerp(PS.start[1], land[1], easeIn(u))];
        const r = t < tS ? 0 : rho * easeInOut(clamp(u * 1.5));
        const flex = t > m.yes && t < m.back;
        const pose = flex ? P({ A1: 1.57, A2: 1.57, B1: 1.57, B2: 1.57, L1: 0.3, R1: 0.3 }) : t < tS ? P({ A1: 0.9, A2: -1.4, B1: 0.9, B2: -1.4, L1: 0.2, R1: 0.2 }) : P({ A1: 2.3 + Math.sin(t * 20) * 0.5, A2: 0.3, B1: 2.3 + Math.sin(t * 20 + 2) * 0.5, B2: 0.3, L1: 0.5, R1: 0.5 });
        stick2(ctx, { x: hip[0], hipY: hip[1], rot: r, s: PS.s, t, pose: Object.assign({}, pose, t < tS ? wob(t) : {}), face: { talk, look: [4, 1.5], mouth: flex ? 'teeth' : t >= tS ? 'scream' : 'smirk', eyes: t >= tS ? 'wide' : 'normal', brow: flex ? -0.8 : 0 } });
        // forces
        const C0 = [hip[0], hip[1] - 60], d0 = Math.hypot(E.x - C0[0], E.y - C0[1]), un = [(E.x - C0[0]) / d0, (E.y - C0[1]) / d0], ap = seg(t, m.pulls, m.pulls + 0.5, easeOut) * (1 - seg(t, tS - 0.1, tS + 0.1));
        if (ap > 0) {
          arrow2(ctx, C0[0] + un[0] * 120, C0[1] + un[1] * 120, C0[0] + un[0] * 235, C0[1] + un[1] * 235, L.teal, 16, ap);
          const es = [E.x - un[0] * (E.r + 16), E.y - un[1] * (E.r + 16)]; arrow2(ctx, es[0], es[1], es[0] - un[0] * 115, es[1] - un[1] * 115, L.coral, 16, ap);
          tag(ctx, '686 N', C0[0] + un[0] * 180, C0[1] + un[1] * 180 - 62, { k: pop(t, m.even), bg: '#CCFBF1', rot: -0.05 });
          tag(ctx, '686 N', es[0] - un[0] * 60, es[1] - un[1] * 60 + 56, { k: pop(t, m.back), bg: '#FFE0E0', rot: 0.05 });
        }
      } else {
        ctx.save(); ctx.translate(sp[0], sp[1] + bump); ctx.rotate(rho); const sq = 1 - 0.25 * Math.sin(clamp(sinceL / 0.25) * Math.PI);
        stick2(ctx, { x: 0, ground: 0, s: PS.s, sy: sq, t, pose: Object.assign(P({ B1: 2.5, B2: 0.2, A1: 0.3 }), wob(t)), face: { talk, mouth: 'grin', eyes: sinceL < 0.5 ? 'x' : 'happy', brow: 0 } });
        ctx.restore();
        comic(ctx, 'OOF!', 470, 700, { size: 110, fill: L.coral, k: pop(t, tl, 0.25) * (1 - seg(t, tl + 1.1, tl + 1.5)), rot: -0.1, shake: 4 * (1 - seg(t, tl, tl + 0.3)), t });
      }
      tag(ctx, 'YOU: 70 kg', 170, 850, { k: pop(t, m.heavy + 0.1), bg: '#CCFBF1' }); tag(ctx, 'EARTH: 6×10²⁴ kg', 790, 600, { k: pop(t, m.heavy), bg: '#DBEAFE', size: 32 });
      tag(ctx, 'EARTH MOVED: 0.000000000001 mm', 700, 1285, { k: pop(t, tl - 0.8) * (landed ? 1 : 1), size: 26, bg: '#FFF3B0', rot: -0.02 });
    },
  });

  // =============== 3. FALL ===============
  const FL = { gy: 1180, cliffTop: 700, cliffX: 420, s: 0.85 };
  const lying = P({ A1: 1.9, A2: 0.2, B1: 1.9, B2: 0.2, L1: 0.5, R1: 0.5, head: 0.15 });
  function cliff(ctx, x0, x1) { ctx.save(); const g = ctx.createLinearGradient(0, FL.cliffTop, 0, FL.gy); g.addColorStop(0, '#D9BE84'); g.addColorStop(1, '#C49E62'); ctx.fillStyle = g; ctx.strokeStyle = L.ink; ctx.lineWidth = 6; ctx.fillRect(x0, FL.cliffTop, x1 - x0, FL.gy - FL.cliffTop + 40); ctx.strokeStyle = 'rgba(27,28,46,0.15)'; ctx.lineWidth = 4; for (let y = FL.cliffTop + 80; y < FL.gy; y += 80) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); } ctx.strokeStyle = L.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, FL.cliffTop); ctx.lineTo(x1, FL.cliffTop); ctx.lineTo(x1, FL.gy); ctx.stroke(); ctx.fillStyle = '#4ADE80'; ctx.fillRect(x0, FL.cliffTop - 2, x1 - x0, 14); ctx.restore(); }
  G.scenes.push({
    id: 'fall',
    mark: T => ({ tF: Math.max(T.w('e', 'speed'), 1.15), tL: T.le('e') - 0.2, tP: T.ls('f') - 0.2, slip: T.w('f', 'tripping', 0) + 0.2, emb: T.w('f', 'embarrassing'), but: T.w('f', 'but'), cl: T.w('f', 'cliff'), prob: T.w('f', 'problem') }),
    events(T, m) { return [ev(0.15, 'pop', 0.6), ev(m.tF - 0.15, 'gulp'), ev(m.tF, 'slide'), ev(m.tL, 'splat'), ev(m.tP + 0.3, 'whoosh', 0.5), ev(m.slip, 'slip'), ev(m.slip + 0.55, 'plop'), ev(m.emb, 'pop'), ev(m.cl, 'gulp'), ev(m.prob, 'pop')]; },
    draw(ctx, S) {
      const { t, talk, m } = S, ph = seg(t, m.tP, m.tP + 0.5, easeInOut), s = FL.s, hOff = standHipY(s, P({}));
      // ---------- phase 1: the cliff ----------
      if (ph < 1) {
        ctx.save(); ctx.translate(-ph * 1200, 0); ctx.globalAlpha *= 1 - ph * 0.6;
        ground2(ctx, FL.gy); cliff(ctx, -40, FL.cliffX);
        const tauMax = 2.4, k = tauMax / (m.tL - m.tF), tau = clamp(k * (t - m.tF), 0, tauMax), falling = t >= m.tF && t < m.tL, landed = t >= m.tL;
        const hip0 = FL.cliffTop + hOff, hipEnd = FL.gy - 22, ppm = (FL.gy + hOff - hip0) / (0.5 * 9.8 * tauMax * tauMax);
        const tEdge = 0.85; let x = lerp(150, 462, clamp((t - 0.1) / (tEdge - 0.1)));
        if (t < m.tF) {
          const walking = t < tEdge, onCliff = x < FL.cliffX + 10;
          const hover = t >= tEdge ? seg(t, tEdge, m.tF) : 0;
          const pose = walking || (t < tEdge + 0.35) ? Object.assign(walk(t * 11), {}) : P({ A1: 0.4, B1: 0.4, L1: 0.25, R1: 0.25 });
          stick2(ctx, { x, hipY: hip0, s, t, pose, face: { talk, look: t < tEdge ? [4, 0] : [0, 4.5], eyes: t < tEdge ? 'normal' : 'wide', mouth: t < tEdge ? 'smile' : 'wavy', sweat: hover > 0.2 ? 1 : 0, brow: hover > 0.2 ? 0.9 : 0 } });
          if (hover > 0.3) speech(ctx, 'Oh no.', x + 130, hip0 - 350, { tail: [x + 20, hip0 - 250], k: pop(t, tEdge + 0.3, 0.3), size: 34 });
        } else if (falling) {
          const y = hip0 + 0.5 * 9.8 * tau * tau * ppm, fx = 462 + tau * 14;
          for (let i = 0; i < 5; i++) { ctx.save(); ctx.strokeStyle = 'rgba(27,28,46,0.3)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; const lx = fx - 90 + i * 45, ly = y - 330 - (i % 2) * 40; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - 40 - tau * 20); ctx.stroke(); ctx.restore(); }
          stick2(ctx, { x: fx, hipY: y, rot: Math.sin(t * 9) * 0.3, s, t, pose: P({ A1: 2.4 + Math.sin(t * 16) * 0.5, A2: 0.3, B1: 2.4 + Math.sin(t * 16 + 2) * 0.5, B2: 0.3, L1: 0.6 + Math.sin(t * 14) * 0.3, R1: 0.6 + Math.sin(t * 14 + 1) * 0.3 }), face: { talk: 0, mouth: 'scream', eyes: 'wide', brow: 0.9 } });
          comic(ctx, 'AAAAAH!', fx + 190, y - 260, { size: 70 + tau * 24, fill: L.coral, k: 1, rot: 0.12, shake: 4, t });
        } else if (landed) {
          const d = t - m.tL, fx = 462 + tauMax * 14;
          stick2(ctx, { x: fx, hipY: lerp(hipEnd - 20, hipEnd, 1), rot: -Math.PI / 2, s, sy: 1 - 0.2 * Math.max(0, 1 - d * 5), t, pose: lying, face: { mouth: 'wavy', eyes: 'spiral' } });
          dazed(ctx, fx - 153 * s - 20, hipEnd - 80, t); puff(ctx, fx, FL.gy - 4, t, m.tL, { n: 8, spread: 120, size: 24, dur: 0.8, color: DUST });
          comic(ctx, 'SPLAT!', fx + 100, FL.gy - 300, { size: 120, fill: L.coral, k: pop(t, m.tL, 0.25), rot: -0.08, shake: 6 * (1 - seg(t, m.tL, m.tL + 0.4)), t });
        }
        // speed readout
        const rk = pop(t, m.tF - 0.2, 0.4);
        if (rk > 0) { ctx.save(); ctx.translate(790, 470); ctx.scale(rk, rk); roundRect(ctx, -240, -80, 480, 160, 26); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = L.ink; ctx.stroke();
          inkText(ctx, 'SPEED', 0, -44, { size: 26, spacing: 6, fill: '#6b7280' }); inkText(ctx, `${(9.8 * tau).toFixed(1)} m/s`, 0, 18, { size: 84, weight: 900, fill: tau > 1.6 ? L.coral : L.ink }); ctx.restore(); }
        ctx.restore();
      }
      // ---------- phase 2: banana vs cliff ----------
      if (ph > 0) {
        ctx.save(); ctx.translate((1 - ph) * 1200, 0); ctx.globalAlpha *= ph;
        ground2(ctx, FL.gy); const gy = FL.gy; ctx.save(); ctx.translate(0, 0); cliff(ctx, 900, 1150); ctx.restore();
        const u = (t - m.slip) / 1.0, up = t < m.slip ? 0 : clamp(u / 0.5), lyingNow = t >= m.slip + 0.5, getUp = seg(t, m.but - 0.1, m.but + 0.45, easeInOut);
        const bx = 640 + (t < m.slip ? 0 : Math.min(130, (t - m.slip) * 260)), by = gy - 16 - (t < m.slip ? 0 : 130 * Math.sin(Math.PI * clamp((t - m.slip) / 0.5)) * (1 - clamp((t - m.slip) / 0.6)));
        banana(ctx, bx, by, t < m.slip ? 0.1 : (t - m.slip) * 6, 1.1);
        let x, hipY, rot = 0, pose, fc;
        if (t < m.slip) { x = lerp(330, 600, clamp((t - m.tP) / (m.slip - m.tP))); hipY = gy + hOff; pose = Object.assign(walk(t * 12), {}); fc = { talk, look: [4, 0], mouth: 'smile' }; }
        else if (!lyingNow) { x = 600 + 90 * up; rot = -Math.PI / 2 * easeInOut(up); hipY = gy + hOff - 150 * Math.sin(up * Math.PI) + (gy - 22 - (gy + hOff)) * easeIn(up) * 0; pose = P({ A1: 2.5 + Math.sin(t * 25) * 0.4, B1: 2.5 + Math.sin(t * 25 + 2) * 0.4, A2: 0.3, B2: 0.3, L1: 0.6, R1: 0.9 }); fc = { mouth: 'scream', eyes: 'wide', brow: 0.9 }; hipY = lerp(hipY, hipY, 1); }
        else { x = 690; const g2 = getUp; rot = -Math.PI / 2 * (1 - g2); hipY = lerp(gy - 24, gy + hOff, g2); pose = g2 > 0.5 ? P({ A1: 0.9, A2: -1.4, B1: 0.9, B2: -1.4 }) : P({ A1: 1.9, B1: 1.9, L1: 0.3, R1: 0.3 }); fc = { talk, mouth: 'wavy', eyes: 'closed', blush: 1 }; }
        if (t >= m.but + 0.4) { const lookCliff = t > m.cl - 0.1; fc = { talk, look: lookCliff ? [5, 0] : [0, 0], mouth: t > m.prob ? 'wavy' : 'flat', eyes: lookCliff ? 'wide' : 'half', sweat: lookCliff ? 1 : 0, brow: lookCliff ? 0.9 : 0 }; pose = t > m.prob ? P({ B1: 2.5 + Math.sin(t * 9) * 0.3, B2: 0.4, A1: 0.2 }) : P({ A1: 0.9, A2: -1.4, B1: 0.9, B2: -1.4 }); }
        if (t >= m.slip + 0.5 && t < m.slip + 1.8) dazed(ctx, 690 - 150, gy - 120, t, 55);
        stick2(ctx, { x, hipY, rot, s, t, pose: Object.assign({}, pose, t >= m.but + 0.4 ? wob(t) : {}), face: fc });
        comic(ctx, 'OOF!', 640, gy - 330, { size: 100, fill: L.coral, k: pop(t, m.slip + 0.5, 0.25) * (1 - seg(t, m.slip + 1.3, m.slip + 1.6)), rot: -0.1 });
        tag(ctx, 'EMBARRASSING', 560, gy - 420, { k: pop(t, m.emb) * (1 - seg(t, m.but + 0.5, m.but + 0.8)), bg: '#FFE0EE', size: 34, rot: -0.04 });
        tag(ctx, 'PROBLEM', 930, FL.cliffTop - 80, { k: pop(t, m.prob - 0.1), bg: '#FFE0E0', fill: L.coral, size: 40, rot: 0.06 });
        ctx.restore();
      }
    },
  });

  // =============== 4. NEWTON ===============
  const NW = { gy: 1180, s: 0.85, ax: [290, 790], ay: 705, ar: 30, g: 1800, tx: 540 };
  G.scenes.push({
    id: 'newton',
    mark: T => ({ r1: T.w('g', 'apple') - 0.05, r2: T.w('h', 'apple') - 0.05, disc: T.w('g', 'discovered'), pain: T.w('h', 'pain') }),
    events(T, m) { const hh = joints({ x: 0, ground: NW.gy, s: NW.s, pose: P({}) }).head[1] - 50 * NW.s - NW.ar, tf = Math.sqrt((2 * (hh - NW.ay)) / NW.g); return [ev(0.15, 'pop', 0.6), ev(m.r1 - 0.25, 'rustle'), ev(m.r1 + tf, 'bonk'), ev(m.r1 + tf + 0.25, 'ding'), ev(m.r2 - 0.25, 'rustle'), ev(m.r2 + tf, 'bonk'), ev(m.r2 + tf + 0.3, 'wah')]; },
    draw(ctx, S) {
      const { t, talk, m } = S; ground2(ctx, NW.gy);
      const hh = joints({ x: 0, ground: NW.gy, s: NW.s, pose: P({}) }).head[1] - 50 * NW.s - NW.ar, tf = Math.sqrt((2 * (hh - NW.ay)) / NW.g);
      const sway = (t > m.r1 - 0.3 && t < m.r1 ? Math.sin(t * 60) * 6 : 0) + (t > m.r2 - 0.3 && t < m.r2 ? Math.sin(t * 60) * 6 : 0);
      tree(ctx, NW.tx, NW.gy, 1.25, sway);
      const person = (i, rel, who) => {
        const x = NW.ax[i], th = rel + tf, hit = t - th, looking = t < th;
        const apx = x, appleY = t < rel ? NW.ay : t < th ? NW.ay + 0.5 * NW.g * (t - rel) ** 2 : bounce(t - th, hh, NW.gy - NW.ar, NW.g, 0.4).y;
        const dip = hit > 0 && hit < 0.2 ? Math.sin((hit / 0.2) * Math.PI) * 14 : 0;
        const pose = looking ? P({ head: 0.12, A1: 0.25, B1: 0.25 }) : who === 0 ? (hit > 0.3 ? P({ A1: 2.6, A2: 0.2, B1: 0.3 }) : P({ A1: 0.25, B1: 0.25 })) : (hit > 0.2 ? P({ A1: 2.4, A2: 1.9, B1: 2.4, B2: 1.9 }) : P({ A1: 0.25, B1: 0.25 }));
        const happy = who === 0 && hit > 0.4, ouch = who === 1 && hit > 0.4;
        const j = stick2(ctx, { x, ground: NW.gy, s: NW.s, lift: -dip, t, hat: who === 0 ? 'wig' : undefined, bump: who === 1 && hit > 0.1 ? easeOut(clamp(hit / 0.4)) : 0, pose: Object.assign({}, pose, wob(t)),
          face: { talk: who === 1 && t > m.r2 - 1.5 && t < m.r2 + 1 ? talk : who === 0 && t < m.r1 + 1.2 ? talk : 0, look: looking ? [0, -4.5] : [0, 0], eyes: hit > 0 && hit < 0.4 ? 'x' : happy ? 'happy' : ouch ? 'spiral' : 'normal', mouth: happy ? 'grin' : ouch ? 'frown' : hit > 0 ? 'o' : 'smile', raise: looking ? 0.6 : 0, noTalk: false } });
        if (t < th) apple(ctx, apx + (t < rel ? Math.sin(t * 40) * 1.5 * (sway ? 1 : 0) : 0), appleY, NW.ar, t > rel ? (t - rel) * 3 : 0);
        else apple(ctx, apx + (t - th) * (i ? 130 : -130), appleY, NW.ar, (t - th) * 6 * (i ? 1 : -1));
        if (hit > 0 && hit < 0.5) burst(ctx, x, hh + 20, t, th, { n: 9, speed: 110, size: 16, colors: [L.sun, '#fff'], dur: 0.5, seed: 4 });
        if (who === 0 && hit > 0.25) { const k = easeOutElastic(clamp((hit - 0.25) / 0.5)); bulb(ctx, j.head[0], j.head[1] - 150 + (1 - k) * 40, k, t); comic(ctx, 'EUREKA!', x + 20, j.head[1] - 300, { size: 84, fill: L.blue, k: pop(t, th + 0.4, 0.3), rot: -0.06 }); }
        if (who === 1 && hit > 0.1) { dazed(ctx, j.head[0], j.head[1] - 85, t, 55 * Math.min(1, hit * 4)); comic(ctx, 'OUCH!', x + 10, j.head[1] - 260, { size: 100, fill: L.coral, k: pop(t, th + 0.2, 0.25), rot: 0.08, shake: 3, t }); }
      };
      person(0, m.r1, 0); person(1, m.r2, 1);
      tag(ctx, 'NEWTON', NW.ax[0], 1262, { k: pop(t, 0.2), bg: '#FFF3B0' }); tag(ctx, 'ME', NW.ax[1], 1262, { k: pop(t, 0.35), bg: '#DBEAFE' });
      tag(ctx, 'DISCOVERED: GRAVITY', NW.ax[0], 400, { k: pop(t, m.disc) * (1 - seg(t, m.r2 - 0.2, m.r2)), bg: '#DCFCE7', size: 28, rot: -0.04 });
      tag(ctx, 'DISCOVERED: PAIN', NW.ax[1], 400, { k: pop(t, m.pain), bg: '#FFE0E0', size: 28, rot: 0.04 });
    },
  });

  // =============== 5. MOON ===============
  const MN = { gy: 1180, ax: 300, s: 0.95, hoopX: 890, rimY: 735 };
  const dunkP = P({ B1: 3.0, B2: 0.0, A1: 1.3, A2: 0.3, L1: 0.5, L2: -0.9, R1: 0.5, R2: -0.9 });
  G.scenes.push({
    id: 'moon',
    mark: T => ({ moon: T.w('i', 'Moon'), six: T.w('i', 'six'), dunk: T.w('j', 'dunk') + 0.05, ath: T.w('j', 'athletic') }),
    events(T, m) { return [ev(0.15, 'pop', 0.6), ev(m.moon + 0.1, 'boing', 0.6), ev(m.six, 'pop'), ev(m.dunk - 1.75, 'slide_up'), ev(m.dunk, 'dunk'), ev(m.dunk + 0.1, 'tada'), ev(m.ath, 'pop'), ev(m.ath - 0.4 + 0.9, 'plop')]; },
    draw(ctx, S) {
      const { t, talk, m } = S, s = MN.s, gy = MN.gy;
      earth2(ctx, 900, 480, 66, { glasses: true }); ground2(ctx, gy, { color: L.moon, dark: L.moonDark });
      ctx.fillStyle = 'rgba(120,112,170,0.28)'; ctx.strokeStyle = 'rgba(27,28,46,0.25)'; ctx.lineWidth = 3; for (const [x, y, rx] of [[120, 1230, 60], [520, 1250, 80], [760, 1225, 46], [980, 1245, 62]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.22, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      // hoop
      const rattle = t > m.dunk && t < m.dunk + 0.5 ? Math.sin((t - m.dunk) * 60) * 4 * (1 - (t - m.dunk) / 0.5) : 0;
      ctx.save(); ctx.fillStyle = '#9CA3AF'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; roundRect(ctx, 972, 640, 16, gy - 640, 4); ctx.fill(); ctx.stroke(); roundRect(ctx, 946, 560, 20, 190, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
      ctx.translate(0, rattle); ctx.strokeStyle = 'rgba(27,28,46,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = -48 + i * 16; ctx.moveTo(MN.hoopX + a, MN.rimY + 6); ctx.lineTo(MN.hoopX + a * 0.6, MN.rimY + 80); } ctx.moveTo(MN.hoopX - 38, MN.rimY + 40); ctx.lineTo(MN.hoopX + 38, MN.rimY + 40); ctx.stroke();
      ctx.strokeStyle = L.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(MN.hoopX, MN.rimY, 50, 12, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = L.coral; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
      // astronaut
      const hOffS = joints({ x: 0, ground: 0, s, pose: P({}), suit: true }).hipY, offD = joints({ x: 0, hipY: 0, s, pose: dunkP, suit: true }).hand.B;
      const tgt = [MN.hoopX - offD[0], MN.rimY - 8 - offD[1]], hipG = gy + hOffS, tJ = m.dunk - 1.75, u = clamp((t - tJ) / 1.75), tR = m.ath - 0.35, dropD = hipG - tgt[1], gM = (2 * dropD) / 0.85 ** 2;
      let x = MN.ax, hipY = hipG, pose = P({ B1: 0.3, A1: 0.3 }), face = { talk, mouth: 'smile', look: [0, 0], eyes: 'wide' };
      const hop = t > m.moon + 0.05 && t < m.moon + 0.6 ? Math.sin(((t - m.moon - 0.05) / 0.55) * Math.PI) * 34 : 0; hipY -= hop; if (hop) pose = P({ A1: 0.9, B1: 0.9, L1: 0.3, R1: 0.3 });
      if (t >= tJ && t < tR) { const e = easeInOut(u); x = lerp(MN.ax, tgt[0], e); hipY = lerp(hipG, tgt[1], easeOut(u)); pose = kf([[0, P({ B1: 0.3, A1: 0.3 })], [1, dunkP]], u); face = { talk, mouth: 'grin', eyes: 'wide', look: [4, -2] }; if (t >= m.dunk) { x = tgt[0] + Math.sin((t - m.dunk) * 3) * 6; hipY = tgt[1]; pose = dunkP; face = { talk, mouth: 'grin', eyes: 'happy' }; } }
      else if (t >= tR) { const d = t - tR, tt = Math.min(d, 0.85); x = tgt[0] + 0; hipY = Math.min(hipG, tgt[1] + 0.5 * gM * tt * tt); pose = hipY < hipG - 2 ? P({ A1: 2.0, B1: 2.0, A2: 0.2, B2: 0.2 }) : P({ B1: 0.3, A1: 0.3 }); face = { talk, mouth: 'smirk', eyes: 'half', look: [-4, 0] }; }
      shadow2(ctx, x, gy + 5, 80, 0.14);
      const j = stick2(ctx, { x, hipY, s, t, suit: true, hat: 'helmet', pose: Object.assign({}, pose, t < tJ ? wob(t, 0.5) : {}), face });
      // ball
      const bTh = m.dunk + 0.12;
      if (t < m.dunk) ballBasket(ctx, j.hand.B[0] + 6, j.hand.B[1] - 14, 28, t * 2);
      else { const b = bounce(t - m.dunk, MN.rimY - 20, gy - 28, 2200, 0.55, 3); ballBasket(ctx, MN.hoopX + (t - m.dunk) * -20, b.y, 28, (t - m.dunk) * 5); }
      tag(ctx, 'EARTH: 0.5 m', 230, 640, { k: pop(t, m.moon) * (1 - seg(t, m.six + 0.4, m.six + 0.7)), bg: '#DBEAFE', rot: -0.04 }); tag(ctx, 'MOON GRAVITY = ⅙', 540, 560, { k: pop(t, m.six - 0.1), bg: '#EDE9FE', size: 34, rot: 0.03 });
      comic(ctx, 'SLAM!', 520, 800, { size: 150, fill: L.blue, k: pop(t, m.dunk, 0.25) * (1 - seg(t, m.dunk + 0.9, m.dunk + 1.3)), rot: -0.1, shake: 6 * (1 - seg(t, m.dunk, m.dunk + 0.4)), t });
      tag(ctx, 'ATHLETIC*', 330, 760, { k: pop(t, m.ath), bg: '#DCFCE7', size: 38, rot: -0.05 }); inkText(ctx, '*ONLY ON THE MOON', 330, 830, { size: 26, spacing: 2, alpha: seg(t, m.ath + 0.2, m.ath + 0.5), fill: '#6b7280' });
    },
  });

  // =============== 6. EINSTEIN ===============
  const sheetY = (x, sag) => 760 + sag * Math.exp(-(((x - 700) / 150) ** 2));
  G.scenes.push({
    id: 'einstein',
    mark: T => ({ ein: T.w('k', 'Einstein'), mass: T.w('k', 'mass'), bends: T.w('k', 'bends'), curve: T.w('k', 'curve'), l0: T.ls('l'), fall: T.w('l', 'falling'), foll: T.w('l', 'following'), dir: T.w('l', 'directions') }),
    events(T, m) { return [ev(0.15, 'pop', 0.6), ev(m.mass, 'slide_up', 0.4), ev(m.mass + 0.3, 'plop'), ev(m.bends + 0.1, 'boing'), ev(m.l0 + 0.1, 'pop'), ev(m.foll, 'tick'), ev(m.foll + 0.9, 'tick'), ev(m.dir, 'pop')]; },
    draw(ctx, S) {
      const { t, talk, m } = S, gy = 1180; ground2(ctx, gy);
      const sag = 250 * easeOutBack(seg(t, m.mass + 0.3, m.mass + 1.25)) * (t > m.mass + 0.3 ? 1 : 0);
      // posts + sheet
      ctx.save(); ctx.fillStyle = '#9CA3AF'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; for (const px of [350, 1040]) { roundRect(ctx, px - 10, 760, 20, gy - 760, 4); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(20,184,166,0.35)'; ctx.lineWidth = 3; for (let x = 360; x <= 1030; x += 22) { const y = sheetY(x, sag); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.stroke(); }
      const curve = () => { ctx.beginPath(); for (let x = 350; x <= 1040; x += 6) { const y = sheetY(x, sag); x === 350 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = L.ink; ctx.lineWidth = 22; curve(); ctx.stroke(); ctx.strokeStyle = L.teal; ctx.lineWidth = 12; curve(); ctx.stroke(); ctx.restore();
      const r = 48, bTop = 330, ballY = Math.min(bTop + 0.5 * 2600 * Math.max(0, t - m.mass) ** 2, sheetY(700, sag) - r);
      if (t > m.mass - 0.05) bowling(ctx, 700, ballY, r);
      // marble following the curve
      const ma = (1 - seg(t, m.l0 - 0.3, m.l0)) * seg(t, m.curve - 1.5, m.curve - 1.3);
      if (t > m.curve - 1.6 && ma > 0) { const tau = Math.max(0, t - (m.curve - 1.6)), mx = 700 - 320 * Math.cos(2.6 * tau) * Math.exp(-0.18 * tau); ctx.save(); ctx.globalAlpha *= ma; G.ball(ctx, mx, sheetY(mx, sag) - 20, 20, L.pink, { glow: 'rgba(0,0,0,0)', glowBlur: 0, dark: 'rgba(27,28,46,0.3)' }); ctx.beginPath(); ctx.strokeStyle = L.ink; ctx.lineWidth = 4; ctx.arc(mx, sheetY(mx, sag) - 20, 20, 0, TAU); ctx.stroke(); ctx.restore(); }
      // Einstein
      stick2(ctx, { x: 160, ground: gy, s: 0.92, t, hat: 'einstein', pose: Object.assign(P({ B1: 2.0 + Math.sin(t * 2) * 0.05, B2: 0.25, A1: 0.25 }), wob(t)), face: { talk: t < m.l0 + 0.1 ? talk : 0, look: [4, -1], mouth: 'smile', raise: 0.3 } });
      shadow2(ctx, 160, gy + 5, 80);
      tag(ctx, 'EINSTEIN', 160, 1262, { k: pop(t, m.ein), bg: '#EDE9FE' });
      tag(ctx, 'MASS BENDS SPACE', 700, 500, { k: pop(t, m.bends), bg: '#CCFBF1', size: 32, rot: -0.03 });
      // narrator following directions
      const w0 = m.l0 + 0.15; if (t > w0) {
        const u = easeInOut(clamp((t - w0) / (m.dir - w0 + 0.4))), nx = lerp(385, 625, u), ny = sheetY(nx, sag), sl = (sheetY(nx + 5, sag) - sheetY(nx - 5, sag)) / 10, tilt = Math.atan(sl), k = pop(t, w0, 0.3);
        ctx.save(); ctx.translate(nx, ny); ctx.rotate(tilt); ctx.scale(k, k);
        const jj = stick2(ctx, { x: 0, ground: 0, s: 0.62, t, pose: Object.assign(walk(t * 9, 0.8), { B1: 2.2, B2: -0.3 }), face: { talk: talk, look: [0, -2], mouth: 'smile', eyes: t > m.dir ? 'wide' : 'normal' } });
        ctx.save(); ctx.translate(jj.hand.B[0] + 6, jj.hand.B[1] - 18); ctx.scale(0.5, 0.5); phone(ctx, 0, 0, 0.1, {}); ctx.restore(); ctx.restore();
        speech(ctx, 'Recalculating...', nx + 30, ny - 330, { tail: [nx + 10, ny - 235], k: pop(t, m.fall, 0.3) * (1 - seg(t, m.foll + 0.5, m.foll + 0.75)), size: 34 });
        speech(ctx, 'Turn left at\nthe bowling ball', nx + 70, ny - 340, { tail: [nx + 12, ny - 235], k: pop(t, m.foll + 0.6, 0.3), size: 34 });
      }
    },
  });

  // =============== 7. CTA ===============
  const CT = { gy: 1180, sx: 330, s: 0.9 };
  G.scenes.push({
    id: 'cta',
    mark: T => ({ trip: T.w('m', 'trip') - 0.15, blame: T.w('m', 'blame'), fol: T.w('n', 'Follow'), sci: T.w('n', 'science'), res: T.w('n', 'Resistance'), wins: T.w('n', 'wins'), grav: T.w('n', 'Gravity') }),
    events(T, m) { return [ev(0.15, 'pop', 0.6), ev(m.trip, 'slip'), ev(m.trip + 0.6, 'plop'), ev(m.blame, 'pop'), ev(m.fol, 'whoosh', 0.5), ev(m.fol + 0.45, 'plop'), ev(m.sci + 0.3, 'ding'), ev(m.sci + 0.3, 'burst'), ev(m.res, 'slide_up'), ev(m.res + 1.3, 'splat', 0.8), ev(m.wins, 'tada')]; },
    draw(ctx, S) {
      const { t, talk, m } = S, s = CT.s, gy = CT.gy, hOff = standHipY(s, P({}));
      ground2(ctx, gy);
      const ek = easeOutElastic(clamp((t - m.grav + 0.3) / 0.6)); if (ek > 0) { ctx.save(); ctx.translate(860, gy); ctx.scale(ek, ek); earth2(ctx, 0, -110, 110, { mouth: t > m.wins ? 'grin' : 'smirk' }); ctx.restore(); }
      // trip & blame
      let x = CT.sx, hipY = gy + hOff, rot = 0, pose = Object.assign(P({}), wob(t)), face = { talk, mouth: 'smile', look: [0, 0] };
      const u = (t - m.trip) / 0.7, tUp = m.blame - 0.15;
      if (t > m.trip && t < tUp) { const e = clamp(u); x = CT.sx + 90 * e; rot = (Math.PI / 2) * easeIn(e); hipY = lerp(gy + hOff, gy - 22, easeIn(e)); pose = P({ A1: 2.6 + Math.sin(t * 25) * 0.3, B1: 2.6, A2: 0.3, B2: 0.3, L1: 0.5, R1: 0.5 }); face = { mouth: e < 0.8 ? 'scream' : 'wavy', eyes: e < 0.8 ? 'wide' : 'spiral' }; if (e >= 1) { pose = lying0; } }
      else if (t >= tUp && t < tUp + 0.5) { const e = easeInOut((t - tUp) / 0.5); x = CT.sx + 90; rot = (Math.PI / 2) * (1 - e); hipY = lerp(gy - 22, gy + hOff, e); pose = P({}); face = { mouth: 'flat', eyes: 'half' }; }
      else if (t >= tUp + 0.5) { x = CT.sx + 90; pose = Object.assign(P({ B1: 2.8, B2: 0.0, A1: 0.3 }), wob(t)); face = { talk, mouth: 'smirk', eyes: 'half', look: [3, -4] }; }
      // gravity wins jump
      const jr = (t - m.res) / 1.35; let lift = 0; if (jr > 0 && jr < 1) { lift = 200 * 4 * jr * (1 - jr); pose = P({ A1: 2.7, B1: 2.7, A2: 0.2, B2: 0.2, L1: 0.5, R1: 0.5 }); face = { talk, mouth: 'grin', eyes: 'wide', look: [0, -4] }; }
      if (jr >= 1) { const d = t - (m.res + 1.35), sq = 1 - 0.3 * Math.max(0, 1 - d * 5); face = { talk, mouth: 'wavy', eyes: 'spiral' }; stick2(ctx, { x, ground: gy, lift: 0, s, sy: sq, t, pose: lying0 === null ? P({}) : P({ A1: 0.6, B1: 0.6, L1: 0.4, R1: 0.4 }), face }); dazed(ctx, x, gy + hOff - 20 + 20, t, 60); puff(ctx, x, gy - 4, t, m.res + 1.35, { n: 8, spread: 120, size: 22, dur: 0.8, color: DUST }); }
      else { shadow2(ctx, x, gy + 5, 70 - lift * 0.08, 0.14); stick2(ctx, { x, hipY: lift ? gy + hOff - lift : hipY, rot, s, t, pose, face }); }
      speech(ctx, 'SPACETIME DID IT!', x + 160, gy - 470, { tail: [x + 50, gy - 390], k: pop(t, m.blame, 0.3) * (1 - seg(t, m.fol - 0.1, m.fol + 0.15)), size: 38 });
      // follow button
      const fy0 = -120, fy1 = 450; let by = fy0; if (t > m.fol) { const b = bounce(t - m.fol, fy0, fy1, 3200, 0.38, 3); by = b.y; }
      if (t > m.fol) {
        const cl = t > m.sci + 0.3, sq = 1 + (cl ? 0.08 * Math.max(0, 1 - (t - m.sci - 0.3) * 5) : 0);
        ctx.save(); ctx.translate(540, by); ctx.scale(sq, 1 / sq); roundRect(ctx, -280, -72, 560, 144, 72); ctx.fillStyle = 'rgba(27,28,46,0.2)'; ctx.save(); ctx.translate(6, 10); ctx.fill(); ctx.restore();
        roundRect(ctx, -280, -72, 560, 144, 72); ctx.fillStyle = cl ? L.green : L.coral; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = L.ink; ctx.stroke();
        ctx.font = '900 64px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = L.ink; ctx.fillStyle = '#fff'; const txt = cl ? 'FOLLOWING ✓' : '+ FOLLOW'; ctx.strokeText(txt, 0, 4); ctx.fillText(txt, 0, 4); ctx.restore();
        const cu = seg(t, m.fol + 0.5, m.sci + 0.3, easeInOut), tap = Math.max(0, 1 - Math.abs(t - m.sci - 0.3) * 8);
        if (cu > 0 && t < m.sci + 1.6) { const cx = lerp(860, 610, cu), cy = lerp(780, 470, cu); ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - tap * 0.15, 1 - tap * 0.15); ctx.fillStyle = '#fff'; ctx.strokeStyle = L.ink; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 62); ctx.lineTo(16, 48); ctx.lineTo(30, 78); ctx.lineTo(44, 71); ctx.lineTo(30, 42); ctx.lineTo(52, 40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        burst(ctx, 540, 450, t, m.sci + 0.3, { n: 16, speed: 360, size: 18, colors: [L.sun, L.pink, L.teal, L.blue], dur: 0.9, seed: 17 });
        tag(ctx, 'FOR MORE SCIENCE', 540, 548, { k: pop(t, m.fol + 0.3), size: 30, bg: '#fff' });
      }
      comic(ctx, 'GRAVITY WINS!', 540, 700, { size: 96, fill: L.coral, k: pop(t, m.wins, 0.3), rot: -0.05, shake: 3, t });
    },
  });
  const lying0 = P({ A1: 1.9, A2: 0.2, B1: 1.9, B2: 0.2, L1: 0.5, R1: 0.5 });
})(window.GR);
