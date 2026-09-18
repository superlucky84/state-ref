import { createStore, createComputed } from '@/index';

const makeDefaultValue1 = () => 1000;
const makeDefaultValue2 = () => 111;

// let newValue!: People;

const defaultValue1 = makeDefaultValue1();
const defaultValue2 = makeDefaultValue2();

/**
 * Auto Test
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Create computed', () => {
    it('The initial value returns the calculated value exactly.', () => {
      const watch1 = createStore<number>(defaultValue1);
      const watch2 = createStore<number>(defaultValue2);

      const computedWatch = createComputed([watch1, watch2], ([ref1, ref2]) => {
        return ref1.value + ref2.value;
      });

      const computedRef = computedWatch();

      expect(computedRef.value).toBe(1111);
    });

    it('When setting, the callback is executed once initially with isFirst included..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const watch1 = createStore<number>(defaultValue1);
      const watch2 = createStore<number>(defaultValue2);
      // const watch2Ref = watch2();

      const computedWatch = createComputed([watch1, watch2], ([ref1, ref2]) => {
        return ref1.value + ref2.value;
      });

      computedWatch((computedRef, isFirst) => {
        console.log('value', computedRef.value, isFirst);
      });

      expect(logSpy).toHaveBeenCalledWith('value', 1111, true);

      logSpy.mockRestore();
    });

    it('When the value changes, the change should be detected and the callback function should be executed.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const watch1 = createStore<number>(defaultValue1);
      const watch2 = createStore<number>(defaultValue2);
      const watch2Ref = watch2();

      const computedWatch = createComputed([watch1, watch2], ([ref1, ref2]) => {
        return ref1.value + ref2.value;
      });

      const computedRef = computedWatch((computedRef, isFirst) => {
        console.log('value', computedRef.value, isFirst);
      });
      watch2Ref.value += 111;

      expect(logSpy).toHaveBeenCalledWith('value', 1222, false);
      expect(computedRef.value).toBe(1222);

      logSpy.mockRestore();
    });
  });

  describe('one computed, many subscribers (CI-27)', () => {
    /**
     * `result` and the proxy reading it used to live in `createComputed`'s own
     * closure, so every subscription shared them. That was harmless while the
     * helper notified unconditionally, and stopped being harmless the moment
     * it started comparing: the first subscription to run wrote `result`, and
     * every later one compared the new value against it, found them equal, and
     * returned without notifying.
     *
     * Each subscription keeps its own, so the comparison is against what *that
     * subscriber* last saw.
     */
    it('notifies every subscriber, not just the first', () => {
      const watch = createStore<{ type: string }>({ type: 'a' });
      const ref = watch();
      const computedWatch = createComputed([watch], ([store]) =>
        'v:'.concat(store.type.value)
      );
      const first: string[] = [];
      const second: string[] = [];

      computedWatch(computed => {
        first.push(computed.value);
      });
      computedWatch(computed => {
        second.push(computed.value);
      });

      ref.type.value = 'b';
      ref.type.value = 'c';

      expect(first).toEqual(['v:a', 'v:b', 'v:c']);
      expect(second).toEqual(['v:a', 'v:b', 'v:c']);
    });

    it('holds when the same computed is shared by many subscribers', () => {
      const watch = createStore<{ n: number }>({ n: 0 });
      const ref = watch();
      const computedWatch = createComputed(
        [watch],
        ([store]) => store.n.value * 2
      );
      const seen = Array.from({ length: 9 }, () => [] as number[]);

      seen.forEach(bucket => {
        computedWatch(computed => {
          bucket.push(computed.value);
        });
      });

      ref.n.value = 5;

      expect(seen.map(bucket => bucket.length)).toEqual(Array(9).fill(2));
      expect(seen.every(bucket => bucket[1] === 10)).toBe(true);
    });

    it('still skips a subscriber whose derived value did not change', () => {
      const watch = createStore<{ a: number; b: number }>({ a: 1, b: 2 });
      const ref = watch();
      const computedWatch = createComputed([watch], ([store]) =>
        Math.max(store.a.value, store.b.value)
      );
      const first: number[] = [];
      const second: number[] = [];

      computedWatch(computed => {
        first.push(computed.value);
      });
      computedWatch(computed => {
        second.push(computed.value);
      });

      /** max stays 2, so nobody hears about it. */
      ref.a.value = 0;

      expect(first).toEqual([2]);
      expect(second).toEqual([2]);

      ref.a.value = 9;

      expect(first).toEqual([2, 9]);
      expect(second).toEqual([2, 9]);
    });

    it('gives each subscriber a proxy of its own', () => {
      const watch = createStore<{ n: number }>({ n: 1 });
      const computedWatch = createComputed([watch], ([store]) => store.n.value);

      expect(computedWatch(() => {})).not.toBe(computedWatch(() => {}));
    });
  });
}
