import { audio, midi } from './engine';

// ---------------------------------------------------------------------------------------------
// VOICES — pipe organ, gregorian choir, church bells, timpani
// ---------------------------------------------------------------------------------------------

function organ(t: number, note: number, dur: number, vel: number, bright = false) {
  const a = audio, ctx = a.ctx!;
  const f = midi(note);
  const out = a.env(t, vel, 0.012, dur, bright ? 0.18 : 0.12);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = bright ? 4200 : 2600;
  out.connect(lp).connect(a.music);
  const bars: [number, number][] = bright
    ? [[0.5, 0.35], [1, 0.5], [2, 0.4], [3, 0.22], [4, 0.2], [6, 0.08], [8, 0.07]]
    : [[0.5, 0.4], [1, 0.5], [2, 0.3], [3, 0.12], [4, 0.1]];
  for (const [ratio, amp] of bars) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * ratio;
    const g = ctx.createGain();
    g.gain.value = amp * 0.3;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.4);
  }
  if (bright) { // reed stop, for that evil cathedral bite
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.025;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.4);
  }
}

function choir(t: number, notes: number[], dur: number, vel: number) {
  const a = audio, ctx = a.ctx!;
  const out = a.env(t, vel, 0.35, dur, 0.9);
  out.connect(a.music);
  const formants: [number, number, number][] = [[730, 7, 1], [1090, 8, 0.6], [2440, 10, 0.25]];
  const mix = ctx.createGain();
  mix.gain.value = 0.5;
  for (const [freq, q, gain] of formants) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    mix.connect(bp).connect(g).connect(out);
  }
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.8;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 6;
  lfo.connect(lfoGain);
  lfo.start(t);
  lfo.stop(t + dur + 1.3);
  for (const n of notes) {
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midi(n);
      o.detune.value = det;
      lfoGain.connect(o.detune);
      o.connect(mix);
      o.start(t);
      o.stop(t + dur + 1.3);
    }
  }
}

function bell(t: number, note: number, vel: number) {
  const a = audio, ctx = a.ctx!;
  const f = midi(note);
  const partials: [number, number][] = [[0.5, 0.55], [1, 1], [1.19, 0.55], [1.5, 0.35], [2, 0.4], [2.52, 0.22], [3.36, 0.14]];
  for (const [ratio, amp] of partials) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * ratio;
    const dec = 3.6 / Math.sqrt(ratio);
    const g = a.env(t, vel * amp * 0.25, 0.004, 0, dec);
    o.connect(g).connect(a.music);
    o.start(t);
    o.stop(t + dec + 0.1);
  }
}

