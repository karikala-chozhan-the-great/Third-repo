#!/usr/bin/env python3
"""Generate the narration with Kokoro TTS and build the master timeline.

Outputs (into --out):
  voice.wav      mono 48 kHz narration, pauses included
  timeline.json  line/word/scene timings + mouth-movement envelope
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt

SR_OUT = 48000
LEAD = 0.45        # silence before the first word
TAIL = 1.2         # hold after the last word (end card)
SCENE_LEAD = 0.30  # a new scene starts this long before its first word


def trim(x, sr, thresh=0.012, keep=0.03):
    """Trim leading/trailing silence, keep a few ms so words don't clip."""
    a = np.abs(x)
    idx = np.where(a > thresh)[0]
    if len(idx) == 0:
        return x
    s = max(0, idx[0] - int(keep * sr))
    e = min(len(x), idx[-1] + int(keep * sr * 2))
    y = x[s:e].copy()
    f = int(0.008 * sr)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def word_weights(words):
    """Relative spoken length of each word (+ pause after clause punctuation)."""
    ws = []
    for w in words:
        core = re.sub(r"[^A-Za-z']", "", w)
        wt = 1.6 + len(core) * 1.0
        if re.search(r"[,;:]$", w):
            wt += 3.2
        ws.append(wt)
    return ws


