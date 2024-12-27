/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data.
 */
export type Lens<T> = {
  sceneList: { prop: string | number | symbol }[];
  chain<K extends keyof T>(prop: K): Lens<T>;
  get(targetObject: T): T;
  set(value: T): (targetObject: T) => T;
};

export function lens<T extends object>(
  defaultList: { prop: string | number | symbol }[] = []
) {
  const sceneList: { prop: string | number | symbol }[] = defaultList;

  const result = {
    sceneList,
    chain(prop: string | number | symbol) {
      const newLens = lens<T>([...sceneList]);
      newLens.sceneList.push({ prop });
      return newLens;
    },
    get(targetObject: T) {
      return sceneList.reduce((currentObject: any, aItem) => {
        return currentObject[aItem.prop];
      }, targetObject);
    },
    set(value: any) {
      return (targetObject: T) => {
        const copiedObject = shallowCopy(targetObject);

        return sceneList.reduce((currentObject: any, aItem, index) => {
          const prop = aItem.prop;

          if (index === sceneList.length - 1) {
            currentObject[prop] = value;
            return copiedObject;
          } else {
            const next = currentObject[prop];
            currentObject[prop] = shallowCopy(next);

            return currentObject[prop];
          }
        }, copiedObject as T);
      };
    },
  };

  return result;
}

function shallowCopy<T>(x: T): T {
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
