import type { StoreType } from '@/types';

/**
 * ROOT에서 프리미티브 타입으로 선언하여 접근할때
 */
export class ShelfRoot<V> {
  public v: V;
  private rootValue: StoreType<V>;
  private runCollector: () => void;
  private runner: () => void;

  constructor(
    propertyValue: V,
    rootValue: StoreType<V>,
    runCollector: () => void,
    runner: () => void
  ) {
    this.v = propertyValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get value() {
    this.runCollector();

    return this.v;
  }

  set value(newValue: V) {
    if (this.v !== newValue) {
      this.v = newValue;
      this.rootValue.root = newValue;
      this.runner();
    }
  }

  setValue(newValue: V) {
    this.v = newValue;
  }
}
