import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { NAVI, TYPE, NODE_INSPECT, getType } from '@/helper';
import { childOf, pathToString } from '@/path';
import type { PathNode } from '@/path';
import { collector } from '@/connectors/collector';
import { runner } from '@/connectors/runner';
import type { Run, WithRoot, StoreRenderList } from '@/types';

/**
 * Use proxies to secure values and match them to lens.
 */
export function makeProxy<S extends WithRoot, T extends object>(
  storeRenderList: StoreRenderList<any>,
  run: Run,
  autoSync: boolean,
  editable: boolean,
  rootValue: S,
  parentNode: PathNode,
  /**
   * This proxy's own segment, or `null` when it *is* `parentNode` - the root
   * proxy of a store.
   */
  segment: string | symbol | null = null,
  lensValue: Lens<S, any> = lens<S>()
): T {
  /**
   * A node is materialised when a proxy is passed *through*, not when one is
   * landed on: `childProxy` asks for `ownNode()` to parent its child, and
   * `collector` asks for it to register a subscription. A path that is only
   * written to never asks, so it costs no node at all - which is what keeps an
   * open key space (array indices, uuids) from growing the tree (`CI-22`).
   */
  let node: PathNode | undefined = segment === null ? parentNode : undefined;

  const ownNode = () => (node ??= childOf(parentNode, segment!));
  /**
   * A proxy holds a path, never a value, so a child proxy stays correct however
   * often the state underneath it changes. Memoising them keeps `ref.a === ref.a`
   * true and stops every property access from allocating a proxy and a lens.
   */
  const childProxies = new Map<string | symbol, unknown>();

  const childProxy = (segment: string | symbol) => {
    const cached = childProxies.get(segment);

    if (cached) {
      return cached;
    }

    const created = makeProxy(
      storeRenderList,
      run,
      autoSync,
      editable,
      rootValue,
      ownNode(),
      segment,
      lensValue.chain(segment)
    );

    childProxies.set(segment, created);

    return created;
  };

  const inspect = () => ({
    navi: pathToString(parentNode, segment),
    type: getType(lensValue.get(rootValue)),
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
          ownNode(),
          run,
          storeRenderList
        );

        return currentValue;
      }

      /**
       * Debug handles. Symbols, so they cannot collide with state keys.
       */
      if (prop === NAVI) {
        return pathToString(parentNode, segment);
      }
      if (prop === TYPE) {
        return getType(lensValue.get(rootValue));
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
              pathToString(parentNode, segment) || 'ref'
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
          for (const index of (iterableValue as unknown as any[]).keys()) {
            yield childProxy(String(index));
          }
        };
      }

      /**
       * When accessing child object types from a proxy
       */
      return childProxy(prop);
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
      const descriptor = Reflect.getOwnPropertyDescriptor(
        Object(lensValue.get(rootValue)),
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
        value: childProxy(prop),
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
         * Run dependency subscription callbacks, limited to the subscriptions
         * this path can have invalidated.
         */
        if (autoSync) {
          runner(storeRenderList, parentNode, segment);
        }
      }
      return true;
    },
  });

  return result;
}
