import { makeProxy } from '@/makeProxy';

/**
 * DataStore
 */
type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = () => boolean | AbortSignal | void;

const DEFAULT_OPTION = { cache: true };

export const store = <T extends object>(value: T) => {
  const storeRenderList: Set<Run> = new Set();
  const cacheMap = new WeakMap<Renew<T>, T>();

  return (renew?: Renew<T>, userOption?: { cache?: boolean }) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});
    const needRunFirst = { value: true };

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew) as T;
    }

    const proxy = makeProxy<T>(value, storeRenderList, needRunFirst);
    let run: Run = () => {};

    if (renew) {
      run = () => renew(proxy);
      // 처음 실행시 디펜던시 추가
      const renewResult = run();

      console.log(renewResult);
      cacheMap.set(renew, proxy);
    }

    return proxy;
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
