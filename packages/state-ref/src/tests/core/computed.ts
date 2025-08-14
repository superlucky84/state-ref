import { createStore, createComputed } from '@/index';

const makeDefaultValue1 = () => 1000;
const makeDefaultValue2 = () => 111;

// let newValue!: People;

const defaultValue1 = makeDefaultValue1();
const defaultValue2 = makeDefaultValue2();

const watch1 = createStore<number>(defaultValue1);
const watch2 = createStore<number>(defaultValue2);


/**
 * Auto Test
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("Create computed", () => {
    it('The initial value returns the calculated value exactly.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const computedWatch = createComputed([watch1, watch2], ([ref1, ref2]) => {
				return ref1.value + ref2.value;
			});

			const computedRef = computedWatch();

      expect(computedRef.value).toBe(1111);

      logSpy.mockRestore();
    });
  });
}

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
}