function timpani(t: number, vel: number, pitch = 1) {
  const a = audio, ctx = a.ctx!;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(115 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(42 * pitch, t + 0.28);
  const g = a.env(t, vel, 0.004, 0.02, 0.38);
  o.connect(g).connect(a.master);
  o.start(t);
  o.stop(t + 0.5);
}

function snare(t: number, vel: number) {
  const a = audio, ctx = a.ctx!;
  const n = a.noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1900;
  bp.Q.value = 0.8;
  const g = a.env(t, vel, 0.002, 0.01, 0.16);
  n.connect(bp).connect(g).connect(a.music);
  n.start(t, Math.random());
  n.stop(t + 0.25);
}

// ---------------------------------------------------------------------------------------------
// TRACKS
// ---------------------------------------------------------------------------------------------

interface Track {
  bpm: number;
  length: number;
  loop: boolean;
  step(s: number, t: number, stepDur: number): void;
}

type Note = [pos: number, note: number, len: number];

const Dm = [50, 53, 57], Bb = [46, 50, 53], Gm = [43, 46, 50], A = [45, 49, 52], F = [41, 45, 48], C = [48, 52, 55];
const Am = [57, 60, 64], Fh = [53, 57, 60], Dh = [50, 53, 57], E = [52, 56, 59], Bdim = [47, 50, 53];

function playMelody(bar: Note[] | undefined, pos: number, t: number, sd: number, vel: number, bright = true) {
  bar?.forEach(([p, n, l]) => { if (p === pos) organ(t, n, l * sd * 0.95, vel, bright); });
}

/** Level theme: "Processione delle Tenebre" — D minor, organ toccata texture over a gregorian pad. */
const level: Track = (() => {
  const chords = [Dm, Bb, Gm, A, Dm, F, Gm, A];
  const melody: Note[][] = [
    [[0, 74, 4], [4, 73, 2], [6, 74, 2], [8, 77, 4], [12, 76, 4]],
    [[0, 74, 4], [4, 72, 2], [6, 70, 2], [8, 69, 8]],
    [[0, 70, 4], [4, 69, 2], [6, 67, 2], [8, 70, 4], [12, 74, 4]],
    [[0, 73, 8], [8, 69, 4], [12, 64, 4]],
    [[0, 77, 4], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 72, 6], [6, 74, 2], [8, 77, 8]],
    [[0, 79, 4], [4, 77, 2], [6, 74, 2], [8, 70, 4], [12, 74, 4]],
    [[0, 73, 4], [4, 76, 4], [8, 81, 8]],
  ];
  const arp = [0, 1, 2, 3, 2, 1, 0, 1, 0, 2, 3, 2, 1, 2, 3, 1];
  return {
    bpm: 100, length: 128, loop: true,
    step(s, t, sd) {
      const bar = Math.floor(s / 16), pos = s % 16;
      const ch = chords[bar];
      const tones = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24];
      organ(t, tones[arp[pos]], sd * 0.9, 0.16);
      if (pos === 0 || pos === 8) organ(t, ch[0] - 12, sd * 7.5, 0.35);
      if (pos === 0) choir(t, ch.map((n) => n + 12), sd * 15, 0.11);
      if (pos === 0 && bar % 4 === 0) bell(t, 50, 0.8);
      if (pos === 0 || pos === 8) timpani(t, 0.7);
      if (pos === 4 || pos === 12) snare(t, 0.08);
      if (bar === 7 && pos >= 12) timpani(t, 0.4, 1.3);
      playMelody(melody[bar], pos, t, sd, 0.26);
    },
  };
})();

/** Boss theme: "Dies Irae del Monsignore" — A harmonic minor, relentless. */
const boss: Track = (() => {
  const chords = [Am, Fh, Dh, E, Am, Fh, Bdim, E];
  const melody: Note[][] = [
    [[0, 81, 4], [4, 80, 4], [8, 81, 2], [10, 84, 2], [12, 83, 4]],
    [[0, 81, 8], [8, 77, 8]],
    [[0, 74, 4], [4, 77, 4], [8, 81, 4], [12, 77, 4]],
    [[0, 80, 8], [8, 76, 4], [12, 80, 4]],
    [[0, 81, 4], [4, 80, 4], [8, 81, 2], [10, 84, 2], [12, 88, 4]],
    [[0, 86, 8], [8, 84, 8]],
    [[0, 83, 4], [4, 86, 4], [8, 89, 8]],
    [[0, 88, 8], [8, 80, 8]],
  ];
  const arp = [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 2, 1, 0, 1];
  return {
    bpm: 138, length: 128, loop: true,
    step(s, t, sd) {
      const bar = Math.floor(s / 16), pos = s % 16;
      const ch = chords[bar];
      const tones = [ch[0], ch[1], ch[2], ch[0] + 12];
      organ(t, tones[arp[pos]], sd * 0.85, 0.15, true);
      if (pos % 4 === 0) organ(t, ch[0] - 24, sd * 3.6, 0.32);
      if (pos === 0) choir(t, [ch[0], ch[1], ch[2], ch[0] + 12], sd * 15, 0.13);
      if (pos === 0) bell(t, 45 + (bar % 2) * 7, 0.7);
      if (pos % 4 === 0) timpani(t, 0.75);
      if (pos === 4 || pos === 12) snare(t, 0.14);
      if (bar === 7 && pos >= 8 && pos % 2 === 0) snare(t, 0.12);
      playMelody(melody[bar], pos, t, sd, 0.3);
    },
  };
})();

