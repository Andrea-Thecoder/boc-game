/**
 * Finite state machine for AI and actors.
 *
 * Every state is an object with optional `enter`, `update` and `exit` hooks. `update` returns the name of the next
 * state to move to, or nothing to stay. The machine tracks how long it has been in the current state (`elapsed`),
 * so timed behaviours ("wind up for 380 ms, then whip") need no extra timers:
 *
 * ```ts
 * const fsm = new StateMachine(beghina, {
 *   walk:   { update: (b) => (b.nearPlayer() ? 'windup' : undefined) },
 *   windup: { enter: (b) => b.showWindup(), update: (_, fsm) => (fsm.elapsed > 380 ? 'whip' : undefined) },
 *   whip:   { enter: (b) => b.whip(), update: (_, fsm) => (fsm.elapsed > 260 ? 'walk' : undefined) },
 * }, 'walk');
 * fsm.update(delta);
 * ```
 *
 * `C` is the context passed to every hook (usually the entity that owns the machine).
 */
export interface StateDef<S extends string, C> {
  enter?(ctx: C, fsm: StateMachine<S, C>): void;
  /** Returns the next state, or nothing to stay in the current one. */
  update?(ctx: C, fsm: StateMachine<S, C>, deltaMs: number): S | void;
  exit?(ctx: C, fsm: StateMachine<S, C>): void;
}

export type StateTable<S extends string, C> = Record<S, StateDef<S, C>>;

export class StateMachine<S extends string, C> {
  private currentState: S;
  private previousState: S | null = null;
  private elapsedMs = 0;

  constructor(
    private readonly ctx: C,
    private readonly table: StateTable<S, C>,
    initial: S,
  ) {
    this.currentState = initial;
    this.table[initial].enter?.(this.ctx, this);
  }

  get current(): S {
    return this.currentState;
  }

  get previous(): S | null {
    return this.previousState;
  }

  /** Milliseconds spent in the current state. */
  get elapsed(): number {
    return this.elapsedMs;
  }

  is(state: S): boolean {
    return this.currentState === state;
  }

  /**
   * Leaves the current state and enters `to`. Transitioning to the current state re-enters it
   * (exit + enter, timer reset): useful to restart an attack.
   */
  transition(to: S): void {
    this.table[this.currentState].exit?.(this.ctx, this);
    this.previousState = this.currentState;
    this.currentState = to;
    this.elapsedMs = 0;
    this.table[to].enter?.(this.ctx, this);
  }

  /** Advances the timer and runs the current state's `update`, transitioning if it asks to. */
  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const next = this.table[this.currentState].update?.(this.ctx, this, deltaMs);
    if (next !== undefined) this.transition(next);
  }
}
