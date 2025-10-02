/**
 * S StoreType<V>; // Append root to the first value type V you are given
 * G StateRefStore<V>; // Add "value" to the ending  point with “root” unattached.
 * T StateRefStore<StoreType<V>>; // Attach a "value" to the ending point in the state where the root exists.
 */
export type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;

export type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);
export type StoreType<V> = { root: V };
export type WithRoot = { root: unknown } & { [key: string | symbol]: unknown };
export type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };
// [K in keyof S]: StateRefStore<S[K]> & { value: S[K] };
// value: { [K in keyof S]: StateRefStore<S[K]> } & { value: S };

export type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean }
) => StateRefStore<V>;

export type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};

export type RenderListSub<A> = Map<string, RunInfo<A>>;

export type StoreRenderList<A> = Map<Run, RenderListSub<A>>;

export type Copyable<T> = {
  [K in keyof T]: Copyable<T[K]>;
} & {
  writeCopy: <J>(v?: T) => J;
};

export type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};

export type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};

/**
 * FILE: lens.ts
 */
/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data.
 */
export function lens<T extends object>(
  sceneList: (string | number | symbol)[] = []
) {
  return new Lens<T>(sceneList);
}

export class Lens<T extends object> {
  private sceneList: (string | number | symbol)[];
  constructor(sceneList: (string | number | symbol)[]) {
    this.sceneList = sceneList;
  }
  chain(prop: string | number | symbol) {
    return lens<T>([...this.sceneList, prop]);
  }
  get(targetObject: T): unknown {
    return this.sceneList.reduce(
      (currentObject: any, prop) => currentObject?.[prop],
      targetObject
    );
  }
  set(value: any) {
    return (targetObject: T) => this.copyOnWrite(targetObject, value);
  }
  private copyOnWrite(targetObject: T, value: any) {
    const copiedObject = this.shallowCopy(targetObject);

    this.sceneList.reduce((currentObject: any, prop, index) => {
      return (currentObject[prop] =
        index === this.sceneList.length - 1
          ? value
          : this.shallowCopy(currentObject[prop]));
    }, copiedObject);

    return copiedObject;
  }
  private shallowCopy<T>(x: T): T {
    if (Array.isArray(x)) {
      return [...x] as T;
    } else if (x && typeof x === 'object') {
      return { ...x } as T;
    }
    return x;
  }
}

/**
 * FILE: helper/index.ts
 */
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

/**
 * FILE: collector.ts
 */
/**
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
// BEFORE: export function collector<V>(..., storeRenderList: StoreRenderList<V>)
export function collector(
  value: unknown,
  getNextValue: () => unknown,
  newDepthList: (string | number | symbol)[],
  run: Run,
  storeRenderList: StoreRenderList<any>
) {
  if (run) {
    const key = keyFromDepthList(newDepthList);

    // RunInfo의 타입도 value에 맞춰 추론되도록 합니다.
    const runInfo: RunInfo<unknown> = {
      value,
      getNextValue,
      key,
    };

    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run)!;
      if (!subList.has(key)) subList.set(key, runInfo);
    } else {
      const subList = new Map<string, RunInfo<unknown>>();
      subList.set(key, runInfo);
      storeRenderList.set(run, subList);
    }
  }
}

/**
 * FILE: runner.ts
 */

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 */
export function runner(storeRenderList: StoreRenderList<any>) {
  const runableRenewList: Set<Run> = new Set();

  storeRenderList.forEach((defs, run) => {
    defs.forEach((item, key) => {
      const { value, getNextValue } = item;
      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(run);
          item.value = nextValue;
        }
      } catch (error) {
        /**
         * The subscribe function is subscribing to a value that has already been removed,
         * so when run is executed, either the user has handled the exception with optional chaining or similar,
         * or an error will occur. Therefore, it’s fine not to throw an error at this point.
         */
        console.warn(
          `Value for key ${key} has been removed, skipping update:`,
          error
        );
      }
    });
  });

  runableRenewList.forEach(run => {
    if (run && run() === false) {
      storeRenderList.delete(run);
    }
  });
  runableRenewList.clear();
}

export function firstRunner<V>(
  run: Run,
  storeRenderList: StoreRenderList<any>,
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>,
  renew: Renew<StateRefStore<V>>
) {
  const renewResult = run!(true);

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
}

/**
 * FILE: proxy/index.ts
 */
/**
 * Use proxies to secure values and match them to lens.
 */
