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
  const storeRenderList: Map<Run, [V, () => V][]> = new Map();
  const cacheMap = new WeakMap<Renew<V>, V>();

  return (renew?: Renew<V>, userOption?: { cache?: boolean }) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});
    const needRunFirst = { value: true };

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew) as V;
    }

    const proxy: { value: null | T } = {
      value: null,
    };

    if (renew) {
      const run = () => renew(proxy.value!.root);
      proxy.value = makeProxy<T, V>(
        value,
        storeRenderList,
        needRunFirst,
        run,
        proxy
      );

      // 처음 실행시 디펜던시 추가
      run();

      cacheMap.set(renew, proxy.value!.root);
    }

    return proxy.value!.root;
  };
};

/*
const runFirstEmit = (
  run: () => boolean | void | AbortSignal,
  storeRenderList: Set<Run>
) => {
  const renewResult = run();

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      storeRenderList.delete(run);
    });
  }
};
*/
