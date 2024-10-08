import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
  waitFor,
} from '@solidjs/testing-library';
import { createSignal, createEffect } from 'solid-js';
import { createStore } from 'state-ref';
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

  describe('Connect Preact', () => {
    afterEach(() => {
      cleanup();
      resetStore();
    });

    it('꺼내온 stateRef 값에 대해서 리액티브하게 잘 동작해야 한다.', () => {
      trender(() => <Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 14');
    });

    it('여러개의 컴포넌트중 value로 꺼내어 값을 구독중인 컴포넌트에 변경만 동작해야한다.', () => {
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

    it('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', () => {
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

    it('여러개의 컴포넌트가 하나의 값을 구독중일때, 모두 스토어 값을 반영하여 정상 동작해야한다.', async () => {
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

    it('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', async () => {
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
  });
}
