import { lenshelf, ShelfStore } from '@/index';
type Info = {
  age: number;
  house: {
    color: string;
    floor: number;
  }[];
};

type People = { john: Info; brown: Info; sara: Info };

const makeDefaultValue = () => ({
  john: {
    age: 20,
    house: [
      { color: 'red', floor: 5 },
      { color: 'red', floor: 5 },
    ],
  },
  brown: { age: 26, house: [{ color: 'red', floor: 5 }] },
  sara: { age: 26, house: [{ color: 'red', floor: 5 }] },
});

const take = lenshelf<People>(makeDefaultValue());
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
    it('구독함수로 부터 전달받은 shelf 에서 value로 꺼낸 값에 대해서 구독 알림을 받아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const take = lenshelf<People>(defaultValue);

      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const mockFn3 = vi.fn();

      const shelf = take();
      take(shelf => {
        console.log(shelf.john.house[0].color.value);
        mockFn1();
      });
      take(shelf => {
        console.log(shelf.brown.house[0].color.value);
        mockFn2();
      });
      take(shelf => {
        console.log(shelf.sara.house[0].color.value);
        mockFn3();
      });

      shelf.john.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      shelf.brown.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      shelf.john.house[0].color.value = 'green';
      expect(mockFn1).toHaveBeenCalledTimes(3);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('take로 부터 반환된 shelf 에서 value로 꺼낸 값에 대해서 구독 알림을 받아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const take = lenshelf<People>(defaultValue);

      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const mockFn3 = vi.fn();

      take(() => {
        mockFn1();
      });
      const shelf = take(() => {
        mockFn2();
      });
      take(() => {
        mockFn3();
      });

      console.log(shelf.brown.house[0].color.value);
      shelf.brown.house[0].color.value = 'blue';

      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('구독하자마자 처음 한번은 구독함수가 실행되어야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const take = lenshelf<People>(defaultValue);

      const mockFn1 = vi.fn();

      take(() => {
        mockFn1();
      });

      expect(mockFn1).toHaveBeenCalledTimes(1);
    });
  });
}
