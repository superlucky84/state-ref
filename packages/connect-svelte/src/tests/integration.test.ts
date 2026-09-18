/**
 * Phase 8 integration for Svelte.
 *
 * Svelte's connector needs a component context - it registers `onDestroy` at
 * initialisation - so these go through real components like the rest of the
 * suite. What is counted is reactive-block runs, which is what a Svelte
 * component pays per store change.
 */
import { render, cleanup, waitFor } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import {
  boardRef,
  getBoard,
  renders,
  resetRenders,
} from '@/tests/store/boardStore';
import BoardApp from '@/tests/svelte/BoardApp.svelte';

describe('Connect Svelte — Phase 8 integration', () => {
  afterEach(() => {
    cleanup();
    boardRef.value = getBoard();
    resetRenders();
  });

  it('updates only the component whose path moved', async () => {
    render(BoardApp);
    resetRenders();

    boardRef.meta.tag.value = 'b';

    await waitFor(() => expect(renders.tag).toBe(1));
    expect(renders.title).toBe(0);
    expect(screenTag()).toBe('b');
  });

  it('updates a length reader when an index write grows the array (CI-21)', async () => {
    const { getByTestId } = render(BoardApp);

    expect(getByTestId('board-length').textContent).toBe('3');

    boardRef.items[3].value = 4;

    await waitFor(() =>
      expect(getByTestId('board-length').textContent).toBe('4')
    );
  });

  it('renders array items and ignores unrelated writes (CI-10)', async () => {
    const { container } = render(BoardApp);

    boardRef.items.value = [...boardRef.items.value, 4];

    await waitFor(() =>
      expect(container.querySelectorAll('li')).toHaveLength(4)
    );

    resetRenders();
    boardRef.title.value = 'elsewhere';

    await waitFor(() => expect(renders.title).toBe(1));
    expect(renders.list).toBe(0);
  });

  it('stops updating after the component is destroyed', async () => {
    render(BoardApp);
    cleanup();
    resetRenders();

    boardRef.title.value = 'after';

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(renders.title).toBe(0);
  });
});

const screenTag = () =>
  document.querySelector('[data-testid="board-tag"]')?.textContent;
