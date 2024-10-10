import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
  waitFor,
} from '@testing-library/preact';
import { h, render } from 'preact';
import { useState } from 'preact/hooks';
import { createStore } from 'state-ref';
import { connectPreact } from '@/index';

type Profile = { name: string; age: number };

const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

const watch = createStore<Profile>(getDefaultValue());
const handleRef = watch();
const usePofileStore = connectPreact(watch);

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

    it('It should work well responsively for stateRef value.', () => {
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 14');
    });

    it('Components should only react and act on the values they are subscribed to.', () => {
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

      fireEvent.click(btnElement);
      fireEvent.click(btnElement);

      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn1).toHaveBeenCalledTimes(1);
    });

    it('Unmounted components should not react.', () => {
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

      handleRef.age.value += 2;

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
  render(<Root />, document.getElementById('root2') as HTMLElement);
}
