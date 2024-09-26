type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = null | (() => boolean | AbortSignal | void);
type StoreType<V> = { root: V };
type WithRoot = { root: unknown } & { [key: string | symbol]: unknown };
type WrapWithValue<S> = S extends object
  ? {
      [K in keyof S]: WrapWithValue<S[K]> & { value: WrapWithValue<S[K]> };
    } & {
      value: { [K in keyof S]: WrapWithValue<S[K]> } & { value: S };
    }
  : { value: S };

type PrivitiveType =
  | string
  | number
  | symbol
  | null
  | undefined
  | boolean
  | bigint;

type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
};

type RenderListSub<A> = Map<string, RunInfo<A>>;

type StoreRenderList<A> = Map<Run, RenderListSub<A>>;
export function collector<V>(
  value: V,
  getNextValue: () => V,
  newDepthList: string[],
  run: Run,
  storeRenderList: StoreRenderList<V>
) {
  const runInfo: RunInfo<typeof value> = {
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
      subList.set(runInfo.key, runInfo);
      storeRenderList.set(run, subList);
    }
  }
}

export const makeDisplayProxyValue = <T>(depty: number, value: object) => {
  if (depty === 1) {
    return (
      Array.isArray(value) ? value.map(() => '..') : { value: '..' }
    ) as T;
  }

  return value;
};

export function isPrimitiveType(
  orignalValue: unknown
): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
}

type Lens<T, U> = LensImpl<T, U> & LensProxy<T, U>;
type LensProxy<T, U> = { readonly [K in keyof U]: Lens<T, U[K]> };

class LensImpl<T, U> {
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

export type Getter<T, V> = (target: T) => V;
export type Setter<T> = (target: T) => T;

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

/**
 * 프록시에서 하위 프리미티브 타입으로 접근했을때 선반 만들기
 */
export class Shelf<V, S extends StoreType<V>> {
  protected v: V;
  private depth: string[];
  private lensValue: Lens<S, S>;
  private rootValue: S;
  private runCollector: () => void;
  private runner: () => void;

  constructor(
    propertyValue: V,
    depthList: string[],
    lensValue: Lens<S, S> = lens<S>(),
    rootValue: S,
    runCollector: () => void,
    runner: () => void
  ) {
    this.v = propertyValue;
    this.depth = depthList;
    this.lensValue = lensValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get value() {
    this.runCollector();

    return this.v;
  }

  set value(newValue: V) {
    const prop = this.depth.at(-1);

    if ((newValue as S[keyof S]) !== this.lensValue.get()(this.rootValue)) {
      const newTree = this.lensValue
        .k(prop as keyof S)
        .set(newValue as S[keyof S])(this.rootValue);

      this.rootValue.root = newTree.root;
      this.runner();
    }
  }
}

/**
 * ROOT에서 프리미티브 타입으로 선언하여 접근할때
 */
export class ShelfPrimitive<V> {
  private v: V;
  private runCollector: () => (value: V) => void;
  private newValueSetter: ((value: V) => void) | null;
  private runner: () => void;

  constructor(
    propertyValue: V,
    runCollector: () => (value: V) => void,
    runner: () => void
  ) {
    this.v = propertyValue;
    this.runCollector = runCollector;
    this.newValueSetter = () => this.v;
    this.runner = runner;
  }

  get value() {
    this.newValueSetter = this.runCollector();

    return this.v;
  }
  set value(newValue: V) {
    if (this.newValueSetter) {
      this.newValueSetter(newValue);
    }

    if (this.v !== newValue) {
      this.v = newValue;
      this.runner();
    }
  }
}

export const runner = <V>(storeRenderList: StoreRenderList<V>) => {
  const runableRenewList: Set<Run> = new Set();
  storeRenderList.forEach((defs, renew) => {
    defs.forEach((item, key) => {
      const { value, getNextValue } = item;
      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(renew);
          item.value = nextValue;
        }
      } catch {
        defs.delete(key);
      }
    });
  });

  runableRenewList.forEach(run => {
    if (run && run() === false) {
      storeRenderList.delete(run);
    }
  });
  runableRenewList.clear();
};

