#!/usr/bin/env python3
"""Clean comedy audio: NO bass / kick / pads. Light plucked marimba bed + cartoon SFX.

Every element is high-passed above ~300 Hz (only the voice keeps its natural low end).
Outputs mix.wav (voice + music + sfx) and mix_nomusic.wav (voice + sfx), both ~-14 LUFS.
"""
import argparse, json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
RNG = np.random.default_rng(7)
LOW_CUT = 320  # Hz — nothing from the music/SFX bus goes below this


def tvec(d): return np.arange(int(d * SR)) / SR
def dec(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def hp(x, fc, o=2): return sosfilt(butter(o, fc, "high", fs=SR, output="sos"), x)
def lp(x, fc, o=2): return sosfilt(butter(o, fc, "low", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def fade(x, a=0.003, r=0.02):
    x = x.copy(); fa, fr = int(a * SR), int(r * SR); x[:fa] *= np.linspace(0, 1, fa); x[-fr:] *= np.linspace(1, 0, fr); return x
def glide(f0, f1, dur, vib=0.0, curve=1.0):
    t = tvec(dur); u = (t / dur) ** curve; f = f0 * (f1 / f0) ** u
    if vib: f = f * (1 + vib * np.sin(2 * np.pi * 7 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------------- SFX (all mid/high) ----------------
def pop(): return fade(glide(520, 1100, 0.09) * dec(int(0.09 * SR), 0.03) * 0.9)
def plop(): n = int(0.16 * SR); return fade(glide(900, 420, 0.16) * dec(n, 0.05), 0.002, 0.03) * 0.9
def swish(): n = int(0.28 * SR); x = bp(RNG.standard_normal(n), 1500, 7500); return fade(x * np.sin(np.linspace(0, np.pi, n)) ** 1.3 * 2.4, 0.01, 0.04)
def whoosh(): n = int(0.55 * SR); x = bp(RNG.standard_normal(n), 700, 6500); return fade(x * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * 2.2, 0.03, 0.08)
def rustle(): n = int(0.5 * SR); x = bp(RNG.standard_normal(n), 3000, 8000); am = (np.sin(2 * np.pi * 24 * np.arange(n) / SR) * 0.5 + 0.5) ** 2; return fade(x * am * np.sin(np.linspace(0, np.pi, n)) * 1.3, 0.03, 0.05)
def boing(): t = tvec(0.5); f = 420 + 380 * np.sin(np.pi * np.minimum(t / 0.22, 1)) * np.exp(-t * 3) + 40 * np.sin(2 * np.pi * 15 * t) * np.exp(-t * 6); return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * dec(len(t), 0.2) * 0.7)
def ding(f=1318.5): t = tvec(1.1); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in [(1, 1, 3.2), (2.76, 0.28, 5), (5.4, 0.1, 8)]); return fade(x * 0.5, 0.001, 0.15)
def tick(): t = tvec(0.07); return fade(np.sin(2 * np.pi * 2200 * t) * dec(len(t), 0.012) * 0.8, 0.0005, 0.01)
def slide_whistle(f0, f1, dur, vib=0.012):
    x = glide(f0, f1, dur, vib) * 0.8 + 0.15 * glide(f0 * 2, f1 * 2, dur, vib); e = np.minimum(np.arange(len(x)) / (0.03 * SR), 1) * np.clip((len(x) - np.arange(len(x))) / (0.06 * SR), 0, 1); return x * e * 0.6
def slip(): return slide_whistle(1700, 520, 0.38)
def slide(): return slide_whistle(2000, 380, 1.6, 0.02)
def slide_up(): return slide_whistle(480, 1800, 0.55)
def splat(): n = int(0.35 * SR); x = bp(RNG.standard_normal(n), 500, 3200) * dec(n, 0.07); return fade((x * 2.0 + glide(900, 380, 0.35) * dec(n, 0.08) * 0.5), 0.001, 0.05)
def bonk(): t = tvec(0.3); w = (np.sin(2 * np.pi * 620 * t) + 0.5 * np.sin(2 * np.pi * 1330 * t) + 0.25 * np.sin(2 * np.pi * 2100 * t)) * dec(len(t), 0.06); return fade(w * 0.7, 0.001, 0.05)
def wah():
    out = np.zeros(int(1.5 * SR)); notes = [(466, 0.0, 0.4), (440, 0.4, 0.4), (415, 0.8, 0.4), (392, 1.2, 0.3)]
    for f, s, d in notes:
        t = tvec(d); saw = 2 * ((f * (1 + 0.012 * np.sin(2 * np.pi * 6 * t)) * t) % 1) - 1; x = lp(saw, 2400) * np.minimum(t / 0.03, 1) * np.clip((d - t) / 0.08, 0, 1)
        i = int(s * SR); out[i:i + len(x)] += x * 0.5
    return out * 0.7
def dunk(): n = int(0.8 * SR); t = tvec(0.8); rim = (np.sin(2 * np.pi * 980 * t) + 0.6 * np.sin(2 * np.pi * 1870 * t) + 0.3 * np.sin(2 * np.pi * 3100 * t)) * np.exp(-t * 7); sw = bp(RNG.standard_normal(n), 2500, 8000) * np.exp(-t * 9) * 0.8; return fade((rim * 0.6 + sw) * 0.9, 0.001, 0.1)
def tada():
    out = np.zeros(int(1.2 * SR))
    for f, s in [(523, 0), (659, 0.09), (784, 0.18), (1047, 0.3)]:
        t = tvec(0.7); x = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 3.5); i = int(s * SR); out[i:i + len(x)] += x * 0.4
    return fade(out, 0.002, 0.1)
def sparkle(n=7):
    out = np.zeros(int(0.9 * SR)); pent = [1568, 1760, 2093, 2349, 2637, 3136, 3520]
    for i in range(n):
        f = pent[(i * 3 + RNG.integers(0, 3)) % len(pent)]; s = int(i * 0.05 * SR); tt = tvec(0.35); out[s:s + len(tt)] += np.sin(2 * np.pi * f * tt) * dec(len(tt), 0.09) * 0.35
    return fade(out, 0.001, 0.1)
def burst(): sp = sparkle(9) * 0.9; p = pop(); sp[:len(p)] += p * 0.5; return sp

def _crack():
    out = np.zeros(int(0.4 * SR))
    for at, f in [(0.0, 4200), (0.05, 3300), (0.12, 5200), (0.19, 2900)]:
        n = int(0.03 * SR); c = hp(RNG.standard_normal(n), f * 0.6) * dec(n, 0.006); i = int(at * SR); out[i:i + n] += c * 1.4
    return fade(out, 0.0005, 0.05)
def _gulp():
    n = int(0.24 * SR); a = glide(380, 700, 0.1) * dec(int(0.1 * SR), 0.04); b = glide(520, 330, 0.12) * dec(int(0.12 * SR), 0.05); out = np.zeros(n); out[:len(a)] += a * 0.8; out[int(0.1 * SR):int(0.1 * SR) + len(b)] += b * 0.7; return fade(out, 0.002, 0.03)

SFX = {"pop": (pop, .36), "plop": (plop, .40), "swish": (swish, .32), "whoosh": (whoosh, .34), "rustle": (rustle, .22), "boing": (boing, .30), "ding": (ding, .28), "tick": (tick, .28),
       "slip": (slip, .30), "slide": (slide, .26), "slide_up": (slide_up, .26), "splat": (splat, .50), "crack": (_crack, .55), "gulp": (_gulp, .45), "bonk": (bonk, .55), "wah": (wah, .35),
       "dunk": (dunk, .50), "tada": (tada, .34), "sparkle": (sparkle, .24), "burst": (burst, .26)}

# ---------------- music: plucked marimba + soft stabs, no low end ----------------
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def marimba(f, d=0.45):
    t = tvec(d); x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 25)) * np.exp(-t * 9); return fade(x, 0.001, 0.05)
