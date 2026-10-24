#!/usr/bin/env python3
"""Generate short, seamless, original local ambient loops for Release 2.0.

Build-time helper only. Requires numpy, soundfile and ffmpeg; the game does not
need Python or ffmpeg to play the encoded OGG files.
"""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio"
SR = 22050
DURATION = 24.0
N = int(SR * DURATION)
T = np.arange(N, dtype=np.float64) / SR
SEG = DURATION / 4

TRACKS = {
    "imperial-archive": {
        "seed": 401,
        "chords": [[55,65.406,82.407,110,130.813], [43.654,65.406,87.307,110], [36.708,55,73.416,110,146.832], [41.203,61.735,82.407,123.47]],
        "pad": 0.36, "air": 0.032, "bells": [(3.4,146.83,0.065,5.0),(11.6,196.0,0.045,6.0),(19.1,164.81,0.07,5.6)],
        "thuds": [(0.8,52,0.045),(8.3,47,0.035),(16.2,49,0.04)], "ticks": [], "character": "archive"
    },
    "hive-industrial": {
        "seed": 402,
        "chords": [[41.203,61.735,82.407,103.826], [43.654,65.406,87.307,110], [38.891,58.27,77.782,116.54], [41.203,61.735,82.407,123.47]],
        "pad": 0.27, "air": 0.045, "bells": [(5.1,110,0.055,2.5),(13.8,92.5,0.07,3.3),(21.4,130.81,0.05,2.8)],
        "thuds": [(0.9,70,0.08),(3.8,58,0.055),(6.7,66,0.065),(9.8,54,0.06),(12.4,72,0.065),(15.5,58,0.06),(18.2,65,0.08),(21.3,52,0.07)],
        "ticks": [(2.6,420,0.025),(7.3,330,0.025),(11.2,510,0.02),(16.9,380,0.025),(22.6,460,0.02)], "character": "industrial"
    },
    "cathedral-crypt": {
        "seed": 403,
        "chords": [[36.708,55,73.416,110,146.832], [41.203,61.735,82.407,123.47], [34.648,51.913,69.296,103.826,138.59], [38.891,58.27,77.782,116.54]],
        "pad": 0.34, "air": 0.04, "bells": [(1.8,130.81,0.08,7.0),(9.5,164.81,0.05,8.0),(17.2,146.83,0.075,7.4)],
        "thuds": [(5.8,42,0.045),(14.6,39,0.05),(22.5,43,0.04)], "ticks": [(6.1,610,0.013),(18.1,730,0.012)], "character": "cathedral"
    },
    "warp-disturbance": {
        "seed": 404,
        "chords": [[55,58.27,65.406,77.782], [49,51.913,65.406,73.416], [55,65.406,69.296,82.407], [46.25,49,58.27,69.296]],
        "pad": 0.30, "air": 0.065, "bells": [(4.8,311.13,0.05,4.4),(12.7,277.18,0.06,5.0),(20.5,329.63,0.045,4.7)],
        "thuds": [(2.2,39,0.05),(9.0,43,0.035),(16.3,36,0.055),(22.3,41,0.05)], "ticks": [(6.2,690,0.035),(10.8,540,0.02),(18.6,810,0.03)], "character": "warp"
    },
    "combat-underscore": {
        "seed": 405,
        "chords": [[41.203,61.735,82.407,103.826], [43.654,65.406,87.307,110], [38.891,58.27,77.782,116.54], [41.203,61.735,82.407,123.47]],
        "pad": 0.29, "air": 0.026, "bells": [(7.2,196,0.023,2.0),(18.3,174.61,0.02,2.4)],
        "thuds": [(i*0.75+0.12, 76 if i%4==0 else 58, 0.115 if i%4==0 else 0.058) for i in range(32)],
        "ticks": [(i*0.75+0.46, 680 if i%2 else 540, 0.035) for i in range(32)], "character": "combat"
    },
}

def snap(freq: float) -> float:
    """Quantize frequency to an exact loop-period bin for a click-free loop."""
    return max(1, round(float(freq) * DURATION)) / DURATION

def oscillator(freq: float, phase: float = 0.0) -> np.ndarray:
    return np.sin(2.0 * np.pi * snap(freq) * T + phase)

