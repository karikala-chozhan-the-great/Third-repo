// Timeline engine: scene lookup, transitions, camera, captions, SFX event export.
(function (G) {
  const { W, H, clamp, seg, easeInOut, easeOut } = G;
  let TL, S, CAPS;

  function makeT(tl, meta) {
    const lines = Object.fromEntries(tl.lines.map(l => [l.id, l]));
    const norm = s => s.toLowerCase().replace(/[^a-z']/g, '');
    return {
      w(id, word, nth = 0) {
        let n = 0;
        for (const w of lines[id].words) if (norm(w.w) === norm(word)) { if (n === nth) return w.s - meta.start; n++; }
        throw new Error(`word "${word}" #${nth} not found in line ${id}`);
      },
      ls: id => lines[id].start - meta.start,
      le: id => lines[id].end - meta.start,
      dur: meta.end - meta.start,
    };
  }

  G.init = function (tl) {
    TL = tl; CAPS = G.buildCaptions(tl);
    S = G.scenes.map(def => {
      const meta = tl.scenes.find(s => s.id === def.id);
      if (!meta) throw new Error('scene missing from timeline: ' + def.id);
      const T = makeT(tl, meta);
      return { def, meta, T, m: def.mark ? def.mark(T) : {} };
    });
    return { scenes: S.length, duration: tl.duration };
  };

  function talkAt(t) {
    const i = t * TL.envRate, i0 = Math.floor(i), a = TL.env[i0] || 0, b = TL.env[i0 + 1] || 0;
    return a + (b - a) * (i - i0);
  }

  G.render = function (ctx, t) {
    G.drawBackground(ctx, t);
    S.forEach((sc, i) => {
      const { start, end } = sc.meta, last = i === S.length - 1;
      if (t < start - 0.001 || t > end + 0.36) return;
      const ain = i === 0 ? 1 : seg(t, start, start + 0.32, easeOut);
      const aout = last ? 0 : seg(t, end, end + 0.32, easeInOut);
      const alpha = ain * (1 - aout);
      if (alpha <= 0.003) return;
      const lt = t - start, dur = end - start;
      ctx.save();
      // camera push-in + slide transition
      const push = 1 + 0.035 * clamp(lt / dur);
      const dy = (1 - ain) * 70 - aout * 50 + 95;
      ctx.translate(W / 2, 800 + dy); ctx.scale(push, push); ctx.translate(-W / 2, -800);
      ctx.globalAlpha = alpha;
      sc.def.draw(ctx, { t: lt, dur, T: sc.T, m: sc.m, talk: talkAt(t), g: t });
      ctx.restore();
    });
    G.drawCaptions(ctx, CAPS, t);
  };

  // absolute-time sound-effect list gathered from the scenes
  G.events = function () {
    const out = [];
    S.forEach((sc, i) => {
      if (i > 0) out.push({ t: sc.meta.start - 0.05, type: 'whoosh', gain: 0.7 });
      if (sc.def.events) sc.def.events(sc.T, sc.m).forEach(e => out.push(Object.assign({}, e, { t: e.t + sc.meta.start })));
    });
    return out.sort((a, b) => a.t - b.t);
  };
})(window.GR);
