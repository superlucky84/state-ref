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

export const DEFAULT_WATCH_OPTION = { cache: true, editable: true };
export const DEFAULT_CREATE_OPTION = { autoSync: true };

/**
 * Map to assign a unique ID to each Symbol.
 * - WeakMap can't use symbol as key in TS, so we use Map.
 * - This ensures every Symbol in a path is uniquely identified.
 */
const symbolIdMap = new Map<symbol, number>();
let symbolCounter = 0;

/**
 * Create information about the proxy that can be viewed in the developer console.
 */
export function makeDisplayProxyValue(
  depthList: (string | number | symbol)[],
  value: unknown
) {
  return {
    _navi: keyFromDepthList(depthList),
    _type: getType(value),
    _value: '..',
  };
}

function getType(value: unknown) {
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
 * Escape special characters in strings to make keys bulletproof.
 * - Escapes ':', '|', and '\' to prevent collisions in the final key string.
 */
function escapeString(str: string): string {
  return str.replace(/[:|\\]/g, '\\$&');
}

/**
 * Convert a path array into a unique, collision-resistant string key.
 * - Supports strings, numbers, and Symbols.
 * - Prefixes each element with a type marker:
 *   - 's:' for string
 *   - 'n:' for number
 *   - 'y:' for Symbol (unique ID via Map)
 * - Escapes special characters in strings.
 * - Joins all elements with '|' to form a flat key string.
 *
 * Example:
 *  ["user", Symbol("id"), 42] -> "s:user|y:1|n:42"
 */
export function keyFromDepthList(path: (string | number | symbol)[]): string {
  return path
    .map(k => {
      if (typeof k === 'string') return 's:' + escapeString(k);
      if (typeof k === 'number') return 'n:' + k;
      if (typeof k === 'symbol') {
        if (!symbolIdMap.has(k)) symbolIdMap.set(k, ++symbolCounter);
        return 'y:' + symbolIdMap.get(k);
      }
      return '?';
    })
    .join('|'); // safe separator
}

/**
 * We provide a convenience utility to make it easy to create data when "copyOnWrite" is required.
 */
export function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T>
): Copyable<T> {
  let lensIns = lensInit || lens<T>();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T) {
      if (prop === 'writeCopy') {
        return (value: T) => {
          return lensIns.set(value)(target as unknown as T);
        };
      }

      return copyable(origObj, lensIns.chain(prop));
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
