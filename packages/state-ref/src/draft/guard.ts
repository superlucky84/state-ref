import type { StateRefStore } from '@/types';
import { REF_CONNECTION } from '@/internal/ref-connection-key';

/** Retained child refs must fail after the owning draft is discarded too. */
export function guardDraftRef<T>(
  source: StateRefStore<T>,
  assertOpen: () => void,
  cache = new WeakMap<object, object>(),
  snapshotCache = new WeakMap<object, object>()
): StateRefStore<T> {
  const readonlyValue = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') return value;
    const cached = snapshotCache.get(value);
    if (cached) return cached;
    const copy = Array.isArray(value)
      ? [...value]
      : Object.assign(Object.create(Object.getPrototypeOf(value)), value);
    const snapshot = new Proxy(copy, {
      get(target, key, receiver) {
        return readonlyValue(Reflect.get(target, key, receiver));
      },
      set() {
        throw new Error('Draft snapshots cannot be modified directly.');
      },
      deleteProperty() {
        throw new Error('Draft snapshots cannot be modified directly.');
      },
      defineProperty() {
        throw new Error('Draft snapshots cannot be modified directly.');
      },
    });
    snapshotCache.set(value, snapshot);
    return snapshot;
  };

  const wrap = (ref: object): object => {
    const cached = cache.get(ref);
    if (cached) return cached;

    const guarded = new Proxy(ref, {
      get(target, key, receiver) {
        assertOpen();
        const value = Reflect.get(target, key, receiver);
        if (key === 'value') return readonlyValue(value);
        if (key === REF_CONNECTION) return value;
        if (key === Symbol.iterator) {
          return function* () {
            assertOpen();
            for (const child of value.call(target)) {
              assertOpen();
              yield wrap(child);
            }
          };
        }
        if (typeof value === 'function') {
          return (...args: unknown[]) => {
            assertOpen();
            return readonlyValue(value.apply(target, args));
          };
        }
        return value && typeof value === 'object' ? wrap(value) : value;
      },
      set(target, key, value, receiver) {
        assertOpen();
        return Reflect.set(target, key, value, receiver);
      },
      has(target, key) {
        assertOpen();
        return Reflect.has(target, key);
      },
      ownKeys(target) {
        assertOpen();
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, key) {
        assertOpen();
        const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
        if (descriptor && 'value' in descriptor) {
          const value = descriptor.value;
          if (value && typeof value === 'object') {
            return { ...descriptor, value: wrap(value) };
          }
        }
        return descriptor;
      },
    });
    cache.set(ref, guarded);
    return guarded;
  };

  return wrap(source as object) as StateRefStore<T>;
}
