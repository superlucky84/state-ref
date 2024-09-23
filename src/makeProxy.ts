import { lens } from '@/lens';
import type { Lens } from '@/lens';

type Run = null | (() => boolean | AbortSignal | void);

export const makeProxy = <T extends { [key: string | symbol]: unknown }, V>(
  value: T,
  storeRenderList: Map<Run, [V, () => V][]>,
  needRunFirst: { value: boolean },
  run: Run,
  rootValue: T = value,
  lensValue: Lens<T, T> = lens<T>()
): T => {
  const result = new Proxy(value, {
    get(target: T, prop: keyof T, receiver: any) {
      console.log(prop);
      // (needRunFirst.value)
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const propertyValue: any = Reflect.get(target, prop, receiver);

      const lens = lensValue.k(prop);

      if (run && storeRenderList.size === 0) {
        queueMicrotask(() => {
          const runInfoItem = [propertyValue, () => lens.get()(rootValue)];

          if (storeRenderList.has(run)) {
            const runInfo = storeRenderList.get(run);
            runInfo!.push([runInfoItem[0], runInfoItem[1]]);
          } else {
            storeRenderList.set(run, [[runInfoItem[0], runInfoItem[1]]]);
          }
        });
      }

      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(
          propertyValue,
          storeRenderList,
          needRunFirst,
          run,
          rootValue,
          lens
        );
      }

      return propertyValue;
    },
    set(target, prop: string | symbol, value) {
      if (target[prop] === value) {
        return true;
      }

      // Reflect.set(target, prop, value);

      console.log('ROOTVALUE', rootValue);

      lensValue.set(value)(rootValue);

      // renew 실행
      console.log('RUN', storeRenderList);
      execDependentCallbacks(storeRenderList);

      return true;
    },
  });

  return result;
};

const execDependentCallbacks = <T>(
  storeRenderList: Map<Run, [T, () => T][]>
) => {
  const trashCollections: Run[] = [];

  trashCollections.push(...runWithtrashCollectUnit(storeRenderList));
  removeTrashCollect(trashCollections, storeRenderList);
};

const removeTrashCollect = <T>(
  trashCollections: Run[],
  storeRenderList: Map<Run, [T, () => T][]>
) => {
  trashCollections.forEach(run => {
    storeRenderList.delete(run);
  });
};

const runWithtrashCollectUnit = <T>(
  storeRenderList: Map<Run, [T, () => T][]>
) => {
  const trashes: Run[] = [];
  storeRenderList.forEach((values, run) => {
    values.forEach(value => {
      loopInner(trashes, value, run);
    });
  });
  return trashes;
};

const loopInner = <T>(
  trashes: Run[],
  [target, lens]: [T, () => T],
  run: Run
) => {
  if (target !== lens()) {
    if (run && run() === false) {
      trashes.push(run);
    }
  }
};
