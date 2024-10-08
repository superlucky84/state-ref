import { createStore } from '@/index';

const watch = createStore<number>(3);

watch(store => {
  console.log('numberChange', store.value);
});

/**
 * Auto Test
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Root - When the root of the data you want to subscribe to is of type primitive', () => {
    it('On numeric data, the Subscribe function should be executed once immediately after subscribing.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNumber = 3;
      const watch = createStore<number>(defaultNumber);

      watch(store => console.log('number', store.value));
      expect(logSpy).toHaveBeenCalledWith('number', defaultNumber);

      logSpy.mockRestore();
    });

    it('The subscribe function should be executed once immediately after subscribing to the string data.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultString = 'john';
      const watch = createStore<string>(defaultString);

      watch(store => console.log('string', store.value));
      expect(logSpy).toHaveBeenCalledWith('string', defaultString);

      logSpy.mockRestore();
    });

    it('Subscribe on undefined data should be executed once immediately after subscribing..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultUndefined = undefined;
      const watch = createStore<undefined>(defaultUndefined);

      watch(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultUndefined);

      logSpy.mockRestore();
    });

    it('The subscribe function should be executed once immediately after subscribing from null data.', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNull = null;
      const watch = createStore<null>(defaultNull);

      watch(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultNull);

      logSpy.mockRestore();
    });

    it('When numeric data changes, the subscription function should detect the change well.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const watch = createStore<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('number', store.value));

      stateRef.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);

      logSpy.mockRestore();
    });

    it('When null data is changed to non-null data, the subscription function should detect the change well.', () => {
      const defaultValue = null;
      const changeValue = 4;
      const watch = createStore<number | null>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('When undefined data is changed to non-undefined data, the subscription function should detect the change well.', () => {
      const defaultValue = undefined;
      const changeValue = 4;
      const watch = createStore<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('When non-undefined data changes to undefined data, the subscription function should detect the change well.', () => {
      const defaultValue = 4;
      const changeValue = undefined;
      const watch = createStore<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('The subscription function should be able to detect changes well even if they are consecutive.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const changeNumber2 = 5;
      const watch = createStore<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('number', store.value));

      stateRef.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const logSpy2 = vi.spyOn(console, 'log').mockImplementation(() => {});
      stateRef.value = changeNumber2;
      expect(logSpy2).toHaveBeenCalledWith('number', changeNumber2);
      logSpy.mockRestore();
    });

    it('If the character type data changes, the subscription function should detect the change well.', () => {
      const defaultString = 'john';
      const changeString = 'james';
      const watch = createStore<string>(defaultString);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('string', store.value));

      stateRef.value = changeString;
      expect(logSpy).toHaveBeenCalledWith('string', changeString);

      logSpy.mockRestore();
    });

    it('Should be able to unsubscribe via "abortController".', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const watch = createStore<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const abortController = new AbortController();
      const stateRef = watch(store => {
        console.log('number', store.value);

        return abortController.signal;
      });

      stateRef.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      abortController.abort();
      stateRef.value = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('If the callback function returns false, you will be notified only the first time and your subscription will be cancelled.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const watch = createStore<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => {
        console.log('number', store.value);

        return false;
      });

      stateRef.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      stateRef.value = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });
}

/**
 * Manual testing with a browser (pnpm dev:core)
 */
if (!import.meta.vitest) {
  const stateRef = watch();

  stateRef.value = 4;
  stateRef.value = 5;

  // @ts-ignore
  window.p = stateRef;
}
