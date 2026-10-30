# Gravity (the funny version) — stickman reel

58-second vertical comedy explainer on gravity (1080×1920, 30 fps) for Reels / Shorts / TikTok.

- `output/gravity_funny.mp4` — final video (male voice, very light music, SFX)
- `output/gravity_funny_no_music.mp4` — same video, voice + SFX only
- `output/cover.png`

## Clean-audio rules
No bass, kick or pads. The music is a few plucked marimba notes and short chord stabs, all high-passed at 320 Hz
(measured: 0.002 % of the music bus energy is below 250 Hz) and ducked under the voice. All SFX are high-passed too
(slide whistles, plops, bonks — no sub thuds). Loudness ≈ -14 LUFS, true peak ≤ -0.7 dBFS.

## Look
Clean cream background, black-ink stickman with comic eyes, speech bubbles and "CRACK!"-style SFX text,
marker-highlight captions inside the Reels/Shorts safe zone.

## Rebuild
```bash
pip install -r requirements.txt     # + ffmpeg and Node with playwright (Chromium)
./build.sh                          # Kokoro voice `am_michael`; edit tts/script.json to change the script/voice
```
