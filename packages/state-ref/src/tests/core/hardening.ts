/**
 * Phase 7 hardening: what happens at the edges of a propagation pass.
 *
 * Everything here is about the window in which `runner` is already running.
 * Three of these behaviours were fine and are pinned so they stay that way -
 * a nested write chain, teardown by returning `false`, teardown outside a
 * pass. Two were not:
 *
 *   - `CI-23` a subscriber that feeds itself recursed until the stack broke,
 *     and the `RangeError` was swallowed by the error reporter, whose own
 *     `console.error` then overflowed again. The store was left at whatever
 *     value the stack ran out on, with no signal to the user.
 *   - `CI-24` an `AbortSignal` that fired mid-pass was undone by its own
 *     subscriber: `removeRun` dropped it, then the pass ran it anyway, and
 *     reading a path re-registered it. The subscription became permanent,
 *     because the signal had already fired and could not fire again.
 *   - `CI-30` the same resurrection through the other entrance. `CI-24` closed
 *     the one inside a pass; an ordinary read through the ref the caller still
 *     holds - what any repaint does - re-registered an ended subscription just
 *     as effectively, and every later read/write pair did it again.
 *
 * All three are in released versions; none was introduced by this branch.
 */
import { createStore, createStoreManualSync } from '@/index';
import { create } from '@/core';
import { makeReference } from '@/core/ref';
import { createPathRoot } from '@/path';
import type { PathNode } from '@/path';
import type { StateRefStore, StoreType, StoreRenderList } from '@/types';

const noop = (_?: unknown) => {};

/**
 * A store whose `storeRenderList` the test owns.
 *
 * `create` deliberately does not hand it out - the leak question is "did the
 * subscription record go away", and nothing on the public surface answers it.
 * Mirroring what `create` does is cheaper than widening its return value, and
 * it costs the bundle nothing.
 */
const harness = <V>(value: V) => {
  const storeRenderList: StoreRenderList<any> = new Map();
  const pathRoot = createPathRoot();
  const cacheMap = new WeakMap<any, StateRefStore<V>>();
  const rootValue: StoreType<V> = { root: value };

  const watch = (renew: any = () => {}) =>
    makeReference<V>({
      renew,
      rootValue,
      storeRenderList,
      cacheMap,
      autoSync: true,
      cache: true,
      editable: true,
      trackDeps: false,
      pathRoot,
    });

  return { watch, storeRenderList, pathRoot };
};

