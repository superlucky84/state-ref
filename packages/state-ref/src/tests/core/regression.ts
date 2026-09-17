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
import { NAVI, TYPE } from '@/helper';

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
    it('FIXED (Phase 2): JSON.stringify returns the value at this path', () => {
      const watch = createStore<{ a: number; b: { c: number } }>({
        a: 1,
        b: { c: 2 },
      });
      const ref = watch();

      expect(JSON.stringify(ref)).toBe('{"a":1,"b":{"c":2}}');
      expect(JSON.stringify(ref.b)).toBe('{"c":2}');
    });

    it('FIXED (Phase 2): Object.keys reflects real state', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 1, b: 2 });
      const ref = watch();

      expect(Object.keys(ref)).toEqual(['a', 'b']);
    });

    it('FIXED (Phase 2): "in" sees real keys', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch();

      expect('a' in ref).toBe(true);
      expect('missing' in ref).toBe(false);
      expect('value' in ref).toBe(true);
    });

    it('FIXED (Phase 2): spreading yields child refs, not display junk', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 1, b: 2 });
      const ref = watch();
      const spread = { ...ref };

      /**
       * Only real state keys are enumerable, so "value" is absent at runtime
       * even though the declared type of the spread still carries it - TS
       * cannot see through an ownKeys trap.
       */
      expect(Object.keys(spread)).toEqual(['a', 'b']);
      expect(spread.a.value).toBe(1);
    });

    it('FIXED (Phase 2): debug handles moved to symbols and read correctly', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();

      expect((ref.a.b as any)[NAVI]).toBe('root.a.b');
      expect((ref.a.b as any)[TYPE]).toBe('number');
      expect((ref.a as any)[TYPE]).toBe('object');
    });

    it('FIXED (Phase 2): state may own keys named _value / _navi / _type', () => {
      /**
       * This is why the debug handles are symbols. Passing the old string keys
       * through the get trap would have shadowed state like this.
       */
      const watch = createStore<{
        _value: string;
        _navi: string;
        _type: string;
      }>({ _value: 'user-owned', _navi: 'mine', _type: 'also mine' });
      const ref = watch();

      expect(ref._value.value).toBe('user-owned');
      expect(ref._navi.value).toBe('mine');
      expect(ref._type.value).toBe('also mine');
      expect(Object.keys(ref)).toEqual(['_value', '_navi', '_type']);
      expect(JSON.stringify(ref)).toContain('user-owned');
    });

    it('deleting through a ref throws with an actionable message', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch();

      expect(() => {
        delete (ref as any).a;
      }).toThrow('Assign a new value to ".value" instead.');
    });

    it('coercing a ref to a primitive names the missing ".value"', () => {
      const watch = createStore<{ a: number }>({ a: 1 });
      const ref = watch();

      expect(() => `${ref.a}`).toThrow(
        'Cannot convert a stateRef to a primitive'
      );
    });

    it('"valueOf" and "toString" stay ordinary state paths', () => {
      const watch = createStore<{ toString: string; valueOf: number }>({
        toString: 'not a method',
        valueOf: 7,
      });
      const ref = watch();

      expect(ref.toString.value).toBe('not a method');
      expect(ref.valueOf.value).toBe(7);
    });
  });

  describe('CI-04 copyOnWrite through a missing intermediate path', () => {
    it('FIXED (Phase 6): names the path and the segment that is not an object', () => {
      const watch = createStore<{ a: Record<string, any> }>({ a: {} });
      const ref = watch(s => noop(s.a.value));

      expect(() => {
        // Types cannot express "a path that does not exist yet"; the point is
        // the runtime failure mode.
        (ref.a as any).b.c.value = 1;
      }).toThrow(
        'Cannot write to "root.a.b.c": "root.a.b" is undefined, not an object. state-ref does not create missing intermediate paths.'
      );
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
       *
       * The write has to land on an ancestor of the throwing path, otherwise
       * Phase 3's narrowing never reads it - see the CI-12 block below.
       */
      let armed = false;
      const makeBranch = (tick: number) => ({
        get flaky(): number {
          if (armed) throw new Error('getter exploded');
          return 1;
        },
        tick,
      });
      const watch = createStore<{ a: { flaky: number; tick: number } }>({
        a: makeBranch(0),
      });
      const ref = watch();
      const reported: unknown[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => reported.push(args[0]);
      let survivor = 0;

      try {
        watch(s => noop(s.a.flaky.value));
        watch(s => {
          noop(s.a.tick.value);
          survivor += 1;
        });

        armed = true;
        survivor = 0;
        ref.a.value = makeBranch(1);
      } finally {
        console.error = original;
      }

      expect(survivor).toBe(1);
      expect(ref.a.tick.value).toBe(1);
      expect((reported[0] as AggregateError).errors[0].message).toBe(
        'getter exploded'
      );
    });
  });

  describe('CI-12 writes only wake the subscriptions they can have touched', () => {
    it('FIXED (Phase 3): an unrelated path is not even read', () => {
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

      watch(s => noop(s.a.probe.value));
      reads = 0;
      ref.other.value = 1;

      expect(reads).toBe(0);
    });

    it('an ancestor write wakes a descendant subscription', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();
      let seen = 0;

      watch(s => {
        seen = s.a.b.value;
      });
      ref.a.value = { b: 9 };

      expect(seen).toBe(9);
    });

    it('a descendant write wakes an ancestor subscription', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();
      let calls = 0;

      watch(s => {
        noop(s.a.value);
        calls += 1;
      });

      calls = 0;
      ref.a.b.value = 9;

      expect(calls).toBe(1);
    });

    it('a sibling write wakes nobody', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 1, b: 1 });
      const ref = watch();
      let calls = 0;

      watch(s => {
        noop(s.a.value);
        calls += 1;
      });

      calls = 0;
      ref.b.value = 9;

      expect(calls).toBe(0);
    });

    it('array index and iteration share one subscription node', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2] });
      const ref = watch();
      let calls = 0;

      watch(s => {
        noop(s.items[0].value);
        for (const item of s.items) noop(item.value);
        calls += 1;
      });

      calls = 0;
      ref.items[0].value = 9;

      expect(calls).toBe(1);
    });

    it('manual sync() still examines everything', () => {
      const { watch, updateRef, sync } = createStoreManualSync<{
        a: number;
        b: number;
      }>({ a: 1, b: 1 });
      let calls = 0;

      watch(s => {
        noop(s.a.value);
        noop(s.b.value);
        calls += 1;
      });

      calls = 0;
      updateRef.a.value = 2;
      updateRef.b.value = 2;
      sync();

      expect(calls).toBe(1);
    });
  });

  describe('CI-06 combineWatch swallows the AbortSignal', () => {
    it('FIXED (Phase 5): abort() on the returned signal stops the callback', () => {
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

      expect(fires).toBe(0);
    });
  });

  describe('CI-07 createComputed fires on unchanged derived values', () => {
    it('FIXED (Phase 5): does not fire when max() did not change', () => {
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
      expect(fires).toBe(0);
    });
  });

  describe('CI-08 cloneDeep fidelity', () => {
    it('FIXED (Phase 6): symbol keys are carried across', () => {
      const key = Symbol('k');
      const cloned = cloneDeep({ [key]: 1, plain: 2 });

      expect(cloned[key as unknown as keyof typeof cloned]).toBe(1);
      expect(cloned.plain).toBe(2);
    });

    it('FIXED (Phase 6): Date / Map / Set / RegExp keep their type', () => {
      const cloned = cloneDeep({
        d: new Date(0),
        m: new Map([[1, 2]]),
        s: new Set([1]),
        r: /x/g,
      });

      expect(cloned.d instanceof Date).toBe(true);
      expect(cloned.m instanceof Map).toBe(true);
      expect(cloned.s instanceof Set).toBe(true);
      expect(cloned.r instanceof RegExp).toBe(true);
    });

    it('FIXED (Phase 6): a circular reference clones instead of overflowing', () => {
      const circular: Record<string, unknown> = { n: 1 };
      circular.self = circular;

      const cloned = cloneDeep(circular);

      expect(cloned.n).toBe(1);
      expect(cloned.self).toBe(cloned);
      expect(cloned).not.toBe(circular);
    });
  });

  describe('CI-10 array type/runtime mismatch', () => {
    it('FIXED (Phase 2): the type now matches what the runtime provides', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3] });
      const ref = watch();

      // `ref.items.map(...)` is a compile error now; these are the real paths.
      expect(ref.items[0].value).toBe(1);
      expect(ref.items.length.value).toBe(3);
      expect(ref.items.value.length).toBe(3);
      expect([...ref.items].map(item => item.value)).toEqual([1, 2, 3]);
      expect(Object.keys(ref.items)).toEqual(['0', '1', '2']);
      expect(JSON.stringify(ref.items)).toBe('[1,2,3]');
    });

    it('FIXED (Phase 2): "length" is a reactive path', () => {
      const watch = createStore<{ items: number[] }>({ items: [1, 2, 3] });
      const ref = watch();
      let seen = 0;

      watch(store => {
        seen = store.items.length.value;
      });

      ref.items.value = [1, 2, 3, 4];
      expect(seen).toBe(4);
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
    it('FIXED (Phase 3): child refs are memoised, so identity is stable', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();

      expect(ref.a === ref.a).toBe(true);
      expect(ref.a.b === ref.a.b).toBe(true);
    });

    it('a memoised ref still reads the current value after a write', () => {
      const watch = createStore<{ a: { b: number } }>({ a: { b: 1 } });
      const ref = watch();
      const held = ref.a.b;

      ref.a.b.value = 42;

      expect(held.value).toBe(42);
    });

    it('CI-09: symbol paths no longer need a global id registry', () => {
      const key = Symbol('dynamic');
      const watch = createStore<Record<symbol, number>>({ [key]: 1 });
      const ref = watch();
      let seen = 0;

      watch(s => {
        seen = (s as any)[key].value;
      });

      (ref as any)[key].value = 7;
      expect(seen).toBe(7);
      expect((ref as any)[key][NAVI]).toBe('root.Symbol(dynamic)');
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
