/**
 * Type helper to extract nested property type
 */
type PropType<T, K extends keyof any> = K extends keyof T
  ? T[K]
  : K extends `${number}`
  ? T extends readonly (infer U)[]
    ? U
    : any
  : any;

/**
 * The stateRef relies on data immutability to determine changes.
 * The lens pattern is used as a core part of the stateRef because,
 * it makes it easy to locate and safely change data.
 */
export function lens<T extends object>(
  sceneList: (string | number | symbol)[] = []
) {
  return new Lens<T, T>(sceneList);
}

export class Lens<Root extends object, Focus = Root> {
  private sceneList: (string | number | symbol)[];
  constructor(sceneList: (string | number | symbol)[]) {
    this.sceneList = sceneList;
  }
  chain<K extends keyof Focus>(prop: K): Lens<Root, PropType<Focus, K>>;
  chain<K extends string | number | symbol>(
    prop: K
  ): Lens<Root, PropType<Focus, K>>;
  chain(prop: string | number | symbol): Lens<Root, any> {
    return new Lens<Root, any>([...this.sceneList, prop]);
  }
  get(targetObject: Root): Focus {
    return this.sceneList.reduce(
      (currentObject: any, prop) => currentObject?.[prop],
      targetObject
    ) as Focus;
  }
  set(value: Focus) {
    return (targetObject: Root): Root => this.copyOnWrite(targetObject, value);
  }
  private copyOnWrite(targetObject: Root, value: Focus): Root {
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
