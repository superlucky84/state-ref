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

  describe('Root - 구독하려는 데이터의 root가 primitive 타입일때는 Root에서 처리', () => {
    it('숫자형 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNumber = 3;
      const watch = createStore<number>(defaultNumber);

      watch(store => console.log('number', store.value));
      expect(logSpy).toHaveBeenCalledWith('number', defaultNumber);

      logSpy.mockRestore();
    });

    it('문자열 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultString = 'john';
      const watch = createStore<string>(defaultString);

      watch(store => console.log('string', store.value));
      expect(logSpy).toHaveBeenCalledWith('string', defaultString);

      logSpy.mockRestore();
    });

    it('undefined 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultUndefined = undefined;
      const watch = createStore<undefined>(defaultUndefined);

      watch(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultUndefined);

      logSpy.mockRestore();
    });

    it('null 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNull = null;
      const watch = createStore<null>(defaultNull);

      watch(store => console.log('undefined', store.value));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultNull);

      logSpy.mockRestore();
    });

    it('숫자형 데이터가 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const watch = createStore<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('number', store.value));

      stateRef.value = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);

      logSpy.mockRestore();
    });

    it('null 데이터가 널이 아닌 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = null;
      const changeValue = 4;
      const watch = createStore<number | null>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('undefined 데이터가 undefined 아닌 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = undefined;
      const changeValue = 4;
      const watch = createStore<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('undefined 아닌 데이터가 undefined 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = 4;
      const changeValue = undefined;
      const watch = createStore<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('value', store.value));

      stateRef.value = changeValue;
      expect(logSpy).toHaveBeenCalledWith('value', changeValue);

      logSpy.mockRestore();
    });

    it('연속으로 변경되어도 구독함수가 변경을 잘 감지해야한다.', () => {
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

    it('문자형 데이터가 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultString = 'john';
      const changeString = 'james';
      const watch = createStore<string>(defaultString);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = watch(store => console.log('string', store.value));

      stateRef.value = changeString;
      expect(logSpy).toHaveBeenCalledWith('string', changeString);

      logSpy.mockRestore();
    });

    it('abortController 를 통해 구독을 취소할수 있어야 한다.', () => {
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

    it('콜백함수가 리턴 false 를 하면 단 한번의 변경만 알림을 받고 구독 취소 되어야 한다.', () => {
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
