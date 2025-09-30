import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createStore,
  createStoreManualSync,
  createComputed,
  combineWatch,
} from 'state-ref';
import type { Watch } from 'state-ref';
import { connectReact } from '@/index';

type Profile = { name: string; age: number };

const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});

const watch = createStore<Profile>(getDefaultValue());
const watch2 = createStore<number>(7);
const handleRef = watch();
const usePofileStore = connectReact(watch);

const computedWatch = createComputed<[Watch<Profile>, Watch<number>], number>(
  [watch, watch2],
  ([ref, ref2]) => {
    return ref.age.value + ref2.value;
  }
);
const useComputedStore = connectReact(computedWatch);

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
  const computedRef = useComputedStore();

  return (
    <div>
      <div data-testid="age-display">age: {age.value}</div>
      <div data-testid="computed-display">age: {computedRef.value}</div>
      <button data-testid="age-increase" onClick={() => (age.value += 1)}>
        increase
      </button>
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('Connect React', () => {
    afterEach(() => {
      cleanup();
      resetStore();
    });

    it('It should work well responsively for stateRef value.', () => {
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      act(() => {
        fireEvent.click(btnElement);
      });
      expect(displayElement.textContent).toBe('age: 14');
    });

    it('The computed property should be reflected correctly.', () => {
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('computed-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 21');
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

      act(() => {
        fireEvent.click(btnElement);
        fireEvent.click(btnElement);
      });

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

      act(() => {
        handleRef.age.value += 2;
      });

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

      act(() => {
        handleRef.age.value += 2;
      });

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
      const usePofileStore = connectReact(watch);

      function AgeWithAction() {
        const { age } = usePofileStore();

        return (
          <div>
            <div data-testid="age-display">age: {age.value}</div>
            <button data-testid="age-increase" onClick={() => changeAge(99)}>
              increase
            </button>
          </div>
        );
      }

      trender(<AgeWithAction />);

      const btnIncreaseElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnIncreaseElement);

      expect(displayElement.textContent).toBe('age: 99');
    });

    it('should combine multiple stores and update reactively', () => {
      const combined = combineWatch([watch, watch2] as const);
      const useCombinedStore = connectReact(combined);

      function ProfileWithNumber() {
        const [profileRef, numberRef] = useCombinedStore();

        return (
          <div>
            <div data-testid="name-display">{profileRef.name.value}</div>
            <div data-testid="age-display">{profileRef.age.value}</div>
            <div data-testid="number-display">{numberRef.value}</div>
            <button
              data-testid="increase-age"
              onClick={() => (profileRef.age.value += 1)}
            >
              increase age
            </button>
            <button
              data-testid="increase-number"
              onClick={() => (numberRef.value += 1)}
            >
              increase number
            </button>
          </div>
        );
      }

      trender(<ProfileWithNumber />);

      const nameEl = screen.getByTestId('name-display');
      const ageEl = screen.getByTestId('age-display');
      const numberEl = screen.getByTestId('number-display');
      const btnAge = screen.getByTestId('increase-age');
      const btnNum = screen.getByTestId('increase-number');

      expect(nameEl.textContent).toBe('Brown');
      expect(ageEl.textContent).toBe('13');
      expect(numberEl.textContent).toBe('7');

      fireEvent.click(btnAge);
      expect(ageEl.textContent).toBe('14');

      fireEvent.click(btnNum);
      expect(numberEl.textContent).toBe('8');
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
  const { watch, updateRef, sync } = createStoreManualSync<Profile>(
    getDefaultValue()
  );

  const changeAge = (newAge: number) => {
    updateRef.age.value = newAge;
    sync();
  };
  const usePofileStore = connectReact(watch);

  function AgeWithAction() {
    const { age } = usePofileStore();

    return (
      <div>
        <div data-testid="age-display">age: {age.value}</div>
        <button
          data-testid="age-increase"
          onClick={() => changeAge(age.value + 1)}
        >
          increase
        </button>
      </div>
    );
  }
  function Root() {
    return (
      <div>
        <AgeWithAction />
        <Name />
      </div>
    );
  }

  createRoot(document.getElementById('root') as HTMLElement).render(<Root />);
}
