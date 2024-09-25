import { lens } from '@/lens';
import type { Lens } from '@/lens';
import type { StoreType } from '@/types';

/**
 * 프록시에서 하위 프리미티브 타입으로 접근했을때 선반 만들기
 */
export class Shelf<V, S extends StoreType<V>> {
  protected v: V;
  private depth: string[];
  private lensValue: Lens<S, S>;
  private rootValue: S;
  private runCollector: () => void;

  constructor(
    propertyValue: V,
    depthList: string[],
    lensValue: Lens<S, S> = lens<S>(),
    rootValue: S,
    runCollector: () => void
  ) {
    this.v = propertyValue;
    this.depth = depthList;
    this.lensValue = lensValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
  }

  get value() {
    this.runCollector();

    return this.v;
  }

  set value(newValue: V) {
    const prop = this.depth.at(-1);

    if ((newValue as S[keyof S]) !== this.lensValue.get()(this.rootValue)) {
      const newTree = this.lensValue
        .k(prop as keyof S)
        .set(newValue as S[keyof S])(this.rootValue);

      this.rootValue.root = newTree.root;
    }
  }
}

/**
 * ROOT에서 프리미티브 타입으로 선언하여 접근할때
 */
export class ShelfPrimitive<V> {
  private v: V;
  private runCollector: () => (value: V) => void;
  private newValueSetter: ((value: V) => void) | null;

  constructor(propertyValue: V, runCollector: () => (value: V) => void) {
    this.v = propertyValue;
    this.runCollector = runCollector;
    this.newValueSetter = () => this.v;
  }

  get value() {
    console.log('GET');
    this.newValueSetter = this.runCollector();

    return this.v;
  }
  set value(newValue: V) {
    if (this.newValueSetter) {
      this.newValueSetter(newValue);
    }
    this.v = newValue;
  }
}
