#!/usr/bin/env python3
"""Synthesise the music bed + sound effects and mix them with the narration.

Everything is generated procedurally (numpy) so there are no licensing concerns.
Output: mix.wav (48 kHz stereo, normalised to ~-14 LUFS for Instagram/Shorts).
"""
import argparse, json, subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
RNG = np.random.default_rng(42)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(n, decay):
    return np.exp(-np.arange(n) / (decay * SR))


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def fade(x, a=0.004, r=0.01):
    n = len(x); fa, fr = int(a * SR), int(r * SR)
    x = x.copy()
    x[:fa] *= np.linspace(0, 1, fa); x[-fr:] *= np.linspace(1, 0, fr)
    return x


# ---------------------------------------------------------------- SFX
def sweep_noise(dur, f0, f1, curve=1.0):
    """Noise through a one-pole low-pass whose cutoff sweeps f0 -> f1."""
    n = int(dur * SR); noise = RNG.standard_normal(n)
    out = np.zeros(n); block = 256; z = np.zeros(1)
    for i in range(0, n, block):
        u = (i / n) ** curve
        fc = f0 * (f1 / f0) ** u
        a = 1 - np.exp(-2 * np.pi * fc / SR)
        seg = noise[i:i + block]
        y, z = lfilter([a], [1, -(1 - a)], seg, zi=z)
        out[i:i + block] = y
    return out


def sfx_whoosh(dur=0.6):
    x = sweep_noise(dur, 250, 5500, 1.3)
    x = hp(x, 180)
    t = np.linspace(0, 1, len(x))
    return fade(x * np.sin(np.pi * t) ** 1.6 * 2.2, 0.02, 0.05)


def sfx_swish():
    x = hp(sweep_noise(0.28, 900, 7000, 1.0), 500) * 3.0
    t = np.linspace(0, 1, len(x))
    return fade(x * np.sin(np.pi * t) ** 1.2, 0.01, 0.03)


def sfx_pop(f=420):
    t = tvec(0.14); fr = f * (1 + 1.1 * np.exp(-t * 40))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return fade(np.sin(ph) * env_exp(len(t), 0.035) * 0.9, 0.001, 0.02)


def sfx_thud(power=1.0):
    t = tvec(0.45); fr = 46 + 90 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(len(t), 0.11)
    click = lp(RNG.standard_normal(len(t)), 900) * env_exp(len(t), 0.02) * 0.7
    return fade((body + click) * 1.4 * power, 0.001, 0.05)


def sfx_ding(f=1318.5):
    t = tvec(1.1)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * d) for m, a, d in [(1, 1, 3.2), (2.76, 0.28, 5), (5.4, 0.1, 8), (0.5, 0.25, 2.5)])
    return fade(x * 0.55, 0.001, 0.15)


def sfx_tick():
    t = tvec(0.07)
    return fade(np.sin(2 * np.pi * 2200 * t) * env_exp(len(t), 0.012) * 0.8 + lp(RNG.standard_normal(len(t)), 5000) * env_exp(len(t), 0.004) * 0.3, 0.0005, 0.01)


def sfx_boing():
    t = tvec(0.5); fr = 190 + 260 * np.sin(np.pi * np.minimum(t / 0.25, 1) ** 0.7) * np.exp(-t * 3) + 30 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6)
    return fade(np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(len(t), 0.18) * 0.7, 0.002, 0.05)


def sfx_bonk():
    t = tvec(0.35)
    wood = (np.sin(2 * np.pi * 520 * t) + 0.5 * np.sin(2 * np.pi * 1110 * t)) * env_exp(len(t), 0.05)
    return fade(wood * 0.7 + sfx_thud(0.6)[: len(t)] * 0.7, 0.001, 0.05)


