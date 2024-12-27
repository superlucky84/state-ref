/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data. */
export type Lens<T> = {
  sceneList: (string | number | symbol)[];
  chain<K extends keyof T>(prop: K): Lens<T>;
  get(targetObject: T): T;
  set(value: T): (targetObject: T) => T;
};
export function lens<T extends object>(
  sceneList: (string | number | symbol)[] = []
) {
  return {
    sceneList,
    chain(prop: string | number | symbol) {
      const newLens = lens<T>([...this.sceneList]);
      newLens.sceneList.push(prop);
      return newLens;
    },
    get(targetObject: T) {
      return this.sceneList.reduce(
        (currentObject: any, prop) => currentObject[prop],
        targetObject
      );
    },
    set(value: any) {
      return (targetObject: T) => {
        const copiedObject = shallowCopy(targetObject);

        this.sceneList.reduce(
          (currentObject: any, prop, index) =>
            (currentObject[prop] =
              index === this.sceneList.length - 1
                ? value
                : shallowCopy(currentObject[prop])),
          copiedObject
        );

        return copiedObject;
      };
    },
  };
}
function shallowCopy<T>(x: T): T {
  if (Array.isArray(x)) {
    return [...x] as T;
  } else if (x && typeof x === 'object') {
    return { ...x } as T;
  }
  return x;
}
