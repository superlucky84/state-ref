export class Shelf<T> {
  protected _v: T;
  constructor(propertyValue: T) {
    this._v = propertyValue;
  }
  get value() {
    return this._v;
  }
  set value(_) {
    throw new Error('value is a read-only property.');
  }
}

export class ShelfPrimitive<T> extends Shelf<T> {
  private _depth: string[];
  constructor(propertyValue: T, depthList: string[]) {
    super(propertyValue);
    this._depth = depthList;
  }
  get value() {
    console.log(this._depth);
    return this._v;
  }
  set value(_) {
    throw new Error('value is a read-only property.');
  }
}