/** Every subscription mark still on the tree, anywhere. */
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

  describe('re-entrant writes (CI-23)', () => {
    it('delivers a chain of writes made from inside subscribers', () => {
      const watch = createStore({ a: 0, b: 0, c: 0 });
      const ref = watch();
      const order: string[] = [];

      watch(s => {
        order.push(`a:${s.a.value}`);

        if (s.a.value === 1) {
          ref.b.value = 1;
        }
      });
      watch(s => {
        order.push(`b:${s.b.value}`);

        if (s.b.value === 1) {
          ref.c.value = 1;
        }
      });
      watch(s => {
        order.push(`c:${s.c.value}`);
      });

      order.length = 0;
      ref.a.value = 1;

      /**
       * Nesting is not the defect and must keep working: under `INV-4` a write
       * notifies synchronously, so a subscriber writing is an ordinary way to
       * derive state.
       */
      expect(order).toEqual(['a:1', 'b:1', 'c:1']);
    });

    it('stops a self-feeding subscriber with an error instead of a broken stack', () => {
      const reported = vi.spyOn(console, 'error').mockImplementation(noop);
      const watch = createStore({ n: 0 });
      const ref = watch();
      let calls = 0;

      watch(s => {
        calls += 1;

        if (s.n.value < 1_000_000) {
          ref.n.value = s.n.value + 1;
        }
      });

      calls = 0;
      ref.n.value = 1;

      /**
       * The cap has to be low enough that the stack is nowhere near it - a
       * self-feeding loop reached about 1,295 frames before `RangeError` on
       * Node 20.
       */
      expect(calls).toBeLessThan(200);
      expect(reported).toHaveBeenCalled();

      const message = String(
        (reported.mock.calls[0][0] as AggregateError)?.errors?.[0] ??
          reported.mock.calls[0][0]
      );

      expect(message).toMatch(/subscriber write loop exceeded/);
      expect(message).not.toMatch(/Maximum call stack/);
    });

    it('does not leak depth between passes', () => {
      const watch = createStore({ a: 0, b: 0 });
      const ref = watch();
      const seen: number[] = [];

      watch(s => {
        if (s.a.value > 0) {
          ref.b.value = s.a.value;
        }
      });
      watch(s => {
        seen.push(s.b.value);
      });

      /**
       * The counter is process-wide, so a pass that nests must give its depth
       * back - otherwise the 300th shallow write would trip a cap of 100.
       */
      for (let i = 1; i <= 300; i += 1) {
        ref.a.value = i;
      }

      expect(seen[seen.length - 1]).toBe(300);
    });
  });

  describe('teardown during a propagation pass (CI-24)', () => {
    it('unsubscribes when the signal fires outside a pass', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const control = new AbortController();
      const seen: number[] = [];

      watch(s => {
        seen.push(s.n.value);

        return control.signal;
      });

      ref.n.value = 1;
      control.abort();
      ref.n.value = 2;

      expect(seen).toEqual([0, 1]);
    });

    it('unsubscribes when a subscriber aborts itself', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const control = new AbortController();
      const seen: number[] = [];

      watch(s => {
        seen.push(s.n.value);

        if (s.n.value === 1) {
          control.abort();
        }

        return control.signal;
      });

      ref.n.value = 1;
      ref.n.value = 2;

      expect(seen).toEqual([0, 1]);
    });

    it('unsubscribes when the callback returns false', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const seen: number[] = [];

      watch(s => {
        seen.push(s.n.value);

        return s.n.value >= 1 ? false : undefined;
      });

      ref.n.value = 1;
      ref.n.value = 2;

      expect(seen).toEqual([0, 1]);
    });

    it('unsubscribes when another subscriber aborts it mid-pass', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const control = new AbortController();
      const seen: string[] = [];

      watch(s => {
        seen.push(`A${s.n.value}`);

        if (s.n.value === 1) {
          control.abort();
        }
      });
      watch(s => {
        seen.push(`B${s.n.value}`);

        return control.signal;
      });

      ref.n.value = 1;
      ref.n.value = 2;
      ref.n.value = 3;

      /**
       * B is aborted while the pass that would run it is still in flight. It
       * must not run again - and above all must not come back: its signal has
       * already fired, so a re-registered B can never be torn down again.
       */
      expect(seen).toEqual(['A0', 'B0', 'A1', 'A2', 'A3']);
    });

    it('stays unsubscribed when the aborted callback reads nothing', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const control = new AbortController();
      const seen: string[] = [];

      watch(s => {
        seen.push(`A${s.n.value}`);

        if (s.n.value === 1) {
          control.abort();
        }
      });
      watch((s, isFirst) => {
        if (isFirst) {
          noop(s.n.value);
          seen.push('B-first');

          return control.signal;
        }

        seen.push('B-run');

        return undefined;
      });

      ref.n.value = 1;
      ref.n.value = 2;

      expect(seen).toEqual(['A0', 'B-first', 'A1', 'A2']);
    });
  });

  describe('an ended subscription stays ended (CI-30)', () => {
    /**
     * The caller keeps the ref after ending the subscription, and reading
     * through it lands in the same `collector` that built the subscription in
     * the first place. Nothing stopped it from re-creating the record
     * `removeRun` had just dropped, so the next write woke a subscriber the
     * caller had ended - and there was no way to end it again, because the
     * signal had already fired.
     *
     * The test above ("the signal fires outside a pass") aborts and writes with
     * no read in between, which is why it passed while this did not. Any app
     * that renders after an action reads through that ref, so the shape is
     * ordinary rather than exotic: `examples/bundles`'s core-only page repaints
     * after every button, and that is where this was found.
     */
    it('a read through the ref after abort does not resubscribe it', () => {
      const watch = createStore({ city: '서울', count: 0 });
      const control = new AbortController();
      const seen: string[] = [];

      const ref = watch((s, isFirst) => {
        seen.push(s.city.value);

        return isFirst ? control.signal : undefined;
      });

      ref.city.value = '부산';
      control.abort();

      // What a repaint does.
      void ref.city.value;
      void ref.count.value;

      ref.city.value = '대전';

      expect(seen).toEqual(['서울', '부산']);
    });

    it('stays ended however many times it is read and written', () => {
      const watch = createStore({ n: 0 });
      const control = new AbortController();
      let calls = 0;

      const ref = watch((s, isFirst) => {
        calls += 1;
        void s.n.value;

        return isFirst ? control.signal : undefined;
      });

      control.abort();

      for (let i = 1; i <= 5; i += 1) {
        void ref.n.value;
        ref.n.value = i;
      }

      // Each read/write pair revived it once, so this counted 6 before the fix.
      expect(calls).toBe(1);
    });

    it('does not resubscribe after a teardown by returning false', () => {
      const watch = createStore({ n: 0 });
      let calls = 0;

      /**
       * Read through the ref the subscription handed back, not an unbound
       * `watch()` - an unbound ref carries no run and so registers nothing,
       * which would make this test pass without testing anything.
       */
      const ref = watch(s => {
        calls += 1;
        void s.n.value;

        return calls === 1 ? undefined : false;
      });

      ref.n.value = 1;
      expect(calls).toBe(2);

      void ref.n.value;
      ref.n.value = 2;

      expect(calls).toBe(2);
    });

    it('leaves an unrelated subscription on the same path alone', () => {
      const watch = createStore({ n: 0 });
      const control = new AbortController();
      const ended: number[] = [];
      const kept: number[] = [];

      const ref = watch((s, isFirst) => {
        ended.push(s.n.value);

        return isFirst ? control.signal : undefined;
      });
      watch(s => {
        kept.push(s.n.value);
      });

      control.abort();
      void ref.n.value;
      ref.n.value = 1;

      expect(ended).toEqual([0]);
      expect(kept).toEqual([0, 1]);
    });
  });

  describe('a write of the value already there', () => {
    it('notifies nobody in auto-sync', () => {
      const watch = createStore({ n: 1, nested: { deep: 'x' } });
      const ref = watch();
      const renew = vi.fn();

      watch(s => {
        noop(s.n.value);
        noop(s.nested.deep.value);
        renew();
      });

      renew.mockClear();
      ref.n.value = 1;
      ref.nested.deep.value = 'x';

      expect(renew).not.toHaveBeenCalled();
    });

    it('notifies nobody in manual sync', () => {
      const { watch, updateRef, sync } = createStoreManualSync({ n: 1 });
      const renew = vi.fn();

      watch(s => {
        noop(s.n.value);
        renew();
      });

      renew.mockClear();
      updateRef.n.value = 1;
      sync();

      expect(renew).not.toHaveBeenCalled();
    });
  });

  describe('subscription records are released', () => {
    it('leaves nothing behind after 1,000 subscribe/abort cycles', () => {
      const { watch, storeRenderList, pathRoot } = harness({
        a: { b: 1 },
        list: [1, 2, 3],
      });

      for (let i = 0; i < 1_000; i += 1) {
        const control = new AbortController();

        watch((s: any) => {
          noop(s.a.b.value);
          noop(s.list[i % 3].value);

          return control.signal;
        });

        control.abort();
      }

      /**
       * Nodes themselves are designed to stay (`DC-14`); what must not stay is
       * the subscription - neither its record nor its mark on the tree.
       */
      expect(storeRenderList.size).toBe(0);
      expect(totalSubs(pathRoot)).toBe(0);
    });

    it('releases the marks a torn-down subscription left on the tree', () => {
      const { pathRoot, watch } = create({ a: { b: 1 } }, { autoSync: true });
      const control = new AbortController();

      watch(s => {
        noop(s.a.b.value);

        return control.signal;
      });

      expect(totalSubs(pathRoot)).toBeGreaterThan(0);

      control.abort();

      expect(totalSubs(pathRoot)).toBe(0);
    });
  });
}
