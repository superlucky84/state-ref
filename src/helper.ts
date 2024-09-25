import type { Lens } from '@/lens';
import type { StoreType } from '@/types';

export class ShelfPrimitive<V, S extends StoreType<V>> {
  protected _v: V;
  private _depth: string[];
  private lens: Lens<S, S>;
  private rootValue: S;

  constructor(
    propertyValue: V,
    depthList: string[],
    lens: Lens<S, S>,
    rootValue: S
  ) {
    this._v = propertyValue;
    this._depth = depthList;
    this.lens = lens;
    this.rootValue = rootValue;
  }

  get value() {
    console.log(this._depth);
    return this._v;
  }

  set value(newValue: V) {
    const prop = this._depth.at(-1);

    if ((newValue as S[keyof S]) !== this.lens.get()(this.rootValue)) {
      const newTree = this.lens.k(prop as keyof S).set(newValue as S[keyof S])(
        this.rootValue
      );

      this.rootValue.root = newTree.root;
    }
  }
}
