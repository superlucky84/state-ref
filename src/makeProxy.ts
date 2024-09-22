import { lens } from '@/lens';
import type { Lens } from '@/lens';

type Run = () => boolean | AbortSignal | void;

export const makeProxy = <T extends object>(
  value: T,
  storeRenderList: Set<Run>,
  needRunFirst: { value: boolean },
  rootValue: T = value,
  lensValue: Lens<T, T> = lens<T>(),
  depth: number = 0
): T => {
  const result = new Proxy(value, {
    get(target: T, prop: string, receiver: any) {
      console.log(prop);
      // (needRunFirst.value)
      if (prop === 'value') {
        return lensValue.get()(rootValue);
      }

      const propertyValue: unknown = Reflect.get(target, prop, receiver);

      const lens = lensValue.k(prop as keyof T) as unknown as Lens<
        object,
        object
      >;

      if (typeof propertyValue === 'object' && propertyValue !== null) {
        return makeProxy(
          propertyValue,
          storeRenderList,
          needRunFirst,
          rootValue,
          lens,
          depth + 1
        );
      }

      return propertyValue;
    },
    set(target, prop: string | symbol, value) {
      if (target[prop as keyof T] === value) {
        return true;
      }

      Reflect.set(target, prop, value);
      lensValue.set(value)(rootValue);

      // renew 실행
      execDependentCallbacks(storeRenderList);

      return true;
    },
  });

  return result;
};

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