def stab(notes, d=0.22):
    t = tvec(d); x = sum(np.sin(2 * np.pi * midi(n) * t) + 0.3 * np.sin(4 * np.pi * midi(n) * t) for n in notes) * np.exp(-t * 14) / len(notes); return fade(x, 0.002, 0.04)
def place(buf, clip, at, g=1.0):
    s = int(at * SR)
    if 0 <= s < len(buf): e = min(len(buf), s + len(clip)); buf[s:e] += clip[:e - s] * g

def make_music(dur):
    n = int((dur + 2) * SR); Lc = np.zeros(n); Rc = np.zeros(n); bpm = 108; beat = 60 / bpm; bar = 4 * beat
    chords = [([72, 76, 79, 84], [64, 67, 72]), ([69, 72, 76, 81], [64, 69, 72]), ([65, 69, 72, 77], [65, 69, 72]), ([67, 71, 74, 79], [62, 67, 71])]  # C Am F G
    pattern = [0, 1, 2, 1, 0, 2, 3, 2]; mask = [1, 0, 1, 1, 0, 1, 1, 0]
    t0 = 0.0; ci = 0
    while t0 < dur + 1:
        arp, st = chords[ci % 4]
        for b in range(2):                       # two bars per chord
            for i in range(8):
                if mask[i] or (b and i == 4):
                    at = t0 + b * bar + i * beat / 2; c = marimba(midi(arp[pattern[i]])) * 0.12
                    place(Lc, c, at, 1.0); place(Rc, c, at + 0.01, 0.85); place(Lc, c, at + 0.28, 0.22); place(Rc, c, at + 0.4, 0.2)
            for sb in (1, 3):                    # off-beat stabs
                at = t0 + b * bar + sb * beat; c = stab(st) * 0.07; place(Lc, c, at); place(Rc, c, at + 0.004)
        t0 += 2 * bar; ci += 1
    return hp(Lc[:int(dur * SR)], LOW_CUT, 4), hp(Rc[:int(dur * SR)], LOW_CUT, 4)

