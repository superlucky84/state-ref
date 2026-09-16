/**
 * IC-01 regression snapshot for docs/core-improvement.
 *
 * All five connectors return `abortController.signal` from their renew and
 * abort it on unmount, so the plain-watch path unsubscribes correctly.
 * `combineWatch` and `createComputed` never forward that return value to the
 * core, so a component connected through either of them keeps its subscription
 * (and its closure over setState) forever.
 *
 * The two "SNAPSHOT (wrong)" tests below pin that leak. Phase 5 of
 * docs/core-improvement/IMPLEMENT.md must flip both to 0.
 */
import { render as trender, cleanup } from '@testing-library/react';
import { createStore, combineWatch, createComputed } from 'state-ref';
import type { Watch, StateRefStore } from 'state-ref';
import { connectReact } from '@/index';

type Counter = { n: number };

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  /**
   * Wraps a watch so we can count how many times the core actually invokes the
   * connector's renew, before and after unmount.
   */
  const countingWatch = <T,>(source: Watch<T>, onRenew: () => void): Watch<T> =>
    ((renew: any, opt: any) =>
      (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
        onRenew();
        return renew(store, isFirst);
      }, opt)) as Watch<T>;

  describe('IC-01 unmount unsubscribes', () => {
    it('plain watch: the subscription stops on unmount', () => {
      const watch = createStore<Counter>({ n: 0 });
      const ref = watch();
      let renews = 0;

      const useStore = connectReact(countingWatch(watch, () => (renews += 1)));
      function View() {
        const store = useStore();
        return <div>{store.n.value}</div>;
      }

      trender(<View />);
      cleanup();

      renews = 0;
      ref.n.value = 1;
      ref.n.value = 2;

      expect(renews).toBe(0);
    });

    it('SNAPSHOT (wrong): combineWatch keeps firing after unmount — Phase 5 must flip this to 0', () => {
      const watch = createStore<Counter>({ n: 0 });
      const watch2 = createStore<number>(0);
      const ref = watch();
      let renews = 0;

      const combined = combineWatch([watch, watch2] as const);
      const useStore = connectReact(
        countingWatch(combined, () => (renews += 1))
      );
      function View() {
        const [first] = useStore() as any;
        return <div>{first.n.value}</div>;
      }

      trender(<View />);
      cleanup();

      renews = 0;
      ref.n.value = 1;
      ref.n.value = 2;

      expect(renews).toBe(2);
    });

    it('SNAPSHOT (wrong): createComputed keeps firing after unmount — Phase 5 must flip this to 0', () => {
      const watch = createStore<Counter>({ n: 0 });
      const watch2 = createStore<number>(0);
      const ref = watch();
      let renews = 0;

      const computed = createComputed<[Watch<Counter>, Watch<number>], number>(
        [watch, watch2],
        ([a, b]) => a.n.value + b.value
      );
      const useStore = connectReact(
        countingWatch(computed as any, () => (renews += 1))
      );
      function View() {
        const store = useStore() as any;
        return <div>{store.value}</div>;
      }

      trender(<View />);
      cleanup();

      renews = 0;
      ref.n.value = 1;
      ref.n.value = 2;

      expect(renews).toBe(2);
    });
  });
}
