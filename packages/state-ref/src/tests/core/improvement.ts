/**
 * Regression & hardening tests for docs/improvement-2026-11-25
 * (`T-IMP-01`, `T-IMP-04`, `T-IMP-05`, `T-IMP-07`, `T-IMP-08`, `T-IMP-09`).
 */
import {
  create,
  createStore,
  createStoreManualSync,
  createComputed,
  combineWatch,
  runBatch,
} from 'state-ref';
import { batch } from 'state-ref/batch';
import type { PathNode } from '@/path';

const countNodes = (node: PathNode): number => {
  let total = 1;
  node.children?.forEach(child => {
    total += countNodes(child);
  });
  return total;
};

const totalSubs = (node: PathNode): number => {
  let total = node.subs?.size ?? 0;
  node.children?.forEach(child => {
    total += totalSubs(child);
  });
  return total;
};

if (import.meta.vitest) {
  const { describe, it, expect, vi, afterEach } = import.meta.vitest;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('T-IMP-01: Symbol.iterator dependency collection and non-array guard (RQ-IMP-06)', () => {
    it('notifies when elements are appended to a non-empty array', () => {
      const watch = createStore({ items: [1, 2] });
      const ref = watch();
      let seen: number[] = [];

      watch(s => {
        seen = [...s.items].map(item => item.value);
      });

      expect(seen).toEqual([1, 2]);
      ref.items.value = [1, 2, 3];
      expect(seen).toEqual([1, 2, 3]);

      ref.items[3].value = 4;
      expect(seen).toEqual([1, 2, 3, 4]);

      ref.items.length.value = 1;
      expect(seen).toEqual([1]);
    });

    it('notifies when the first element is added to an empty array', () => {
      const watch = createStore<{ items: number[] }>({ items: [] });
      const ref = watch();
      let seen: number[] = [];

      watch(s => {
        seen = [...s.items].map(item => item.value);
      });

      expect(seen).toEqual([]);
      ref.items.value = [9];
      expect(seen).toEqual([9]);
    });

    it('keeps element-level granularity and does not allocate nodes for unbound iteration', () => {
      const { watch, pathRoot } = create({ items: [1, 2] });
      const ref = watch();

      // Unbound iteration must not materialize a 'length' or index PathNode (DC-14).
      const unboundItems = [...ref.items];
      expect(unboundItems).toHaveLength(2);
      expect(countNodes(pathRoot)).toBe(3);

      // Iterating without reading item values only watches length.
      let runs = 0;
      watch(s => {
        runs += 1;
        void [...s.items];
      });
      expect(runs).toBe(1);

      ref.items[0].value = 99;
      expect(runs).toBe(1);

      ref.items.value = [99, 2, 3];
      expect(runs).toBe(2);
    });

    it('does not crash when iterating non-array values (string, Set, Map, null)', () => {
      const watch = createStore<{
        text: string;
        set: Set<number>;
        map: Map<string, number>;
        empty: number[] | null;
      }>({
        text: 'abc',
        set: new Set([1, 2]),
        map: new Map([['a', 1]]),
        empty: null,
      });
      const ref = watch();

      expect(() => [...(ref.text as any)]).not.toThrow();
      expect([...(ref.text as any)]).toEqual([]);
      expect([...(ref.set as any)]).toEqual([]);
      expect([...(ref.map as any)]).toEqual([]);

      let seen: number[] = [];
      watch(s => {
        seen = [...((s.empty as any) || [])].map((i: any) => i.value);
      });
      expect(seen).toEqual([]);
      ref.empty.value = [7];
      expect(seen).toEqual([7]);
    });

    it('works with trackDeps: true when conditionally iterating an array', () => {
      const watch = createStore(
        { show: true, items: [1, 2] },
        { trackDeps: true }
      );
      const ref = watch();
      let runs = 0;

      watch(s => {
        runs += 1;
        if (s.show.value) {
          for (const item of s.items) void item.value;
        }
      });

      expect(runs).toBe(1);
      ref.items.value = [1, 2, 3];
      expect(runs).toBe(2);

      ref.show.value = false;
      expect(runs).toBe(3);

      ref.items.value = [1, 2, 3, 4];
      expect(runs).toBe(3);
    });
  });

  describe('T-IMP-04: First-run exception rollback (RQ-IMP-03)', () => {
    it('removes core subscription when the first run throws after reading paths', () => {
      const { watch, pathRoot } = create({ a: 1 });
      const ref = watch();
      let calls = 0;

      expect(() => {
        watch(s => {
          calls += 1;
          void s.a.value;
          if (calls === 1) throw new Error('first-run failure');
        });
      }).toThrow('first-run failure');

      expect(totalSubs(pathRoot)).toBe(0);

      ref.a.value = 2;
      expect(calls).toBe(1);
    });

    it('rolls back inner subscriptions when createComputed throws on first run', () => {
      const s1 = create({ n: 1 });
      const s2 = create({ n: 2 });
      let computeCalls = 0;

      const computed = createComputed(
        [s1.watch, s2.watch] as const,
        ([a, b]) => {
          computeCalls += 1;
          const sum = a.n.value + b.n.value;
          if (computeCalls === 1) throw new Error('compute boom');
          return sum;
        }
      );

      expect(() => {
        computed(() => {});
      }).toThrow('compute boom');

      expect(totalSubs(s1.pathRoot)).toBe(0);
      expect(totalSubs(s2.pathRoot)).toBe(0);

      s1.updateRef.n.value = 10;
      s2.updateRef.n.value = 20;
      expect(computeCalls).toBe(1);
    });

    it('rolls back inner subscriptions when createComputed subscriber throws on first run', () => {
      const s1 = create({ n: 1 });
      const s2 = create({ n: 2 });
      let subscriberCalls = 0;

      const computed = createComputed(
        [s1.watch, s2.watch] as const,
        ([a, b]) => a.n.value + b.n.value
      );

      expect(() => {
        computed(() => {
          subscriberCalls += 1;
          if (subscriberCalls === 1) throw new Error('subscriber boom');
        });
      }).toThrow('subscriber boom');

      expect(totalSubs(s1.pathRoot)).toBe(0);
      expect(totalSubs(s2.pathRoot)).toBe(0);

      s1.updateRef.n.value = 10;
      expect(subscriberCalls).toBe(1);
    });

    it('rolls back inner subscriptions when combineWatch callback throws on first run', () => {
      const s1 = create({ n: 1 });
      const s2 = create({ n: 2 });
      let calls = 0;

      const combined = combineWatch([s1.watch, s2.watch] as const);

      expect(() => {
        combined(refs => {
          calls += 1;
          void refs[0].n.value;
          void refs[1].n.value;
          if (calls === 1) throw new Error('combine boom');
        });
      }).toThrow('combine boom');

      expect(totalSubs(s1.pathRoot)).toBe(0);
      expect(totalSubs(s2.pathRoot)).toBe(0);

      s1.updateRef.n.value = 10;
      s2.updateRef.n.value = 20;
      expect(calls).toBe(1);
    });
  });

  describe('T-IMP-05: Core cacheMap cleanup & already-aborted AbortSignal (RQ-IMP-01, RQ-IMP-02)', () => {
    it('immediately unsubscribes when first run returns an already-aborted AbortSignal', () => {
      const { watch, pathRoot } = create({ n: 0 });
      const ref = watch();
      let calls = 0;

      const returned = watch(s => {
        calls += 1;
        void s.n.value;
        const ac = new AbortController();
        ac.abort();
        return ac.signal;
      });

      expect(calls).toBe(1);
      expect(totalSubs(pathRoot)).toBe(0);

      // Same-turn synchronous write must not invoke the ended callback.
      ref.n.value = 1;
      expect(calls).toBe(1);

      // Reading through the returned ref must not resurrect it (CI-30).
      void returned.n.value;
      ref.n.value = 2;
      expect(calls).toBe(1);
    });

    it('allows re-subscribing the same callback after returning false', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const seen: number[] = [];

      const fn = (s: ReturnType<typeof watch>, isFirst: boolean) => {
        seen.push(s.n.value);
        if (!isFirst) return false;
        return undefined;
      };

      watch(fn);
      ref.n.value = 1; // runs and ends via return false
      ref.n.value = 2; // ended -> ignored
      expect(seen).toEqual([0, 1]);

      // Re-subscribe with the same callback identity.
      watch(fn);
      ref.n.value = 3;
      expect(seen).toEqual([0, 1, 2, 3]);
    });

    it('allows re-subscribing the same callback after an already-aborted first run', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      let abortFirst = true;
      const seen: number[] = [];

      const fn = (s: ReturnType<typeof watch>) => {
        seen.push(s.n.value);
        if (abortFirst) {
          const ac = new AbortController();
          ac.abort();
          return ac.signal;
        }
        return undefined;
      };

      watch(fn);
      ref.n.value = 1;
      expect(seen).toEqual([0]);

      abortFirst = false;
      watch(fn);
      ref.n.value = 2;
      expect(seen).toEqual([0, 1, 2]);
    });

    it('does not evict a cached subscription when an uncached copy or stale signal aborts', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      let activeController = new AbortController();
      let stopNext = false;
      const seen: number[] = [];

      const fn = (s: ReturnType<typeof watch>, isFirst: boolean) => {
        seen.push(s.n.value);
        if (isFirst) return activeController.signal;
        return stopNext ? false : undefined;
      };

      // Cached subscription #1 returns signal1, then ends via `return false`.
      const signal1Controller = activeController;
      watch(fn);
      stopNext = true;
      ref.n.value = 1;
      expect(seen).toEqual([0, 1]);

      // Re-subscribe cached subscription #2 with a fresh controller.
      stopNext = false;
      activeController = new AbortController();
      const ref2 = watch(fn);

      // Aborting the old signal must NOT evict subscription #2 from cacheMap.
      signal1Controller.abort();
      expect(watch(fn)).toBe(ref2);

      // An uncached subscription aborting must NOT evict subscription #2 either.
      const uncachedController = new AbortController();
      activeController = uncachedController;
      watch(fn, { cache: false });
      uncachedController.abort();
      expect(watch(fn)).toBe(ref2);

      seen.length = 0;
      ref.n.value = 2;
      expect(seen).toEqual([2]);
    });

    it('returns the in-progress ref without recursing when watch(fn) is called re-entrantly during first run', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      let calls = 0;
      let innerRef: ReturnType<typeof watch> | undefined;

      const fn = (s: ReturnType<typeof watch>, isFirst: boolean) => {
        calls += 1;
        void s.n.value;
        if (isFirst) innerRef = watch(fn);
      };

      const outerRef = watch(fn);
      expect(calls).toBe(1);
      expect(innerRef).toBe(outerRef);

      ref.n.value = 1;
      expect(calls).toBe(2);
    });
  });

  describe('T-IMP-07: Core NaN equality with Object.is (RQ-IMP-05)', () => {
    it('does not notify or invoke onWrite when writing NaN over NaN', () => {
      const writes: unknown[] = [];
      const { watch, updateRef } = create(
        { n: NaN, other: 0 },
        { onWrite: write => writes.push(write.after) }
      );
      let calls = 0;

      watch(s => {
        calls += 1;
        void s.n.value;
      });

      expect(calls).toBe(1);
      updateRef.n.value = NaN;
      updateRef.n.value = NaN;
      expect(calls).toBe(1);
      expect(writes).toEqual([]);
    });

    it('does not spuriously wake NaN subscribers on manual sync or root/sibling writes', () => {
      const { watch, updateRef, sync } = createStoreManualSync({
        n: NaN,
        other: 0,
      });
      let nanCalls = 0;

      watch(s => {
        nanCalls += 1;
        void s.n.value;
      });

      expect(nanCalls).toBe(1);
      updateRef.other.value = 1;
      sync();
      expect(nanCalls).toBe(1);
    });

    it('distinguishes +0 and -0 via Object.is', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const seen: number[] = [];

      watch(s => {
        seen.push(s.n.value);
      });

      ref.n.value = -0;
      expect(seen).toHaveLength(2);
      expect(Object.is(seen[1], -0)).toBe(true);
    });
  });

  describe('T-IMP-08: batch() finalizer exception isolation (RQ-IMP-12)', () => {
    it('runs all remaining finalizers even when an earlier finalizer throws', () => {
      const ran: string[] = [];

      expect(() => {
        batch(() => {
          runBatch.batch?.end(() => {
            ran.push('first');
            throw new Error('finalizer-1');
          });
          runBatch.batch?.end(() => {
            ran.push('second');
          });
        });
      }).toThrow('finalizer-1');

      expect(ran).toEqual(['first', 'second']);
    });

    it('preserves the primary callback error when a finalizer also throws', () => {
      const reported = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ran: string[] = [];
      const primary = new Error('callback-failure');

      expect(() => {
        batch(() => {
          runBatch.batch?.end(() => {
            ran.push('f1');
            throw new Error('finalizer-failure');
          });
          runBatch.batch?.end(() => {
            ran.push('f2');
          });
          throw primary;
        });
      }).toThrow(primary);

      expect(ran).toEqual(['f1', 'f2']);
      expect(reported).toHaveBeenCalledTimes(1);
      expect(reported.mock.calls[0][0]).toBeInstanceOf(AggregateError);
    });

    it('throws an AggregateError when multiple finalizers throw without a primary error', () => {
      const ran: string[] = [];
      let caught: unknown;

      try {
        batch(() => {
          runBatch.batch?.end(() => {
            ran.push('f1');
            throw new Error('e1');
          });
          runBatch.batch?.end(() => {
            ran.push('f2');
            throw new Error('e2');
          });
          runBatch.batch?.end(() => {
            ran.push('f3');
          });
        });
      } catch (error) {
        caught = error;
      }

      expect(ran).toEqual(['f1', 'f2', 'f3']);
      expect(caught).toBeInstanceOf(AggregateError);
      expect((caught as AggregateError).errors).toHaveLength(2);
    });
  });

  describe('T-IMP-09: Hardening combinations', () => {
    it('flushes draft status even when an earlier batch finalizer throws', async () => {
      const { createDraft } = await import('@/draft');
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      const dirtyStates: boolean[] = [];

      draft.watchStatus(s => {
        dirtyStates.push(s.dirty.value);
      });
      expect(dirtyStates).toEqual([false]);

      expect(() => {
        batch(() => {
          runBatch.batch?.end(() => {
            throw new Error('unrelated finalizer');
          });
          draft.ref.city.value = '부산';
        });
      }).toThrow('unrelated finalizer');

      expect(dirtyStates).toEqual([false, true]);
      draft.discard();
    });

    it('handles return false and NaN writes cleanly inside batch()', () => {
      const watch = createStore({ n: NaN, flag: 0 });
      const ref = watch();
      const seen: number[] = [];

      const fn = (s: ReturnType<typeof watch>, isFirst: boolean) => {
        seen.push(s.flag.value);
        void s.n.value;
        return isFirst ? undefined : false;
      };

      watch(fn);
      batch(() => {
        ref.n.value = NaN;
      });
      expect(seen).toEqual([0]);

      batch(() => {
        ref.flag.value = 1;
      });
      expect(seen).toEqual([0, 1]);

      // Ended via return false inside batch; re-subscribing must work.
      watch(fn);
      ref.flag.value = 2;
      expect(seen).toEqual([0, 1, 1, 2]);
    });
  });
}
