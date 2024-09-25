export class ShelfPrimitive<V> {
  protected _v: V;
  private _depth: string[];
  constructor(propertyValue: V, depthList: string[]) {
    this._v = propertyValue;
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
