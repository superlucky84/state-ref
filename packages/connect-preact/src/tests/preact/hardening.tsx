/**
 * Phase 7 hardening (docs/connectors/IMPLEMENT.md): a second, independent
 * catch for each connector defect that only one test used to catch.
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { render, cleanup, act, fireEvent } from '@testing-library/preact';
import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectPreact, connectPreactView } from '@/index';

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  const countingWatch = <T,>(source: Watch<T>, onRenew: () => void): Watch<T> =>
    ((renew?: any, opt?: any) => {
      if (!renew) return (source as any)(undefined, opt);
      return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
        if (!isFirst) onRenew();
        return renew(store, isFirst);
      }, opt);
    }) as Watch<T>;

  afterEach(() => cleanup());

  describe('hardening: teardown', () => {
    it('releases a child the parent stops rendering', async () => {
      const watch = createStore({ n: 0 });
      const writer = watch();
      let renews = 0;
      const useCounter = connectPreact(
        countingWatch(watch, () => (renews += 1))
      );
      function Child() {
        const state = useCounter();
        return <span>{state.n.value}</span>;
      }
      function Parent() {
        const [shown, setShown] = useState(true);
        return (
          <div>
            <button data-testid="hide" onClick={() => setShown(false)}>
              hide
            </button>
            {shown && <Child />}
          </div>
        );
      }
      const screen = render(<Parent />);
      await act(() => {
        fireEvent.click(screen.getByTestId('hide'));
      });
      const before = renews;
      await act(() => {
        writer.n.value = 1;
      });
      expect(renews - before).toBe(0);
    });

    it('releases the view connector on unmount', async () => {
      const watch = createStore({ n: 0 });
      const writer = watch();
      let renews = 0;
      const useView = connectPreactView(
        countingWatch(watch, () => (renews += 1))
      );
      function View() {
        const state = useView();
        return <span>{state.n.value}</span>;
      }
      const screen = render(<View />);
      screen.unmount();
      const before = renews;
      await act(() => {
        writer.n.value = 1;
      });
      expect(renews - before).toBe(0);
    });
  });
}
