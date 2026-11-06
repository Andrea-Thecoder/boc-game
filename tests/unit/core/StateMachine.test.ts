import { describe, expect, it } from 'vitest';
import { StateMachine, type StateTable } from '../../../src/core/StateMachine';

type BeghinaState = 'walk' | 'windup' | 'whip';

/** Minimal context recording the hooks called, in order. */
class FakeBeghina {
  readonly log: string[] = [];
  nearPlayer = false;
}

const table: StateTable<BeghinaState, FakeBeghina> = {
  walk: {
    enter: (b) => b.log.push('enter:walk'),
    update: (b) => (b.nearPlayer ? 'windup' : undefined),
    exit: (b) => b.log.push('exit:walk'),
  },
  windup: {
    enter: (b) => b.log.push('enter:windup'),
    update: (_, fsm) => (fsm.elapsed >= 380 ? 'whip' : undefined),
    exit: (b) => b.log.push('exit:windup'),
  },
  whip: {
    enter: (b) => b.log.push('enter:whip'),
  },
};

const build = (initial: BeghinaState = 'walk') => {
  const beghina = new FakeBeghina();
  const fsm = new StateMachine(beghina, table, initial);
  return { beghina, fsm };
};

describe('StateMachine', () => {
  it('constructor_initialState_isCurrent', () => {
    // Arrange: nothing to prepare

    // Act
    const { fsm } = build('walk');

    // Assert
    expect(fsm.current).toBe('walk');
  });

  it('constructor_initialState_callsItsEnter', () => {
    // Arrange: nothing to prepare

    // Act
    const { beghina } = build('walk');

    // Assert
    expect(beghina.log).toEqual(['enter:walk']);
  });

  it('update_stateReturnsNothing_staysInState', () => {
    // Arrange
    const { fsm } = build('walk');

    // Act
    fsm.update(16);

    // Assert
    expect(fsm.current).toBe('walk');
  });

  it('update_stateReturnsNextState_transitions', () => {
    // Arrange
    const { beghina, fsm } = build('walk');
    beghina.nearPlayer = true;

    // Act
    fsm.update(16);

    // Assert
    expect(fsm.current).toBe('windup');
  });

  it('transition_toOtherState_callsExitThenEnter', () => {
    // Arrange
    const { beghina, fsm } = build('walk');

    // Act
    fsm.transition('windup');

    // Assert
    expect(beghina.log).toEqual(['enter:walk', 'exit:walk', 'enter:windup']);
  });

  it('update_repeatedCalls_accumulatesElapsedTime', () => {
    // Arrange
    const { fsm } = build('walk');

    // Act
    fsm.update(16);
    fsm.update(17);

    // Assert
    expect(fsm.elapsed).toBe(33);
  });

  it('transition_afterTimeSpent_resetsElapsed', () => {
    // Arrange
    const { fsm } = build('walk');
    fsm.update(500);

    // Act
    fsm.transition('windup');

    // Assert
    expect(fsm.elapsed).toBe(0);
  });

  it('update_timedStateBeforeDuration_staysInState', () => {
    // Arrange
    const { fsm } = build('windup');

    // Act
    fsm.update(379);

    // Assert
    expect(fsm.current).toBe('windup');
  });

  it('update_timedStateAfterDuration_movesToNextState', () => {
    // Arrange
    const { fsm } = build('windup');
    fsm.update(379);

    // Act
    fsm.update(1);

    // Assert
    expect(fsm.current).toBe('whip');
  });

  it('transition_toSameState_reentersIt', () => {
    // Arrange
    const { beghina, fsm } = build('windup');

    // Act
    fsm.transition('windup');

    // Assert
    expect(beghina.log).toEqual(['enter:windup', 'exit:windup', 'enter:windup']);
  });

  it('previous_afterTransition_isTheLeftState', () => {
    // Arrange
    const { fsm } = build('walk');

    // Act
    fsm.transition('whip');

    // Assert
    expect(fsm.previous).toBe('walk');
  });

  it('is_currentState_returnsTrue', () => {
    // Arrange
    const { fsm } = build('whip');

    // Act
    const result = fsm.is('whip');

    // Assert
    expect(result).toBe(true);
  });

  it('update_stateWithoutHooks_doesNotThrow', () => {
    // Arrange
    const { fsm } = build('whip');

    // Act
    const act = () => fsm.update(16);

    // Assert
    expect(act).not.toThrow();
  });
});
