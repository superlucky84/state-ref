// import { lens } from '@/lens';
// import type { Lens } from '@/lens';

type Run = () => boolean | AbortSignal | void;

export const makeProxy = <T extends object>(
  value: T,
  storeRenderList: Set<Run>,
  needRunFirst: { value: boolean }
): T => {
  const result = new Proxy(value, {
    get(target: T, prop: string | symbol, receiver: any) {
      console.log(prop);
      // (needRunFirst.value)
      const propertyValue: unknown = Reflect.get(target, prop, receiver);
      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(propertyValue, storeRenderList, needRunFirst);
      }

      return propertyValue;
    },
    set(target, prop: string | symbol, value) {
      if (target[prop as keyof T] === value) {
        return true;
      }

      Reflect.set(target, prop, value);
      execDependentCallbacks(storeRenderList);

      return true;
    },
  });

  return result;
};

/*
function immuChainable<T>(origObj: T, lensInit: Lens<T, T>) {
  let lensIns = lensInit || lens();
  return new Proxy(
    {},
    {
      get(obj, prop) {
        if (prop === 'copyOn') {
          console.log('a', origObj);
          return value => lensIns.set(value)(origObj);
        }

        console.log('b');
        return immuChainable(origObj, lensIns.k(prop));
      },
      set(target, prop, value) {
        return true;
      },
    }
  );
}
*/

const execDependentCallbacks = (storeRenderList: Set<Run>) => {
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
