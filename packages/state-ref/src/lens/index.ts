/**
 * How a value that cannot be walked into is named in an error.
 */
function describe(value: unknown) {
  if (value === null) {
    return 'null';
  }

  return value === undefined ? 'undefined' : `a ${typeof value}`;
}

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
  /**
   * Rebuilds the spine down to the focus and puts `value` at the end.
   *
   * Missing intermediate paths are an error rather than something to create
   * (`DC-01`). Auto-creating them would make a typo succeed - `ref.usre.name`
   * would grow a branch nobody reads and the screen would simply never update,
   * with no error to go on. The boundary is the *parent*: assigning to a key an
   * existing object does not have is an ordinary write and still succeeds, it
   * is only a missing or non-object parent that throws.
   *
   * Nothing is committed when it does throw - the caller replaces its tree only
   * with the value this returns.
   */
  private copyOnWrite(targetObject: Root, value: Focus): Root {
    const copiedObject = this.shallowCopy(targetObject);
    const lastIndex = this.sceneList.length - 1;

    this.sceneList.reduce((currentObject: any, prop, index) => {
      if (index === lastIndex) {
        currentObject[prop] = value;

        return currentObject;
      }

      const nextObject = currentObject[prop];

      if (nextObject === null || typeof nextObject !== 'object') {
        throw new Error(
          `Cannot write to "${this.pathLabel()}": "${this.pathLabel(
            index + 1
          )}" is ${describe(nextObject)}, not an object. ` +
            'state-ref does not create missing intermediate paths.'
        );
      }

      return (currentObject[prop] = this.shallowCopy(nextObject));
    }, copiedObject);

    return copiedObject;
  }

  /**
   * The path as the debug handles render it (see NAVI), so an error and
   * `ref.a.b[NAVI]` name the same thing.
   */
  private pathLabel(end = this.sceneList.length) {
    return this.sceneList.slice(0, end).map(String).join('.');
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
