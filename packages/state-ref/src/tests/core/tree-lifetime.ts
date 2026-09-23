/**
 * The path tree's lifetime (CI-22 / DC-13).
 *
 * Nothing ever removes a node: teardown clears `subs`, never `children`. So
 * what decides the node count of a store is *which paths get a node at all*,
 * and Phase 6.5 changed the answer from "every path ever touched" to "every
 * path a subscription reached" (`DC-14`):
 *
 *   - a node is materialised when a proxy is passed *through* (to parent a
 *     child) or subscribed to, never merely by landing on it
 *   - so a path that is only written costs no node, which is what stops an open
 *     key space - array indices, uuids - from growing the tree without bound
 *
 * These tests do two jobs. They pin that rule, including the part of it that is
 * easy to get wrong: a write must still reach a sibling subscriber even when
 * the written path has no node of its own - `items.length` subscribed while
 * `items.2` is not, the very shape `CI-21` missed.
 *
 * And they pin the invariant any reclamation strategy has to keep, because the
 * obvious strategy breaks it. Pruning a subtree when its value is replaced
 * detaches nodes that live proxies and live subscriptions still point at, and
 * the notification is then lost in silence - measured, not argued: the
 * replacement that prunes cannot even reach its own subtree, because pruning
 * happens before the runner does.
 */
import { createStore, combineWatch, createComputed } from '@/index';
import { create } from '@/core';
import { createPathRoot, childOf, forEachAffected } from '@/path';
import type { PathNode } from '@/path';
import type { Run } from '@/types';

const noop = (_?: unknown) => {};

/**
 * How many nodes a store has. Unobservable from the public surface by
 * construction - an unmaterialised path leaves no trace - so the store's own
 * `pathRoot` is the only way to gate the rule (see `create`'s note).
 */
const countNodes = (node: PathNode): number => {
  let total = 1;

  node.children?.forEach(child => {
    total += countNodes(child);
  });

  return total;
};

const countSubscriptions = (node: PathNode): number => {
  let total = node.subs?.size ?? 0;
  node.children?.forEach(child => {
    total += countSubscriptions(child);
  });
  return total;
};