def follower(x, attack=0.015, release=0.4):
    a_a = np.exp(-1 / (attack * SR)); a_r = np.exp(-1 / (release * SR)); sm = lfilter([1 - a_a], [1, -a_a], np.abs(x)); out = np.empty_like(sm); cur = 0.0; step = SR // 200
    for i in range(0, len(sm), step):
        m = sm[i:i + step].max(); cur = m if m > cur else cur * (a_r ** step); out[i:i + step] = cur
    return out

def norm(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", "loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.84:level=disabled", "-ar", str(SR), str(dst)], check=True)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--timeline", required=True); ap.add_argument("--events", required=True); ap.add_argument("--voice", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args(); tl = json.loads(Path(a.timeline).read_text()); events = json.loads(Path(a.events).read_text()); dur = tl["duration"]; N = int(dur * SR)
    voice, sr = sf.read(a.voice, dtype="float32"); assert sr == SR; voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
    duck = follower(voice); g = lp(1 - 0.7 * np.clip(duck / 0.12, 0, 1), 8, 1)
    mL, mR = make_music(dur); fi = np.clip(np.arange(N) / (0.8 * SR), 0, 1); fo = np.clip((N - np.arange(N)) / (1.6 * SR), 0, 1)
    mus = 0.5; mL, mR = mL * g * mus * fi * fo, mR * g * mus * fi * fo
    sfx = np.zeros(N)
    for e in events:
        fn, gain = SFX[e["type"]]; clip = hp(fn(), LOW_CUT, 2) * gain * (e.get("gain") if e.get("gain") is not None else 1.0) * RNG.uniform(0.93, 1.05); place(sfx, clip, max(0, e["t"]))
    sfx = sfx * (1 - 0.2 * np.clip(duck / 0.12, 0, 1))
    out = Path(a.out)
    for name, mus_on in (("mix", True), ("mix_nomusic", False)):
        L = voice + sfx + (mL if mus_on else 0); R = voice + sfx + (mR if mus_on else 0)
        tmp = out.parent / f"{name}.pre.wav"; sf.write(tmp, np.stack([L, R], 1), SR); norm(tmp, out.parent / f"{name}.wav"); tmp.unlink()
    print("wrote", out.parent / "mix.wav", "and mix_nomusic.wav")

if __name__ == "__main__":
    main()
