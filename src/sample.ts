export type Lens<T, U> = LensImpl<T, U> & LensProxy<T, U>;
export type LensProxy<T, U> = { readonly [K in keyof U]: Lens<T, U[K]> };

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

type Run = null | (() => boolean | AbortSignal | void);
type RootedObject = { root: unknown } & { [key: string | symbol]: unknown };

export const makeProxy = <T extends RootedObject, V>(
  value: T,
  storeRenderList: Map<Run, [V, () => V, number][]>,
  run: Run,
  rootValue: T = value,
  lensValue: Lens<T, T> = lens<T>(),
  depth: number = 0
): T => {
  const result = new Proxy(value, {
    get(_: T, prop: keyof T) {
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const lens = lensValue.k(prop);
      const propertyValue: any = lens.get()(rootValue);

      // 랜더 콜백 리스트가 비어있고 콜스택 실행이 아직 안끝났으면 계속 수집 시도
      // Todo: target에 대해 중복 수집 막기
      // Todo: 값이 객체 타입이 아닐경우 value 처리
      if (
        run &&
        (!storeRenderList.has(run) || storeRenderList.get(run)!.length === 0)
      ) {
        queueMicrotask(() => {
          const runInfoItem = [
            propertyValue,
            () => lens.get()(rootValue),
            depth,
          ];

          if (storeRenderList.has(run)) {
            const runInfo = storeRenderList.get(run);
            runInfo!.push([runInfoItem[0], runInfoItem[1], runInfoItem[2]]);
          } else {
            storeRenderList.set(run, [
              [runInfoItem[0], runInfoItem[1], runInfoItem[2]],
            ]);
          }
        });
      }

      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(
          propertyValue,
          storeRenderList,
          run,
          rootValue,
          lens,
          depth + 1
        );
      }

      return propertyValue;
    },
    set(_, prop: string | symbol, value) {
      if (lensValue.k(prop).get()(rootValue) !== value) {
        const newValue: T = lensValue.k(prop).set(value)(rootValue) as T;

        rootValue.root = newValue.root;

        // 랜더리스트에서 해당 run 에 해당하는 정보를 가져옴
        const info = storeRenderList.get(run);

        if (info) {
          let needRun = false;
          info.forEach(infoItem => {
            const [target, lens, depth] = infoItem;
            const newTarget = lens();

            if (depth > 0 && target !== newTarget) {
              needRun = true;
            }
            // 타겟 업데이트
            infoItem[0] = newTarget;
          });

          if (needRun && run && run() === false) {
            storeRenderList.delete(run);
          }
        }
      }

      return true;
    },
  });

  return result;
};

/**
 * DataStore
 */
type Renew<V> = (store: V) => boolean | AbortSignal | void;
type StoreType<V> = { root: V };

const DEFAULT_OPTION = { cache: true };

export const store = <V extends { [key: string | symbol]: unknown }>(
  initialValue: V
) => {
  type T = StoreType<V>;

  const value: T = { root: initialValue } as T;
  const storeRenderList: Map<Run, [V, () => V, number][]> = new Map();
  const cacheMap = new WeakMap<Renew<V>, V>();

  return (renew?: Renew<V>, userOption?: { cache?: boolean }) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew) as V;
    }

    const proxy: { value: null | T } = {
      value: null,
    };

    if (renew) {
      const run = () => renew(proxy.value!.root);
      proxy.value = makeProxy<T, V>(value, storeRenderList, run);

      // 처음 실행시 abort 이벤트 리스너에 추가
      runFirstEmit(run, storeRenderList, cacheMap, renew);

      cacheMap.set(renew, proxy.value!.root);
    }

    return proxy.value!.root;
  };
};

const runFirstEmit = <V>(
  run: Run,
  storeRenderList: Map<Run, [V, () => V, number][]>,
  cacheMap: WeakMap<Renew<V>, V>,
  renew: Renew<V>
) => {
  const renewResult = run!();

  if (renewResult instanceof AbortSignal) {
    // 구독 취소시 일부로 구독 수집기를 고장냄
    renewResult.addEventListener('abort', () => {
      const chatValue = {} as V;
      cacheMap.delete(renew);
      storeRenderList.set(run, [[chatValue, () => chatValue, 0]]);
    });
  }
};
