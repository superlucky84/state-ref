import { lens } from '@/lens';
import type { Lens } from '@/lens';
import { NAVI, TYPE, NODE_INSPECT, getType } from '@/helper';
import { childOf, pathToString } from '@/path';
import type { PathNode } from '@/path';
import { collector } from '@/connectors/collector';
import { runBatch } from '@/connectors/runner';
import { REF_CONNECTION } from '@/internal/ref-connection-key';
import type { Run, WithRoot, StoreRenderList, RefWrite } from '@/types';

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
  onWrite?: (write: RefWrite) => void,
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
      onWrite,
      segment,
      lensValue.chain(segment)
    );

    childProxies.set(segment, created);

    return created;
  };

  const inspect = () => {
    const value = lensValue.get(rootValue);
    return {
      navi: pathToString(parentNode, segment),
      type: getType(value),
      value,
    };
  };

  /**
   * The proxy target carries what a console reads, and nothing else.
   *
   * Neither runtime reaches our traps to render a proxy. Node's util.inspect
   * swaps a proxy for its target before it looks for anything; Chrome names a
   * proxy after its target and previews the target's properties. So a display
   * affordance has to sit here or it does not exist - which is why 2.x got one
   * for free, its target being `{ _navi, _type, _value }`, and why putting the
   * tag in the get trap (3.0.2) showed nothing in a browser.
   *
   * What 2.x could not do is be honest at the same time: with no `ownKeys` or
   * `getOwnPropertyDescriptor` trap, those three keys *were* the proxy's shape,
   * so `Object.keys` returned them and `JSON.stringify` recursed forever
   * reading "_value" (`CI-02`, `CI-03`). With the traps in place the target is
   * invisible to every shape question, so a tag here costs nothing - verified
   * in both runtimes: keys, spread, `in` and JSON are unchanged.
   *
   * `Symbol.toStringTag` rather than a `_navi` property because Chrome renders
   * it as the proxy's name - `Proxy(root.john.age)` - which is legible without
   * expanding anything, where a target property is not previewed at all.
   */
  const result = new Proxy(
    {
      [NODE_INSPECT]: inspect,
      [Symbol.toStringTag]: pathToString(parentNode, segment),
    } as unknown as T,
    {
      /**
       * 1. When accessing ".value" from a proxy
       *   1-1. Have the "collector" collect the subscription callbacks and the
       *   1-2. Subtracts a value from "lens" and returns it
       * 2. When serializing, coercing, or iterating the proxy.
       * 3. When accessing child object types from a proxy
       */
      get(_: T, prop: keyof T & (string | symbol)) {
        if (prop === REF_CONNECTION) {
          return [rootValue, lensValue, ownNode(), editable, storeRenderList];
        }

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
         *
         * `Symbol.toStringTag` answers with the path too, which is what puts it
         * back in a browser console. 2.x displayed the path for free because the
         * proxy's target *was* the display object and there was no `ownKeys`
         * trap - the same lie that made `Object.keys` and spread return debug
         * junk (`CI-02`, `CI-03`). With that fixed, a browser renders through
         * the traps and sees only real state, so the path had nowhere left to
         * appear. The tag puts it on the header line - `root.john.age {…}` -
         * without claiming a property that does not exist.
         */
        if (prop === NAVI || prop === Symbol.toStringTag) {
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
        } else if (!editable) {
          throw new Error(
            'With the current settings, direct modification is not allowed.'
          );
        } else {
          const before = lensValue.get(rootValue);

          if (value === before) return true;

          const newTree = lensValue.set(value)(rootValue);

          onWrite?.({ parent: parentNode, segment, before, after: value });

          rootValue.root = newTree.root;

          /**
           * Run dependency subscription callbacks, limited to the subscriptions
           * this path can have invalidated.
           */
          if (
            autoSync &&
            !runBatch.batch?.write(storeRenderList, parentNode, segment)
          ) {
            runBatch(storeRenderList, parentNode, segment);
          }
        }
        return true;
      },
    }
  );

  return result;
}
