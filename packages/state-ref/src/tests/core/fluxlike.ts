import { createStoreManualSync } from '@/index';
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

/**
 * Auto Test
 */
if (import.meta.vitest) {
  // const { describe, it, expect, vi } = import.meta.vitest;
  const { describe, it } = import.meta.vitest;

  describe("FluxLike - 'createStoreManualSync' makes it easier to apply similar flux patterns.", () => {
    it('The reference created with "watch" should throw an error when modified..', () => {
      const defaultValue = makeDefaultValue();
      const { watch } = createStoreManualSync<People>(defaultValue);

      const stateRef = watch(stateRef => {
        console.log(stateRef.john.age.value);
      });

      expect(() => {
        stateRef.john.age.value = 40;
      }).toThrow(
        'With the current settings, direct modification is not allowed.'
      );
    });

    it("It should be possible to modify the reference with 'updateRef'", () => {
      const defaultValue = makeDefaultValue();
      const { watch, updateRef } = createStoreManualSync<People>(defaultValue);

      watch(stateRef => {
        console.log(stateRef.john.age.value);
      });

      updateRef.john.age.value = 41;

      expect(updateRef.john.age.value).toBe(41);
    });

    it("Even when modified with 'updateRef', the dependent subscription function should not be triggered immediately.", () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = makeDefaultValue();
      const { watch, updateRef } = createStoreManualSync<People>(defaultValue);

      watch(stateRef => {
        console.log(stateRef.john.age.value);
      });

      updateRef.john.age.value = 41;

      expect(logSpy).toHaveBeenCalledTimes(1);
      logSpy.mockRestore();
    });

    it('updateRef로 수정 후 sync함수를 사용하면 구독함수가 실행되어야 한다.', () => {
      const mockFn1 = vi.fn();
      const defaultValue = makeDefaultValue();
      const { watch, updateRef, sync } =
        createStoreManualSync<People>(defaultValue);

      watch(stateRef => {
        mockFn1();
        console.log(stateRef.john.age.value);
      });

      updateRef.john.age.value = 42;
      sync();

      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it("After modifying with 'updateRef', the subscription function should be triggered when the sync function is used.", () => {
      const mockFn1 = vi.fn();
      const defaultValue = makeDefaultValue();
      const { watch, updateRef, sync } =
        createStoreManualSync<People>(defaultValue);

      watch(stateRef => {
        mockFn1();
        console.log(stateRef.john.age.value);
        console.log(stateRef.john.house[0].color.value);
        console.log(stateRef.john.house[1].color.value);
      });

      updateRef.john.age.value = 43;
      updateRef.john.house[0].color.value = 'blue';
      updateRef.john.house[1].color.value = 'green';
      sync();

      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('Even when the sync function is used, the subscription function should not be triggered if it does not actually reference the value.', () => {
      const mockFn1 = vi.fn();
      const defaultValue = makeDefaultValue();
      const { watch, updateRef, sync } =
        createStoreManualSync<People>(defaultValue);

      watch(stateRef => {
        mockFn1();
        console.log(stateRef.john.age.value);
        console.log(stateRef.john.house[0].color.value);
        console.log(stateRef.john.house[1].color.value);
      });

      updateRef.brown.age.value = 44;
      sync();

      expect(mockFn1).toHaveBeenCalledTimes(1);
    });
  });
}

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
  const defaultValue = makeDefaultValue();
  const { watch, updateRef, sync } =
    createStoreManualSync<People>(defaultValue);

  const stateRef = watch(stateRef => {
    console.log(stateRef.brown.house[0].color.value);
  });

  const changeJohnAge = (newAge: number) => {
    updateRef.john.age.value = newAge;
    sync();
  };

  const changeJohnFirstHouseInfo = (
    firstHouseInfo = { color: 'blue', floor: 7 }
  ) => {
    updateRef.john.house[0].value = firstHouseInfo;
    sync();
  };

  const changeBrownFirstHouseInfo = (
    firstHouseInfo = { color: 'blue', floor: 7 }
  ) => {
    updateRef.brown.house[0].value = firstHouseInfo;
    sync();
  };

  const changeBrownSecondHouseInfo = async (
    firstHouseInfo = { color: 'blue', floor: 7 }
  ) => {
    updateRef.brown.house[1].value = firstHouseInfo;
    sync();
  };

  // @ts-ignore
  window.actions = {
    changeJohnAge,
    changeJohnFirstHouseInfo,
    changeBrownFirstHouseInfo,
    changeBrownSecondHouseInfo,
  };

  // @ts-ignore
  window.p = stateRef;
}
