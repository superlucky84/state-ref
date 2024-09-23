import { makeProxy } from '@/makeProxy';

/**
 * DataStore
 */
type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = null | (() => boolean | AbortSignal | void);
type StoreType<V> = { root: V };

const DEFAULT_OPTION = { cache: true };

export const store = <V extends { [key: string | symbol]: unknown }>(
  initialValue: V
) => {
  type T = StoreType<V>;

  const value: T = { root: initialValue } as T;
  const storeRenderList: Map<Run, [T, () => T][]> = new Map();
  const cacheMap = new WeakMap<Renew<T>, T>();

  return (renew?: Renew<T>, userOption?: { cache?: boolean }) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});
    const needRunFirst = { value: true };

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew) as T;
    }

    const proxy: { value: null | T } = {
      value: null,
    };

    if (renew) {
      const run = () => renew(proxy.value!);
      (proxy.value = makeProxy<T>(value, storeRenderList, needRunFirst, run)),
        // 처음 실행시 디펜던시 추가
        run();

      cacheMap.set(renew, proxy.value);
    }

    console.log('PVALUE - ', proxy.value);

    return proxy.value;
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
