import type { Renew, StateRefStore, Watch } from 'state-ref';

/**
 * A read-only view of a plain object or array, reused for the same value.
 *
 * Shared by `guardRef` and the peek (`peek.ts`), which hands a `select` the
 * same protection a display does without going through a ref.
 */
export function snapshotValue(
  value: unknown,
  snapshots: WeakMap<object, object>
): unknown {
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
      return snapshotValue(Reflect.get(target, key, receiver), snapshots);
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
}

/** The editable payload must only be changed through ref setters. */
export function guardRef<T>(
  source: StateRefStore<T>,
  assertActive: () => void,
  refs = new WeakMap<object, object>(),
  snapshots = new WeakMap<object, object>(),
  snapshotValues = true,
  /**
   * Answer a write to a readonly query in this package's own words.
   *
   * The ref underneath is non-editable, so core would refuse the write anyway
   * - but with its generic settings message, which says nothing about which
   * query refused or why. Both ways of getting a ref (`query.ref` and
   * `query.watch(renew)`) pass through here, so both say the same thing.
   */
  readonly = false,
  /**
   * Called before a ref is inspected rather than read: `in`, `Object.keys`,
   * a property descriptor. The peek recomputes there as it does on a read
   * (DC-QH-29); every other ref leaves these to the target as before.
   */
  inspect?: () => void
): StateRefStore<T> {
  const snapshot = (value: unknown): unknown =>
    snapshotValues ? snapshotValue(value, snapshots) : value;

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
        if (readonly) throw new TypeError('This query is readonly.');
        return Reflect.set(target, key, value, receiver);
      },
      ...(inspect && {
        has(target, key) {
          inspect();
          return Reflect.has(target, key);
        },
        ownKeys(target) {
          inspect();
          return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(target, key) {
          inspect();
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      }),
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
