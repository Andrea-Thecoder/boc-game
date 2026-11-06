import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';

interface TestEvents {
  'enemy:killed': { points: number };
  'boss:defeated': void;
}

describe('EventBus', () => {
  it('emit_subscribedHandler_receivesPayload', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('enemy:killed', handler);

    // Act
    bus.emit('enemy:killed', { points: 100 });

    // Assert
    expect(handler).toHaveBeenCalledWith({ points: 100 });
  });

  it('emit_voidEvent_callsHandlerWithoutPayload', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('boss:defeated', handler);

    // Act
    bus.emit('boss:defeated');

    // Assert
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emit_handlerOfAnotherEvent_isNotCalled', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('boss:defeated', handler);

    // Act
    bus.emit('enemy:killed', { points: 100 });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('emit_multipleHandlers_calledInSubscriptionOrder', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const calls: string[] = [];
    bus.on('boss:defeated', () => calls.push('score'));
    bus.on('boss:defeated', () => calls.push('music'));

    // Act
    bus.emit('boss:defeated');

    // Assert
    expect(calls).toEqual(['score', 'music']);
  });

  it('emit_noSubscribers_doesNotThrow', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();

    // Act
    const act = () => bus.emit('boss:defeated');

    // Assert
    expect(act).not.toThrow();
  });

  it('emit_handlerThrows_errorPropagatesToEmitter', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    bus.on('boss:defeated', () => {
      throw new Error('bug nel sistema');
    });

    // Act
    const act = () => bus.emit('boss:defeated');

    // Assert
    expect(act).toThrow('bug nel sistema');
  });

  it('on_returnedUnsubscribe_stopsDelivery', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    const unsubscribe = bus.on('boss:defeated', handler);

    // Act
    unsubscribe();
    bus.emit('boss:defeated');

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('off_registeredHandler_stopsDelivery', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('boss:defeated', handler);

    // Act
    bus.off('boss:defeated', handler);
    bus.emit('boss:defeated');

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('once_emittedTwice_handlerCalledOnlyOnce', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.once('boss:defeated', handler);

    // Act
    bus.emit('boss:defeated');
    bus.emit('boss:defeated');

    // Assert
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emit_handlerUnsubscribesAnotherDuringDispatch_currentEmissionStillReachesIt', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const second = vi.fn();
    bus.on('boss:defeated', () => bus.off('boss:defeated', second));
    bus.on('boss:defeated', second);

    // Act
    bus.emit('boss:defeated');

    // Assert
    expect(second).toHaveBeenCalledOnce();
  });

  it('emit_wrongPayload_isRejectedByCompiler', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();

    // Act: the real assertion is the compiler (npm run typecheck fails if these lines become valid)
    // @ts-expect-error points must be a number
    const wrongType = () => bus.emit('enemy:killed', { points: 'tanti' });
    // @ts-expect-error the payload is mandatory for non-void events
    const missing = () => bus.emit('enemy:killed');
    // @ts-expect-error unknown event name
    const unknown = () => bus.emit('paolone:dieta');

    // Assert
    expect([wrongType, missing, unknown]).toHaveLength(3);
  });

  it('listenerCount_afterUnsubscribe_isZero', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const unsubscribe = bus.on('boss:defeated', vi.fn());

    // Act
    unsubscribe();

    // Assert
    expect(bus.listenerCount('boss:defeated')).toBe(0);
  });

  it('clear_withSubscriptions_removesAllHandlers', () => {
    // Arrange
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('boss:defeated', handler);
    bus.on('enemy:killed', handler);

    // Act
    bus.clear();
    bus.emit('boss:defeated');
    bus.emit('enemy:killed', { points: 1 });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });
});
