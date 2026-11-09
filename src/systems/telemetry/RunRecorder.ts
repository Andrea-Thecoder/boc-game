/**
 * Run telemetry, pure (no Phaser, no browser APIs): collects what happens during one run
 * and produces an anonymous summary. Gameplay statistics only, no personal data.
 */

/** Bump when the summary shape changes: the backend uses it to read old and new records. */
export const RUN_SUMMARY_SCHEMA_VERSION = 1;

export type RunOutcome = 'victory' | 'gameover';

export interface RunSummary {
  schemaVersion: typeof RUN_SUMMARY_SCHEMA_VERSION;
  /** random id of this run */
  runId: string;
  gameVersion: string;
  level: string;
  /** ISO timestamp */
  startedAt: string;
  durationMs: number;
  outcome: RunOutcome;
  score: number;
  /** enemies defeated, by kind (boss included) */
  kills: Record<string, number>;
  /** hearts lost */
  damageTaken: number;
  /** panzerotti eaten */
  heals: number;
  /** volleys thrown and single bricks thrown (a pear volley is 3 bricks) */
  throws: number;
  bricks: number;
  panzate: number;
  /** pickups collected, by kind */
  pickups: Record<string, number>;
  wavesStarted: number;
  bossReached: boolean;
  /** highest boss phase index reached, -1 if the fight never started */
  bossPhaseReached: number;
  bossDefeated: boolean;
}

export interface RunInfo {
  runId: string;
  gameVersion: string;
  level: string;
  /** epoch ms */
  startedAt: number;
}

const bump = (counter: Record<string, number>, key: string, by = 1) => {
  counter[key] = (counter[key] ?? 0) + by;
};

export class RunRecorder {
  private readonly kills: Record<string, number> = {};
  private readonly pickups: Record<string, number> = {};
  private damageTaken = 0;
  private heals = 0;
  private throws = 0;
  private bricks = 0;
  private panzate = 0;
  private wavesStarted = 0;
  private bossReached = false;
  private bossPhaseReached = -1;
  private bossDefeated = false;
  private summary: RunSummary | null = null;

  constructor(private readonly info: RunInfo) {}

  enemyKilled(kind: string) {
    bump(this.kills, kind);
  }
  playerHurt() {
    this.damageTaken++;
  }
  playerHealed() {
    this.heals++;
  }
  threw(bricks: number) {
    this.throws++;
    this.bricks += bricks;
  }
  panzata() {
    this.panzate++;
  }
  pickup(kind: string) {
    bump(this.pickups, kind);
  }
  waveStarted() {
    this.wavesStarted++;
  }
  bossArrived() {
    this.bossReached = true;
  }
  bossPhase(index: number) {
    this.bossPhaseReached = Math.max(this.bossPhaseReached, index);
  }
  bossWasDefeated() {
    this.bossDefeated = true;
  }

  get finished(): boolean {
    return this.summary !== null;
  }

  /** Closes the run. Calling it again returns the first summary unchanged. */
  finish(outcome: RunOutcome, score: number, endedAt: number): RunSummary {
    this.summary ??= {
      schemaVersion: RUN_SUMMARY_SCHEMA_VERSION,
      runId: this.info.runId,
      gameVersion: this.info.gameVersion,
      level: this.info.level,
      startedAt: new Date(this.info.startedAt).toISOString(),
      durationMs: Math.max(0, Math.round(endedAt - this.info.startedAt)),
      outcome,
      score,
      kills: { ...this.kills },
      damageTaken: this.damageTaken,
      heals: this.heals,
      throws: this.throws,
      bricks: this.bricks,
      panzate: this.panzate,
      pickups: { ...this.pickups },
      wavesStarted: this.wavesStarted,
      bossReached: this.bossReached,
      bossPhaseReached: this.bossPhaseReached,
      bossDefeated: this.bossDefeated,
    };
    return this.summary;
  }
}
