import { createStore } from '@/index';
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

// let newValue!: People;

const defaultValue = makeDefaultValue();
const watch = createStore<People>(defaultValue);
watch(stateRef => {
  console.log(stateRef.brown.house[0].color.value);
});

/**
 * 브라우저로 수동 테스트
 */
if (!import.meta.vitest) {
  const stateRef = watch();

  // @ts-ignore
  window.p = stateRef;
}

/**
 * vitest 자동 테스트
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Proxy - 구독하려는 데이터가 객체일때는 프록시에서 처리.', () => {
    it('구독함수로 부터 전달받은 stateRef 에서 value로 꺼낸 값에 대해서 구독 알림을 받아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);

      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const mockFn3 = vi.fn();

      const stateRef = watch();
      watch(stateRef => {
        console.log(stateRef.john.house[0].color.value);
        mockFn1();
      });
      watch(stateRef => {
        console.log(stateRef.brown.house[0].color.value);
        mockFn2();
      });
      watch(stateRef => {
        console.log(stateRef.sara.house[0].color.value);
        mockFn3();
      });

      stateRef.john.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      stateRef.brown.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      stateRef.john.house[0].color.value = 'green';
      expect(mockFn1).toHaveBeenCalledTimes(3);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('watch로 부터 반환된 stateRef 에서 value로 꺼낸 값에 대해서 구독 알림을 받아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);

      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const mockFn3 = vi.fn();

      watch(() => {
        mockFn1();
      });
      const stateRef = watch(() => {
        mockFn2();
      });
      watch(() => {
        mockFn3();
      });

      console.log(stateRef.brown.house[0].color.value);
      stateRef.brown.house[0].color.value = 'blue';

      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('abortController 를 통해 지정된 구독 함수만 취소할수 있어야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const abortController = new AbortController();

      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const mockFn3 = vi.fn();

      const stateRef = watch();
      watch(stateRef => {
        console.log(stateRef.john.house[0].color.value);
        mockFn1();

        return abortController.signal;
      });
      watch(stateRef => {
        console.log(stateRef.brown.house[0].color.value);
        mockFn2();
      });
      watch(stateRef => {
        console.log(stateRef.sara.house[0].color.value);
        mockFn3();
      });

      stateRef.john.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      abortController.abort();

      stateRef.john.house[0].color.value = 'green';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      stateRef.brown.house[0].color.value = 'yellow';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(1);

      stateRef.sara.house[0].color.value = 'yellow';
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);
      expect(mockFn3).toHaveBeenCalledTimes(2);
    });

    it('구독하자마자 처음 한번은 구독함수가 실행되어야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      watch(() => {
        mockFn1();
      });

      expect(mockFn1).toHaveBeenCalledTimes(1);
    });

    it('구독하자마자 처음 한번은 두번째 인자로 true 값을 받아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);

      const mockFn1 = vi.fn();

      const stateRef = watch((stateRef, isFirst) => {
        console.log(stateRef.brown.house[0].color.value);
        mockFn1(isFirst);
      });

      expect(mockFn1).toHaveBeenCalledWith(true);
      stateRef.brown.house[0].color.value = 'blue';
      expect(mockFn1).toHaveBeenCalledWith(false);
    });

    it('변경한 값에 대해서 copyOnWrite가 정확히 적용되어야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);

      let newValue!: People;
      const stateRef = watch(stateRef => {
        newValue = stateRef.value;
        console.log(stateRef.brown.house[0].color.value);
      });

      stateRef.john.house[0].color.value = 'blue';
      expect(defaultValue.john.age).toBe(newValue.john.age);
      expect(defaultValue.john.house).not.toBe(newValue.john.house);
      expect(defaultValue.john.house[0]).not.toBe(newValue.john.house[0]);
      expect(defaultValue.john.house[0].color).not.toBe(
        newValue.john.house[0].color
      );
      expect(defaultValue.john.house[0].floor).toBe(
        newValue.john.house[0].floor
      );
      expect(defaultValue.john.house[1]).toBe(newValue.john.house[1]);
      expect(defaultValue.brown).toBe(newValue.brown);
    });

    it('특정 값의 부모에 해당하는 뿌리를 구독하고 있다면, 특정 값의 데이터가 변경되었을때 반응해야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      const stateRef = watch(({ john: { value: johnValue } }) => {
        mockFn1(johnValue);
      });

      stateRef.john.house[1].floor.value = 7;
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('어떤 부모에 자식노드에 해당하는 특정값을 구독하고 있다면, 부모노드가 변경되었을때 반응해야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      const stateRef = watch(
        ({
          john: {
            house: [
              ,
              {
                floor: { value: floorData },
              },
            ],
          },
        }) => {
          mockFn1(floorData);
        }
      );

      stateRef.john.value = {
        age: 40,
        house: [
          { color: 'red', floor: 5 },
          { color: 'red', floor: 7 },
        ],
      };
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('어떤 부모에 자식노드에 해당하는 특정값을 구독하고 있고 부모노드가 변경되었어도 값의 참조가 변하지 않았다면 구독함수는 반응하지 말아야 한다.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      const stateRef = watch(
        ({
          john: {
            house: [
              ,
              {
                floor: { value: floorData },
              },
            ],
          },
        }) => {
          mockFn1(floorData);
        }
      );

      stateRef.john.value = {
        age: 40,
        house: [
          { color: 'red', floor: 2 },
          { color: 'red', floor: 5 },
        ],
      };
      expect(mockFn1).toHaveBeenCalledTimes(1);
    });
  });
}