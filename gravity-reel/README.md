# Gravity — stickman explainer reel

A 52-second vertical (1080×1920, 30 fps) animated explainer on gravity for Instagram Reels / YouTube Shorts / TikTok.

- `output/gravity_reel.mp4` — final video (H.264 + AAC, ~-14 LUFS)
- `output/cover.png` — cover frame

## What's in it
Hook → mass attracts mass → why we stay on Earth → 9.8 m/s² → Newton's apple & the Moon → hammer & feather on the Moon (Apollo 15) → Einstein's spacetime → follow CTA.

## How it's made (all free / open source)
| Part | Tool |
|---|---|
| Narration | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) TTS via `kokoro-onnx`, voice `af_heart` |
| Animation | Hand-rigged vector stickman drawn on HTML canvas, rendered frame-by-frame in headless Chromium (Playwright) |
| Captions / lip-sync | Word timings aligned to the audio (snapped to real pauses); mouth driven by the voice envelope |
| Music + SFX | Synthesised with numpy (no licensed audio), ducked under the voice |
| Encode | ffmpeg (x264 CRF 15, BT.709, faststart) |

## Rebuild
Requires: `ffmpeg`, Node 18+ with `playwright` (Chromium), Python 3.10+.
```bash
pip install -r requirements.txt
./build.sh            # downloads the Kokoro model on first run, writes output/gravity_reel.mp4
```
Edit `tts/script.json` to change the narration/voice; scene visuals live in `render/scenes_a.js` and `render/scenes_b.js`
(scenes are keyed to word timings, so animation beats follow the new script automatically).

Layout respects Reels/Shorts safe zones (UI overlays top ~250 px and bottom ~450 px).
