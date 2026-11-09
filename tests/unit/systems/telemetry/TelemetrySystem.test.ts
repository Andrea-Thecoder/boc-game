import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../src/core/EventBus';
import type { Enemy } from '../../../../src/entities/enemies/Enemy';
import type { GameEvents } from '../../../../src/systems/events';
import type { RunSummary } from '../../../../src/systems/telemetry/RunRecorder';
import type { TelemetrySink } from '../../../../src/systems/telemetry/sinks';
import { TelemetrySystem } from '../../../../src/systems/telemetry/TelemetrySystem';

class SpySink implements TelemetrySink {
  readonly recorded: RunSummary[] = [];
  record(summary: RunSummary) {
    this.recorded.push(summary);
  }
}

/** Builds a telemetry system on a real bus, with a controllable clock and score. */
const setup = () => {
  const bus = new EventBus<GameEvents>();
  const sink = new SpySink();
  const clock = { now: 1_000, score: 0 };
  new TelemetrySystem(bus, sink, {
    level: 'level1',
    gameVersion: '0.1.0',
    now: () => clock.now,
    score: () => clock.score,
    newRunId: () => 'run-42',
  });
  return { bus, sink, clock };
};

const enemy = (kind: string) => ({ kind }) as unknown as Enemy;

describe('TelemetrySystem', () => {
  it('runOver_noEventsBefore_recordsExactlyOneRun', () => {
    // Arrange
    const { bus, sink } = setup();

    // Act
    bus.emit('run:over', { outcome: 'gameover' });

    // Assert
    expect(sink.recorded).toHaveLength(1);
  });

  it('runOver_emittedTwice_recordsOnlyOnce', () => {
    // Arrange
    const { bus, sink } = setup();
    bus.emit('run:over', { outcome: 'victory' });

    // Act
    bus.emit('run:over', { outcome: 'gameover' });

    // Assert
    expect(sink.recorded).toHaveLength(1);
  });

  it('runOver_afterKills_summaryCountsKillsByKind', () => {
    // Arrange
    const { bus, sink } = setup();
    bus.emit('enemy:killed', { enemy: enemy('beghina'), points: 150 });
    bus.emit('enemy:killed', { enemy: enemy('monsignor-panza'), points: 5000 });

    // Act
    bus.emit('run:over', { outcome: 'victory' });

    // Assert
    expect(sink.recorded[0].kills).toEqual({ beghina: 1, 'monsignor-panza': 1 });
  });

  it('runOver_anyOutcome_usesScoreAndClockAtTheEnd', () => {
    // Arrange
    const { bus, sink, clock } = setup();
    clock.now = 61_000;
    clock.score = 4_200;

    // Act
    bus.emit('run:over', { outcome: 'victory' });

    // Assert
    expect(sink.recorded[0]).toMatchObject({ score: 4_200, durationMs: 60_000, outcome: 'victory', runId: 'run-42' });
  });

  it('runOver_bossFoughtUpToPhaseThree_reportsBossProgress', () => {
    // Arrange
    const { bus, sink } = setup();
    bus.emit('boss:arrived');
    bus.emit('boss:fightStarted');
    bus.emit('boss:phaseChanged', { phase: 1 });
    bus.emit('boss:phaseChanged', { phase: 2 });

    // Act
    bus.emit('run:over', { outcome: 'gameover' });

    // Assert
    expect(sink.recorded[0]).toMatchObject({ bossReached: true, bossPhaseReached: 2, bossDefeated: false });
  });

  it('runOver_pickupsCollected_countsThemByKind', () => {
    // Arrange
    const { bus, sink } = setup();
    bus.emit('pickup:collected', { kind: 'pera', x: 0, y: 0 });
    bus.emit('pickup:collected', { kind: 'panzerotto', x: 0, y: 0 });
    bus.emit('pickup:collected', { kind: 'pera', x: 0, y: 0 });

    // Act
    bus.emit('run:over', { outcome: 'gameover' });

    // Assert
    expect(sink.recorded[0].pickups).toEqual({ pera: 2, panzerotto: 1 });
  });
});
