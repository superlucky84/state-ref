import { createStore } from '@/index';

/**
 * Auto Test
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Symbol - Handles Symbol keys correctly', () => {
    it('Should react when a Symbol key in the middle of the path changes', () => {
      type TestData = {
        group: {
          [key: symbol]: {
            name: string;
          };
        };
      };

      const symA = Symbol('a');
      const defaultValue: TestData = {
        group: {
          [symA]: { name: 'initial' },
        },
      };

      const watch = createStore<TestData>(defaultValue);
      const mockFn = vi.fn();

      const stateRef = watch(state => {
        console.log(state.group[symA].name.value);
        mockFn();
      });

      // Change the Symbol key value
      stateRef.group[symA].name.value = 'updated';

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(stateRef.group[symA].name.value).toBe('updated');
    });

    it('Should react when a Symbol key at the last node changes', () => {
      type TestData = {
        group: {
          settings: {
            [key: symbol]: { color: string };
          };
        };
      };

      const symB = Symbol('b');
      const defaultValue: TestData = {
        group: {
          settings: {
            [symB]: { color: 'red' },
          },
        },
      };

      const watch = createStore<TestData>(defaultValue);
      const mockFn = vi.fn();

      const stateRef = watch(state => {
        console.log(state.group.settings[symB].color.value);
        mockFn();
      });

      // Change the Symbol key value
      stateRef.group.settings[symB].color.value = 'blue';

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(stateRef.group.settings[symB].color.value).toBe('blue');
    });

    it('Should distinguish multiple different Symbols in the middle of the path', () => {
      type TestData = {
        group: {
          [key: symbol]: {
            [key: symbol]: string;
          };
        };
      };

      const symA = Symbol('A');
      const symB = Symbol('B');
      const symC = Symbol('C');

      const defaultValue: TestData = {
        group: {
          [symA]: {
            [symB]: 'first',
            [symC]: 'second',
          },
        },
      };

      const watch = createStore<TestData>(defaultValue);

      const mockFnB = vi.fn();
      const mockFnC = vi.fn();

      const stateRef = watch(state => {
        console.log(state.group[symA][symB].value);
        mockFnB();
      });

      watch(state => {
        console.log(state.group[symA][symC].value);
        mockFnC();
      });

      // Change symB path value
      stateRef.group[symA][symB].value = 'updatedB';

      expect(mockFnB).toHaveBeenCalledTimes(2);
      expect(mockFnC).toHaveBeenCalledTimes(1);
      expect(stateRef.group[symA][symB].value).toBe('updatedB');

      // Change symC path value
      stateRef.group[symA][symC].value = 'updatedC';

      expect(mockFnB).toHaveBeenCalledTimes(2);
      expect(mockFnC).toHaveBeenCalledTimes(2);
      expect(stateRef.group[symA][symC].value).toBe('updatedC');
    });
  });
}
