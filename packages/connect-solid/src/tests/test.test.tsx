import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
  waitFor,
} from '@solidjs/testing-library';
import { createSignal, createEffect } from 'solid-js';
import { createStore, createStoreManualSync } from 'state-ref';
import { connectSolid } from '@/index';

type Profile = { name: string; age: number };

const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

const watch = createStore<Profile>(getDefaultValue());
const handleRef = watch();
const usePofileStore = connectSolid(watch);

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

function Age() {
  const [age, setAge] = usePofileStore(store => store.age);

  return (
    <div>
      <div data-testid="age-display">age: {age()}</div>
      <button
        data-testid="age-increase"
        onClick={() => {
          setAge(age => age + 1);
        }}
      >
        increase
      </button>
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('Connect Solid', () => {
    afterEach(() => {
      cleanup();
      resetStore();
    });

    it('It should work well responsively for stateRef value.', () => {
      trender(() => <Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 14');
    });

    it('Components should only react and act on the values they are subscribed to.', () => {
      const mockFn1 = vi.fn();

      function AgeWithoutExtractingValue() {
        const [name] = usePofileStore(store => store.name);
        createEffect(() => {
          mockFn1(name());
        });

        return <div>name: {name()}</div>;
      }
      function Root() {
        return (
          <div>
            <Age />
            <AgeWithoutExtractingValue />
          </div>
        );
      }
      trender(() => <Root />);

      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      fireEvent.click(btnElement);

      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn1).toHaveBeenCalledTimes(1);
    });

    it('Unmounted components should not react.', () => {
      const mockFn1 = vi.fn();

      function AgeUnmountable() {
        const [state] = usePofileStore(store => store);

        createEffect(() => {
          mockFn1(state());
        });

        return <div>age: {state().age}</div>;
      }
      function Root() {
        const [mounted, setMounted] = createSignal(true); // createSignal을 사용하여 반응형 상태 생성

        return (
          <div>
            <button data-testid="unmount" onClick={() => setMounted(false)}>
              unmount
            </button>
            <Age />
            {mounted() && <AgeUnmountable />} {/* mounted()로 상태 값 호출 */}
          </div>
        );
      }
      trender(() => <Root />);

      const btnUnmoutElement = screen.getByTestId('unmount');
      const btnIncreaseElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnIncreaseElement);

      expect(displayElement.textContent).toBe('age: 14');
      expect(mockFn1).toHaveBeenCalledTimes(2);

      fireEvent.click(btnUnmoutElement);
      fireEvent.click(btnIncreaseElement);

      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('When multiple components are subscribing to a single value, they should all reflect the store value and behave normally.', async () => {
      const handleRef = watch();

      function Age1() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display1">age: {state().age}</div>;
      }
      function Age2() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display2">age: {state().age}</div>;
      }
      function Age3() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display3">age: {state().age}</div>;
      }
      function Root() {
        return (
          <div>
            <Age1 />
            <Age2 />
            <Age3 />
          </div>
        );
      }
      trender(() => <Root />);

      const displayElement1 = screen.getByTestId('age-display1');
      const displayElement2 = screen.getByTestId('age-display2');
      const displayElement3 = screen.getByTestId('age-display3');

      handleRef.age.value += 2;

      await waitFor(() => {
        expect(displayElement1.textContent).toBe('age: 15');
        expect(displayElement2.textContent).toBe('age: 15');
        expect(displayElement3.textContent).toBe('age: 15');
      });
    });

    it('Components with different roots from different render functions should be able to share values.', async () => {
      const handleRef = watch();

      function Age1() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display1">age: {state().age}</div>;
      }
      function Age2() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display2">age: {state().age}</div>;
      }
      function Age3() {
        const [state] = usePofileStore(store => store);
        return <div data-testid="age-display3">age: {state().age}</div>;
      }
      trender(() => <Age1 />);
      trender(() => <Age2 />);
      trender(() => <Age3 />);

      const displayElement1 = screen.getByTestId('age-display1');
      const displayElement2 = screen.getByTestId('age-display2');
      const displayElement3 = screen.getByTestId('age-display3');

      handleRef.age.value += 2;

      await waitFor(() => {
        expect(displayElement1.textContent).toBe('age: 15');
        expect(displayElement2.textContent).toBe('age: 15');
        expect(displayElement3.textContent).toBe('age: 15');
      });
    });

    it('It should properly update in "manualSync" mode.', () => {
      const { watch, updateRef, sync } = createStoreManualSync<Profile>(
        getDefaultValue()
      );

      const changeAge = (newAge: number) => {
        updateRef.age.value = newAge;
        sync();
      };
      const usePofileStore = connectSolid(watch);

      function AgeWithAction() {
        const [age] = usePofileStore(stateRef => stateRef.age);

        return (
          <div>
            <div data-testid="age-display">age: {age()}</div>
            <button
              data-testid="age-increase"
              onClick={() => {
                changeAge(99);
              }}
            >
              increase
            </button>
          </div>
        );
      }

      trender(() => <AgeWithAction />);

      const btnIncreaseElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnIncreaseElement);

      expect(displayElement.textContent).toBe('age: 99');
    });
  });
}
