/**
 * Phase 8 integration for Vue.
 *
 * The connector registers `onUnmounted` at setup, so these go through a real
 * component like the rest of the suite. What is counted is how often each
 * reactive the connector hands back actually changes - the thing a template
 * re-renders on.
 */
import { render, cleanup, waitFor, fireEvent } from '@testing-library/vue';
import { describe, it, expect, afterEach } from 'vitest';
import { nextTick } from 'vue';
import {
  boardRef,
  counterRef,
  getBoard,
  renders,
  resetRenders,
} from '@/tests/store/boardStore';
import BoardApp from '@/tests/vue/BoardApp.vue';
import Counter from '@/tests/vue/Counter.vue';
import MountWrite from '@/tests/vue/MountWrite.vue';

describe('Connect Vue — Phase 8 integration', () => {
  afterEach(() => {
    cleanup();
    boardRef.value = getBoard();
    resetRenders();
  });

  it('updates only the reactive whose path moved', async () => {
    const { getByTestId } = render(BoardApp);

    resetRenders();
    await fireEvent.click(getByTestId('change-tag'));
    await nextTick();

    await waitFor(() => expect(getByTestId('board-tag').textContent).toBe('b'));
    expect(renders.tag).toBe(1);
    expect(renders.title).toBe(0);
  });

  it('updates a length reader when an index write grows the array (CI-21)', async () => {
    const { getByTestId } = render(BoardApp);

    expect(getByTestId('board-length').textContent).toBe('3');

    await fireEvent.click(getByTestId('grow-items'));
    await nextTick();

    await waitFor(() =>
      expect(getByTestId('board-length').textContent).toBe('4')
    );
  });

  it('renders array items and ignores unrelated writes (CI-10)', async () => {
    const { container, getByTestId } = render(BoardApp);

    await fireEvent.click(getByTestId('replace-items'));
    await nextTick();

    await waitFor(() =>
      expect(container.querySelectorAll('li')).toHaveLength(4)
    );

    resetRenders();
    await fireEvent.click(getByTestId('change-title'));
    await nextTick();

    await waitFor(() => expect(renders.title).toBe(1));
    expect(renders.list).toBe(0);
  });

  it('stops updating after the component unmounts', async () => {
    render(BoardApp);
    cleanup();
    resetRenders();

    boardRef.title.value = 'after';
    await nextTick();

    expect(renders.title).toBe(0);
  });
});

/**
 * Two defects Phase 8 found in this connector. Both are in the released
 * 2.1.0 and neither is reachable from the core's own suite.
 *
 * `CI-25` — the echo guard is armed by the connector's *first* run, which has
 * nothing to guard against: it creates the reactive rather than writing back
 * to the store. The guard only clears on a microtask, so a store write that
 * lands in the same turn as the component's mount is dropped in silence.
 *
 * `CI-26` — the choice between "update the reactive" and "create it" is made
 * on the truthiness of its current value instead of on whether it exists. A
 * store sitting on `0`, `''`, `false` or `null` therefore takes the create
 * branch on every update and replaces the object the template is bound to.
 * The component is then wired to an orphan and never updates again.
 */
describe('Connect Vue — defects found in Phase 8', () => {
  afterEach(() => {
    cleanup();
    boardRef.value = getBoard();
    counterRef.count.value = 0;
  });

  it('applies a store write that lands in the same turn as mount (CI-25)', async () => {
    const { getByTestId } = render(MountWrite);
    await nextTick();

    await waitFor(() =>
      expect(getByTestId('mount-title').textContent).toBe('written at mount')
    );
  });

  it('keeps updating a value that passes through zero (CI-26)', async () => {
    const { getByTestId } = render(Counter);
    await nextTick();

    expect(getByTestId('counter-value').textContent).toBe('0');

    await fireEvent.click(getByTestId('counter-bump'));
    await nextTick();

    await waitFor(() =>
      expect(getByTestId('counter-value').textContent).toBe('1')
    );

    await fireEvent.click(getByTestId('counter-bump'));
    await nextTick();

    await waitFor(() =>
      expect(getByTestId('counter-value').textContent).toBe('2')
    );
    expect(counterRef.count.value).toBe(2);
  });
});
