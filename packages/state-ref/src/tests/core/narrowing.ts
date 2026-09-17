/**
 * What a write is allowed to skip.
 *
 * `runner` does not examine every subscription on every write - it walks the
 * path tree from the written node. That is only sound if the set of nodes it
 * walks really covers everything copy-on-write can have moved, so these tests
 * pin the set itself, both directions:
 *
 *   - nothing outside the set is even read (the narrowing is real)
 *   - nothing inside the set is missed (the narrowing is correct)
 *
 * The last test is a differential oracle: the same write, propagated through
 * the narrowed path (auto-sync) and through the full scan (manual-sync +
 * `sync()`), must notify identically. It is the test that caught the `length`
 * hole below.
 *
 * See: docs/core-improvement/DESIGN.md §3.4
 */
import { createStore, createStoreManualSync } from '@/index';

const noop = (_?: unknown) => {};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('narrowing is real', () => {
    it('does not read a sibling path on an ordinary property write', () => {
      let reads = 0;
      const watch = createStore<{ a: { probe: number }; other: number }>({
        a: {
          get probe() {
            reads += 1;

            return 1;
          },
        },
        other: 0,
      });
      const ref = watch();

      watch(state => noop(state.a.probe.value));
      reads = 0;

      ref.other.value = 1;

      expect(reads).toBe(0);
    });

    it("re-reads only the path that moved, not the subscriber's other paths", () => {
      /**
       * The subscriber is woken through `hot`, so it is examined - but its
       * `probe.v` path is provably unchanged and must not be re-read by the
       * runner. The one read that remains is the callback re-reading it, which
       * is the user's own code.
       *
       * The counter sits one level down, on `probe.v`, rather than on a
       * top-level `probe`. copyOnWrite shallow-copies every object on the
       * written spine, and a spread *evaluates* a getter it finds there - a
       * top-level getter would be read (and frozen) by the write itself, and
       * the test would pass without proving anything. `probe` is a plain slot
       * holding the object, so the copy carries it across by reference and
       * leaves the getter alone.
       */
      let reads = 0;
      const watch = createStore<{ hot: number; probe: { v: number } }>({
        hot: 0,
        probe: {
          get v() {
            reads += 1;

            return 1;
          },
        },
      });
      const ref = watch();

      watch(state => {
        noop(state.hot.value);
        noop(state.probe.v.value);
      });
      reads = 0;

      ref.hot.value = 1;

      expect(reads).toBe(1);
    });

    it('does not walk every index of an array on a single index write', () => {
      const size = 200;
      const watch = createStore<{ items: number[] }>({
        items: Array.from({ length: size }, (_, i) => i),
      });
      const ref = watch();
      const seen: number[] = [];

      for (let i = 0; i < size; i += 1) {
        watch(state => {
          noop(state.items[i].value);
          seen.push(i);
        });
      }

      seen.length = 0;
      ref.items[0].value = 999;

      /**
       * Only the subscriber on the written index re-runs. The others are
       * carried across by the array copy, so their values cannot have moved.
       */
      expect(seen).toEqual([0]);
    });
  });

  describe('narrowing is correct - array length is a sibling, not a descendant', () => {
    it('notifies a length subscriber when an index write extends the array', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2] });
      const ref = watch();
      const mockFn = vi.fn();
      let seen = -1;

      watch(state => {
        seen = state.items.length.value;
        mockFn();
      });

      expect(seen).toBe(2);

      ref.items[2].value = 3;

      expect(ref.items.value).toEqual([1, 2, 3]);
      expect(seen).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('notifies a length subscriber on a sparse extend', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2] });
      const ref = watch();
      let seen = -1;

      watch(state => {
        seen = state.items.length.value;
      });

      ref.items[5].value = 9;

      expect(seen).toBe(6);
    });

    it('notifies index subscribers when a length write truncates the array', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3, 4] });
      const ref = watch();
      const mockFn = vi.fn();
      let seen: number | undefined = -1;

      watch(state => {
        seen = state.items[3].value;
        mockFn();
      });

      expect(seen).toBe(4);

      ref.items.length.value = 2;

      expect(ref.items.value).toEqual([1, 2]);
      expect(seen).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('leaves an untouched index alone when the array is extended', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2] });
      const ref = watch();
      const mockFn = vi.fn();

      watch(state => {
        noop(state.items[0].value);
        mockFn();
      });

      ref.items[2].value = 3;

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('narrowing matches a full scan (differential oracle)', () => {
    /**
     * Readers and writers are deliberately biased towards arrays, where the
     * affected set is subtle. A shape is a list of reader indices given to one
     * subscriber.
     */
    const readers: ((s: any) => unknown)[] = [
      s => s.a.b.value,
      s => s.a.b.c.value,
      s => s.a.e.value,
      s => s.a.e[0].value,
      s => s.a.e[1].value,
      s => s.a.e[3].value,
      s => s.a.e.length.value,
      s => s.z.value,
      s => s.n.value,
    ];

    const writers: ((r: any, i: number) => void)[] = [
      (r, i) => (r.a.b.c.value = i),
      (r, i) => (r.a.b.value = { c: i }),
      (r, i) => (r.a.e[0].value = i),
      (r, i) => (r.a.e[3].value = i),
      (r, i) => (r.a.e[6].value = i),
      (r, i) => (r.a.e.value = [i, i]),
      (r, i) => (r.a.e.value = [i, i, i, i, i]),
      r => (r.a.e.length.value = 1),
      r => (r.a.e.length.value = 4),
      (r, i) => (r.z.value = i),
      (r, i) => (r.n.value = i),
      (r, i) => (r.value = { a: { b: { c: i }, e: [i] }, z: i, n: i }),
    ];

    const initial = () => ({
      a: { b: { c: 1 }, e: [10, 20, 30] },
      z: 0,
      n: 0,
    });

    it('notifies identically for every write in a pseudo-random sequence', () => {
      let seed = 987654321;
      const rand = (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;

        return seed % n;
      };

      let compared = 0;

      for (let trial = 0; trial < 150; trial += 1) {
        const shapes: number[][] = [];
        for (let s = 0; s < 1 + rand(3); s += 1) {
          const picked: number[] = [];
          for (let j = 0; j < 1 + rand(4); j += 1) {
            picked.push(rand(readers.length));
          }
          shapes.push(picked);
        }

        const narrowHits = shapes.map(() => 0);
        const scanHits = shapes.map(() => 0);

        const watchNarrow = createStore<any>(initial());
        const refNarrow = watchNarrow();
        shapes.forEach((picked, idx) => {
          watchNarrow(state => {
            picked.forEach(p => noop(readers[p](state)));
            narrowHits[idx] += 1;
          });
        });

        const {
          watch: watchScan,
          updateRef: refScan,
          sync,
        } = createStoreManualSync<any>(initial());
        shapes.forEach((picked, idx) => {
          watchScan(state => {
            picked.forEach(p => noop(readers[p](state)));
            scanHits[idx] += 1;
          });
        });

        for (let step = 0; step < 5; step += 1) {
          const write = writers[rand(writers.length)];

          write(refNarrow, 100 + step);
          write(refScan, 100 + step);
          sync();

          compared += 1;
          expect(narrowHits).toEqual(scanHits);
        }

        shapes.forEach(picked => {
          expect(picked.map(p => readers[p](refNarrow))).toEqual(
            picked.map(p => readers[p](refScan))
          );
        });
      }

      expect(compared).toBe(750);
    });
  });
}
