import type {
  Copyable,
  Watch,
  StateRefStore,
  Renew,
  StateRefsTuple,
  CombinedValue,
} from '@/types';
import type { Lens } from '@/lens';
import { lens } from '@/lens';

/**
 * Defaults for `watch(renew, userOption)`.
 *
 * Resolution order is DEFAULT_WATCH_OPTION < store mode < userOption, so
 * `editable` follows the store's `autoSync` flag unless the caller states it
 * explicitly. `editable: true` here is only the fallback for a store that
 * never declares a mode.
 */
export const DEFAULT_WATCH_OPTION = { cache: true, editable: true };
export const DEFAULT_CREATE_OPTION = { autoSync: true };

/**
 * Debug handles on a stateRef, readable as `ref.a.b[NAVI]` / `ref.a.b[TYPE]`.
 *
 * They are symbols rather than the string keys they replaced ("_navi", "_type",
 * "_value"): a string key would shadow state that happens to own a property of
 * the same name, and it would surface in `ownKeys`. Registered symbols
 * (`Symbol.for`) so the same handles resolve across bundle boundaries -
 * `Symbol.for('state-ref.navi')` works without importing anything.
 */
export const NAVI = Symbol.for('state-ref.navi');
export const TYPE = Symbol.for('state-ref.type');

/**
 * Node's util.inspect reads a proxy's target directly instead of running its
 * traps, so an empty target would print as "{}". This hook gives console.log
 * something to show. Browsers ignore it and render via the traps instead.
 */
export const NODE_INSPECT = Symbol.for('nodejs.util.inspect.custom');

export function getType(value: unknown) {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object') {
    return 'object';
  } else {
    return typeof value;
  }
}

/**
 * We provide a convenience utility to make it easy to create data when "copyOnWrite" is required.
 */
export function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T> {
  let lensIns = lensInit || lens<T>();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T | 'writeCopy') {
      if (prop === 'writeCopy') {
        return <V>(value: V) => {
          return lensIns.set(value)(target as unknown as T);
        };
      }

      return copyable(origObj, lensIns.chain(prop as keyof T));
    },
    set() {
      throw new Error(
        'Property modification is not supported on a copyable object. Use "writeCopy" for state updates.'
      );
    },
  });
}

/**
 * Provides a convenience utility to make deep copying easier in special cases.
 */
export function cloneDeep<T>(value: T): T {
  if (value == null) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const isArray = Array.isArray(value);
  const Ctor = isArray ? Array : Object;

  const result = new Ctor() as T; // 새로운 객체 또는 배열 생성

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = cloneDeep(value[key]); // 재귀적으로 깊은 복사
    }
  }

  return result;
}
/**
 * Combines multiple state watchers to produce a derived (computed) value,
 * and invokes the provided callback whenever the computed value changes.
 */
export function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (a: StateRefsTuple<W>) => R
) {
  let result: R;
  const proxy: { value: R } = {
    get value(): R {
      return result;
    },
    set value(_setter) {
      console.warn('Can not setting');
    },
  };

  return (
    computedCallback?: (proxy: { value: R }, isFirst: boolean) => void
  ) => {
    const refs = watches.map(watch => watch(() => false)) as StateRefsTuple<W>;

    watches.forEach((watch, index) => {
      watch((ref, init) => {
        (refs as any)[index] = ref;
        result = callback(refs);
        if (!init && computedCallback) {
          computedCallback(proxy, false);
        }
      });
    });

    if (computedCallback) {
      computedCallback(proxy, true);
    }

    return proxy;
  };
}

/**
 * Observes multiple Watch instances together and triggers a callback
 * whenever any of them changes. The callback receives the current
 * StateRefStore values of all watches and a boolean indicating
 * whether this is the first invocation.
 */
export function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>> {
  type R = CombinedValue<W>;
  type RefsTuple = StateRefsTuple<W>;

  return (
    callback?: Renew<StateRefStore<R>>,
    userOption?: { cache?: boolean }
  ): StateRefStore<R> => {
    const refs: RefsTuple = watches.map(w =>
      w(() => {}, userOption)
    ) as RefsTuple;

    const combinedStore: StateRefStore<R> = new Proxy({} as StateRefStore<R>, {
      get(_, prop) {
        if (prop === 'value') {
          console.warn(
            `You cannot directly access the nested 'value' of a store created by combineWatch.`
          );

          return refs.map(s => s.value) as R;
        }

        return Reflect.get(refs, prop);
      },
      set(_, prop) {
        if (prop === 'value') {
          console.warn(
            "You cannot directly assign to '.value' of a store created by combineWatch. Use an individual store instead (e.g., store[0].value)."
          );
        } else {
          console.warn(
            `You cannot directly assign to the property '${String(
              prop
            )}' of a store created by combineWatch.`
          );
        }
        return false;
      },
    });

    watches.forEach((watch, i) => {
      const index = i as keyof RefsTuple;
      watch((ref, isFirst) => {
        refs[index] = ref as RefsTuple[number];

        if (!isFirst && callback) {
          callback(combinedStore, false);
        }
      }, userOption);
    });

    if (callback) {
      callback(combinedStore, true);
    }

    return combinedStore;
  };
}
