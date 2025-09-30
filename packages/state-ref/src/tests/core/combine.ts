import { createStore, combineWatch } from '@/index';

// let newValue!: People;

const defaultValue1 = 1000;
const defaultValue2 = { jj: 2000 };

/*
const storeA = createStore<number>(100);
const storeB = createStore<string>('hello');
const storeC = createStore<boolean>(false);

const combinedAB = combineWatch([storeA, storeB] as const);
const combinedABC = combineWatch([combinedAB, storeC] as const);
*/

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Create combineWatch', () => {
    it('should immediately call callback when any watch value changes', () => {
      const watch1 = createStore<number>(defaultValue1);
      const watch2 = createStore<{ jj: number }>(defaultValue2);

      // mock callback
      const callback = vi.fn();

      const combinedWatch = combineWatch([watch1, watch2] as const);

      // subscribe
      combinedWatch(([ref1, ref2], isFirst) => {
        callback(ref1.value + ref2.jj.value, isFirst);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(3000, true); // 1000 + 2000

      watch1().value = 1500;
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(3500, false); // 1500 + 2000

      watch2().jj.value = 2500;
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenLastCalledWith(4000, false); // 1500 + 2500
    });

    it('should correctly handle nested combineWatch compositions', () => {
      const storeA = createStore<number>(100);
      const storeB = createStore<string>('hello');
      const storeC = createStore<boolean>(false);

      const combinedAB = combineWatch([storeA, storeB] as const);

      const combinedABC = combineWatch([combinedAB, storeC] as const);

      const nestedCallback = vi.fn();

      combinedABC(([abRef, cRef], isFirst) => {
        const [aRef, bRef] = abRef;

        const output = `${aRef.value} ${bRef.value} ${cRef.value}`;
        nestedCallback(output, isFirst);
      });

      expect(nestedCallback).toHaveBeenCalledTimes(1);
      expect(nestedCallback).toHaveBeenCalledWith('100 hello false', true);

      storeA().value = 200;
      expect(nestedCallback).toHaveBeenCalledTimes(2);
      expect(nestedCallback).toHaveBeenLastCalledWith('200 hello false', false);

      storeC().value = true;
      expect(nestedCallback).toHaveBeenCalledTimes(3);
      expect(nestedCallback).toHaveBeenLastCalledWith('200 hello true', false);

      storeB().value = 'world';
      expect(nestedCallback).toHaveBeenCalledTimes(4);
      expect(nestedCallback).toHaveBeenLastCalledWith('200 world true', false);
    });
  });
}