const store = <V>(value: V) => {
  const { pathRoot, watch } = create(value, { autoSync: true });

  return { watch, nodes: () => countNodes(pathRoot) };
};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('a node exists only for a path a subscription reached (DC-14)', () => {
    it.each([true, false])(
      'keeps nested callbackless helpers live without subscriptions (autoSync=%s)',
      autoSync => {
        const { watch, updateRef, sync, pathRoot } = create(
          { n: 1 },
          { autoSync }
        );
        const combined = combineWatch([watch]);
        const computed = createComputed(
          [combined],
          ([refs]) => refs[0].n.value * 2
        );
        const nested = combineWatch([combined, computed]);
        const unbound = nested();

        for (let index = 0; index < 11; index += 1) {
          expect(nested()[1].value).toBe(2);
        }
        expect(countSubscriptions(pathRoot)).toBe(0);

        const seen: number[] = [];
        const abort = new AbortController();
        nested(refs => {
          seen.push(refs[1].value);
          return abort.signal;
        });
        updateRef.n.value = 2;
        expect(unbound[0][0].n.value).toBe(2);
        expect(unbound[1].value).toBe(4);
        if (!autoSync) {
          expect(seen).toEqual([2]);
          expect(() => {
            unbound[0][0].n.value = 3;
          }).toThrow();
          sync();
        }
        expect(seen).toEqual([2, 4]);
        abort.abort();
        expect(countSubscriptions(pathRoot)).toBe(0);
      }
    );

    it('evaluates unbound computed reads without retaining a subscription', () => {
      const { watch, updateRef, pathRoot } = create({ n: 1 });
      const calculate = vi.fn(([ref]: [ReturnType<typeof watch>]) => ({
        parity: ref.n.value % 2,
      }));
      const computed = createComputed([watch] as const, calculate, {
        equals: (a, b) => a.parity === b.parity,
      });
      const ref = computed();
      const first = ref.value;
      expect(ref.value).toBe(first);
      calculate.mockClear();
      updateRef.n.value = 3;
      expect(calculate.mock.calls.length).toBe(0);
      expect(ref.value).toBe(first);
      updateRef.n.value = 4;
      expect(ref.value).toEqual({ parity: 0 });
      expect(ref.value).not.toBe(first);
      expect(countSubscriptions(pathRoot)).toBe(0);
    });

    it('keeps callbackless refs live without tracking their reads', () => {
      const { watch, pathRoot } = create(
        { n: 1, other: 1 },
        { autoSync: true }
      );
      const unbound = watch();

      for (let index = 0; index < 11; index += 1) {
        expect(watch().n.value).toBe(1);
      }

      expect(countSubscriptions(pathRoot)).toBe(0);

      const seen: number[] = [];
      watch(ref => {
        seen.push(ref.n.value);
        void unbound.other.value;
      });
      expect(countSubscriptions(pathRoot)).toBe(1);

      unbound.other.value = 2;
      expect(seen).toEqual([1]);
      unbound.n.value = 2;
      expect(seen).toEqual([1, 2]);
      expect(watch().n.value).toBe(2);
      expect(countSubscriptions(pathRoot)).toBe(1);
    });

    it('costs no node for a path that is only written', () => {
      const { watch, nodes } = store<{ byId: Record<string, number> }>({
        byId: {},
      });
      const ref = watch();

      watch(s => noop(s.byId.value));

      for (let i = 0; i < 200; i += 1) ref.byId[`id-${i}`].value = i;

      /**
       * `byId` is materialised because the proxy is passed through it; the 200
       * keys are landed on and never subscribed, so none of them is.
       */
      expect(Object.keys(ref.byId.value)).toHaveLength(200);
      expect(nodes()).toBe(3);
    });

    it('costs no node for array indices that are only written', () => {
      const { watch, nodes } = store<{ items: number[] }>({ items: [] });
      const ref = watch();

      watch(s => noop(s.items.length.value));

      for (let i = 0; i < 200; i += 1) ref.items[i].value = i;

      expect(ref.items.value.length).toBe(200);
      expect(nodes()).toBe(4);
    });

    it('materialises the whole chain when a path is subscribed', () => {
      /**
       * The subtree rule leans on this: a node with subscribed descendants
       * must itself exist, so "no node" can be read as "no descendants".
       */
      const { watch, nodes } = store<{ a: { b: { c: number } } }>({
        a: { b: { c: 1 } },
      });

      watch(s => noop(s.a.b.c.value));

      expect(nodes()).toBe(5);
    });

    it('wakes a sibling subscriber when the written path has no node', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2] });
      const ref = watch();
      const mockFn = vi.fn();
      let seen = -1;

      watch(store => {
        seen = store.items.length.value;
        mockFn();
      });

      /**
       * `items.2` is written but never subscribed, so it has no node. The
       * length subscriber still has to be told the array grew.
       */
      ref.items[2].value = 3;

      expect(ref.items.value).toEqual([1, 2, 3]);
      expect(seen).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('wakes index subscribers when a length write truncates', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3, 4] });
      const ref = watch();
      let seen: number | undefined = -1;

      watch(store => {
        seen = store.items[3].value;
      });

      ref.items.length.value = 2;

      expect(seen).toBeUndefined();
    });

    it('leaves an unrelated subscriber alone', () => {
      const watch = createStore<{ items: number[]; other: number }>({
        items: [1, 2],
        other: 0,
      });
      const ref = watch();
      const mockFn = vi.fn();

      watch(store => {
        noop(store.other.value);
        mockFn();
      });

      mockFn.mockClear();
      ref.items[5].value = 9;

      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('the tree accumulates and is never pruned (CI-22)', () => {
    it('keeps a node after its last subscription is dropped', () => {
      const root = createPathRoot();
      const a = childOf(root, 'a');
      const node = childOf(a, 'b');
      const run: Run = () => {};

      (node.subs ??= new Set()).add(run);
      /**
       * What `removeRun` and `forgetDeps` do - the only teardown there is.
       */
      node.subs?.delete(run);

      expect(node.subs?.size ?? 0).toBe(0);
      expect(a.children?.has('b')).toBe(true);
    });

    it('allocates no containers for a node nobody subscribes to', () => {
      /**
       * 6.5-A: an empty Map and an empty Set are 83% of a bare node, and a
       * path that is only written through never needs either.
       */
      const root = createPathRoot();
      const leaf = childOf(childOf(root, 'a'), 'b');

      expect(leaf.children).toBeUndefined();
      expect(leaf.subs).toBeUndefined();
    });

    it('keeps one node per distinct segment ever asked for', () => {
      const root = createPathRoot();
      const items = childOf(root, 'items');

      for (let i = 0; i < 50; i += 1) childOf(items, String(i));

      expect(items.children?.size).toBe(50);
    });

    it('visits every sibling on a length write, dead or not', () => {
      const root = createPathRoot();
      const items = childOf(root, 'items');
      const length = childOf(items, 'length');

      for (let i = 0; i < 50; i += 1) childOf(items, String(i));

      let visited = 0;
      forEachAffected(length.parent!, 'length', () => {
        visited += 1;
      });

      /**
       * A `length` write has to consider every sibling by definition (DC-12),
       * so segment narrowing cannot help here - which is why it mattered that
       * Phase 6.5 stopped unsubscribed paths from becoming siblings at all.
       * The rule itself is unchanged: given nodes, all of them are visited.
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
