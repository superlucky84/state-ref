/**
 * The path tree's lifetime (CI-22 / DC-13).
 *
 * `childOf` creates a node the first time a property is touched, and nothing
 * ever removes one: teardown clears `subs`, never `children`. The node count of
 * a store is therefore "every distinct path ever accessed", not "every path
 * currently subscribed", and in an open key space - array indices, uuids - that
 * has no upper bound. `REQUIREMENTS.md` §3.6 has the measurements.
 *
 * These tests do two different jobs:
 *
 *   - pin the accumulation itself, so it stays a known property rather than
 *     being rediscovered
 *   - pin the invariant any reclamation strategy has to keep, because the
 *     obvious strategy breaks it. Pruning a subtree when its value is replaced
 *     detaches nodes that live proxies and live subscriptions still point at,
 *     and the notification is then lost in silence - measured, not argued: the
 *     replacement that prunes cannot even reach its own subtree, because
 *     pruning happens before the runner does.
 */
import { createStore } from '@/index';
import { createPathRoot, childOf, forEachAffectedNode } from '@/path';
import type { Run } from '@/types';

const noop = (_?: unknown) => {};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('the tree accumulates and is never pruned (CI-22)', () => {
    it('keeps a node after its last subscription is dropped', () => {
      const root = createPathRoot();
      const node = childOf(childOf(root, 'a'), 'b');
      const run: Run = () => {};

      node.subs.add(run);
      /**
       * What `removeRun` and `forgetDeps` do - the only teardown there is.
       */
      node.subs.delete(run);

      expect(node.subs.size).toBe(0);
      expect(childOf(root, 'a').children.has('b')).toBe(true);
    });

    it('keeps one node per distinct segment ever asked for', () => {
      const root = createPathRoot();
      const items = childOf(root, 'items');

      for (let i = 0; i < 50; i += 1) childOf(items, String(i));

      expect(items.children.size).toBe(50);
    });

    it('walks dead siblings on a length write, which is where the cost is', () => {
      const root = createPathRoot();
      const items = childOf(root, 'items');
      const length = childOf(items, 'length');

      for (let i = 0; i < 50; i += 1) childOf(items, String(i));

      let visited = 0;
      forEachAffectedNode(length, () => {
        visited += 1;
      });

      /**
       * A `length` write has to consider every sibling by definition (DC-12),
       * so segment narrowing cannot help here: the 50 index nodes are visited
       * whether or not anything still subscribes to them.
       */
      expect(visited).toBeGreaterThanOrEqual(50);
    });
  });

  describe('what a reclamation strategy must not break (DC-13)', () => {
    it('still wakes a subscriber after the subtree it reads is replaced', () => {
      const watch = createStore<{ items: { n: number }[] }>({
        items: [{ n: 1 }],
      });
      const ref = watch();
      const mockFn = vi.fn();
      let seen = -1;

      watch(store => {
        seen = store.items[0].n.value;
        mockFn();
      });

      expect(seen).toBe(1);

      ref.items.value = [{ n: 9 }];
      expect(seen).toBe(9);

      /**
       * The second replacement is the one that pruning on write gets wrong in
       * the general case; the first is the one it gets wrong here, because
       * pruning would run before the runner.
       */
      ref.items.value = [{ n: 20 }];
      expect(seen).toBe(20);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('still wakes a subscriber through a proxy held from before the replacement', () => {
      const watch = createStore<{ items: { n: number }[] }>({
        items: [{ n: 1 }],
      });
      const ref = watch();
      let seen = -1;

      watch(store => {
        seen = store.items[0].n.value;
      });

      const held = ref.items[0];

      ref.items.value = [{ n: 9 }];
      held.n.value = 5;

      expect(seen).toBe(5);
      expect(ref.items.value).toEqual([{ n: 5 }]);
    });

    it('hands back the same child proxy after a replacement', () => {
      /**
       * `childProxies` is a strong Map, so the proxy - and the node it closes
       * over - outlives the value it pointed at. This is CI-15 working as
       * designed, and it is also why weakening only `PathNode.children` would
       * free nothing: the cache would still hold the node.
       */
      const watch = createStore<{ items: { n: number }[] }>({
        items: [{ n: 1 }, { n: 2 }],
      });
      const ref = watch();
      const before = ref.items[1];

      ref.items.value = [{ n: 9 }];

      expect(ref.items[1]).toBe(before);
      expect(before.n.value).toBeUndefined();
    });

    it('keeps a subscribed descendant reachable from an ancestor write', () => {
      const watch = createStore<{ a: { b: { c: number } } }>({
        a: { b: { c: 1 } },
      });
      const ref = watch();
      const mockFn = vi.fn();

      watch(store => {
        noop(store.a.b.c.value);
        mockFn();
      });

      mockFn.mockClear();
      ref.a.value = { b: { c: 2 } };

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
}
