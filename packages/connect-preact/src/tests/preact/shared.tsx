/**
 * docs/shared-store (T-SH-10, connector half): a hook made from a shared
 * watch renders pending, then loading, then data - and re-renders on its own
 * at each step. The two-copies half lives in
 * packages/state-ref/test/shared-bundle.mjs.
 */
import { h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { createStore } from 'state-ref';
import {
  isProvided,
  isReady,
  provideShared,
  sharedWatch,
} from 'state-ref/shared';
import { connectPreactView } from '@/index';

type Subs = { loaded: boolean; mySubs: number[] | null; noise: number };
type LoadedSubs = Subs & { loaded: true; mySubs: number[] };

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  afterEach(() => {
    cleanup();
    delete (globalThis as any)[Symbol.for('state-ref.shared')];
  });

  describe('a shared watch through connectPreactView', () => {
    it('renders each stage of a store that arrives after the component', async () => {
      // The consumer bundle: a hook at module level, before any provider.
      const useSubs = connectPreactView(sharedWatch<Subs, LoadedSubs>('subs'));
      let renders = 0;
      function Badge() {
        renders += 1;
        const subs = useSubs();
        if (!isProvided(subs)) return <span data-testid="badge">none</span>;
        if (!isReady(subs)) return <span data-testid="badge">loading</span>;
        return <span data-testid="badge">{subs.mySubs.value.length}</span>;
      }
      const screen = render(<Badge />);
      const badge = () => screen.getByTestId('badge').textContent;
      expect(badge()).toBe('none');

      // The provider bundle loads.
      let subs!: ReturnType<ReturnType<typeof createStore<Subs>>>;
      await act(() => {
        subs = provideShared(
          'subs',
          createStore<Subs>({ loaded: false, mySubs: null, noise: 0 }),
          { ready: ref => ref.loaded.value }
        )();
      });
      expect(badge()).toBe('loading');

      // Its fetch lands.
      await act(() => {
        subs.mySubs.value = [1, 2, 3];
        subs.loaded.value = true;
      });
      expect(badge()).toBe('3');

      await act(() => {
        subs.mySubs.value = [1];
      });
      expect(badge()).toBe('1');

      // Nothing the component did not read wakes it.
      const settled = renders;
      await act(() => {
        subs.noise.value = 1;
      });
      expect(renders).toBe(settled);
    });

    it('unsubscribes with the component, before or after the store arrives', async () => {
      const useCount = connectPreactView(sharedWatch<number>('n'));
      let renders = 0;
      function Counter() {
        renders += 1;
        const count = useCount();
        return <span>{isProvided(count) ? count.value : '-'}</span>;
      }
      render(<Counter />);
      cleanup();
      const before = renders;

      const ref = provideShared('n', createStore(0))();
      await act(() => {
        ref.value = 1;
      });
      expect(renders).toBe(before);
    });
  });
}