def pad_for_chord(notes, seed, chord_index, character):
    rng = np.random.default_rng(seed + chord_index * 101)
    part = np.zeros(N, dtype=np.float64)
    for ix, base in enumerate(notes):
        phase = rng.uniform(-np.pi, np.pi)
        note = np.zeros(N, dtype=np.float64)
        # Smooth, organ/brass-like harmonic stack without sharp transient edges.
        for h in range(1, 7):
            weight = 1.0 / (h ** (1.45 if character != 'warp' else 1.22))
            if h >= 4: weight *= 0.55 if character == 'archive' else 0.72
            note += weight * oscillator(base * h, phase + h * 0.29)
        # A very slow periodic amplitude movement adds motion but keeps the loop seamless.
        movement = 0.84 + 0.12 * np.sin(2*np.pi*(2/DURATION)*T + ix*1.1) + 0.04*np.sin(2*np.pi*(3/DURATION)*T + phase)
        part += note * movement
        # Extremely quiet neighbouring partial adds width and slight beating.
        part += 0.10 * oscillator(base * 1.003, phase + 0.8)
    return part / max(1, len(notes))

def chord_pad(cfg):
    pads = [pad_for_chord(ch, cfg['seed'], i, cfg['character']) for i,ch in enumerate(cfg['chords'])]
    fade = 1.15
    out = np.zeros(N, dtype=np.float64)
    for i, signal in enumerate(pads):
        rel = (T - i*SEG) % DURATION
        w = np.ones(N, dtype=np.float64)
        # Chord transitions overlap, including the transition across the loop boundary.
        fade_in = rel < fade
        w[fade_in] = 0.5 - 0.5*np.cos(np.pi*rel[fade_in]/fade)
        fade_out = rel > SEG - fade
        w[fade_out] = np.minimum(w[fade_out], 0.5 - 0.5*np.cos(np.pi*(SEG-rel[fade_out])/fade))
        out += signal * w
    out *= cfg['pad']
    # The industrial track has a barely audible slow motor overtone.
    if cfg['character'] == 'industrial':
        out += 0.036 * oscillator(41.2) * (0.5 + 0.5*np.sin(2*np.pi*(1/DURATION)*T))
    if cfg['character'] == 'warp':
        out += 0.035 * oscillator(55.0) * (0.5 + 0.5*np.sin(2*np.pi*(5/DURATION)*T))
    return out

def coloured_noise(seed):
    rng = np.random.default_rng(seed)
    white = rng.standard_normal(N)
    spec = np.fft.rfft(white)
    f = np.fft.rfftfreq(N, 1/SR)
    # Diffuse low-passed pink noise rather than white static.
    shape = 1.0 / np.sqrt(np.maximum(f, 24.0))
    shape *= np.exp(-((f/1500.0)**2))
    shape[f < 20] = 0
    n = np.fft.irfft(spec*shape, n=N)
    n /= max(float(np.std(n)), 1e-9)
    return n

def event_tone(t0, freq, level, decay, partials=None):
    dt = (T - t0) % DURATION
    active = dt < min(DURATION, decay*5.5)
    out = np.zeros(N, dtype=np.float64)
    if not np.any(active): return out
    x = dt[active]
    partials = partials or [(1.0,1.0),(2.01,0.48),(2.74,0.24),(4.16,0.12),(5.31,0.05)]
    ring = np.zeros_like(x)
    for mult, amp in partials:
        ring += amp * np.sin(2*np.pi*snap(freq*mult)*x + mult*0.37)
    out[active] = level * ring * np.exp(-x/decay)
    return out

def thud(t0, freq, level):
    dt = (T - t0) % DURATION
    active = dt < 1.0
    out = np.zeros(N, dtype=np.float64)
    x = dt[active]
    # Falling-pitch impact and a short, soft noise attack.
    k = 3.8
    phase = 2*np.pi*snap(freq) * (1.0 - np.exp(-k*x)) / k
    out[active] = level * np.sin(phase) * np.exp(-x/0.30)
    return out

def tick(t0, freq, level):
    dt = (T - t0) % DURATION
    active = dt < 0.38
    out = np.zeros(N, dtype=np.float64)
    x = dt[active]
    out[active] = level * (np.sin(2*np.pi*snap(freq)*x) + 0.35*np.sin(2*np.pi*snap(freq*2.71)*x)) * np.exp(-x/0.065)
    return out

