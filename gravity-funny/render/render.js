#!/usr/bin/env node
// Deterministic frame renderer: drives the canvas page in headless Chromium.
//   node render.js --timeline T.json --out DIR [--from F --to F] [--fps 30]
//   node render.js --timeline T.json --events events.json
//   node render.js --timeline T.json --out DIR --at 1.5,12,30   (preview stills)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a), []));
const tl = JSON.parse(fs.readFileSync(args.timeline, 'utf8'));
const fps = Number(args.fps || tl.fps || 30);
const total = Math.ceil(tl.duration * fps);

(async () => {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(tl => window.GR.init(tl), tl);

  if (args.events) {
    const ev = await page.evaluate(() => window.GR.events());
    fs.writeFileSync(args.events, JSON.stringify(ev, null, 1));
    console.log(`wrote ${ev.length} events`);
    await browser.close();
    return;
  }

  fs.mkdirSync(args.out, { recursive: true });
  const shot = async (t, file) => {
    await page.evaluate(t => window.GR.draw(t), t);
    await page.screenshot({ path: file, type: 'png' });
  };
  if (args.at) {
    for (const s of args.at.split(',')) await shot(Number(s), path.join(args.out, `still_${String(Number(s).toFixed(2)).padStart(6, '0')}.png`));
  } else {
    const from = Number(args.from || 0), to = Math.min(Number(args.to || total), total);
    for (let f = from; f < to; f++) {
      await shot(f / fps, path.join(args.out, `f_${String(f).padStart(5, '0')}.png`));
      if (f % 60 === 0) console.log(`frame ${f}/${total}`);
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
