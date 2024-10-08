import { createStore, StateRefStore } from '@/index';

type DataType = {
  a: { b: { c: number | undefined | null | string }; b1: { c2: number } };
  a1: number;
};

const defaultValue = { a: { b: { c: 7 }, b1: { c2: 8 } }, a1: 9 };
const watch = createStore<DataType>(defaultValue);

const ref = watch();
watch(store => {
  console.log('a', store.a.b1.c2.value);
});
watch(store => {
  console.log('b', store.a.b.c.value);
});
watch(store => {
  console.log('c', store.a1.value);
});

//@ts-ignore
window.p = ref;
ref.a.b1.c2.value = 100;

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

  describe('Tail - When the data you want to subscribe to is a primitive type at the end of an object, it is handled by the Tail.', () => {
    it('Subscriptions are guaranteed to run at least once immediately upon subscription.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);

      watch(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('"copyOnWrite" should change to a well-applied state.', () => {
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = 10;
      expect(newValue.a.b.c).toBe(10);
      expect(defaultValue).not.toBe(newValue);
      expect(defaultValue.a).not.toBe(newValue.a);
      expect(defaultValue.a.b).not.toBe(newValue.a.b);
      expect(defaultValue.a.b1).toBe(newValue.a.b1);
      expect(defaultValue.a1).toBe(newValue.a1);
    });

    it('Subscribing from string data should be executed once immediately after subscribing.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: 4 }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);

      watch(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('Subscribe on undefined data should be executed once immediately after subscribing.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: undefined }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);

      watch(store => console.log(store.value));
      expect(logSpy).toHaveBeenCalledWith(defaultValue);

      logSpy.mockRestore();
    });

    it('The subscribe function should be executed once immediately after subscribing from null data.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultValue = { a: { b: { c: null }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);

      watch(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultValue);

      logSpy.mockRestore();
    });

    it('When null data is changed to non-null data, "copyOnWrite" should update successfully.', () => {
      const defaultValue = { a: { b: { c: null }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = 21;
      expect(newValue.a.b.c).toBe(21);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('When undefined data is changed to non-undefined data, "copyOnWrite" should update successfully.', () => {
      const defaultValue = { a: { b: { c: undefined }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = 21;
      expect(newValue.a.b.c).toBe(21);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('When non-undefined data is changed to undefined data, copyOnWrite should be applied and updated properly.', () => {
      const defaultValue = { a: { b: { c: 7 }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = undefined;
      expect(newValue.a.b.c).toBe(undefined);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('"copyOnWrite" in the subscription function should work even if it is changed consecutively.', () => {
      let defaultValue: DataType = {
        a: { b: { c: 'john' }, b1: { c2: 8 } },
        a1: 9,
      };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = 7;
      expect(newValue.a.b.c).toBe(7);
      assertCopyOnRight(defaultValue, newValue);
      defaultValue = newValue;

      stateRef.a.b.c.value = 8;
      expect(newValue.a.b.c).toBe(8);
      assertCopyOnRight(defaultValue, newValue);
      defaultValue = newValue;

      stateRef.a.b.c.value = 9;
      expect(newValue.a.b.c).toBe(9);
      assertCopyOnRight(defaultValue, newValue);
    });

    it('When the character type data changes, copyOnWrite should work well in the subscription function.', () => {
      const defaultValue = { a: { b: { c: 'john' }, b1: { c2: 8 } }, a1: 9 };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;
      });

      stateRef.a.b.c.value = 'sara';
      expect(newValue.a.b.c).toBe('sara');
      assertCopyOnRight(defaultValue, newValue);
    });

    it('Should be able to unsubscribe via "abortController".', () => {
      const abortController = new AbortController();
      let defaultValue: DataType = {
        a: { b: { c: 'john' }, b1: { c2: 8 } },
        a1: 9,
      };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;

        return abortController.signal;
      });

      stateRef.a.b.c.value = 'sara';
      expect(newValue.a.b.c).toBe('sara');
      assertCopyOnRight(defaultValue, newValue);

      defaultValue = newValue;
      abortController.abort();

      stateRef.a.b.c.value = 'james';
      expect(newValue.a.b.c).toBe('sara');
      assertNotCopyOnRight(defaultValue, newValue);
    });

    it('If the callback function returns false, you will be notified only the first time and your subscription will be cancelled.', () => {
      let defaultValue: DataType = {
        a: { b: { c: 'john' }, b1: { c2: 8 } },
        a1: 9,
      };
      const watch = createStore<DataType>(defaultValue);
      let newValue!: DataType;
      const stateRef = watch((store: StateRefStore<DataType>) => {
        newValue = store.value;

        return false;
      });

      stateRef.a.b.c.value = 'sara';
      expect(newValue.a.b.c).toBe('sara');
      assertCopyOnRight(defaultValue, newValue);
      defaultValue = newValue;

      stateRef.a.b.c.value = 'james';
      expect(newValue.a.b.c).toBe('sara');
      assertNotCopyOnRight(defaultValue, newValue);
    });
  });

  /**
   * Verify that copyonwrite worked for that test group.
   */
  function assertCopyOnRight<T extends DataType>(defaultValue: T, newValue: T) {
    expect(defaultValue).not.toBe(newValue);
    expect(defaultValue.a).not.toBe(newValue.a);
    expect(defaultValue.a.b).not.toBe(newValue.a.b);
    expect(defaultValue.a.b1).toBe(newValue.a.b1);
    expect(defaultValue.a1).toBe(newValue.a1);
  }

  /**
   * Verify that no copyonwrites occurred in that test group.
   */
  function assertNotCopyOnRight<T extends DataType>(
    defaultValue: T,
    newValue: T
  ) {
    expect(defaultValue).toBe(newValue);
    expect(defaultValue.a).toBe(newValue.a);
    expect(defaultValue.a.b).toBe(newValue.a.b);
    expect(defaultValue.a.b1).toBe(newValue.a.b1);
    expect(defaultValue.a1).toBe(newValue.a1);
  }
}
