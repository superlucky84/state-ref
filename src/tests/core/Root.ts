import { fromState } from '@/index';

const capture = fromState<number>(3);

capture(store => {
  console.log('numberChange', store.current);
});

/**
 * 브라우저로 수동 테스트
 */
if (!import.meta.vitest) {
  const stateRef = capture();

  stateRef.current = 4;
  stateRef.current = 5;

  // @ts-ignore
  window.p = stateRef;
}

/**
 * vitest 자동 테스트
 */
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe('Root - 구독하려는 데이터의 root가 primitive 타입일때는 Root에서 처리', () => {
    it('숫자형 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNumber = 3;
      const capture = fromState<number>(defaultNumber);

      capture(store => console.log('number', store.current));
      expect(logSpy).toHaveBeenCalledWith('number', defaultNumber);

      logSpy.mockRestore();
    });

    it('문자열 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultString = 'john';
      const capture = fromState<string>(defaultString);

      capture(store => console.log('string', store.current));
      expect(logSpy).toHaveBeenCalledWith('string', defaultString);

      logSpy.mockRestore();
    });

    it('undefined 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultUndefined = undefined;
      const capture = fromState<undefined>(defaultUndefined);

      capture(store => console.log('undefined', store.current));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultUndefined);

      logSpy.mockRestore();
    });

    it('null 데이터에서 구독즉시 한번 구독함수가 실행되어야 한다..', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const defaultNull = null;
      const capture = fromState<null>(defaultNull);

      capture(store => console.log('undefined', store.current));
      expect(logSpy).toHaveBeenCalledWith('undefined', defaultNull);

      logSpy.mockRestore();
    });

    it('숫자형 데이터가 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const capture = fromState<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('number', store.current));

      stateRef.current = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);

      logSpy.mockRestore();
    });

    it('null 데이터가 널이 아닌 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = null;
      const changeValue = 4;
      const capture = fromState<number | null>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('current', store.current));

      stateRef.current = changeValue;
      expect(logSpy).toHaveBeenCalledWith('current', changeValue);

      logSpy.mockRestore();
    });

    it('undefined 데이터가 undefined 아닌 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = undefined;
      const changeValue = 4;
      const capture = fromState<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('current', store.current));

      stateRef.current = changeValue;
      expect(logSpy).toHaveBeenCalledWith('current', changeValue);

      logSpy.mockRestore();
    });

    it('undefined 아닌 데이터가 undefined 데이터로 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultValue = 4;
      const changeValue = undefined;
      const capture = fromState<number | undefined>(defaultValue);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('current', store.current));

      stateRef.current = changeValue;
      expect(logSpy).toHaveBeenCalledWith('current', changeValue);

      logSpy.mockRestore();
    });

    it('연속으로 변경되어도 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const changeNumber2 = 5;
      const capture = fromState<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('number', store.current));

      stateRef.current = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const logSpy2 = vi.spyOn(console, 'log').mockImplementation(() => {});
      stateRef.current = changeNumber2;
      expect(logSpy2).toHaveBeenCalledWith('number', changeNumber2);
      logSpy.mockRestore();
    });

    it('문자형 데이터가 변경되면 구독함수가 변경을 잘 감지해야한다.', () => {
      const defaultString = 'john';
      const changeString = 'james';
      const capture = fromState<string>(defaultString);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => console.log('string', store.current));

      stateRef.current = changeString;
      expect(logSpy).toHaveBeenCalledWith('string', changeString);

      logSpy.mockRestore();
    });

    it('abortController 를 통해 구독을 취소할수 있어야 한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const capture = fromState<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const abortController = new AbortController();
      const stateRef = capture(store => {
        console.log('number', store.current);

        return abortController.signal;
      });

      stateRef.current = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      abortController.abort();
      stateRef.current = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('콜백함수가 리턴 false 를 하면 단 한번의 변경만 알림을 받고 구독 취소 되어야 한다.', () => {
      const defaultNumber = 3;
      const changeNumber = 4;
      const capture = fromState<number>(defaultNumber);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stateRef = capture(store => {
        console.log('number', store.current);

        return false;
      });

      stateRef.current = changeNumber;
      expect(logSpy).toHaveBeenCalledWith('number', changeNumber);
      logSpy.mockRestore();

      const abortLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      stateRef.current = defaultNumber;

      expect(abortLogSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });
}
