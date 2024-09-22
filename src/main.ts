/**
 * DataStore
 */
type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = () => boolean | AbortSignal | void;
type StoreType<V> = V extends { [key: string]: unknown } ? V : { value: V };

const DEFAULT_OPTION = { cache: true };

export const store = <V>(initialValue: V) => {
  type T = StoreType<V>;

  const isObjectTypeValue =
    !Array.isArray(initialValue) &&
    typeof initialValue === 'object' &&
    initialValue !== null;
  const value: T = isObjectTypeValue
    ? (initialValue as T)
    : ({ value: initialValue } as T);

  const storeRenderList: Set<Run> = new Set();
  const cacheMap = new WeakMap<Renew<T>, T>();

  return (
    renew?: Renew<T>,
    makeObserver?: ((store: T) => unknown[]) | null,
    userOption?: { cache?: boolean }
  ) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});

    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew)!;
    }

    let makedProxy: { value: null | T } = { value: null };
    let run: Run = () => {};

    if (renew && makeObserver) {
      run = () => renew(makedProxy.value!);
      makedProxy.value = updater<T>(value, storeRenderList);
      makeObserver(makedProxy.value);
    }

    if (!makedProxy.value) {
      makedProxy.value = updater<T>(value, storeRenderList);

      if (renew) {
        run = () => renew(makedProxy.value!);
        storeRenderList.add(run);
      }
    }

    if (renew) {
      runFirstEmit(run, storeRenderList);
      cacheMap.set(renew, makedProxy.value);
    }

    return makedProxy.value;
  };
};

const updater = <T extends { [key: string | symbol]: unknown }>(
  value: T,
  storeRenderList: Set<Run>
) => {
  const result = new Proxy(value, {
    get(target: T, prop: keyof T) {
      return target[prop];
    },
    set(target, prop: keyof T, value) {
      if (target[prop] === value) {
        return true;
      }

      target[prop] = value;

      execDependentCallbacks(storeRenderList);

      return true;
    },
  });

  return result;
};

const execDependentCallbacks = <T>(storeRenderList: Set<Run>) => {
  const trashCollections: Run[] = [];

  trashCollections.push(...runWithtrashCollectUnit(storeRenderList));
  removeTrashCollect(trashCollections, [...storeRenderList.values()]);
};

const removeTrashCollect = (trashCollections: Run[], targetList: Run[]) => {
  trashCollections.forEach(deleteTarget => {
    targetList.splice(targetList.indexOf(deleteTarget), 1);
  });
};

const runWithtrashCollectUnit = (storeRenderList: Set<Run>) => {
  const trashes: Run[] = [];
  storeRenderList.forEach(run => {
    if (run() === false) {
      trashes.push(run);
    }
  });
  return trashes;
};

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
