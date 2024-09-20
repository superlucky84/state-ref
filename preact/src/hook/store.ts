/**
 * DataStore
 */
type Renew<T> = (store: T) => boolean | AbortSignal | void;
type Run = () => boolean | AbortSignal | void;
type StoreType<V> = V extends { [key: string]: unknown } ? V : { value: V };
type StoreValue = {
  [key: string | symbol]: Set<Run>;
};

const DEFAULT_OPTION = { cache: true };

export const store = <V>(initialValue: V) => {
  type T = StoreType<V>;

  const allowInitSetting = { value: false };
  const isObjectTypeValue =
    !Array.isArray(initialValue) &&
    typeof initialValue === 'object' &&
    initialValue !== null;
  const value: T = isObjectTypeValue
    ? (initialValue as T)
    : ({ value: initialValue } as T);

  const storeRenderList: Set<Run> = new Set();
  const storeRenderObserveList: StoreValue[] = [];
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

    const storeRenderObserveMap: StoreValue = {};
    let makedProxy: { value: null | T } = { value: null };
    let run: Run = () => {};

    storeRenderObserveList.push(storeRenderObserveMap);

    if (renew && makeObserver) {
      run = () => renew(makedProxy.value!);
      makedProxy.value = updater<T>(
        value,
        allowInitSetting,
        storeRenderList,
        run,
        storeRenderObserveMap,
        storeRenderObserveList
      );
      allowInitSetting.value = true;
      makeObserver(makedProxy.value);
      allowInitSetting.value = false;
    }

    if (!makedProxy.value) {
      makedProxy.value = updater<T>(value, allowInitSetting, storeRenderList);

      if (renew) {
        run = () => renew(makedProxy.value!);
        storeRenderList.add(run);
      }
    }

    if (renew) {
      runFirstEmit(run, storeRenderList, storeRenderObserveMap);
      cacheMap.set(renew, makedProxy.value);
    }

    return makedProxy.value;
  };
};

const updater = <T extends { [key: string | symbol]: unknown }>(
  value: T,
  allowInitSetting: { value: boolean },
  storeRenderList: Set<Run>,
  run?: Run,
  storeRenderObserveMap?: StoreValue,
  storeRenderObserveList?: StoreValue[]
) => {
  const allowedAccessProp: (keyof T)[] = [];

  const result = new Proxy(value, {
    get(target: T, prop: keyof T) {
      if (run && storeRenderObserveMap && allowInitSetting.value) {
        storeRenderObserveMap[prop] ??= new Set();

        if (!storeRenderObserveMap[prop].has(run)) {
          storeRenderObserveMap[prop].add(run);
          allowedAccessProp.push(prop);
        }
      }

      if (allowedAccessProp.includes(prop) || !run) {
        return target[prop];
      }

      return null;
    },
    set(target, prop: keyof T, value) {
      if (target[prop] === value) {
        return true;
      } else if (allowedAccessProp.includes(prop) || !run) {
        target[prop] = value;
      } else {
        return true;
      }

      execDependentCallbacks(
        storeRenderList,
        storeRenderObserveList,
        prop,
        run
      );

      return true;
    },
  });

  return result;
};

const execDependentCallbacks = <T>(
  storeRenderList: Set<Run>,
  storeRenderObserveList: StoreValue[] = [],
  prop: keyof T,
  run?: () => boolean | AbortSignal | void
) => {
  const trashCollections: Run[] = [];

  trashCollections.push(...runWithtrashCollectUnit(storeRenderList));

  (storeRenderObserveList || []).forEach(storeRenderObserveMap => {
    const renderObserveList: Set<Run> = run
      ? storeRenderObserveMap[prop] || new Set<Run>()
      : new Set<Run>();

    trashCollections.push(...runWithtrashCollectUnit(renderObserveList));

    removeTrashCollect(trashCollections, [...renderObserveList.values()]);
  });

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
  storeRenderList: Set<Run>,
  storeRenderObserveMap: StoreValue
) => {
  const renewResult = run();

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      const renderObserveList: StoreValue = storeRenderObserveMap || {};

      storeRenderList.delete(run);

      Object.values(renderObserveList).forEach(item => {
        item.delete(run);
      });
    });
  }
};
