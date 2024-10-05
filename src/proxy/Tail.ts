import { lens } from '@/lens';
import type { Lens } from '@/lens';
import type { StoreType } from '@/types';

/**
 * 프록시에서 하위 프리미티브 타입으로 접근했을때
 * current로 값에 접근하고, current로 값을 수정할수 있는 객체로 감싸서 리턴한다.
 */
export class Tail<V, S extends StoreType<V>> {
  private _current: V;
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
    this._current = propertyValue;
    this.depth = depthList;
    this.lensValue = lensValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner;
  }

  get current() {
    this.runCollector();

    return this._current;
  }

  set current(newValue: V) {
    const prop = this.depth.at(-1);

    if ((newValue as S[keyof S]) !== this.lensValue.get()(this.rootValue)) {
      const newTree = this.lensValue
        .k(prop as keyof S)
        .set(newValue as S[keyof S])(this.rootValue);

      this._current = newValue;
      this.rootValue.root = newTree.root;
      this.runner();
    }
  }

  setCurrent(newValue: V) {
    this._current = newValue;
  }
}