def make_track(name, cfg):
    rng = np.random.default_rng(cfg['seed'])
    mix = chord_pad(cfg)
    air = coloured_noise(cfg['seed'] + 9001)
    # Rhythmic filtered-air bed; every layer is periodic across the loop boundary.
    mod_rate = {'archive':2,'industrial':4,'cathedral':3,'warp':5,'combat':8}[cfg['character']]
    lfo = 0.57 + 0.25*np.sin(2*np.pi*(mod_rate/DURATION)*T) + 0.18*np.sin(2*np.pi*(1/DURATION)*T+1.2)
    mix += air * cfg['air'] * np.clip(lfo,0,1)
    for t0, f, lvl, dec in cfg['bells']:
        mix += event_tone(t0, f, lvl, dec)
    for t0, f, lvl in cfg['thuds']:
        mix += thud(t0, f, lvl)
    for t0, f, lvl in cfg['ticks']:
        mix += tick(t0, f, lvl)
    # A track-specific harmonic accent prevents the score from sounding like a single hum.
    if cfg['character'] == 'archive':
        for t0, f in [(6.5,293.66),(14.4,246.94),(22.2,329.63)]:
            mix += event_tone(t0, f, 0.022, 2.0, [(1,1),(2.76,.35),(4.1,.11)])
    elif cfg['character'] == 'industrial':
        for i,t0 in enumerate([1.8,4.9,8.9,11.9,15.0,19.1,23.2]):
            mix += tick(t0, 165 + (i%3)*34, 0.018)
    elif cfg['character'] == 'cathedral':
        for t0,f in [(4.1,220),(15.0,185),(22.0,246.94)]:
            mix += event_tone(t0, f, 0.028, 4.5, [(1,1),(2,.55),(3.01,.20),(4.02,.11)])
    elif cfg['character'] == 'warp':
        # Quiet rising dissonant tails, like an uncertain echo in the Warp.
        for t0,f in [(2.9,185),(10.5,207.65),(18.1,174.61)]:
            dt=(T-t0)%DURATION; active=dt<2.1; x=dt[active]
            env=np.sin(np.pi*np.clip(x/2.1,0,1))**1.5
            sweep=np.sin(2*np.pi*(f*x + 3.1*x*x))
            mix[active] += 0.022*sweep*env
    elif cfg['character'] == 'combat':
        # A restrained two-note ostinato and occasional secondary impacts, not a dance beat.
        for i in range(32):
            t0=(i*0.75+0.28)%DURATION
            mix += tick(t0, 146.83 if i%4 else 110, 0.012 if i%4 else 0.021)
        for t0 in [5.9,11.9,17.9,23.7]:
            mix += event_tone(t0, 82.41, 0.035, 0.9, [(1,1),(1.47,.28),(2.6,.10)])
    # Soft stereo space from periodic delayed reflections and a slight independent side texture.
    delay_l = int(SR*0.19); delay_r = int(SR*0.31)
    left = mix + 0.15*np.roll(mix, delay_l) + 0.012*np.roll(air, int(SR*0.07))
    right = mix + 0.15*np.roll(mix, delay_r) - 0.012*np.roll(air, int(SR*0.11))
    stereo = np.column_stack((left,right))
    stereo -= np.mean(stereo, axis=0, keepdims=True)
    peak = float(np.max(np.abs(stereo)))
    if peak > 1e-8: stereo *= 0.68 / peak
    stereo = np.clip(stereo, -0.95, 0.95).astype(np.float32)
    return stereo

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name,cfg in TRACKS.items():
        pcm = make_track(name,cfg)
        tmp = OUT / f'.{name}.wav'
        dst = OUT / f'{name}.ogg'
        sf.write(tmp, pcm, SR, subtype='PCM_16')
        command = ['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-metadata','artist=Original procedural composition for Warhammer 40,000 Solo RPG','-metadata',f'title={name.replace("-"," ").title()}','-metadata','comment=Locally generated seamless ambient loop; no external audio assets','-vn',str(dst)]
        subprocess.run(command,check=True)
        tmp.unlink(missing_ok=True)
        print(f'{name}: {dst.stat().st_size:,} bytes, {len(pcm)/SR:.1f}s, peak={np.max(np.abs(pcm)):.2f}')

if __name__ == '__main__': main()
