/**
 * Regression snapshot for docs/core-improvement (CI-01 ~ CI-20).
 *
 * These tests pin the behavior observed at the baseline commit, including the
 * behavior that is currently WRONG. Each "SNAPSHOT (wrong)" assertion is
 * expected to be flipped by the phase named in its comment; flipping it is the
 * proof that the fix landed. Do not "fix" a snapshot without doing the work.
 *
 * See: docs/core-improvement/REQUIREMENTS.md
 */
import {
  createStore,
  createStoreManualSync,
  cloneDeep,
  copyable,
  createComputed,
  combineWatch,
} from '@/index';
import type { Watch } from '@/types';

const noop = (_?: unknown) => {};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('CI-01 editable option is bypassed when userOption is passed', () => {
    it('watch(cb) in manual-sync mode blocks writes', () => {
      const { watch } = createStoreManualSync<{ a: number }>({ a: 1 });
      const ref = watch(s => noop(s.a.value));

      expect(() => {
        ref.a.value = 99;
      }).toThrow(
        'With the current settings, direct modification is not allowed.'
      );
    });

    it('FIXED (Phase 1): watch(cb, {cache:false}) in manual-sync mode also blocks writes', () => {
      const { watch } = createStoreManualSync<{ a: number }>({ a: 1 });
      const ref = watch(s => noop(s.a.value), { cache: false });

      expect(() => {
        ref.a.value = 99;
      }).toThrow(
        'With the current settings, direct modification is not allowed.'
      );
      expect(ref.a.value).toBe(1);
    });

    it('an explicit {editable:true} is still honoured as an escape hatch', () => {
      const { watch } = createStoreManualSync<{ a: number }>({ a: 1 });
      const ref = watch(s => noop(s.a.value), { editable: true });

      ref.a.value = 99;
      expect(ref.a.value).toBe(99);
    });

    it('auto-sync mode allows writes with or without userOption', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch(s => noop(s.a.value), { cache: false });

      ref.a.value = 99;
      expect(ref.a.value).toBe(99);
    });
  });

  describe('CI-02 / CI-03 proxy protocol coverage', () => {
    it('SNAPSHOT (wrong): JSON.stringify(ref) blows the stack — Phase 2 must flip this', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch();

      expect(() => JSON.stringify(ref)).toThrow(RangeError);
    });

    it('SNAPSHOT (wrong): Object.keys leaks the display target — Phase 2 must flip this', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 1, b: 2 });
      const ref = watch();

      expect(Object.keys(ref)).toEqual(['_navi', '_type', '_value']);
    });

    it('SNAPSHOT (wrong): "in" does not see real keys — Phase 2 must flip this', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch();

      expect('a' in ref).toBe(false);
    });

    it('SNAPSHOT (wrong): display keys are unreadable through the proxy — Phase 2 must flip this', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();

      /**
       * Devtools only ever sees _navi/_type because ownKeys and
       * getOwnPropertyDescriptor are untrapped and fall through to the display
       * target. Any actual [[Get]] returns yet another child proxy, which is
       * the same root cause as the JSON.stringify overflow above.
       */
      const navi = (ref.a.b as unknown as { _navi: unknown })._navi;
      expect(typeof navi).toBe('object');
      expect(Object.keys(ref.a.b)).toEqual(['_navi', '_type', '_value']);
      expect(Object.getOwnPropertyDescriptor(ref.a.b, '_navi')?.value).toBe(
        's:root|s:a|s:b'
      );
    });
  });

  describe('CI-04 copyOnWrite through a missing intermediate path', () => {
    it('SNAPSHOT (wrong): throws a cryptic TypeError — Phase 6 must flip this', () => {
      const watch = createStore<{ a: Record<string, any> }>({ a: {} });
      const ref = watch(s => noop(s.a.value));

      expect(() => {
        // Types cannot express "a path that does not exist yet"; the point is
        // the runtime failure mode.
        (ref.a as any).b.c.value = 1;
      }).toThrow(TypeError);
    });
  });

  describe('CI-05 / CI-18 a throwing subscriber must not stop the others', () => {
    it('FIXED (Phase 1): later subscribers still run and the write does not throw', () => {
      const watch = createStore<{ a: number }>({ a: 0 });
      const ref = watch();
      const reported: unknown[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => reported.push(args[0]);
      let second = 0;

      try {
        watch(s => {
          if (s.a.value === 1) throw new Error('boom');
        });
        watch(s => {
          noop(s.a.value);
          second += 1;
        });

        second = 0;
        ref.a.value = 1;
      } finally {
        console.error = original;
      }

      expect(second).toBe(1);
      expect(ref.a.value).toBe(1);
      expect(reported).toHaveLength(1);
      expect(reported[0]).toBeInstanceOf(AggregateError);
      expect((reported[0] as AggregateError).errors).toHaveLength(1);
      expect((reported[0] as AggregateError).errors[0].message).toBe('boom');
    });

    it('FIXED (Phase 1): several throwing subscribers are aggregated into one report', () => {
      const watch = createStore<{ a: number }>({ a: 0 });
      const ref = watch();
      const reported: unknown[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => reported.push(args[0]);
      let survivor = 0;

      try {
        watch(s => {
          if (s.a.value === 1) throw new Error('first');
        });
        watch(s => {
          if (s.a.value === 1) throw new Error('second');
        });
        watch(s => {
          noop(s.a.value);
          survivor += 1;
        });

        survivor = 0;
        ref.a.value = 1;
      } finally {
        console.error = original;
      }

      expect(survivor).toBe(1);
      expect(reported).toHaveLength(1);
      expect((reported[0] as AggregateError).errors).toHaveLength(2);
    });

    it('FIXED (Phase 1): a throwing accessor on a subscribed path does not abort the scan', () => {
      /**
       * CI-18 was filed as dead code. It is not: the lens walks with optional
       * chaining, so a removed value yields undefined, but a throwing getter in
       * the user's own state does reach this path.
       */
      let armed = false;
      const watch = createStore<{ a: { flaky: number }; other: number }>({
        a: {
          get flaky() {
            if (armed) throw new Error('getter exploded');
            return 1;
          },
        },
        other: 0,
      });
      const ref = watch();
      const reported: unknown[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => reported.push(args[0]);
      let survivor = 0;

      try {
        watch(s => noop(s.a.flaky.value));
        watch(s => {
          noop(s.other.value);
          survivor += 1;
        });

        armed = true;
        survivor = 0;
        ref.other.value = 1;
      } finally {
        console.error = original;
      }

      expect(survivor).toBe(1);
      expect(ref.other.value).toBe(1);
      expect((reported[0] as AggregateError).errors[0].message).toBe(
        'getter exploded'
      );
    });
  });

  describe('CI-06 combineWatch swallows the AbortSignal', () => {
    it('SNAPSHOT (wrong): the subscription survives abort() — Phase 5 must flip this', () => {
      const w1 = createStore<{ n: number }>({ n: 1 });
      const w2 = createStore<number>(2);
      const r1 = w1();
      const controller = new AbortController();
      let fires = 0;

      combineWatch([w1, w2] as const)((store, isFirst) => {
        noop((store as any)[0].n.value);
        if (!isFirst) fires += 1;
        return controller.signal;
      });

      controller.abort();
      fires = 0;
      r1.n.value = 10;

      expect(fires).toBe(1);
    });
  });

  describe('CI-07 createComputed fires on unchanged derived values', () => {
    it('SNAPSHOT (wrong): fires although max() did not change — Phase 5 must flip this', () => {
      const w1 = createStore<{ n: number }>({ n: 1 });
      const w2 = createStore<{ n: number }>({ n: 9 });
      const r1 = w1();
      let fires = 0;

      const computed = createComputed<
        [Watch<{ n: number }>, Watch<{ n: number }>],
        number
      >([w1, w2], ([a, b]) => Math.max(a.n.value, b.n.value));
      const store = computed((_p, isFirst) => {
        if (!isFirst) fires += 1;
      });

      fires = 0;
      r1.n.value = 2;

      expect(store.value).toBe(9);
      expect(fires).toBe(1);
    });
  });

  describe('CI-08 cloneDeep fidelity', () => {
    it('SNAPSHOT (wrong): symbol keys are dropped — Phase 6 must flip this', () => {
      const key = Symbol('k');
      const cloned = cloneDeep({ [key]: 1, plain: 2 });

      expect(cloned[key as unknown as keyof typeof cloned]).toBeUndefined();
      expect(cloned.plain).toBe(2);
    });

    it('SNAPSHOT (wrong): Date / Map / Set / RegExp collapse to plain objects — Phase 6 must flip this', () => {
      const cloned = cloneDeep({
        d: new Date(0),
        m: new Map([[1, 2]]),
        s: new Set([1]),
        r: /x/g,
      });

      expect(cloned.d instanceof Date).toBe(false);
      expect(cloned.m instanceof Map).toBe(false);
      expect(cloned.s instanceof Set).toBe(false);
      expect(cloned.r instanceof RegExp).toBe(false);
    });

    it('SNAPSHOT (wrong): circular references overflow the stack — Phase 6 must flip this', () => {
      const circular: Record<string, unknown> = { n: 1 };
      circular.self = circular;

      expect(() => cloneDeep(circular)).toThrow(RangeError);
    });
  });

  describe('CI-10 array type/runtime mismatch', () => {
    it('SNAPSHOT (wrong): array methods are absent at runtime — Phase 2 must flip this (via types)', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3] });
      const ref = watch();

      expect(typeof (ref.items as any).map).not.toBe('function');
      expect(typeof (ref.items as any).length).toBe('object');
      expect(Array.isArray(ref.items)).toBe(false);
    });

    it('iteration works and stays supported', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3] });
      const ref = watch();

      expect([...ref.items].map(item => item.value)).toEqual([1, 2, 3]);
      expect(ref.items.value.length).toBe(3);
    });
  });

  describe('CI-13 writes are not batched', () => {
    it('SNAPSHOT (wrong): two assignments produce two callbacks — Phase 4 makes this opt-in', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 0, b: 0 });
      let calls = 0;
      const ref = watch(s => {
        calls += 1;
        noop(s.a.value);
        noop(s.b.value);
      });

      calls = 0;
      ref.a.value = 1;
      ref.b.value = 1;

      expect(calls).toBe(2);
    });
  });

  describe('CI-14 dependencies are never re-collected', () => {
    it('SNAPSHOT (wrong): a no-longer-read path still wakes the subscriber — Phase 5 makes this opt-in', () => {
      const watch = createStore<{ flag: boolean; a: number; b: number }>({
        flag: true,
        a: 0,
        b: 0,
      });
      let calls = 0;
      const ref = watch(s => {
        calls += 1;
        if (s.flag.value) noop(s.a.value);
        else noop(s.b.value);
      });

      ref.flag.value = false;
      calls = 0;
      ref.a.value = 123;

      expect(calls).toBe(1);
    });
  });

  describe('CI-15 proxy identity is unstable', () => {
    it('SNAPSHOT (wrong): every access allocates a new proxy — Phase 3 must flip this', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();

      expect(ref.a === ref.a).toBe(false);
      expect(ref.a.b === ref.a.b).toBe(false);
    });
  });

  describe('CI-16 cache:false multiplies subscriptions', () => {
    it('SNAPSHOT: cache:false registers one subscription per call', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      let calls = 0;
      const renew = (s: any) => {
        calls += 1;
        noop(s.a.value);
      };

      for (let i = 0; i < 5; i += 1) watch(renew, { cache: false });
      const ref = watch();
      calls = 0;
      ref.a.value = 2;

      expect(calls).toBe(5);
    });

    it('cache:true (default) de-duplicates by renew identity', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      let calls = 0;
      const renew = (s: any) => {
        calls += 1;
        noop(s.a.value);
      };

      for (let i = 0; i < 5; i += 1) watch(renew);
      const ref = watch();
      calls = 0;
      ref.a.value = 2;

      expect(calls).toBe(1);
    });
  });

  describe('behavior that must NOT change (guard rails)', () => {
    it('copyable shares untouched subtrees with the original', () => {
      const original = { a: { x: 1 }, b: { y: 2 }, c: 3 };
      const next = copyable(original).a.x.writeCopy(10) as typeof original;

      expect(next.a.x).toBe(10);
      expect(next.b).toBe(original.b);
      expect(next.c).toBe(3);
      expect(original.a.x).toBe(1);
    });

    it('manual-sync defers notification until sync()', () => {
      const { watch, updateRef, sync } = createStoreManualSync<{ a: number }>({
        a: 1,
      });
      let calls = 0;
      watch(s => {
        calls += 1;
        noop(s.a.value);
      });

      calls = 0;
      updateRef.a.value = 2;
      expect(calls).toBe(0);

      sync();
      expect(calls).toBe(1);
    });

    it('assigning an identical value notifies nobody', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      let calls = 0;
      const ref = watch(s => {
        calls += 1;
        noop(s.a.value);
      });

      calls = 0;
      ref.a.value = 1;
      expect(calls).toBe(0);
    });

    it('a renew returning false removes the subscription', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      let calls = 0;
      watch(s => {
        calls += 1;
        noop(s.a.value);
        return false;
      });
      const ref = watch();

      ref.a.value = 2;
      ref.a.value = 3;

      expect(calls).toBe(2);
    });
  });
}
