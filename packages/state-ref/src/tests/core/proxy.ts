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
 * Auto Test
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("Proxy - When the data you want to subscribe to is an object., it's handled by the proxy", () => {
    it('Should receive subscription notifications for the value retrieved as the ".value" of the stateRef passed in from the subscription function.', () => {
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

    it('Should receive a subscription notification for the value retrieved as the ".value" of the stateRef returned from watch.', () => {
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

    it('The specified subscription function must be cancelable via the "abortController".', () => {
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

    it('The subscription function must be run once immediately after subscription.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      watch(() => {
        mockFn1();
      });

      expect(mockFn1).toHaveBeenCalledTimes(1);
    });

    it('As soon as you subscribe, you must receive the value true as the second argument the first time.', () => {
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

    it('"copyOnWrite" must be applied accurately to the changed value.', () => {
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

    it('When you subscribe to a node that is the parent of a specific value, you need to react when the data for that specific value changes.', () => {
      const defaultValue = makeDefaultValue();
      const watch = createStore<People>(defaultValue);
      const mockFn1 = vi.fn();

      const stateRef = watch(({ john: { value: johnValue } }) => {
        mockFn1(johnValue);
      });

      stateRef.john.house[1].floor.value = 7;
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('If you subscribe to a specific value for a child of a certain parent node, you need to react when the parent node changes.', () => {
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

    it('If you are subscribing to a specific value that corresponds to a child node of a parent node, and the parent node has changed, but the reference to the value has not changed, the subscription function should not react.', () => {
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

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
  const stateRef = watch(stateRef => {
    const [firstHouse] = stateRef.john.house;
    const age = stateRef.john.age.value;
    console.log(firstHouse.value, age);
  });
  const hohnHouse = stateRef.john.house;

  hohnHouse[0].color.value = 'yellow';

  // @ts-ignore
  window.p = stateRef;
}
