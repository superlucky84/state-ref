import type { StoreType } from '@/types';

/**
 * ROOT 에서 프리미티브 타입으로 선언하여 접근할때
 * current로 값에 접근하고, current로 값을 수정할수 있는 객체로 감싸서 리턴한다.
 */
export class Root<V> {
  private _current: V;
  private rootValue: StoreType<V>;
  private runCollector: () => void;
  private runner: () => void;

  constructor(
    propertyValue: V,
    rootValue: StoreType<V>,
    runCollector: () => void,
    runner: () => void
  ) {
    this._current = propertyValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get current() {
    this.runCollector();

    return this._current;
  }

  set current(newValue: V) {
    if (this._current !== newValue) {
      this._current = newValue;
      this.rootValue.root = newValue;
      this.runner();
    }
  }

  setCurrent(newValue: V) {
    this._current = newValue;
  }
}
