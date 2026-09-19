import type { Renew, StateRefStore, Watch } from 'state-ref';

/** The editable payload must only be changed through ref setters. */
export function guardRef<T>(
  source: StateRefStore<T>,
  assertActive: () => void,
  refs = new WeakMap<object, object>(),
  snapshots = new WeakMap<object, object>(),
  snapshotValues = true
): StateRefStore<T> {
  const snapshot = (value: unknown): unknown => {
    if (!snapshotValues) return value;
    if (value === null || typeof value !== 'object') return value;
    const prototype = Object.getPrototypeOf(value);
    if (
      !Array.isArray(value) &&
      prototype !== null &&
      prototype !== Object.prototype
    ) {
      return value;
    }
    const cached = snapshots.get(value);
    if (cached) return cached;
    const copy = Array.isArray(value)
      ? [...value]
      : Object.assign(Object.create(Object.getPrototypeOf(value)), value);
    const guarded = new Proxy(copy, {
      get(target, key, receiver) {
        return snapshot(Reflect.get(target, key, receiver));
      },
      set() {
        throw new Error('Resource snapshots cannot be modified directly.');
      },
      deleteProperty() {
        throw new Error('Resource snapshots cannot be modified directly.');
      },
      defineProperty() {
        throw new Error('Resource snapshots cannot be modified directly.');
      },
    });
    snapshots.set(value, guarded);
    return guarded;
  };

  const wrap = (ref: object): object => {
    const cached = refs.get(ref);
    if (cached) return cached;
    const guarded = new Proxy(ref, {
      get(target, key, receiver) {
        assertActive();
        const value = Reflect.get(target, key, receiver);
        if (key === 'value') return snapshot(value);
        if (key === Symbol.for('state-ref.ref-link')) return value;
        if (key === Symbol.iterator) {
          return function* () {
            for (const child of value.call(target)) yield wrap(child);
          };
        }
        if (typeof value === 'function') {
          return (...args: unknown[]) => snapshot(value.apply(target, args));
        }
        return value && typeof value === 'object' ? wrap(value) : value;
      },
      set(target, key, value, receiver) {
        assertActive();
        return Reflect.set(target, key, value, receiver);
      },
    });
    refs.set(ref, guarded);
    return guarded;
  };
  return wrap(source as object) as StateRefStore<T>;
}

/** Subscriptions owned by a query handle stop when that handle is disposed. */
export function guardedWatch<T>(
  raw: Watch<T>,
  fallback: StateRefStore<T>,
  guard: (ref: StateRefStore<T>) => StateRefStore<T>,
  assertActive: () => void,
  controllers: Set<AbortController>,
  readonly = false
): Watch<T> {
  const cache = new WeakMap<
    Renew<StateRefStore<T>>,
    {
      controller: AbortController;
      callback: Renew<StateRefStore<T>>;
    }
  >();
  return ((renew, option) => {
    assertActive();
    if (!renew) return guard(fallback);
    let record = cache.get(renew);
    if (
      !record ||
      record.controller.signal.aborted ||
      option?.cache === false
    ) {
      const controller = new AbortController();
      controllers.add(controller);
      controller.signal.addEventListener(
        'abort',
        () => controllers.delete(controller),
        { once: true }
      );
      const callback: Renew<StateRefStore<T>> = (ref, first) => {
        const result = renew(guard(ref), first);
        if (first && result instanceof AbortSignal) {
          if (result.aborted) queueMicrotask(() => controller.abort());
          else
            result.addEventListener('abort', () => controller.abort(), {
              once: true,
            });
        }
        if (!first && result === false) controller.abort();
        return first ? controller.signal : result;
      };
      record = { controller, callback };
      if (option?.cache !== false) cache.set(renew, record);
    }
    return guard(
      raw(record.callback, readonly ? { ...option, editable: false } : option)
    );
  }) as Watch<T>;
}
