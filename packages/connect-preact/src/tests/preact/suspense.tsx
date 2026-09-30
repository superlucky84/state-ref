/**
 * F-P3 regression (docs/connectors/DESIGN.md).
 *
 * The connector used to subscribe during render and release in an effect
 * cleanup. A render that suspends never commits, so no effect registers and
 * nothing ever releases that subscription. Measured before the fix: after the
 * suspended component was unmounted, the next store write reached its dead
 * setState and Preact threw `TypeError: Cannot read properties of undefined
 * (reading '__c')`.
 */
import { h } from 'preact';
import { Suspense } from 'preact/compat';
import { render, cleanup, act } from '@testing-library/preact';
import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectPreact } from '@/index';

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

  describe('F-P3 suspended render', () => {
    it('leaves no subscription behind a render that suspended', async () => {
      const watch = createStore({ n: 0 });
      const writer = watch();
      let renews = 0;
      const useCounter = connectPreact(
        countingWatch(watch, () => (renews += 1))
      );
      const never = new Promise<void>(() => {});
      function View() {
        const state = useCounter();
        const n = state.n.value;
        if (n >= 0) throw never;
        return <span>{n}</span>;
      }
      const screen = render(
        <Suspense fallback={<i>loading</i>}>
          <View />
        </Suspense>
      );
      screen.unmount();

      for (const value of [1, 2, 3]) {
        await act(() => {
          writer.n.value = value;
        });
      }
      expect(renews).toBe(0);
    });
  });
}
