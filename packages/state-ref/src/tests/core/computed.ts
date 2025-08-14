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

    it('When the value changes, the change should be detected and the callback function should be executed.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const watch1 = createStore<number>(defaultValue1);
      const watch2 = createStore<number>(defaultValue2);
      const watch2Ref = watch2();

      const computedWatch = createComputed([watch1, watch2], ([ref1, ref2]) => {
        return ref1.value + ref2.value;
      });

      const computedRef = computedWatch(computedRef => {
        console.log('value', computedRef.value);
      });
      watch2Ref.value += 111;

      expect(logSpy).toHaveBeenCalledWith('value', 1222);

      logSpy.mockRestore();
    });
  });
}

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
}
