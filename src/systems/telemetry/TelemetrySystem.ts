import type { GameBus } from '../events';
import { RunRecorder } from './RunRecorder';
import type { TelemetrySink } from './sinks';

export interface TelemetryOptions {
  level: string;
  gameVersion: string;
  /** epoch ms (injected so tests control time) */
  now: () => number;
  /** current score, read when the run ends */
  score: () => number;
  newRunId?: () => string;
}

/** Random id for a run, without touching Math.random (which the e2e tests seed for the gameplay). */
export function randomRunId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Listens to the game events, builds the run summary and hands it to the sink when the run ends.
 * MUST be created before RunSystem: `boss:defeated` has to be recorded before RunSystem emits `run:over`.
 */
export class TelemetrySystem {
  constructor(bus: GameBus, sink: TelemetrySink, opts: TelemetryOptions) {
    const r = new RunRecorder({
      runId: (opts.newRunId ?? randomRunId)(),
      gameVersion: opts.gameVersion,
      level: opts.level,
      startedAt: opts.now(),
    });
    bus.on('enemy:killed', ({ enemy }) => r.enemyKilled(enemy.kind));
    bus.on('player:hurt', () => r.playerHurt());
    bus.on('player:healed', () => r.playerHealed());
    bus.on('player:threw', ({ angles }) => r.threw(angles.length));
    bus.on('player:panzata', () => r.panzata());
    bus.on('pickup:collected', ({ kind }) => r.pickup(kind));
    bus.on('wave:started', () => r.waveStarted());
    bus.on('boss:arrived', () => r.bossArrived());
    bus.on('boss:fightStarted', () => r.bossPhase(0));
    bus.on('boss:phaseChanged', ({ phase }) => r.bossPhase(phase));
    bus.on('boss:defeated', () => r.bossWasDefeated());
    bus.on('run:over', ({ outcome }) => {
      if (!r.finished) sink.record(r.finish(outcome, opts.score(), opts.now()));
    });
  }
}