def sfx_sparkle(n=7):
    out = np.zeros(int(0.9 * SR)); pent = [1568, 1760, 2093, 2349, 2637, 3136, 3520]
    for i in range(n):
        f = pent[(i * 3 + RNG.integers(0, 3)) % len(pent)]; s = int(i * 0.05 * SR)
        tt = tvec(0.35); n_ = len(tt)
        out[s:s + n_] += np.sin(2 * np.pi * f * tt) * env_exp(n_, 0.09) * 0.35
    return fade(out, 0.001, 0.1)


def sfx_burst():
    sp = sfx_sparkle(9) * 0.9
    pop = sfx_pop(520)
    sp[: len(pop)] += pop * 0.5
    return sp


def sfx_slam():
    crash = lp(RNG.standard_normal(int(0.7 * SR)), 4500) * env_exp(int(0.7 * SR), 0.18) * 0.6
    th = sfx_thud(1.6)
    out = np.zeros(int(0.8 * SR)); out[:len(crash)] += crash; out[:len(th)] += th
    return fade(out, 0.001, 0.1)


def sfx_rustle():
    n = int(0.45 * SR); x = bp(RNG.standard_normal(n), 2500, 7500)
    am = (np.sin(2 * np.pi * 22 * np.arange(n) / SR) * 0.5 + 0.5) ** 2
    t = np.linspace(0, 1, n)
    return fade(x * am * np.sin(np.pi * t) * 1.2, 0.02, 0.05)


SFX = {"whoosh": (sfx_whoosh, 0.40), "swish": (sfx_swish, 0.35), "pop": (sfx_pop, 0.36), "thud": (sfx_thud, 0.55), "ding": (sfx_ding, 0.30),
       "tick": (sfx_tick, 0.30), "boing": (sfx_boing, 0.32), "bonk": (sfx_bonk, 0.50), "sparkle": (sfx_sparkle, 0.26), "burst": (sfx_burst, 0.28),
       "slam": (sfx_slam, 0.55), "rustle": (sfx_rustle, 0.22)}


# ---------------------------------------------------------------- music
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pad_note(f, dur, att=1.0, rel=1.4):
    n = int((dur + rel) * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for det, amp in [(0.997, 0.5), (1.003, 0.5)]:
        for h, a in [(1, 1.0), (2, 0.35), (3, 0.14), (4, 0.06)]:
            x += amp * a * np.sin(2 * np.pi * f * det * h * t + RNG.uniform(0, 6.28))
    e = np.minimum(t / att, 1.0)
    e = e * np.where(t > dur, np.clip(1 - (t - dur) / rel, 0, 1), 1)
    return x * e * (1 + 0.04 * np.sin(2 * np.pi * 0.35 * t))


def bell(f, dur=1.1):
    t = tvec(dur)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 5) + 0.12 * np.sin(2 * np.pi * f * 3.9 * t) * np.exp(-t * 9)) * np.exp(-t * 3.4)
    return fade(x, 0.002, 0.05)


def kick():
    t = tvec(0.35); fr = 42 + 95 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(len(t), 0.1)


def hat():
    t = tvec(0.06)
    return hp(RNG.standard_normal(len(t)), 7000) * env_exp(len(t), 0.012)


def rim():
    t = tvec(0.1)
    return (np.sin(2 * np.pi * 820 * t) * 0.5 + bp(RNG.standard_normal(len(t)), 1500, 4000)) * env_exp(len(t), 0.02)


def place(buf, clip, at, gain=1.0):
    s = int(at * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(clip))
    buf[s:e] += clip[: e - s] * gain