def align_words(words, audio, sr):
    """Distribute word boundaries over the clip, snapping comma pauses to real silence."""
    dur = len(audio) / sr
    wt = np.array(word_weights(words))
    bounds = np.concatenate([[0], np.cumsum(wt)]) / wt.sum() * dur  # n+1 boundaries

    # Snap boundaries after commas to the quietest nearby region
    hop = int(0.01 * sr)
    env = np.array([np.sqrt(np.mean(audio[i:i + hop] ** 2) + 1e-12) for i in range(0, len(audio) - hop, hop)])
    thr = 0.12 * np.percentile(env, 90)
    for i, w in enumerate(words[:-1]):
        if re.search(r"[,;:]$", w):
            c = bounds[i + 1] - 0.5 * (wt[i] and (3.2 / wt.sum() * dur))  # pause centre guess
            lo, hi = int(max(0, c - 0.3) / 0.01), int(min(dur, c + 0.3) / 0.01)
            seg = env[lo:hi] < thr
            best, run, start = None, 0, 0
            for j, q in enumerate(seg):
                if q:
                    if run == 0:
                        start = j
                    run += 1
                    if best is None or run > best[1]:
                        best = (start, run)
                else:
                    run = 0
            if best and best[1] >= 4:  # >=40 ms of real silence
                centre = (lo + best[0] + best[1] / 2) * 0.01
                # shift this boundary and rescale neighbours so ordering is kept
                bounds[i + 1] = centre
    bounds = np.maximum.accumulate(bounds)
    out = []
    for i, w in enumerate(words):
        out.append({"w": w, "s": float(bounds[i]), "e": float(bounds[i + 1])})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default=str(Path(__file__).with_name("script.json")))
    ap.add_argument("--models", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    from kokoro_onnx import Kokoro

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    cfg = json.loads(Path(args.script).read_text())
    kokoro = Kokoro(str(Path(args.models) / "kokoro-v1.0.onnx"), str(Path(args.models) / "voices-v1.0.bin"))

    clips = []
    for ln in cfg["lines"]:
        samples, sr = kokoro.create(ln["text"], voice=cfg["voice"], speed=cfg["speed"], lang="en-us")
        samples = trim(samples.astype(np.float32), sr)
        clips.append((ln, samples, sr))
        print(f'{ln["id"]}: {len(samples)/sr:5.2f}s  {ln["text"]}')

    # Resample every clip to 48 kHz via ffmpeg (soxr) for quality
    sr_in = clips[0][2]
    tmp_in, tmp_out = out / "_cat_in.wav", out / "_cat_out.wav"
    cat = np.concatenate([c[1] for c in clips])
    sf.write(tmp_in, cat, sr_in)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp_in), "-af", f"aresample={SR_OUT}:resampler=soxr", str(tmp_out)], check=True)
    cat48, _ = sf.read(tmp_out, dtype="float32")
    tmp_in.unlink(); tmp_out.unlink()

    # Slice back per clip (proportional to original lengths), build the track
    total_in = len(cat)
    track = [np.zeros(int(LEAD * SR_OUT), dtype=np.float32)]
    t = LEAD
    lines = []
    pos = 0
    for ln, samples, sr in clips:
        n48 = int(round(len(samples) * len(cat48) / total_in))
        clip = cat48[pos:pos + n48]
        pos += n48
        words = ln["text"].split()
        wd = align_words(words, clip, SR_OUT)
        for w in wd:
            w["s"] += t
            w["e"] += t
        lines.append({"id": ln["id"], "scene": ln["scene"], "text": ln["text"],
                      "start": t, "end": t + len(clip) / SR_OUT, "words": wd})
        track.append(clip)
        gap = np.zeros(int(ln["pause"] * SR_OUT), dtype=np.float32)
        track.append(gap)
        t += len(clip) / SR_OUT + ln["pause"]
    track.append(np.zeros(int(TAIL * SR_OUT), dtype=np.float32))
    voice = np.concatenate(track)
    duration = len(voice) / SR_OUT

    # Light voice polish: high-pass, gentle presence lift, soft compression via ffmpeg
    raw = out / "_voice_raw.wav"
    sf.write(raw, voice, SR_OUT)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                    "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=1.8,equalizer=f=220:t=q:w=1:g=1.2,"
                    "acompressor=threshold=-20dB:ratio=2.6:attack=8:release=140:makeup=3,alimiter=limit=0.95",
                    str(out / "voice.wav")], check=True)
    raw.unlink()
    voice, _ = sf.read(out / "voice.wav", dtype="float32")

    # Scenes: group consecutive lines with the same scene id
    scenes = []
    for ln in lines:
        if scenes and scenes[-1]["id"] == ln["scene"]:
            scenes[-1]["end_line"] = ln["end"]
            scenes[-1]["lines"].append(ln["id"])
        else:
            scenes.append({"id": ln["scene"], "first_line": ln["start"], "end_line": ln["end"], "lines": [ln["id"]]})
    for i, sc in enumerate(scenes):
        sc["start"] = 0.0 if i == 0 else sc["first_line"] - SCENE_LEAD
        sc["end"] = duration if i == len(scenes) - 1 else scenes[i + 1]["first_line"] - SCENE_LEAD

    # Mouth envelope (60 Hz): smoothed band-passed RMS, normalised
    sos = butter(2, [120, 3800], btype="band", fs=SR_OUT, output="sos")
    band = sosfiltfilt(sos, voice)
    hop = SR_OUT // 60
    n = len(band) // hop
    rms = np.sqrt(np.mean(band[: n * hop].reshape(n, hop) ** 2, axis=1))
    ref = np.percentile(rms[rms > 0.004], 92) if np.any(rms > 0.004) else 1.0
    env = np.clip(rms / ref, 0, 1.0) ** 0.8
    env[rms < 0.004] = 0
    k = np.array([0.2, 0.6, 0.2])
    env = np.convolve(env, k, mode="same")

    tl = {"fps": 30, "duration": float(duration), "lines": lines, "scenes": scenes,
          "env": [round(float(v), 3) for v in env], "envRate": 60, "voice": cfg["voice"]}
    (out / "timeline.json").write_text(json.dumps(tl))
    print(f"\nTotal duration: {duration:.2f}s  ({len(scenes)} scenes)")
    for sc in scenes:
        print(f'  {sc["id"]:9s} {sc["start"]:6.2f} -> {sc["end"]:6.2f}')


if __name__ == "__main__":
    sys.exit(main())
