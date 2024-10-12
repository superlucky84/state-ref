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
  renew: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean }
) => StateRefStore<V>;

export type PrivitiveType =
  | string
  | number
  | symbol
  | null
  | undefined
  | boolean
  | bigint;

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
  writeCopy: <J>(v?: T) => J; // lensIns.set의 반환 타입을 사용
};

/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data.
 */
export type Lens<T, U> = LensImpl<T, U> & LensProxy<T, U>;
export type LensProxy<T, U> = { readonly [K in keyof U]: Lens<T, U[K]> };
export type Getter<T, V> = (target: T) => V;
export type Setter<T> = (target: T) => T;

export class LensImpl<T, U> {
  constructor(
    private _get: Getter<T, U>,
    private _set: (value: U) => Setter<T>
  ) {}

  public k<K extends keyof U>(key: K): Lens<T, U[K]> {
    return this.compose(
      lens(
        t => t[key],
        v => t => {
          const copied = copy(t);
          copied[key] = v;
          return copied;
        }
      )
    );
  }

  public compose<V>(other: Lens<U, V>): Lens<T, V> {
    return lens(
      t => other._get(this._get(t)),
      v => t => this._set(other._set(v)(this._get(t)))(t)
    );
  }

  public get(): Getter<T, U>;
  public get<V>(f: Getter<U, V>): Getter<T, V>;
  public get() {
    if (arguments.length) {
      const f = arguments[0];
      return (t: T) => f(this._get(t));
    } else {
      return this._get;
    }
  }

  public set(value: U): Setter<T>;
  public set(f: Setter<U>): Setter<T>;
  public set(modifier: U | Setter<U>) {
    if (typeof modifier === 'function') {
      return (t: T) => this._set((modifier as Setter<U>)(this._get(t)))(t);
    } else {
      return this._set(modifier);
    }
  }
}

function copy<T>(x: T): T {
  if (Array.isArray(x)) {
    return x.slice() as any;
  } else if (x && typeof x === 'object') {
    return Object.keys(x).reduce<any>((res, k) => {
      res[k] = (x as any)[k];
      return res;
    }, {});
  } else {
    return x;
  }
}

function proxify<T, U>(impl: LensImpl<T, U>): Lens<T, U> {
  return new Proxy(impl, {
    get(target, prop) {
      if (typeof (target as any)[prop] !== 'undefined') {
        return (target as any)[prop];
      }
      return target.k(prop as any);
    },
  }) as any;
}

export function lens<T>(): Lens<T, T>;
export function lens<T, U>(
  _get: Getter<T, U>,
  _set: (value: U) => Setter<T>
): Lens<T, U>;
export function lens() {
  if (arguments.length) {
    return proxify(new LensImpl(arguments[0], arguments[1]));
  } else {
    return lens(
      t => t,
      v => _ => v
    );
  }
}

export const DEFAULT_OPTION = { cache: true };

/**
 * Create information about the proxy that can be viewed in the developer console.
 */
export function makeDisplayProxyValue(depthList: string[], value: unknown) {
  return {
    _navi: depthList.join('.'),
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
 * We provide a convenience utility to make it easy to create data when "copyOnWrite" is required.
 */
export function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, T>
): Copyable<T> {
  let lensIns = lensInit || lens();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T) {
      if (prop === 'writeCopy') {
        return (value: T) => {
          return lensIns.set(value)(target as unknown as T); // 원본 코드는 변경되지 않음
        };
      }

      return copyable(origObj, lensIns.k(prop) as any);
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
 * The subscription to store starts the moment the user of stateRef fetches the reference as a “.value”.
 * This code captures the moment of fetching to “.value” and collects the subscription.
 */
export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: string[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  const runInfo: RunInfo<V> = {
    value,
    getNextValue,
    key: newDepthList.join('.'),
  };

  if (run) {
    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run);
      if (!subList!.has(runInfo.key)) {
        subList!.set(runInfo.key, runInfo);
      }
    } else {
      const subList = new Map<string, typeof runInfo>();
      if (!subList!.has(runInfo.key)) {
        subList.set(runInfo.key, runInfo);
        storeRenderList.set(run, subList);
      }
    }
  }
}

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 */
export function runner<V>(storeRenderList: StoreRenderList<V>) {
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
  storeRenderList: StoreRenderList<V>,
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
 * Use proxies to secure values and match them to lens.
 */
export function makeProxy<S extends WithRoot, T extends WithRoot, V>(
  value: S,
  storeRenderList: StoreRenderList<V>,
  run: Run,
  rootValue: S = value,
  lensValue: Lens<S, S> = lens<S>(),
  depth: number = 0,
  depthList: string[] = []
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
      get(_: T, prop: keyof T) {
        const newDepthList = [...depthList, prop.toString()];

        /**
         * When accessing ".value" from a proxy
         */
        if (prop === 'value') {
          const value: any = lensValue.get()(rootValue);
          collector(
            value,
            () => lensValue.get()(rootValue),
            [...depthList],
            run,
            storeRenderList
          );

          return value;
        }

        /**
         * When accessing "iterator" from a proxy
         */
        if (prop === Symbol.iterator) {
          return function* () {
            for (const [index, value] of (
              lensValue.get()(rootValue) as any
            ).entries()) {
              yield makeProxy(
                value,
                storeRenderList,
                run,
                rootValue,
                lensValue.k(index),
                depth + 1,
                [...depthList, String(index)]
              );
            }
          };
        }

        /**
         * When accessing child object types from a proxy
         */
        const lens = lensValue.k(prop);
        const propertyValue: any = lens.get()(rootValue);

        return makeProxy(
          propertyValue,
          storeRenderList,
          run,
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
        if (prop === 'value' && value !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * Run dependency subscription callbacks.
           */
          runner(storeRenderList);
        } else if (prop !== 'value') {
          throw new Error('Can only be assigned to a "value".');
        }

        return true;
      },
    }
  );

  return result;
}

/**
 * Make the value a stateRef.
 */
export function makeReference<V>({
  renew,
  rootValue,
  storeRenderList,
  cacheMap,
}: {
  renew: Renew<StateRefStore<V>>;
  rootValue: StoreType<V>;
  storeRenderList: StoreRenderList<V>;
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>;
}) {
  const ref: { value: null | StateRefStore<StoreType<V>> } = {
    value: null,
  };
  const run = (isFirst?: boolean) => renew(ref.value!.root, isFirst ?? false);

  ref.value = makeProxy<StoreType<V>, StateRefStore<StoreType<V>>, V>(
    rootValue,
    storeRenderList,
    run
  );

  /**
   * It is initialized only once per subscription and collects the 'abort' signal.
   */
  firstRunner(run, storeRenderList, cacheMap, renew);

  cacheMap.set(renew, ref.value!.root);

  return ref.value!.root;
}

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
  const storeRenderList: StoreRenderList<V> = new Map();
  const cacheMap = new WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>();
  const rootValue: StoreType<V> = { root: orignalValue };

  return (
    renew: Renew<StateRefStore<V>> = () => {},
    userOption?: { cache?: boolean }
  ): StateRefStore<V> => {
    /**
     * Caching
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * Make the value a stateRef.
     */
    return makeReference({ renew, rootValue, storeRenderList, cacheMap });
  };
}
