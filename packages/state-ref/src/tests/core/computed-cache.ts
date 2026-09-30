import { create } from '@/core';
import { combineWatch, createComputed } from '@/index';
import type { PathNode } from '@/path';
import type { Watch } from '@/types';

const subscriptions = (node: PathNode): number =>
  (node.subs?.size ?? 0) +
  [...(node.children?.values() ?? [])].reduce(
    (total, child) => total + subscriptions(child),
    0
  );

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('unbound computed dependency cache', () => {
    it('supports a Watch implemented outside the core', () => {
      let n = 1;
      const watch: Watch<number> = () => ({
        get value() {
          return n;
        },
      });
      let calls = 0;
      const ref = createComputed([watch], ([source]) => {
        calls += 1;
        return { n: source.value };
      })();
      const first = ref.value;
      expect(ref.value).toBe(first);
      n = 2;
      expect(ref.value).toEqual({ n: 2 });
      expect(calls).toBe(2);
    });

    it('reuses object results until a value it read changes', () => {
      const { watch, updateRef, pathRoot } = create({ n: 1, other: 0 });
      let calls = 0;
      const ref = createComputed([watch], ([source]) => {
        calls += 1;
        expect(source.n).toBe(source.n);
        return { n: source.n.value };
      })();
      const first = ref.value;
      expect(ref.value).toBe(first);
      expect(calls).toBe(1);
      updateRef.other.value = 2;
      expect(ref.value).toBe(first);
      expect(calls).toBe(1);
      updateRef.n.value = 2;
      updateRef.n.value = 3;
      expect(calls).toBe(1);
      const next = ref.value;
      expect(next).toEqual({ n: 3 });
      expect(next).not.toBe(first);
      expect(ref.value).toBe(next);
      expect(calls).toBe(2);
      expect(subscriptions(pathRoot)).toBe(0);
    });

    it('reads before manual sync without consuming another subscriber notification', () => {
      const { watch, updateRef, sync, pathRoot } = create(
        { n: 1 },
        { autoSync: false }
      );
      const computed = createComputed([watch], ([source]) => ({
        n: source.n.value,
      }));
      const ref = computed();
      const abort = new AbortController();
      const seen: number[] = [];
      const bound = computed(value => {
        seen.push(value.value.n);
        return abort.signal;
      });
      const first = ref.value;
      updateRef.n.value = 2;
      expect(ref.value).toEqual({ n: 2 });
      expect(ref.value).not.toBe(first);
      expect(bound.value).toEqual({ n: 1 });
      expect(seen).toEqual([1]);
      sync();
      expect(seen).toEqual([1, 2]);
      expect(bound.value).toEqual({ n: 2 });
      abort.abort();
      expect(subscriptions(pathRoot)).toBe(0);
    });

    it('replaces dependencies when the selected branch changes', () => {
      const { watch, updateRef } = create({ flag: true, a: 1, b: 2 });
      let calls = 0;
      const ref = createComputed([watch], ([source]) => {
        calls += 1;
        return { n: source.flag.value ? source.a.value : source.b.value };
      })();
      const first = ref.value;
      updateRef.b.value = 3;
      expect(ref.value).toBe(first);
      expect(calls).toBe(1);
      updateRef.flag.value = false;
      const second = ref.value;
      expect(second).toEqual({ n: 3 });
      updateRef.a.value = 4;
      expect(ref.value).toBe(second);
      expect(calls).toBe(2);
      updateRef.b.value = 5;
      expect(ref.value).toEqual({ n: 5 });
      expect(calls).toBe(3);
    });

    it('checks nested computed results and preserves equal results without recalculating the outer value', () => {
      const { watch, updateRef, pathRoot } = create({ n: 1 });
      let innerCalls = 0;
      let outerCalls = 0;
      const inner = createComputed([watch], ([source]) => {
        innerCalls += 1;
        return source.n.value % 2;
      });
      const combined = combineWatch([inner]);
      const outer = createComputed([combined], ([values]) => {
        outerCalls += 1;
        return { label: String(values[0].value) };
      })();
      const first = outer.value;
      expect([innerCalls, outerCalls]).toEqual([1, 1]);
      updateRef.n.value = 3;
      expect(outer.value).toBe(first);
      expect([innerCalls, outerCalls]).toEqual([2, 1]);
      updateRef.n.value = 4;
      expect(outer.value).toEqual({ label: '0' });
      expect([innerCalls, outerCalls]).toEqual([3, 2]);
      expect(subscriptions(pathRoot)).toBe(0);
    });

    it.each(['calculation', 'equals'] as const)(
      'retries after a failed %s',
      failure => {
        const { watch, updateRef } = create(1);
        let fail = false;
        let calls = 0;
        const ref = createComputed(
          [watch],
          ([source]) => {
            calls += 1;
            const n = source.value;
            if (fail && failure === 'calculation') throw new Error('retry');
            return { n };
          },
          {
            equals: (a, b) => {
              if (fail && failure === 'equals') throw new Error('retry');
              return a.n === b.n;
            },
          }
        )();
        const first = ref.value;
        fail = true;
        updateRef.value = 2;
        expect(() => ref.value).toThrow('retry');
        fail = false;
        const next = ref.value;
        expect(next).toEqual({ n: 2 });
        expect(next).not.toBe(first);
        expect(ref.value).toBe(next);
        expect(calls).toBe(3);
      }
    );

    it('tracks refs yielded by array and combined iterators', () => {
      const key = Symbol('item');
      const { watch, updateRef, pathRoot } = create({
        items: [1, 2],
        [key]: 3,
      });
      let calls = 0;
      const combined = combineWatch([watch]);
      const ref = createComputed([combined], ([values]) => {
        calls += 1;
        const [source] = values;
        return [...source.items].reduce(
          (sum, item) => sum + item.value,
          source[key].value
        );
      })();
      expect(ref.value).toBe(6);
      expect(ref.value).toBe(6);
      expect(calls).toBe(1);
      updateRef.items[0].value = 4;
      expect(ref.value).toBe(9);
      updateRef[key].value = 5;
      expect(ref.value).toBe(11);
      updateRef.items[2].value = 6;
      expect(ref.value).toBe(17);
      updateRef.items.value = [];
      expect(ref.value).toBe(5);
      updateRef.items[0].value = 10;
      expect(ref.value).toBe(15);
      expect(calls).toBe(6);
      expect(subscriptions(pathRoot)).toBe(0);
    });

    it('caches a calculation with no dependencies and a NaN input', () => {
      const { watch } = create(NaN);
      let calls = 0;
      const ref = createComputed([watch], ([source]) => {
        calls += 1;
        return { n: source.value };
      })();
      const first = ref.value;
      expect(ref.value).toBe(first);
      expect(calls).toBe(1);
      const calculate = vi.fn(() => ({ n: 1 }));
      const constant = createComputed([], calculate)();
      expect(constant.value).toBe(constant.value);
      expect(calculate).toHaveBeenCalledTimes(1);
    });
  });
}
