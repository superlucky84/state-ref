import { makeProxy } from '@/makeProxy';

/**
 * DataStore
 */
type Renew<V> = (store: V) => boolean | AbortSignal | void;
type Run = null | (() => boolean | AbortSignal | void);
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
