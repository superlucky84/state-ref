import type { StoreType } from '@/types';

/**
 * ROOT 에서 프리미티브 타입으로 선언하여 접근할때
 * value로 값에 접근하고, value로 값을 수정할수 있는 객체로 감싸서 리턴한다.
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