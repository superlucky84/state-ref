import { lenshelf, ShelfStore } from '@/index';

type DataType = {
  a: { b: { c: number | undefined | null | string }; b1: { c2: number } };
  a1: number;
};

const defaultValue = { a: { b: { c: null }, b1: { c2: 8 } }, a1: 9 };

const take = lenshelf<DataType>(defaultValue);
let newValue!: DataType;
const shelf = take((store: ShelfStore<DataType>) => {
  newValue = store.value;
});

shelf.a.b.c.value = 21;

console.log('DEFAULTVALUE', defaultValue);
console.log('NEWVALUE', newValue);
console.log(defaultValue.a.b1 === newValue.a.b1);

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

  describe('Shelf Tail - 구독하려는 데이터가 객체 끝에 달린 primitive 타입 단독일때.', () => {
    it('구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);

      take(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('데이터가 변경되면 copyOnWrite가 잘 이루어진 데이터로 갱신되어야 한다.', () => {
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = 10;
      expect(newValue.a.b.c).toBe(10);
      expect(defaultValue).not.toBe(newValue);
      expect(defaultValue.a).not.toBe(newValue.a);
      expect(defaultValue.a.b).not.toBe(newValue.a.b);
      expect(defaultValue.a.b1).toBe(newValue.a.b1);
      expect(defaultValue.a1).toBe(newValue.a1);
    });

    it('문자열 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);

      take(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('undefined 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: undefined }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);

      take(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('null 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: null }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);

      take(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultValue);

      logSpy.mockRestore();
    });

    it('null 데이터가 널이 아닌 데이터로 변경되면 copyOnWrite가 잘 이루어진 데이터로 갱신되어야 한다', () => {
      const defaultValue = { a: { b: { c: null }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = 21;
      expect(newValue.a.b.c).toBe(21);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('undefined 데이터가 undefined 아닌 데이터로 copyOnWrite가 잘 이루어진 데이터로 갱신되어야 한다', () => {
      const defaultValue = { a: { b: { c: undefined }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = 21;
      expect(newValue.a.b.c).toBe(21);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('undefined 아닌 데이터가 undefined 데이터로 변경되면 copyOnWrite가 잘 이루어진 데이터로 갱신되어야 한다.', () => {
      const defaultValue = { a: { b: { c: 7 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = undefined;
      expect(newValue.a.b.c).toBe(undefined);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('연속으로 변경되어도 구독함수 함수에서 copyOnWrite가 잘 이루어진 데이터로 확인되어야 한다.', () => {
      const defaultValue = { a: { b: { c: 7 }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = 7;
      expect(newValue.a.b.c).toBe(7);
      assertCopyOnRight(defaultValue, newValue);

      shelf.a.b.c.value = 8;
      expect(newValue.a.b.c).toBe(8);
      assertCopyOnRight(defaultValue, newValue);

      shelf.a.b.c.value = 9;
      expect(newValue.a.b.c).toBe(9);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('문자형 데이터가 변경되면 구독함수에서 copyOnWrite가 잘 이루어진 데이터로 확인되어야 한다.', () => {
      const defaultValue = { a: { b: { c: 'john' }, b1: { c2: 8 } }, a1: 9 };
      const take = lenshelf<DataType>(defaultValue);
      let newValue!: DataType;
      const shelf = take((store: ShelfStore<DataType>) => {
        newValue = store.value;
      });

      shelf.a.b.c.value = 'sara';
      expect(newValue.a.b.c).toBe('sara');
      assertCopyOnRight(defaultValue, newValue);
    });

    it.skip('abortController 를 통해 구독을 취소할수 있어야 한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const take = lenshelf<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const abortController = new AbortController();
      const shelf = take(store => {
        console.log('number', store.value);

        return abortController.signal;
      });

      shelf.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      abortController.abort();
      shelf.value = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it.skip('콜백함수가 리턴 false 를 하면 단 한번의 변경만 알림을 받고 구독 취소 되어야 한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const take = lenshelf<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const shelf = take(store => {
        console.log('number', store.value);

        return false;
      });

      shelf.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      shelf.value = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });

  function assertCopyOnRight<T extends DataType>(defaultValue: T, newValue: T) {
    expect(defaultValue).not.toBe(newValue);
    expect(defaultValue.a).not.toBe(newValue.a);
    expect(defaultValue.a.b).not.toBe(newValue.a.b);
    expect(defaultValue.a.b1).toBe(newValue.a.b1);
    expect(defaultValue.a1).toBe(newValue.a1);
  }
}