def make_music(dur):
    n = int((dur + 2) * SR)
    L = np.zeros(n); R = np.zeros(n)
    bpm = 96; beat = 60 / bpm; bar = 4 * beat
    chords = [([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([48, 52, 55, 59], 48), ([55, 59, 62, 64], 43)]  # Am7 Fmaj7 Cmaj7 G6
    pent = [69, 72, 74, 76, 79, 81, 84]
    t0 = 0.0; ci = 0
    arp_rng = np.random.default_rng(5)
    while t0 < dur + 1:
        notes, bass = chords[ci % 4]
        for k, nn in enumerate(notes):
            c = pad_note(midi(nn), 2 * bar, att=1.2, rel=1.6) * 0.16
            place(L, c, t0, 1.0 if k % 2 == 0 else 0.8); place(R, c, t0, 0.8 if k % 2 == 0 else 1.0)
        b = pad_note(midi(bass - 12 + 12), 2 * bar, att=0.3, rel=0.8) * 0.28
        place(L, b, t0); place(R, b, t0)
        # arpeggio (8th notes, sparse) from chord tones + pentatonic
        for i in range(16):
            if arp_rng.random() < 0.5:
                pool = [x + 12 for x in notes] + pent[:4]
                f = midi(int(arp_rng.choice(pool)))
                c = bell(f) * 0.10 * arp_rng.uniform(0.6, 1.0)
                at = t0 + i * beat / 2
                place(L, c, at, 1.0); place(R, c, at + 0.011, 0.9)
                place(L, c, at + 0.375, 0.34); place(R, c, at + 0.5, 0.3)  # ping-pong echo
        # lo-fi beat
        for bi in range(8):
            tb = t0 + bi * beat
            if bi % 4 == 0 or bi % 4 == 2.0 and bi % 8 == 6:
                place(L, kick() * 0.42, tb); place(R, kick() * 0.42, tb)
            if bi % 2 == 1:
                place(L, rim() * 0.08, tb); place(R, rim() * 0.08, tb + 0.004)
            for h in (0.5,):
                place(L, hat() * 0.05, tb + h * beat); place(R, hat() * 0.05, tb + h * beat + 0.003)
        t0 += 2 * bar; ci += 1
    return L[: int(dur * SR)], R[: int(dur * SR)]


def follower(x, attack=0.02, release=0.35):
    a_a = np.exp(-1 / (attack * SR)); a_r = np.exp(-1 / (release * SR))
    env = np.abs(x)
    # smooth with a fast box then asymmetric one-pole via two lfilters (attack approx.)
    sm = lfilter([1 - a_a], [1, -a_a], env)
    # release: peak-hold decay
    out = np.empty_like(sm); cur = 0.0
    step = SR // 200
    for i in range(0, len(sm), step):
        m = sm[i:i + step].max()
        cur = m if m > cur else cur * (a_r ** step)
        out[i:i + step] = cur
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", required=True); ap.add_argument("--events", required=True)
    ap.add_argument("--voice", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    tl = json.loads(Path(a.timeline).read_text()); events = json.loads(Path(a.events).read_text())
    dur = tl["duration"]; N = int(dur * SR)
    voice, sr = sf.read(a.voice, dtype="float32"); assert sr == SR
    voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

    mL, mR = make_music(dur)
    # duck the music under speech
    duck = follower(voice, 0.015, 0.45)
    g = 1 - 0.62 * np.clip(duck / 0.12, 0, 1)
    g = lp(g, 8, 1)
    mus_gain = 0.55
    mL, mR = mL * g * mus_gain, mR * g * mus_gain
    # intro/outro fades
    fi = np.clip(np.arange(N) / (0.8 * SR), 0, 1); fo = np.clip((N - np.arange(N)) / (1.8 * SR), 0, 1)
    mL, mR = mL * fi * fo, mR * fi * fo

    sfx = np.zeros(N)
    for e in events:
        fn, gain = SFX[e["type"]]
        clip = fn() * gain * e.get("gain", 1.0) * RNG.uniform(0.92, 1.05)
        place(sfx, clip, max(0, e["t"]))
    sfx_ducked = sfx * (1 - 0.25 * np.clip(duck / 0.12, 0, 1))

    L = voice * 1.0 + mL + sfx_ducked
    R = voice * 1.0 + mR + sfx_ducked
    mix = np.stack([L, R], axis=1)
    tmp = Path(a.out).with_suffix(".pre.wav"); sf.write(tmp, mix, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.84", "-ar", str(SR), str(a.out)], check=True)
    tmp.unlink()
    print("mix written:", a.out)


if __name__ == "__main__":
    main()
