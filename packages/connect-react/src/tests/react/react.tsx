import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
// @ts-ignore
import { createElement as h, useState } from 'react';
// @ts-ignore
import { createRoot } from 'react-dom/client';
import { createStore } from 'state-ref';
import { connectReact } from '@/index';

type Profile = { name: string; age: number };

const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

const watch = createStore<Profile>(getDefaultValue());
const handleRef = watch();
const usePofileStore = connectReact(watch);

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

function Name() {
  const stateRef = usePofileStore();

  return (
    <div>
      <div>name: {stateRef.name.value}</div>
      <button
        onClick={() =>
          (stateRef.name.value = getRandomName(stateRef.name.value))
        }
      >
        nameChange
      </button>
    </div>
  );
}

function Age() {
  const { age } = usePofileStore();

  return (
    <div>
      <div data-testid="age-display">age: {age.value}</div>
      <button data-testid="age-increase" onClick={() => (age.value += 1)}>
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
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      act(() => {
        fireEvent.click(btnElement);
      });
      expect(displayElement.textContent).toBe('age: 14');
    });

    it('여러개의 컴포넌트중 value로 꺼내어 값을 구독중인 컴포넌트에 변경만 동작해야한다.', () => {
      const mockFn1 = vi.fn();

      function AgeWithoutExtractingValue() {
        const stateRef = usePofileStore();

        mockFn1(stateRef.age);

        return <div>None</div>;
      }
      function Root() {
        return (
          <div>
            <Age />
            <AgeWithoutExtractingValue />
          </div>
        );
      }
      trender(<Root />);

      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      act(() => {
        fireEvent.click(btnElement);
        fireEvent.click(btnElement);
      });

      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn1).toHaveBeenCalledTimes(1);
    });
    it('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', () => {
      const mockFn1 = vi.fn();

      function AgeUnmountable() {
        const stateRef = usePofileStore();
        mockFn1();

        return <div>age: {stateRef.age.value}</div>;
      }
      function Root() {
        const [mounted, setMounted] = useState(true);

        return (
          <div>
            <button data-testid="unmount" onClick={() => setMounted(false)}>
              unmount
            </button>
            <Age />
            {mounted && <AgeUnmountable />}
          </div>
        );
      }
      trender(<Root />);

      const btnUnmoutElement = screen.getByTestId('unmount');
      const btnIncreaseElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      act(() => {
        fireEvent.click(btnIncreaseElement);
      });

      expect(displayElement.textContent).toBe('age: 14');
      expect(mockFn1).toHaveBeenCalledTimes(2);

      act(() => {
        fireEvent.click(btnUnmoutElement);
        fireEvent.click(btnIncreaseElement);
      });

      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });

    it('여러개의 컴포넌트가 하나의 값을 구독중일때, 모두 스토어 값을 반영하여 정상 동작해야한다.', async () => {
      const handleRef = watch();

      function Age1() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display1">age: {stateRef.age.value}</div>;
      }
      function Age2() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display2">age: {stateRef.age.value}</div>;
      }
      function Age3() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display3">age: {stateRef.age.value}</div>;
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
      trender(<Root />);

      const displayElement1 = screen.getByTestId('age-display1');
      const displayElement2 = screen.getByTestId('age-display2');
      const displayElement3 = screen.getByTestId('age-display3');

      act(() => {
        handleRef.age.value += 2;
      });

      await waitFor(() => {
        expect(displayElement1.textContent).toBe('age: 15');
        expect(displayElement2.textContent).toBe('age: 15');
        expect(displayElement3.textContent).toBe('age: 15');
      });
    });

    it('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', async () => {
      const handleRef = watch();

      function Age1() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display1">age: {stateRef.age.value}</div>;
      }
      function Age2() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display2">age: {stateRef.age.value}</div>;
      }
      function Age3() {
        const stateRef = usePofileStore();
        return <div data-testid="age-display3">age: {stateRef.age.value}</div>;
      }
      trender(<Age1 />);
      trender(<Age2 />);
      trender(<Age3 />);

      const displayElement1 = screen.getByTestId('age-display1');
      const displayElement2 = screen.getByTestId('age-display2');
      const displayElement3 = screen.getByTestId('age-display3');

      act(() => {
        handleRef.age.value += 2;
      });

      await waitFor(() => {
        expect(displayElement1.textContent).toBe('age: 15');
        expect(displayElement2.textContent).toBe('age: 15');
        expect(displayElement3.textContent).toBe('age: 15');
      });
    });
  });
}

function getRandomName(excludeName: string) {
  const names = ['Brown', 'Alice', 'Bob', 'Charlie'];
  const filteredNames = names.filter(name => name !== excludeName);

  if (filteredNames.length === 0) {
    throw new Error('No names left to choose from.');
  }

  const randomIndex = Math.floor(Math.random() * filteredNames.length);
  return filteredNames[randomIndex];
}

if (!import.meta.vitest) {
  //@ts-ignore
  window.p = handleRef;
  function Root() {
    return (
      <div>
        <Age />
        <Age />
        <Age />
        <Name />
      </div>
    );
  }

  createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
}
