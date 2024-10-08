import type { StoreType } from '@/types';

/**
 * When a shared value is declared as a primitive type.
 */
export class Root<V> {
  private _value: V;
  private rootValue: StoreType<V>;
  private runCollector: () => void;
  private runner: () => void;

  constructor(
    propertyValue: V,
    rootValue: StoreType<V>,
    runCollector: () => void,
    runner: () => void
  ) {
    this._value = propertyValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get value() {
    this.runCollector();

    return this._value;
  }

  set value(newValue: V) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.rootValue.root = newValue;
      this.runner();
    }
  }

  setValue(newValue: V) {
    this._value = newValue;
  }
}