export const makeProxy = <S extends WithRoot, T extends WithRoot, V>(
  value: S,
  storeRenderList: StoreRenderList<V>,
  run: Run,
  rootValue: S = value,
  lensValue: Lens<S, S> = lens<S>(),
  depth: number = 0,
  depthList: string[] = []
): T => {
  const result = new Proxy(
    makeDisplayProxyValue(depth, value) as unknown as T,
    {
      get(_: T, prop: keyof T) {
        const newDepthList = [...depthList, prop.toString()];

        /**
         * 프록시에서 value로 접근할때
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
         * 프록시에서 하위 객체타입으로 접근할때
         */
        const lens = lensValue.k(prop);
        const propertyValue: any = lens.get()(rootValue);

        if (typeof propertyValue === 'object' && propertyValue !== null) {
          return makeProxy(
            propertyValue,
            storeRenderList,
            run,
            rootValue,
            lens,
            depth + 1,
            newDepthList
          );
        }

        /**
         * 프록시에서 하위 프리미티브 타입으로 접근할때
         */
        return new Shelf(
          propertyValue,
          newDepthList,
          lensValue,
          rootValue,
          () => {
            collector(
              propertyValue,
              () => lens.get()(rootValue),
              newDepthList,
              run,
              storeRenderList
            );
          },
          () => {
            runner(storeRenderList);
          }
        );
      },
      set(_, prop: string | symbol, value) {
        if (prop === 'value' && value !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value)(rootValue);
          rootValue.root = newTree.root;

          /**
           * 디팬던시 run 실행
           */
          runner(storeRenderList);
        } else if (lensValue.k(prop).get()(rootValue) !== value) {
          throw new Error('Can only be assigned to a "value".');
        }

        return true;
      },
    }
  );

  return result;
};

const DEFAULT_OPTION = { cache: true };

export const store = <V>(orignalValue: V) => {
  type S = StoreType<V>; // 처음 제공받는 값 타입 V에 root를 달음
  type G = WrapWithValue<V>; // 끝에 root가 안달린 상태 끝에 value를 달음
  type T = WrapWithValue<S>; // 끝에 root가 달린 상태 끝에 value를 달음

  const storeRenderList: StoreRenderList<V> = new Map();
  const cacheMap = new WeakMap<Renew<G>, G>();

  return (renew?: Renew<G>, userOption?: { cache?: boolean }): G => {
    /**
     * 캐시처리
     */
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    /**
     * 객체 가 아닌 데이터면 shelfPrimitive로 만들어서 반환
     */
    if (isPrimitiveType(orignalValue)) {
      const ref: { current: null | G } = { current: null };

      ref.current = new ShelfPrimitive(
        orignalValue,
        () => {
          let newValue: V = orignalValue;
          if (renew) {
            const run = () => renew(ref.current!);
            collector(
              orignalValue,
              () => newValue as V & undefined,
              ['root'],
              run,
              storeRenderList
            );
          }

          return (value: V) => {
            newValue = value;
          };
        },
        () => {
          runner(storeRenderList);
        }
      ) as unknown as G;

      if (renew) {
        const run = () => renew(ref.current!);
        // 처음 실행시 abort 이벤트 리스너에 추가
        runFirstEmit(run, storeRenderList, cacheMap, renew);

        cacheMap.set(renew, ref.current!);
      }

      return ref.current! as G;
    }

    /**
     * 객체일때는 프록시 만들어서 리턴
     */
    const initialValue = orignalValue;
    const value: S = { root: initialValue };
    const ref: { current: null | T } = { current: null };

    if (renew) {
      const run = () => renew(ref.current!.root);
      ref.current = makeProxy<S, T, V>(value, storeRenderList, run);

      // 처음 실행시 abort 이벤트 리스너에 추가
      runFirstEmit(run, storeRenderList, cacheMap, renew);

      cacheMap.set(renew, ref.current!.root);
    }

    return ref.current!.root;
  };
};

const runFirstEmit = <V, G>(
  run: Run,
  storeRenderList: StoreRenderList<V>,
  cacheMap: WeakMap<Renew<G>, G>,
  renew: Renew<G>
) => {
  const renewResult = run!();

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
};
