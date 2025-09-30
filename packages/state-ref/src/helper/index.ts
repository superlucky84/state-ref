import type {
  PrivitiveType,
  Copyable,
  Watch,
  StateRefStore,
  Renew,
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
 * When createStore receives the initial value, it checks to see if it is of a primitive type.
 */
export function isPrimitiveType(
  orignalValue: unknown
): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
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
  let lensIns = lensInit || lens();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T) {
      if (prop === 'writeCopy') {
        return (value: T) => {
          return lensIns.set(value)(target as unknown as T); // 원본 코드는 변경되지 않음
        };
      }

      return copyable(origObj, lensIns.chain(prop) as any);
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
  callback: (a: {
    [K in keyof W]: W[K] extends Watch<infer T> ? StateRefStore<T> : never;
  }) => R
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
    const refs = watches.map(watch => watch(() => false)) as unknown as {
      [K in keyof W]: W[K] extends Watch<infer T> ? StateRefStore<T> : never;
    }[];

    watches.forEach((watch, index) => {
      watch((ref, init) => {
        refs[index] = ref as any;
        result = callback(refs as any);
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
type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};

export function combineWatch<W extends readonly Watch<any>[]>(
  watches: W
): Watch<CombinedValue<W>> {
  type R = CombinedValue<W>;

  return (
    callback?: Renew<StateRefStore<R>>,
    userOption?: { cache?: boolean }
  ): StateRefStore<R> => {
    const refs: { -readonly [K in keyof W]: StateRefStore<R[K]> } = watches.map(
      w => w(() => false)
    ) as any;

    const combinedRef: StateRefStore<R> = new Proxy(
      {
        _type: 'combined-array',
        _length: watches.length,
        _value: '..',
      } as unknown as StateRefStore<R>,
      {
        get(_, prop) {
          if (prop === 'value') {
            return refs.map(r => r) as any;
          }
          return (refs as any)[prop];
        },
        set(_, prop, value) {
          if (prop === 'value') {
            console.warn('Cannot overwrite .value directly on combinedRef');
            return false;
          }
          (refs as any)[prop] = value;

          return true;
        },
      }
    );

    watches.forEach((watch, i) => {
      watch((ref, init) => {
        refs[i] = ref as any;
        if (!init && callback) {
          callback(combinedRef, false);
        }
      }, userOption);
    });

    if (callback) {
      callback(combinedRef, true);
    }

    return combinedRef;
  };
}
