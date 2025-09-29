import { createStore, combineWatch } from '@/index';

// let newValue!: People;

const defaultValue1 = 1000;
const defaultValue2 = { jj: 2000 };

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
        callback(ref1.value + ref2.value.jj, isFirst);
      });

      // 초기 호출 확인
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(3000, true); // 1000 + 2000

      watch1().value = 1500;
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(3500, false); // 1500 + 2000

      watch2().value.jj = 2500;
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenLastCalledWith(4000, false); // 1500 + 2500
    });
  });
}
