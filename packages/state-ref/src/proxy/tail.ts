import { lens } from '@/lens';
import type { Lens } from '@/lens';
import type { StoreType } from '@/types';

/**
 * 프록시에서 하위 프리미티브 타입으로 접근했을때
 * value로 값에 접근하고, value로 값을 수정할수 있는 객체로 감싸서 리턴한다.
 */
export class Tail<V extends S[keyof S], S extends StoreType<V>> {
  private _value: V;
  private depth: string[];
  private lensValue: Lens<S, S>;
  private rootValue: S;
  private runCollector: () => void;
  private runner: () => void;

  constructor(
    propertyValue: V,
    depthList: string[],
    lensValue: Lens<S, S> = lens<S>(),
    rootValue: S,
    runCollector: () => void,
    runner: () => void
  ) {
    this._value = propertyValue;
    this.depth = depthList;
    this.lensValue = lensValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get value() {
    this.runCollector();

    return this._value;
  }

  set value(newValue: V) {
    const prop = this.depth.at(-1);
    const lensValue = this.lensValue.get()(
      this.rootValue
    ) as unknown as S[keyof S];

    if (newValue !== lensValue) {
      const newTree = this.lensValue.k(prop as keyof S).set(newValue)(
        this.rootValue
      );

      this._value = newValue;
      this.rootValue.root = newTree.root;
      this.runner();
    }
  }

  setValue(newValue: V) {
    this._value = newValue;
  }
}