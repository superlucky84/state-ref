import type { PrivitiveType, Copyable, Watch, StateRefStore } from '@/types';
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
// Helper type: 입력된 Watch 배열의 T 타입을 추출하여 StateRefStore<T>의 튜플로 변환
type RefsTuple<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? StateRefStore<T> : never;
};

/**
 * 여러 개의 watch 함수를 하나로 결합하여, 모든 watch의 상태 배열을 값으로 가지는
 * 새로운 watch 함수를 반환합니다. 이 함수는 재귀적으로 사용 가능합니다.
 *
 * @param watches 결합할 watch 함수들의 배열
 * @returns 모든 watch의 최신 상태(ref) 배열을 값으로 가지는 새로운 Watch 함수
 */
  /*
export function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W] // Variadic tuple types for better type inference
): Watch<RefsTuple<W>> {
  // 여러 watch를 구독하고, 그 결과(상태 배열)를 전달하는 새로운 Watch 함수를 반환
  return (
    masterCallback: (combinedRefs: RefsTuple<W>, isFirst: boolean) => void
  ): StateRefStore<RefsTuple<W>> => {
    // 1. 각 watch의 초기 상태(ref)를 가져와 배열로 만든다.
    //    이 배열이 이 combined watch의 현재 상태가 된다.
    const currentRefs = watches.map(watch =>
      // 콜백으로 빈 함수를 넘겨주어 초기 ref만 얻어온다.
      watch(() => {})
    ) as RefsTuple<W>;

    // 2. 입력된 모든 watch에 대해 구독을 설정한다.
    watches.forEach((watch, index) => {
      watch((updatedRef, isFirst) => {
        // isFirst=true인 초기 호출은 무시한다. (이미 아래 masterCallback에서 처리)
        // 오직 "업데이트" 시에만 masterCallback을 호출한다.
        if (!isFirst) {
          // 해당 index의 ref를 최신 값으로 업데이트
          currentRefs[index] = updatedRef;

          // masterCallback에게 최신 상태 배열의 복사본을 전달한다.
          // (불변성을 위해 복사본을 전달하는 것이 좋음)
          masterCallback([...currentRefs] as RefsTuple<W>, false);
        }
      });
    });

    // 3. 이 새로운 watch가 처음 구독될 때, masterCallback을 동기적으로 한 번 호출해준다.
    if (masterCallback) {
      masterCallback(currentRefs, true);
    }

    // 4. Watch<T>의 정의에 따라 초기 상태(StateRefStore<T>)를 반환해야 한다.
    //    이 경우 T는 상태 배열이므로, 그 배열을 value로 가지는 StateRefStore를 반환.
    return { value: currentRefs };
  };
}
*/

export function combineWatch<W extends readonly Watch<any>[]>(watches: W) {
  return (
    callback: (
      refs: {
        [K in keyof W]: W[K] extends Watch<infer T> ? StateRefStore<T> : never;
      },
      isFirst: boolean
    ) => void
  ) => {
    const refs = watches.map(watch => watch(() => false)) as {
      [K in keyof W]: W[K] extends Watch<infer T> ? StateRefStore<T> : never;
    }[];

    watches.forEach((watch, index) => {
      watch((ref, init) => {
        refs[index] = ref as any;
        if (!init && callback) {
          callback(refs as any, false);
        }
      });
    });

    if (callback) {
      callback(refs as any, true);
    }

    return refs;
  };
}
