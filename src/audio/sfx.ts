import { audio } from './engine';

type Wave = OscillatorType;

function tone(wave: Wave, f0: number, f1: number, dur: number, vel: number, delay = 0, vibrato = 0) {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = wave;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  if (vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vibrato;
    const lg = ctx.createGain();
    lg.gain.value = f0 * 0.12;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  const g = audio.env(t, vel, 0.005, dur * 0.3, dur * 0.7);
  o.connect(g).connect(audio.sfx);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(type: BiquadFilterType, f0: number, f1: number, dur: number, vel: number, q = 1, delay = 0) {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const n = audio.noise();
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = audio.env(t, vel, 0.003, dur * 0.2, dur * 0.8);
  n.connect(f).connect(g).connect(audio.sfx);
  n.start(t, Math.random() * 0.5);
  n.stop(t + dur + 0.05);
}

export const sfx = {
  throw: () => { noise('bandpass', 2400, 600, 0.12, 0.35, 2); tone('triangle', 500, 260, 0.06, 0.2); },
  splash: () => { noise('lowpass', 1400, 300, 0.2, 0.5); tone('sine', 340, 110, 0.14, 0.35); },
  hit: () => tone('square', 260, 120, 0.07, 0.18),
  enemyDie: () => {
    const v = 0.9 + Math.random() * 0.4;
    tone('sawtooth', 820 * v, 180 * v, 0.45, 0.16, 0, 14);
  },
  panzata: () => { tone('sine', 140, 38, 0.3, 0.8); noise('lowpass', 600, 80, 0.25, 0.5); },
  jump: () => tone('square', 140, 300, 0.12, 0.12),
  land: () => tone('sine', 90, 35, 0.15, 0.55),
  pickup: () => [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.08, 0.25, i * 0.055)),
  burp: () => {
    const ctx = audio.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.25;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t);
    o.frequency.linearRampToValueAtTime(70, t + 0.5);
    const am = ctx.createOscillator();
    am.type = 'square';
    am.frequency.value = 23;
    const amg = ctx.createGain();
    amg.gain.value = 0.5;
    const g = audio.env(t, 0.5, 0.02, 0.3, 0.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.Q.value = 6;
    am.connect(amg).connect(g.gain);
    o.connect(lp).connect(g).connect(audio.sfx);
    o.start(t); am.start(t);
    o.stop(t + 0.6); am.stop(t + 0.6);
  },
  hurt: () => tone('square', 480, 90, 0.3, 0.25, 0, 30),
  ostia: () => tone('triangle', 1200, 700, 0.07, 0.12),
  whip: () => noise('highpass', 3000, 1200, 0.1, 0.3, 1),
  smoke: () => noise('lowpass', 500, 900, 0.4, 0.18),
  holyWater: () => { noise('bandpass', 3500, 1500, 0.15, 0.2, 3); },
  bossHit: () => { tone('square', 1480, 1400, 0.06, 0.08); tone('square', 1570, 1500, 0.06, 0.08); },
  bell: () => {
    [1, 2.4, 3, 4.2].forEach((r, i) => tone('sine', 440 * r, 440 * r * 0.99, 0.6 - i * 0.1, 0.18 / (i + 1)));
  },
  explosion: () => { noise('lowpass', 1800, 60, 1.1, 0.9); tone('sine', 120, 30, 0.8, 0.7); },
  blip: () => tone('square', 660 + Math.random() * 120, 640, 0.025, 0.05),
  select: () => { tone('square', 440, 440, 0.06, 0.15); tone('square', 880, 880, 0.08, 0.15, 0.06); },
};
