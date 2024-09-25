export class ShelfPrimitive<P> {
  protected _v: P;
  private _depth: string[];
  constructor(propertyValue: P, depthList: string[]) {
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
