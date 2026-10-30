#!/usr/bin/env bash
# Build the gravity reel end-to-end:  TTS -> timeline -> SFX/music mix -> frames -> MP4
#   PYTHON  python with kokoro-onnx, soundfile, scipy, numpy   (default: python3)
#   MODELS  dir holding kokoro-v1.0.onnx + voices-v1.0.bin      (default: ./models, auto-downloaded)
#   BUILD   scratch dir for audio/frames                        (default: ./build)
#   JOBS    parallel Chromium workers                           (default: 4)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PY="${PYTHON:-python3}"; MODELS="${MODELS:-$ROOT/models}"; BUILD="${BUILD:-$ROOT/build}"; JOBS="${JOBS:-4}"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
FPS=30
mkdir -p "$MODELS" "$BUILD" "$ROOT/output"

if [ ! -f "$MODELS/kokoro-v1.0.onnx" ]; then
  base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
  curl -L -o "$MODELS/kokoro-v1.0.onnx" "$base/kokoro-v1.0.onnx"
  curl -L -o "$MODELS/voices-v1.0.bin" "$base/voices-v1.0.bin"
fi

echo "== 1/5 narration (Kokoro TTS)";  "$PY" "$ROOT/tts/generate_voice.py" --models "$MODELS" --out "$BUILD"
echo "== 2/5 sound-effect cues";       node "$ROOT/render/render.js" --timeline "$BUILD/timeline.json" --events "$BUILD/events.json"
echo "== 3/5 music + SFX mix";         "$PY" "$ROOT/tts/make_audio.py" --timeline "$BUILD/timeline.json" --events "$BUILD/events.json" --voice "$BUILD/voice.wav" --out "$BUILD/mix.wav"

echo "== 4/5 render frames ($JOBS workers)"
DUR=$("$PY" -c "import json;print(json.load(open('$BUILD/timeline.json'))['duration'])")
TOTAL=$("$PY" -c "import math;print(math.ceil($DUR*$FPS))")
rm -rf "$BUILD/frames"; mkdir -p "$BUILD/frames"
CH=$(( (TOTAL + JOBS - 1) / JOBS ))
for ((j=0; j<JOBS; j++)); do
  node "$ROOT/render/render.js" --timeline "$BUILD/timeline.json" --out "$BUILD/frames" --from $((j*CH)) --to $(((j+1)*CH)) > "$BUILD/worker$j.log" 2>&1 &
done
wait
[ "$(ls "$BUILD/frames" | wc -l)" -eq "$TOTAL" ] || { echo "frame count mismatch"; exit 1; }

echo "== 5/5 encode"
ffmpeg -y -loglevel error -framerate $FPS -i "$BUILD/frames/f_%05d.png" -i "$BUILD/mix.wav" \
  -vf "format=gbrp,noise=alls=2.2:allf=t,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -r $FPS \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 192k -ar 48000 -t "$DUR" -movflags +faststart "$ROOT/output/gravity_reel.mp4"
echo "done -> $ROOT/output/gravity_reel.mp4"
