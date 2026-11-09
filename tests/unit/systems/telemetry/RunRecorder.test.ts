import { describe, expect, it } from 'vitest';
import { RunRecorder } from '../../../../src/systems/telemetry/RunRecorder';

const START = Date.UTC(2026, 10, 9, 20, 0, 0);
const recorder = () => new RunRecorder({ runId: 'run-1', gameVersion: '0.1.0', level: 'level1', startedAt: START });

describe('RunRecorder', () => {
  it('finish_afterNinetySeconds_reportsDuration', () => {
    // Arrange
    const r = recorder();

    // Act
    const summary = r.finish('gameover', 0, START + 90_000);

    // Assert
    expect(summary.durationMs).toBe(90_000);
  });

  it('finish_fractionalClock_durationIsWholeMilliseconds', () => {
    // Arrange
    const r = recorder();

    // Act
    const summary = r.finish('gameover', 0, START + 1234.567);

    // Assert
    expect(summary.durationMs).toBe(1235);
  });

  it('finish_anyRun_startedAtIsIsoTimestamp', () => {
    // Arrange
    const r = recorder();

    // Act
    const summary = r.finish('gameover', 0, START);

    // Assert
    expect(summary.startedAt).toBe('2026-11-09T20:00:00.000Z');
  });

  it('enemyKilled_severalKinds_countsEachKind', () => {
    // Arrange
    const r = recorder();
    r.enemyKilled('beghina');
    r.enemyKilled('chierichetto');
    r.enemyKilled('beghina');

    // Act
    const summary = r.finish('victory', 1000, START);

    // Assert
    expect(summary.kills).toEqual({ beghina: 2, chierichetto: 1 });
  });

  it('threw_pearVolleyAndSingleThrow_countsVolleysAndBricks', () => {
    // Arrange
    const r = recorder();
    r.threw(3);
    r.threw(1);

    // Act
    const summary = r.finish('gameover', 0, START);

    // Assert
    expect([summary.throws, summary.bricks]).toEqual([2, 4]);
  });

  it('bossPhase_phasesReportedOutOfOrder_keepsHighest', () => {
    // Arrange
    const r = recorder();
    r.bossPhase(0);
    r.bossPhase(2);
    r.bossPhase(1);

    // Act
    const summary = r.finish('gameover', 0, START);

    // Assert
    expect(summary.bossPhaseReached).toBe(2);
  });

  it('finish_bossNeverFought_phaseIsMinusOne', () => {
    // Arrange
    const r = recorder();

    // Act
    const summary = r.finish('gameover', 0, START);

    // Assert
    expect(summary.bossPhaseReached).toBe(-1);
  });

  it('finish_calledTwice_keepsFirstSummary', () => {
    // Arrange
    const r = recorder();
    const first = r.finish('victory', 500, START + 1000);

    // Act
    const second = r.finish('gameover', 0, START + 9000);

    // Assert
    expect(second).toBe(first);
  });

  it('finish_eventsAfterFinish_doNotChangeSummary', () => {
    // Arrange
    const r = recorder();
    const summary = r.finish('victory', 500, START);

    // Act
    r.enemyKilled('beghina');

    // Assert
    expect(summary.kills).toEqual({});
  });
});