/** Title theme: a sinister organ flourish, then the bells of Chiappetons. */
const title: Track = (() => {
  const melody: Note[][] = [
    [[0, 86, 1], [1, 84, 1], [2, 86, 6]],
    [[0, 84, 1], [1, 82, 1], [2, 81, 1], [3, 79, 1], [4, 77, 2], [6, 76, 2], [8, 74, 8]],
    [[0, 77, 4], [4, 76, 4], [8, 74, 4], [12, 73, 4]],
    [[0, 74, 16]],
  ];
  return {
    bpm: 72, length: 64, loop: true,
    step(s, t, sd) {
      const bar = Math.floor(s / 16), pos = s % 16;
      playMelody(melody[bar], pos, t, sd, 0.3);
      if (bar === 1 && pos === 8) { [50, 53, 57, 62].forEach((n) => organ(t, n, sd * 8, 0.18, true)); organ(t, 26, sd * 24, 0.45); }
      if (bar === 2 && pos === 0) choir(t, [50, 53, 57], sd * 16, 0.13);
      if (bar === 3 && pos === 0) { choir(t, [49, 52, 57], sd * 16, 0.13); [45, 49, 52].forEach((n) => organ(t, n - 12, sd * 15, 0.16)); }
      if (pos === 0 && bar >= 2) bell(t, bar === 2 ? 50 : 45, 0.8);
      if (bar === 3 && pos === 12) timpani(t, 0.8);
    },
  };
})();

/** Game over: descending cadence. One shot. */
const gameOver: Track = {
  bpm: 76, length: 48, loop: false,
  step(s, t, sd) {
    const seq = [Dm, Bb, Gm, A, Dm];
    if (s % 8 === 0 && s / 8 < seq.length) {
      const ch = seq[s / 8];
      ch.forEach((n) => organ(t, n, sd * (s === 32 ? 15 : 7.5), 0.2, true));
      organ(t, ch[0] - 12, sd * 7.5, 0.35);
    }
    if (s === 32) { bell(t, 38, 1); choir(t, [50, 53, 57], sd * 14, 0.14); }
  },
};

/** Victory: picardy third, D major triumphs over D minor. */
const victory: Track = {
  bpm: 96, length: 64, loop: false,
  step(s, t, sd) {
    const seq = [Dm, Bb, C, [50, 54, 57]];
    if (s % 8 === 0 && s / 8 < seq.length) {
      const ch = seq[s / 8];
      const last = s / 8 === seq.length - 1;
      ch.forEach((n) => organ(t, n + 12, sd * (last ? 30 : 7.5), 0.2, true));
      organ(t, ch[0] - 12, sd * (last ? 30 : 7.5), 0.35);
      if (last) { choir(t, [62, 66, 69], sd * 28, 0.15); bell(t, 62, 1); bell(t, 50, 0.8); }
      timpani(t, 0.6);
    }
    if (s === 28 || s === 29 || s === 30) timpani(t, 0.4, 1.2);
  },
};

export const TRACKS = { title, level, boss, gameOver, victory } as const;
export type TrackName = keyof typeof TRACKS;

/** Look-ahead step sequencer (25ms timer, 120ms schedule window). */
class MusicPlayer {
  private timer: number | null = null;
  private track: Track | null = null;
  private stepIdx = 0;
  private nextTime = 0;
  current: TrackName | null = null;

  play(name: TrackName) {
    if (!audio.ctx || this.current === name) return;
    this.stop();
    this.current = name;
    this.track = TRACKS[name];
    this.stepIdx = 0;
    this.nextTime = audio.now + 0.08;
    this.timer = window.setInterval(() => this.tick(), 25);
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.track = null;
    this.current = null;
  }

  private tick() {
    const tr = this.track;
    if (!tr || !audio.ctx) return;
    const sd = 60 / tr.bpm / 4;
    if (this.nextTime < audio.now - 0.25) this.nextTime = audio.now + 0.02; // tab was hidden
    while (this.nextTime < audio.now + 0.12) {
      if (this.stepIdx >= tr.length) {
        if (!tr.loop) { this.stop(); return; }
        this.stepIdx = 0;
      }
      tr.step(this.stepIdx, this.nextTime, sd);
      this.nextTime += sd;
      this.stepIdx++;
    }
  }
}

export const music = new MusicPlayer();
