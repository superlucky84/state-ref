import {
  render as trender,
  fireEvent,
  cleanup,
  screen,
} from '@testing-library/preact';
import { h, render } from 'preact';
import { createStore } from 'state-ref';
import { connectWithPreactA } from '@/index';

type Profile = { name: string; age: number };
const getDefaultValue = () => ({
  name: 'Brown',
  age: 13,
});
const watch = createStore<Profile>(getDefaultValue());
const p = watch();
const usePofileStore = connectWithPreactA(watch);

const resetStore = () => {
  p.value = getDefaultValue();
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
function Root() {
  return (
    <div>
      <Age />
      <Name />
    </div>
  );
}

if (import.meta.vitest) {
  // const { describe, it, expect } = import.meta.vitest;

  describe('Connect Preact', () => {
    it('꺼내온 stateRef 값에 대해서 리액티브하게 잘 동작해야 한다.', () => {
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 14');

      cleanup();
      resetStore();
    });
    it('여러개의 컴포넌트중 value로 꺼내어 값을 구독중인 컴포넌트에 변경만 동작해야한다.', () => {
      trender(<Age />);
      const btnElement = screen.getByTestId('age-increase');
      const displayElement = screen.getByTestId('age-display');

      fireEvent.click(btnElement);
      expect(displayElement.textContent).toBe('age: 14');

      cleanup();
      resetStore();
    });
    /*
    it('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('여러개의 컴포넌트가 하나의 값을 구독중일때 언마운트된 컴포넌트 외에 다른 컴포넌트들은 정상 동작해야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
     */
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
  window.p = p;
  // render(<Age />, document.getElementById('root') as HTMLElement);
  render(<Name />, document.getElementById('root2') as HTMLElement);
}
