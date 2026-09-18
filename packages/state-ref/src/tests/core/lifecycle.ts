/**
 * Phase 5 - subscription lifetime (CI-06, CI-07, CI-14, CI-16, CI-17).
 *
 * The theme is who can stop a subscription and when it is woken:
 *
 *   - the helpers (`combineWatch`, `createComputed`) must offer the same
 *     teardown channel a plain `watch` callback has, and no more
 *   - a computed must notify on a change in the derived value, not on a change
 *     in its sources
 *   - `cache: false` must not hand its subscription to the next cached caller
 *   - `trackDeps` must let a callback stop being woken by a path it stopped
 *     reading
 *
 * See: docs/core-improvement/IMPLEMENT.md (Phase 5)
 */
import {
  createStore,
  createStoreManualSync,
  createComputed,
  combineWatch,
} from '@/index';
import type { Watch } from '@/types';

const noop = (_?: unknown) => {};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  type N = { n: number };

  describe('combineWatch teardown (CI-06)', () => {
    it('stops every inner subscription on abort, not just one', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const r2 = w2();
      const controller = new AbortController();
      const mockFn = vi.fn();

      combineWatch([w1, w2] as const)((store, isFirst) => {
        noop((store as any)[0].n.value);
        noop((store as any)[1].n.value);
        if (!isFirst) mockFn();

        return controller.signal;
      });

      controller.abort();

      r1.n.value = 10;
      r2.n.value = 10;

      /**
       * One watch per source, so a teardown that only reached the subscription
       * that happened to fire would still leave the other live.
       */
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('unsubscribes when the callback returns false on a later pass', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const r2 = w2();
      const mockFn = vi.fn();

      combineWatch([w1, w2] as const)((store, isFirst) => {
        noop((store as any)[0].n.value);
        noop((store as any)[1].n.value);
        if (!isFirst) mockFn();

        return false;
      });

      r1.n.value = 2;
      expect(mockFn).toHaveBeenCalledTimes(1);

      r1.n.value = 3;
      r2.n.value = 3;
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('keeps the subscription when false comes from the first pass', () => {
      /**
       * Mirrors the core: `firstRunner` honours only an AbortSignal, so a
       * helper must not treat a first-pass `false` as a teardown either.
       */
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const mockFn = vi.fn();
      let first = true;

      combineWatch([w1, w2] as const)(store => {
        noop((store as any)[0].n.value);

        if (first) {
          first = false;

          return false;
        }

        mockFn();

        return undefined;
      });

      r1.n.value = 2;

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('ignores a signal that only appears on a later pass', () => {
      /**
       * Core parity: `runner` never registers an AbortSignal, only
       * `firstRunner` does. A helper that accepted one later would give the
       * library two teardown rules to explain.
       */
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const controller = new AbortController();
      const mockFn = vi.fn();

      combineWatch([w1, w2] as const)((store, isFirst) => {
        noop((store as any)[0].n.value);

        if (isFirst) {
          return undefined;
        }

        mockFn();

        return controller.signal;
      });

      r1.n.value = 2;
      expect(mockFn).toHaveBeenCalledTimes(1);

      controller.abort();
      r1.n.value = 3;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('fires once per source change in a tick (DC-11)', () => {
      /**
       * INV-4 keeps propagation inside the write, so two writes are two
       * passes. Coalescing them would mean deferring, which the library does
       * not do - N calls is the defined behaviour.
       */
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const r2 = w2();
      const mockFn = vi.fn();

      combineWatch([w1, w2] as const)((store, isFirst) => {
        noop((store as any)[0].n.value);
        noop((store as any)[1].n.value);
        if (!isFirst) mockFn();
      });

      r1.n.value = 2;
      r2.n.value = 2;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createComputed notifies on the derived value (CI-07)', () => {
    const maxOf = (w1: Watch<N>, w2: Watch<N>) =>
      createComputed<[Watch<N>, Watch<N>], number>([w1, w2], ([a, b]) =>
        Math.max(a.n.value, b.n.value)
      );

    it('does not notify when the derived value is unchanged', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 9 });
      const r1 = w1();
      const mockFn = vi.fn();

      const store = maxOf(
        w1,
        w2
      )((_proxy, isFirst) => {
        if (!isFirst) mockFn();
      });

      r1.n.value = 2;
      r1.n.value = 3;

      expect(store.value).toBe(9);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('notifies exactly once when the derived value moves', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 9 });
      const r1 = w1();
      const mockFn = vi.fn();

      const store = maxOf(
        w1,
        w2
      )((_proxy, isFirst) => {
        if (!isFirst) mockFn();
      });

      r1.n.value = 20;

      expect(store.value).toBe(20);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('exposes the first derived value before any change', () => {
      const w1 = createStore<N>({ n: 4 });
      const w2 = createStore<N>({ n: 7 });

      expect(maxOf(w1, w2)().value).toBe(7);
    });

    it('fires once per source change in a tick (DC-11)', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 2 });
      const r1 = w1();
      const r2 = w2();
      const mockFn = vi.fn();

      createComputed<[Watch<N>, Watch<N>], number>(
        [w1, w2],
        ([a, b]) => a.n.value + b.n.value
      )((_proxy, isFirst) => {
        if (!isFirst) mockFn();
      });

      r1.n.value = 10;
      r2.n.value = 20;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('accepts an AbortSignal from the subscriber', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 1 });
      const r1 = w1();
      const r2 = w2();
      const controller = new AbortController();
      const mockFn = vi.fn();

      maxOf(
        w1,
        w2
      )((_proxy, isFirst) => {
        if (!isFirst) mockFn();

        return controller.signal;
      });

      controller.abort();

      r1.n.value = 50;
      r2.n.value = 60;

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('takes a custom equals for a computed that returns a fresh object', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 9 });
      const r1 = w1();
      const mockFn = vi.fn();

      const computed = createComputed<[Watch<N>, Watch<N>], { max: number }>(
        [w1, w2],
        ([a, b]) => ({ max: Math.max(a.n.value, b.n.value) }),
        { equals: (next, previous) => next.max === previous?.max }
      );
      const store = computed((_proxy, isFirst) => {
        if (!isFirst) mockFn();
      });

      r1.n.value = 2;
      expect(mockFn).not.toHaveBeenCalled();

      r1.n.value = 30;
      expect(store.value).toEqual({ max: 30 });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('notifies on every source change without equals, since the object is new', () => {
      const w1 = createStore<N>({ n: 1 });
      const w2 = createStore<N>({ n: 9 });
      const r1 = w1();
      const mockFn = vi.fn();

      createComputed<[Watch<N>, Watch<N>], { max: number }>(
        [w1, w2],
        ([a, b]) => ({ max: Math.max(a.n.value, b.n.value) })
      )((_proxy, isFirst) => {
        if (!isFirst) mockFn();
      });

      r1.n.value = 2;

      /**
       * Object.is on two fresh objects is always false. This is what `equals`
       * exists for, and why the default cannot be cleverer.
       */
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache:false no longer claims the cache slot (CI-16)', () => {
    it('leaves the next cached call to make its own subscription', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const mockFn = vi.fn();
      const renew = (store: any) => {
        mockFn();
        noop(store.a.value);
      };

      for (let i = 0; i < 5; i += 1) watch(renew, { cache: false });
      watch(renew);

      const ref = watch();
      mockFn.mockClear();
      ref.a.value = 2;

      /**
       * Five uncached subscriptions plus the cached one. Before the fix the
       * cached call was handed a reference belonging to the last uncached
       * subscription and registered nothing of its own, so this was 5.
       */
      expect(mockFn).toHaveBeenCalledTimes(6);
    });

    it('still de-duplicates repeated cached calls', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const renew = (store: any) => noop(store.a.value);

      expect(watch(renew)).toBe(watch(renew));
    });
  });

  describe('trackDeps re-collects dependencies (CI-14)', () => {
    type Branch = { flag: boolean; a: number; b: number };
    const initial = (): Branch => ({ flag: true, a: 0, b: 0 });

    it('stops waking on a path the callback no longer reads', () => {
      const watch = createStore<Branch>(initial(), { trackDeps: true });
      const mockFn = vi.fn();
      const ref = watch(store => {
        mockFn();
        if (store.flag.value) noop(store.a.value);
        else noop(store.b.value);
      });

      ref.flag.value = false;
      mockFn.mockClear();

      ref.a.value = 123;
      expect(mockFn).not.toHaveBeenCalled();

      ref.b.value = 456;
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('starts waking on a path the callback newly reads', () => {
      const watch = createStore<Branch>(initial(), { trackDeps: true });
      const mockFn = vi.fn();
      const ref = watch(store => {
        mockFn();
        if (store.flag.value) noop(store.a.value);
        else noop(store.b.value);
      });

      ref.b.value = 1;
      expect(mockFn).toHaveBeenCalledTimes(1);

      ref.flag.value = false;
      mockFn.mockClear();

      ref.b.value = 2;
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('keeps the old dependencies when the callback throws', () => {
      /**
       * The callback read `flag` and then failed, so its re-collected set is
       * incomplete. Merging the old set back leaves the subscription too wide
       * rather than too narrow - it must not go silent.
       */
      const watch = createStore<Branch>(initial(), { trackDeps: true });
      const mockFn = vi.fn();
      let explode = false;
      const ref = watch(store => {
        mockFn();
        noop(store.flag.value);

        if (explode) {
          throw new Error('boom');
        }

        noop(store.a.value);
      });

      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      explode = true;
      ref.flag.value = false;
      expect(consoleError).toHaveBeenCalled();

      explode = false;
      mockFn.mockClear();
      ref.a.value = 9;

      expect(mockFn).toHaveBeenCalledTimes(1);

      consoleError.mockRestore();
    });

    it('works in manual-sync mode', () => {
      const { watch, updateRef, sync } = createStoreManualSync<Branch>(
        initial(),
        { trackDeps: true }
      );
      const mockFn = vi.fn();

      watch(store => {
        mockFn();
        if (store.flag.value) noop(store.a.value);
        else noop(store.b.value);
      });

      updateRef.flag.value = false;
      sync();
      mockFn.mockClear();

      updateRef.a.value = 123;
      sync();

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('is on by default from 3.0.0 (DC-02)', () => {
      const watch = createStore<Branch>(initial());
      const mockFn = vi.fn();
      const ref = watch(store => {
        mockFn();
        if (store.flag.value) noop(store.a.value);
        else noop(store.b.value);
      });

      ref.flag.value = false;
      mockFn.mockClear();

      ref.a.value = 123;

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('can be turned back off, which is the 2.x behaviour', () => {
      const watch = createStore<Branch>(initial(), { trackDeps: false });
      const mockFn = vi.fn();
      const ref = watch(store => {
        mockFn();
        if (store.flag.value) noop(store.a.value);
        else noop(store.b.value);
      });

      ref.flag.value = false;
      mockFn.mockClear();

      ref.a.value = 123;

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
}
