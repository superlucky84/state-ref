import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { handleRef, getDefaultValue } from '@/tests/store/store';

import AgeWithAction from '@/tests/vue/AgeWithAction.vue';
import Age from '@/tests/vue/Age.vue';
import Age1 from '@/tests/vue/Age1.vue';
import Age2 from '@/tests/vue/Age2.vue';
import Root1 from '@/tests/vue/Root1.vue';
import Root2 from '@/tests/vue/Root2.vue';
import Root3 from '@/tests/vue/Root3.vue';
import { nextTick } from 'vue';

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

describe('Connect Vue', () => {
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

  it('Components should only react and act on the values they are subscribed to.', async () => {
    const mockFn = vi.fn();
    render(Root1, { props: { mockFn } });

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);
    fireEvent.click(btnElement);

    await nextTick();

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn).toHaveBeenCalledTimes(0);
    });
  });

  it('Unmounted components should not react.', async () => {
    const mockFn = vi.fn();
    render(Root2, { props: { mockFn } });

    const btnUnmoutElement = screen.getByTestId('unmount');
    const btnIncreaseElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnIncreaseElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 14');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(btnUnmoutElement);
    fireEvent.click(btnIncreaseElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age: 15');
      expect(mockFn).toHaveBeenCalledTimes(1);
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

  /**
   * "@testing-library/vue" isolates the testing environment by creating a new instance of the store with each render, instead of using a singleton. As a result, this test does not work.
   * (Manual testing is required with `npm run dev:vue`.)
   */
  it.skip('Components with different roots from different render functions should be able to share values.', async () => {
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
    await nextTick();

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age1: 99');
    });
  });
});
