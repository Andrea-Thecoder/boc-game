/**
 * Synchronous, strongly typed publish/subscribe bus.
 *
 * `Events` maps every event name to its payload type, e.g.
 * `{ 'enemy:killed': { x: number; points: number }; 'boss:defeated': void }`.
 * TypeScript then checks both emitters and listeners: a wrong name or payload does not compile.
 *
 * Handlers run in subscription order, synchronously, inside `emit`. An exception in a handler propagates
 * to the emitter (fail fast: a bug in a system must not be silently swallowed).
 */

/** Payload arguments of `emit`: none for `void` events, exactly one otherwise. */
type PayloadArgs<P> = [P] extends [void] ? [] : [payload: P];

export type Handler<P> = (payload: P) => void;
export type Unsubscribe = () => void;

export class EventBus<Events extends object> {
  private readonly handlers = new Map<keyof Events, Set<Handler<never>>>();

  /** Subscribes and returns the function that removes the subscription. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): Unsubscribe {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  /** Subscribes for a single emission only. */
  once<K extends keyof Events>(event: K, handler: Handler<Events[K]>): Unsubscribe {
    const wrapper: Handler<Events[K]> = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.handlers.delete(event);
  }

  emit<K extends keyof Events>(event: K, ...args: PayloadArgs<Events[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // iterate over a snapshot: handlers may subscribe/unsubscribe while the event is being dispatched
    for (const handler of [...set]) (handler as Handler<unknown>)(args[0]);
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /** Removes every subscription (call it when the owning scene shuts down). */
  clear(): void {
    this.handlers.clear();
  }
}
