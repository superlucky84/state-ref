/**
 * Phase 7 edge-case matrix: value shapes crossed with store options.
 *
 * Most of the core's tests take one interesting path at a time. This file
 * takes the boring paths all at once, because the options are where the thin
 * coverage is: `cache: false` has no real user anywhere in this repository
 * (`IC-02`) and `trackDeps` is opt-in and new (`DC-02`), so combinations of
 * them had never been run against anything but the simplest state.
 *
 * Two axes:
 *
 *   values   primitive / string / boolean / null / undefined / object /
 *            array / nested array / symbol-keyed
 *   options  autoSync|manualSync x editable x cache x trackDeps
 *
 * The option axes are crossed exhaustively (16 stores) and asserted against
 * the invariants that hold in every one of them, rather than against
 * behaviour that differs per combination - which is what makes the cross
 * product worth running instead of just long.
 */
import { createStore, createStoreManualSync } from '@/index';
import type { StateRefStore } from '@/types';

const noop = (_?: unknown) => {};
const TAG = Symbol('tag');

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  /**
   * One store per option combination, driven through the same script.
   *
   * `updateRef` is how a manual-sync store writes, and it is also the only
   * writable reference when `editable: false` - so the two modes share a
   * shape here instead of needing two scripts.
   */
  const combinations = [true, false].flatMap(autoSync =>
    [true, false].flatMap(editable =>
      [true, false].flatMap(cache =>
        [true, false].map(trackDeps => ({
          autoSync,
          editable,
          cache,
          trackDeps,
          name: `autoSync=${autoSync} editable=${editable} cache=${cache} trackDeps=${trackDeps}`,
        }))
      )
    )
  );

  describe('value shapes survive a round trip', () => {
    const shapes: [string, unknown, unknown][] = [
      ['number', 1, 2],
      ['string', 'a', 'b'],
      ['boolean', true, false],
      ['null', null, 1],
      ['undefined', undefined, 1],
      ['object', { x: 1 }, { x: 2 }],
      ['array', [1, 2], [1, 2, 3]],
      [
        'nested array',
        [
          [1, 2],
          [3, 4],
        ],
        [[1, 2], [3, 4], [5]],
      ],
    ];

    it.each(shapes)('%s notifies once and reads back', (_name, first, next) => {
      const watch = createStore<{ v: unknown }>({ v: first });
      const ref = watch();
      const renew = vi.fn();

      watch(s => {
        noop(s.v.value);
        renew();
      });

      renew.mockClear();
      ref.v.value = next;

      expect(renew).toHaveBeenCalledTimes(1);
      expect(ref.v.value).toEqual(next);
    });

    it.each(shapes)(
      '%s notifies once and reads back in manual sync',
      (_name, first, next) => {
        const { watch, updateRef, sync } = createStoreManualSync<{
          v: unknown;
        }>({ v: first });
        const renew = vi.fn();

        watch(s => {
          noop(s.v.value);
          renew();
        });

        renew.mockClear();
        updateRef.v.value = next;
        sync();

        expect(renew).toHaveBeenCalledTimes(1);
        expect(watch().v.value).toEqual(next);
      }
    );

    it('carries a symbol key through a write to its sibling', () => {
      const watch = createStore<{ [TAG]: number; other: number }>({
        [TAG]: 1,
        other: 0,
      });
      const ref = watch();
      const seen: number[] = [];

      watch(s => {
        seen.push(s[TAG].value);
      });

      ref[TAG].value = 2;

      expect(seen).toEqual([1, 2]);
      expect(ref.other.value).toBe(0);
    });

    it('treats a value removed by a parent write as undefined, not a throw', () => {
      const watch = createStore<{ a: { b?: number } }>({ a: { b: 1 } });
      const ref = watch();
      const seen: (number | undefined)[] = [];

      watch(s => {
        /**
         * An optional property's reference is typed optional too, even though
         * the proxy for it always exists - the types describe the state, not
         * the proxy tree.
         */
        seen.push(s.a.b!.value);
      });

      ref.a.value = {};

      expect(seen).toEqual([1, undefined]);
    });
  });

  describe('the option cross product', () => {
    const build = (option: (typeof combinations)[number]) => {
      const { autoSync, editable, cache, trackDeps } = option;
      const initial = { n: 0, deep: { list: [1, 2] } };

      if (autoSync) {
        const watch = createStore<typeof initial>(initial, { trackDeps });

        return {
          watch: (renew?: any) => watch(renew, { cache, editable }),
          write: watch(() => {}, { cache: false, editable: true }),
          flush: noop,
        };
      }

      const { watch, updateRef, sync } = createStoreManualSync<typeof initial>(
        initial,
        { trackDeps }
      );

      return {
        watch: (renew?: any) => watch(renew, { cache, editable }),
        write: updateRef,
        flush: sync,
      };
    };

    it.each(combinations)(
      'notifies exactly once per change — $name',
      option => {
        const { watch, write, flush } = build(option);
        const renew = vi.fn();

        watch((s: StateRefStore<{ n: number }>) => {
          noop(s.n.value);
          renew();
        });

        renew.mockClear();
        write.n.value = 1;
        flush();

        expect(renew).toHaveBeenCalledTimes(1);

        renew.mockClear();
        write.n.value = 1;
        flush();

        /**
         * A write of the value already there is not a change in any
         * combination - `trackDeps` re-collects what a callback reads, it does
         * not widen what counts as a change.
         */
        expect(renew).not.toHaveBeenCalled();
      }
    );

    it.each(combinations)('honours `editable` — $name', option => {
      const { watch } = build(option);
      const ref = watch();

      if (option.editable) {
        ref.n.value = 7;

        expect(ref.n.value).toBe(7);
      } else {
        expect(() => {
          ref.n.value = 7;
        }).toThrow(/direct modification is not allowed/);
      }
    });

    it.each(combinations)('honours `cache` — $name', option => {
      const { watch } = build(option);
      const renew = () => {};
      const first = watch(renew);
      const second = watch(renew);

      /**
       * `cache: false` asks for a subscription of its own, so it must hand
       * back a different reference - and must not claim the cache slot on the
       * way out, which is what `CI-16` fixed.
       */
      if (option.cache) {
        expect(first).toBe(second);
      } else {
        expect(first).not.toBe(second);
      }
    });

    it.each(combinations)(
      'keeps proxy identity stable within a store — $name',
      option => {
        const { watch } = build(option);
        const ref = watch();

        expect(ref.deep).toBe(ref.deep);
        expect(ref.deep.list[0]).toBe(ref.deep.list[0]);
      }
    );

    it.each(combinations)(
      'reaches a nested path and its length — $name',
      option => {
        const { watch, write, flush } = build(option);
        const lengths: number[] = [];

        watch((s: any) => {
          lengths.push(s.deep.list.length.value);
        });

        write.deep.list[2].value = 3;
        flush();

        expect(lengths).toEqual([2, 3]);
      }
    );
  });
}