// BEFORE: export function makeProxy<S extends WithRoot, T, V>(
export function makeProxy<S extends WithRoot, T extends object>( // AFTER: T에 'extends object' 제약 추가
  value: unknown,
  storeRenderList: StoreRenderList<any>,
  run: Run,
  autoSync: boolean,
  editable: boolean,
  rootValue: S,
  lensValue: Lens<S> = lens<S>(),
  depth: number = 0,
  depthList: (string | number | symbol)[] = []
): T {
  const result = new Proxy(
    makeDisplayProxyValue(depthList, value) as unknown as T,
    {
      /**
       * 1. When accessing ".value" from a proxy
       *   1-1. Have the "collector" collect the subscription callbacks and the
       *   1-2. Subtracts a value from "lens" and returns it
       * 2. When accessing iterables from a proxy.
       * 3. When accessing child object types from a proxy
       */
      get(_: T, prop: keyof T & (string | symbol)) {
        const newDepthList = [...depthList, prop];

        /**
         * When accessing ".value" from a proxy
         */
        if (prop === 'value') {
          const currentValue = lensValue.get(rootValue);

          collector(
            currentValue,
            () => lensValue.get(rootValue),
            [...depthList],
            run,
            storeRenderList
          );

          return currentValue;
        }

        /**
         * When accessing "iterator" from a proxy
         */
        if (prop === Symbol.iterator) {
          return function* () {
            const iterableValue = lensValue.get(rootValue);
            if (
              !iterableValue ||
              typeof (iterableValue as any)[Symbol.iterator] !== 'function'
            ) {
              return;
            }
            for (const [index, itemValue] of (
              iterableValue as any[]
            ).entries()) {
              yield makeProxy(
                itemValue,
                storeRenderList,
                run,
                autoSync,
                editable,
                rootValue,
                lensValue.chain(index),
                depth + 1,
                [...depthList, String(index)]
              );
            }
          };
        }

        /**
         * When accessing child object types from a proxy
         */
        const lens = lensValue.chain(prop);
        const propertyValue = lens.get(rootValue);

        return makeProxy(
          propertyValue,
          storeRenderList,
          run,
          autoSync,
          editable,
          rootValue,
          lens,
          depth + 1,
          newDepthList
        );
      },

      /**
       * When assigning a value to “.value”, copyOnWrite is performed.
       * Error if you try to assign a value to something that isn't a ".value".
       * ex) ref.a.b = 'newValue'; // Error
       * ex) ref.a.b.value = 'newValue'; // Success
       */
      set(_, prop: string | symbol, value) {
        if (prop !== 'value') {
          throw new Error('Can only be assigned to a "value".');
        } else if (prop === 'value' && !editable) {
          throw new Error(
            'With the current settings, direct modification is not allowed.'
          );
        } else if (prop === 'value' && value !== lensValue.get(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * Run dependency subscription callbacks.
           */
          if (autoSync) {
            runner(storeRenderList);
          }
        }
        return true;
      },
    }
  );

  return result;
}

/**
 * FILE: core/ref.ts
 */
/**
 * Make the value a stateRef.
 */
export function makeReference<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
  autoSync,
  editable,
}: {
  renew: Renew<StateRefStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<any>; // 이전 수정 사항 반영
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
  autoSync: boolean;
  editable: boolean;
}) {
  const ref: { value: null | StateRefStore<StoreType<V>> } = {
    value: null,
  };
  const run = (isFirst?: boolean) => renew(ref.value!.root, isFirst ?? false);

  // AFTER:
  ref.value = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>>(
    rootValue, // 1. value: 현재 경로의 값 (최초에는 root)
    storeRenderList, // 2. storeRenderList
    run, // 3. run
    autoSync, // 4. autoSync
    editable, // 5. editable
    rootValue // 6. rootValue: 전체 트리의 루트 값 (필수 인자)
  );

  /**
   * It is initialized only once per subscription and collects the 'abort' signal.
   */
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.value!.root);

  return ref.value!.root;
}

/**
 * FILE: core/index.ts
 */
/**
 * createStore - The argument is the initial value of the state
 *
 * Can work with primitive types, or you can work with object types.
 * The return value is the "watch" function.
 *
 * example>
 * const watch = createStore<number>(7)
 * // const watch = createStore<{name: string; age: number;}>({ name: 'brown', age: 38 })
 * const stateRef = watch(stateRef => {
 *   console.log(stateRef.value));
 * });
 */
export function createStore<V>(orignalValue: V) {
  const { watch } = create(orignalValue, { autoSync: true });

  return watch;
}
export function createStoreManualSync<V>(orignalValue: V) {
  return create(orignalValue, { autoSync: false });
}

function create<V>(orignalValue: V, userCreateOption?: { autoSync?: boolean }) {
  const storeRenderList: StoreRenderList<any> = new Map();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const { autoSync } = Object.assign(
    {},
    DEFAULT_CREATE_OPTION,
    userCreateOption || {}
  );
  const rootValue: StoreType<V> = { root: orignalValue };

  const watch = (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean; editable?: boolean }
  ): StateRefStore<V> => {
    const watchOption = Object.assign(
      {},
      DEFAULT_WATCH_OPTION,
      userOption || { editable: autoSync }
    );
    const { cache, editable } = watchOption;

    /**
     * Caching
     */
    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * Make the value a stateRef.
     */
    return makeReference({
      renew,
      rootValue,
      storeRenderList,
      cacheMap,
      autoSync,
      editable,
    });
  };

  return {
    watch,
    updateRef: watch(() => {}, { editable: true }),
    sync: () => {
      runner(storeRenderList);
    },
  };
}
