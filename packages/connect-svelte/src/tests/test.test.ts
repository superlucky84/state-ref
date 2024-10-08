import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import { handleRef, getDefaultValue } from '@/tests/store/store';

import Age from '@/tests/svelte/Age.svelte';
import Age1 from '@/tests/svelte/Age1.svelte';
import Age2 from '@/tests/svelte/Age2.svelte';
import Root1 from '@/tests/svelte/Root1.svelte';
import Root2 from '@/tests/svelte/Root2.svelte';
import Root3 from '@/tests/svelte/Root3.svelte';

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

describe('Connect Svelte', () => {
  afterEach(() => {
    cleanup();
    resetStore();
  });

  it('꺼내온 stateRef 값에 대해서 리액티브하게 잘 동작해야 한다.', () => {
    render(Age);
    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);
    waitFor(() => {
      expect(displayElement.textContent).toBe('age: 14');
    });
  });

  it('여러개의 컴포넌트중 value로 꺼내어 값을 구독중인 컴포넌트에만 업데이트가 일어나야 한다.', async () => {
    const mockFn = vi.fn();
    render(Root1, { mockFn });

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);
    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      // svelte 의 afterUpdate 는 마운트 하고 되고 나서도 호출되므로 1
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  it('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', async () => {
    const mockFn = vi.fn();
    render(Root2, { mockFn });

    const btnUnmoutElement = screen.getByTestId('unmount');
    const btnIncreaseElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnIncreaseElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 14');
      // svelte 의 afterUpdate 는 마운트 하고 되고 나서도 호출되므로 2
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(btnUnmoutElement);
    fireEvent.click(btnIncreaseElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  it('여러개의 컴포넌트가 하나의 값을 구독중일때, 모두 스토어 값을 반영하여 정상 동작해야한다.', async () => {
    render(Root3);

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');
    const displayElement1 = screen.getByTestId('age-display2');
    const displayElement2 = screen.getByTestId('age-display2');

    fireEvent.click(btnElement);
    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      expect(displayElement1.textContent).toBe('age: 15');
      expect(displayElement2.textContent).toBe('age: 15');
    });
  });

  it('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', async () => {
    render(Age);
    render(Age1);
    render(Age2);

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');
    const displayElement1 = screen.getByTestId('age-display1');
    const displayElement2 = screen.getByTestId('age-display2');

    fireEvent.click(btnElement);
    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      expect(displayElement1.textContent).toBe('age: 15');
      expect(displayElement2.textContent).toBe('age: 15');
    });
  });
});
