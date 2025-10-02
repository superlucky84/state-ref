/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data.
 */
export function lens<T extends object>(
  sceneList: (string | number | symbol)[] = []
) {
  return new Lens<T>(sceneList);
}

export class Lens<T extends object> {
  private sceneList: (string | number | symbol)[];
  constructor(sceneList: (string | number | symbol)[]) {
    this.sceneList = sceneList;
  }
  chain(prop: string | number | symbol) {
    return lens<T>([...this.sceneList, prop]);
  }
  get(targetObject: T): unknown {
    return this.sceneList.reduce(
      (currentObject: any, prop) => currentObject?.[prop],
      targetObject
    );
  }
  set(value: any) {
    return (targetObject: T) => this.copyOnWrite(targetObject, value);
  }
  private copyOnWrite(targetObject: T, value: any) {
    const copiedObject = this.shallowCopy(targetObject);

    this.sceneList.reduce((currentObject: any, prop, index) => {
      return (currentObject[prop] =
        index === this.sceneList.length - 1
          ? value
          : this.shallowCopy(currentObject[prop]));
    }, copiedObject);

    return copiedObject;
  }
  private shallowCopy<T>(x: T): T {
    if (Array.isArray(x)) {
      return [...x] as T;
    } else if (x && typeof x === 'object') {
      return { ...x } as T;
    }
    return x;
  }
}
