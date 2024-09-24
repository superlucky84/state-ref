export class Shelf<T> {
  private _v: T;
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
