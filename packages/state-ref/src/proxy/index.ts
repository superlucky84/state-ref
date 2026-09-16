import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { NAVI, TYPE, NODE_INSPECT, getType, keyFromDepthList } from '@/helper';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import type { Run, WithRoot, StoreRenderList } from '@/types';

/**
 * Use proxies to secure values and match them to lens.
 */
export function makeProxy<S extends WithRoot, T extends object>(
  value: unknown,
  storeRenderList: StoreRenderList<any>,
  run: Run,
  autoSync: boolean,
  editable: boolean,
  rootValue: S,
  lensValue: Lens<S, any> = lens<S>(),
  depth: number = 0,
  depthList: (string | number | symbol)[] = []
): T {
  /**
   * `lensProp` walks the lens, `depthProp` builds the subscription key. They
   * differ only for iteration, where the lens indexes an array numerically but
   * the key must match the string form produced by `ref.items[0]`.
   */
  const childProxy = (
    lensProp: string | number | symbol,
    childValue: unknown,
    depthProp: string | number | symbol = lensProp
  ) =>
    makeProxy(
      childValue,
      storeRenderList,
      run,
      autoSync,
      editable,
      rootValue,
      lensValue.chain(lensProp),
      depth + 1,
      [...depthList, depthProp]
    );

  const inspect = () => ({
    navi: keyFromDepthList(depthList),
    type: getType(value),
    value: lensValue.get(rootValue),
  });

  /**
   * The proxy target carries nothing but the Node inspection hook.
   *
   * It used to carry "_navi"/"_type"/"_value" for the developer console, which
   * made `JSON.stringify(ref)` recurse forever - reading "_value" handed back
   * another proxy carrying "_value". Those handles are symbols now (NAVI/TYPE),
   * so nothing on the target can be mistaken for state.
   *
   * The hook has to live on the target rather than in the get trap: Node's
   * util.inspect swaps a proxy for its target before it looks for anything, so
   * no trap of ours ever runs during console.log. Browsers do render through
   * the traps, and see real state keys via ownKeys.
   */
  const result = new Proxy({ [NODE_INSPECT]: inspect } as unknown as T, {
    /**
     * 1. When accessing ".value" from a proxy
     *   1-1. Have the "collector" collect the subscription callbacks and the
     *   1-2. Subtracts a value from "lens" and returns it
     * 2. When serializing, coercing, or iterating the proxy.
     * 3. When accessing child object types from a proxy
     */
    get(_: T, prop: keyof T & (string | symbol)) {
      /**
       * When accessing ".value" from a proxy
       */
      if (prop === 'value') {
        const currentValue = lensValue.get(rootValue);

        collector(
          currentValue,
          () => lensValue.get(rootValue),
          [...depthList],
          run,
          storeRenderList
        );

        return currentValue;
      }

      /**
       * Debug handles. Symbols, so they cannot collide with state keys.
       */
      if (prop === NAVI) {
        return keyFromDepthList(depthList);
      }
      if (prop === TYPE) {
        return getType(value);
      }

      /**
       * console.log() in Node. See NODE_INSPECT.
       */
      if (prop === NODE_INSPECT) {
        return inspect;
      }

      /**
       * JSON.stringify() hands back the value at this path. Without it the
       * serializer would walk the proxy structurally and bottom out at "{}" for
       * every primitive leaf.
       */
      if (prop === 'toJSON') {
        return () => lensValue.get(rootValue);
      }

      /**
       * Coercing a stateRef to a primitive is always a missing ".value", so say
       * that instead of letting the engine raise "Cannot convert object to
       * primitive value". Only the well-known symbol is trapped; "valueOf" and
       * "toString" stay reachable as ordinary state paths.
       */
      if (prop === Symbol.toPrimitive) {
        return () => {
          throw new Error(
            `Cannot convert a stateRef to a primitive. Read it with ".value" (e.g. ${
              keyFromDepthList(depthList) || 'ref'
            } -> .value).`
          );
        };
      }

      /**
       * When accessing "iterator" from a proxy
       */
      if (prop === Symbol.iterator) {
        return function* () {
          const iterableValue = lensValue.get(rootValue);
          if (
            !iterableValue ||
            typeof (iterableValue as any)[Symbol.iterator] !== 'function'
          ) {
            return;
          }
          for (const [index, itemValue] of (
            iterableValue as unknown as any[]
          ).entries()) {
            yield childProxy(index, itemValue, String(index));
          }
        };
      }

      /**
       * When accessing child object types from a proxy
       */
      const childLens = lensValue.chain(prop);

      return childProxy(prop, childLens.get(rootValue));
    },

    /**
     * Reflect the shape of the value at this path, not the shape of the empty
     * target, so `in`, Object.keys(), spread and console inspection all see
     * real state.
     */
    has(_: T, prop: string | symbol) {
      if (prop === 'value' || prop === NAVI || prop === TYPE) {
        return true;
      }

      return prop in Object(lensValue.get(rootValue));
    },

    ownKeys() {
      return Reflect.ownKeys(Object(lensValue.get(rootValue)));
    },

    getOwnPropertyDescriptor(_: T, prop: string | symbol) {
      const currentValue = lensValue.get(rootValue);
      const descriptor = Reflect.getOwnPropertyDescriptor(
        Object(currentValue),
        prop
      );

      if (!descriptor) {
        return undefined;
      }

      /**
       * "configurable" must stay true: the target does not actually own this
       * key, and reporting a non-configurable phantom property violates the
       * proxy invariants with a TypeError. "enumerable" is mirrored from the
       * real value so that Object.keys() skips what the value itself hides -
       * an array's "length", for one.
       */
      return {
        enumerable: descriptor.enumerable,
        configurable: true,
        writable: true,
        value: childProxy(prop, (currentValue as any)?.[prop]),
      };
    },

    deleteProperty(_: T, prop: string | symbol) {
      throw new Error(
        `Cannot delete "${String(
          prop
        )}" from a stateRef. Assign a new value to ".value" instead.`
      );
    },

    /**
     * When assigning a value to “.value”, copyOnWrite is performed.
     * Error if you try to assign a value to something that isn't a ".value".
     * ex) ref.a.b = 'newValue'; // Error
     * ex) ref.a.b.value = 'newValue'; // Success
     */
    set(_, prop: string | symbol, value) {
      if (prop !== 'value') {
        throw new Error('Can only be assigned to a "value".');
      } else if (prop === 'value' && !editable) {
        throw new Error(
          'With the current settings, direct modification is not allowed.'
        );
      } else if (prop === 'value' && value !== lensValue.get(rootValue)) {
        const newTree = lensValue.set(value)(rootValue);
        rootValue.root = newTree.root;

        /**
         * Run dependency subscription callbacks.
         */
        if (autoSync) {
          runner(storeRenderList);
        }
      }
      return true;
    },
  });

  return result;
}
