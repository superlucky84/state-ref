/**
 * F-R1 regression (docs/connectors/DESIGN.md).
 *
 * `<StrictMode>` mounts, unmounts and remounts every component in development.
 * The connector used to subscribe during render and abort in an effect
 * cleanup, so the simulated unmount ended the subscription and the remount -
 * which re-runs effects but not render - never made a new one. Measured before
 * the fix: React 18.3 dropped the first write, React 19.3 never updated at all.
 *
 * These tests do not depend on the React version; the connector matrix
 * (`scripts/connector-matrix.mjs`) runs them against both majors.
 */
import { StrictMode, act } from 'react';
import { render, cleanup } from '@testing-library/react';
import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectReact, connectReactView } from '@/index';

type Counter = { n: number; other: number };

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

  describe('F-R1 StrictMode', () => {
    it('shows every write under StrictMode', () => {
      const watch = createStore<Counter>({ n: 0, other: 0 });
      const writer = watch();
      const useCounter = connectReact(watch);
      function View() {
        const state = useCounter();
        return <span data-testid="n">{state.n.value}</span>;
      }
      const screen = render(
        <StrictMode>
          <View />
        </StrictMode>
      );
      const seen: string[] = [];
      for (const value of [1, 2, 3]) {
        act(() => {
          writer.n.value = value;
        });
        seen.push(screen.getByTestId('n').textContent ?? '');
      }
      expect(seen).toEqual(['1', '2', '3']);
    });

    it('shows every write through the view connector under StrictMode', () => {
      const watch = createStore<Counter>({ n: 0, other: 0 });
      const writer = watch();
      const useView = connectReactView(watch);
      function View() {
        const state = useView();
        return <span data-testid="n">{state.n.value}</span>;
      }
      const screen = render(
        <StrictMode>
          <View />
        </StrictMode>
      );
      act(() => {
        writer.n.value = 5;
      });
      expect(screen.getByTestId('n').textContent).toBe('5');
    });

    it('releases the subscription after a StrictMode unmount', () => {
      const watch = createStore<Counter>({ n: 0, other: 0 });
      const writer = watch();
      let renews = 0;
      const useCounter = connectReact(
        countingWatch(watch, () => (renews += 1))
      );
      function View() {
        const state = useCounter();
        return <span>{state.n.value}</span>;
      }
      const screen = render(
        <StrictMode>
          <View />
        </StrictMode>
      );
      screen.unmount();
      const before = renews;
      act(() => {
        writer.n.value = 9;
      });
      expect(renews - before).toBe(0);
    });

    it('does not re-render for a field the component never read', () => {
      const watch = createStore<Counter>({ n: 0, other: 0 });
      const writer = watch();
      const useCounter = connectReact(watch);
      let renders = 0;
      function View() {
        renders += 1;
        const state = useCounter();
        return <span>{state.n.value}</span>;
      }
      render(
        <StrictMode>
          <View />
        </StrictMode>
      );
      const before = renders;
      act(() => {
        writer.other.value = 1;
      });
      expect(renders - before).toBe(0);
    });
  });
}
