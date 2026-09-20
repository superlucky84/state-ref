import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { handleRef, getDefaultValue, watch, watch2 } from '@/tests/store/store';

import AgeWithAction from '@/tests/vue/AgeWithAction.vue';
import Age from '@/tests/vue/Age.vue';
import Age1 from '@/tests/vue/Age1.vue';
import Age2 from '@/tests/vue/Age2.vue';
import Root1 from '@/tests/vue/Root1.vue';
import Root2 from '@/tests/vue/Root2.vue';
import Root3 from '@/tests/vue/Root3.vue';
import AgeCombind from '@/tests/vue/AgeCombind.vue';
import { nextTick } from 'vue';
import { batch } from 'state-ref/batch';

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

describe('Connect Vue', () => {
  afterEach(() => {
    cleanup();
    resetStore();
  });

  it('applies one synchronous batch notification and keeps two-way input writable', async () => {
    render(Age);
    await nextTick();
    const seen: Array<[string, number]> = [];
    const abort = new AbortController();
    watch(state => {
      seen.push([state.name.value, state.age.value]);
      return abort.signal;
    });
    seen.length = 0;

    batch(() => {
      handleRef.name.value = 'Batch';
      handleRef.age.value = 20;
      expect(seen).toEqual([]);
    });
    expect(seen).toEqual([['Batch', 20]]);
    await nextTick();
    expect(screen.getByTestId('age-display').textContent).toBe('age: 20');

    await fireEvent.click(screen.getByTestId('age-increase'));
    await nextTick();
    expect(handleRef.age.value).toBe(21);
    expect(screen.getByTestId('age-display').textContent).toBe('age: 21');
    abort.abort();
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
   * Skipped until Phase 8 with the note that "@testing-library/vue isolates
   * the testing environment by creating a new instance of the store with each
   * render". That diagnosis was wrong, and skipping on it hid a real defect
   * for as long as it stood: the three `render` calls happen in one turn, and
   * `CI-25` dropped every store write that landed while a component's mount
   * still held the connector's echo guard up. Fixing `CI-25` made this pass.
   */
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
    await nextTick();

    const btnElement = screen.getByTestId('age-increase');
    const displayElement = screen.getByTestId('age-display');

    fireEvent.click(btnElement);

    await waitFor(() => {
      expect(displayElement.textContent).toBe('age1: 99');
    });
  });

  it('Should reflect combined values correctly', async () => {
    render(AgeCombind);
    await nextTick();

    const displayAge = screen.getByTestId('age-display');
    const displayNum = screen.getByTestId('num-display');

    expect(displayAge.textContent).toBe('age: 13');
    expect(displayNum.textContent).toBe('num: 7');

    const handleRef = watch();
    const numRef = watch2();

    handleRef.age.value += 2;

    await waitFor(() => expect(displayAge.textContent).toBe('age: 15'));

    numRef.value = 42;

    await waitFor(() => expect(displayNum.textContent).toBe('num: 42'));
  });
});
