import { lenshelf, ShelfStore } from '@/index';
type Info = {
  age: number;
  house: {
    color: string;
    size: string;
    floor: number;
  }[];
};

type People = { john: Info; brown: Info; sara: Info };

const defaultValue = {
  john: {
    age: 20,
    house: [
      { color: 'red', size: 'big', floor: 5 },
      { color: 'red', size: 'big', floor: 5 },
    ],
  },
  brown: { age: 26, house: [{ color: 'red', size: 'big', floor: 5 }] },
  sara: { age: 26, house: [{ color: 'red', size: 'big', floor: 5 }] },
};

const take = lenshelf<People>(defaultValue);
// let newValue!: DataType;
const shelf = take((store: ShelfStore<People>) => {
  console.log(store);
});

shelf.john.house[0].color.value = 'blue';

/**
 * 브라우저로 수동 테스트
 */
if (!import.meta.vitest) {
  const shelf = take();

  // @ts-ignore
  window.p = shelf;
}

/**
 * vitest 자동 테스트
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Proxy - 구독하려는 데이터가 객체일때는 프록시에서 처리.', () => {
    /*
    it('구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);

      take(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });
    */
  });
}
