import { createStoreLayered } from '@/index';
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

  describe("Proxy - When the data you want to subscribe to is an object., it's handled by the proxy", () => {
    it('Should receive subscription notifications for the value retrieved as the ".value" of the stateRef passed in from the subscription function.', () => {
      console.log('a');
    });
  });
}

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
  const defaultValue = makeDefaultValue();
  const { watch, updateRef, flush } = createStoreLayered<People>(defaultValue);

  const stateRef = watch(stateRef => {
    console.log(stateRef.brown.house[0].color.value);
  });

  const action = {
    changeJohnAge(newAge: number) {
      updateRef.john.age.value = newAge;
      flush();
    },
    changeJohnFirstHouseInfo(firstHouseInfo = { color: 'blue', floor: 7 }) {
      updateRef.john.house[0].value = firstHouseInfo;
      flush();
    },
    changeBrownFirstHouseInfo(firstHouseInfo = { color: 'blue', floor: 7 }) {
      updateRef.brown.house[0].value = firstHouseInfo;
      flush();
    },
    async changeBrownSecondHouseInfo(
      firstHouseInfo = { color: 'blue', floor: 7 }
    ) {
      const vv = await fetch('https://ss.www.com');
      updateRef.brown.house[1].value = firstHouseInfo;
      flush();
    },
  };
  console.log(action);

  // @ts-ignore
  window.p = stateRef;
}
