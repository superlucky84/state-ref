import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import { handleRef, getDefaultValue } from '@/tests/store/store';

import AgeWithAction from '@/tests/svelte/AgeWithAction.svelte';
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

  it('It should work well responsively for stateRef value.', () => {
    render(Age);
    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);
    waitFor(() => {
      expect(displayElement.textContent).toBe('age: 14');
    });
  });

  it('The computed property should be reflected correctly.', () => {
    render(Age);

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('computed-display');

    fireEvent.click(btnElement);
    waitFor(() => {
      expect(displayElement.textContent).toBe('age: 21');
    });
  });

  it('Components should only react and act on the values they are subscribed to.', async () => {
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

  it('Unmounted components should not react.', async () => {
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

  it('When multiple components are subscribing to a single value, they should all reflect the store value and behave normally.', async () => {
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

  it('Components with different roots from different render functions should be able to share values.', async () => {
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
  it('It should properly update in "manualSync" mode.', async () => {
    render(AgeWithAction);

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 99');
    });
  });
});
