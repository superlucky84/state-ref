/**
 * Phase 8 integration: what the core's changes do to a real connector.
 *
 * The core suite proves the store notifies correctly. This asks the question
 * the core cannot: does a component render more often than it did, and does
 * it still render when it must. Renders are the connector's whole cost -
 * every subscription here ends in a `setState`.
 *
 * Three things are measured rather than argued:
 *
 *   - render counts against the baseline, including the narrowing Phase 3/4
 *     introduced and the array shapes `CI-10` and `CI-21` are about
 *   - `trackDeps` on the same components, which is the measurement `DC-02`
 *     was waiting for before deciding whether it can be the default
 *   - `CI-24` through the connector's own teardown path: every connector
 *     unsubscribes by aborting a signal, so an unmount that lands while a
 *     propagation pass is in flight is the realistic way to hit it
 */
import { render as trender, cleanup, act } from '@testing-library/react';
import { useState } from 'react';
import { createStore } from 'state-ref';
import { connectReact } from '@/index';

type Board = {
  title: string;
  items: number[];
  meta: { tag: string };
};

const initial = (): Board => ({
  title: 'board',
  items: [1, 2, 3],
  meta: { tag: 'a' },
});

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  afterEach(cleanup);

  describe('render counts', () => {
    it('renders only the component whose path moved', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectReact(watch);
      const renders = { title: 0, tag: 0 };

      function Title() {
        const store = useStore();
        renders.title += 1;

        return <div>{store.title.value}</div>;
      }

      function Tag() {
        const store = useStore();
        renders.tag += 1;

        return <div>{store.meta.tag.value}</div>;
      }

      trender(
        <>
          <Title />
          <Tag />
        </>
      );

      renders.title = 0;
      renders.tag = 0;

      act(() => {
        ref.meta.tag.value = 'b';
      });

      expect(renders.tag).toBe(1);
      expect(renders.title).toBe(0);
    });

    it('renders once per write, not once per subscriber path', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectReact(watch);
      let renders = 0;

      function View() {
        const store = useStore();
        renders += 1;

        return (
          <div>
            {store.title.value} {store.meta.tag.value}
          </div>
        );
      }

      trender(<View />);
      renders = 0;

      act(() => {
        ref.title.value = 'next';
      });

      expect(renders).toBe(1);

      /**
       * Two writes are two notifications - `INV-4`, and `DC-03`'s decision not
       * to batch - but one render. React coalesces the two `setState` calls
       * that result, so the core's refusal to batch costs a React application
       * nothing here. Measured rather than assumed: the plain subscriber
       * counts the notifications the connector does not turn into renders.
       */
      let notifications = 0;

      watch(store => {
        void store.title.value;
        void store.meta.tag.value;
        notifications += 1;
      });

      renders = 0;
      notifications = 0;

      act(() => {
        ref.title.value = 'again';
        ref.meta.tag.value = 'c';
      });

      expect(notifications).toBe(2);
      expect(renders).toBe(1);
    });

    it('renders a length subscriber when an index write grows the array (CI-21)', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectReact(watch);
      const seen: number[] = [];

      function Count() {
        const store = useStore();
        seen.push(store.items.length.value);

        return <div>{store.items.length.value}</div>;
      }

      trender(<Count />);

      act(() => {
        ref.items[3].value = 4;
      });

      expect(seen).toEqual([3, 4]);
    });

    it('renders array items through .value, the documented shape (CI-10)', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectReact(watch);
      let renders = 0;

      function List() {
        const store = useStore();
        renders += 1;

        return (
          <ul>
            {store.items.value.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
      }

      const { container } = trender(<List />);

      expect(container.querySelectorAll('li')).toHaveLength(3);

      renders = 0;

      act(() => {
        ref.items.value = [...ref.items.value, 4];
      });

      expect(renders).toBe(1);
      expect(container.querySelectorAll('li')).toHaveLength(4);

      /** An unrelated write must not re-render the list. */
      renders = 0;

      act(() => {
        ref.title.value = 'elsewhere';
      });

      expect(renders).toBe(0);
    });

    it('does not render a component that unmounted mid-write', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectReact(watch);
      let renders = 0;

      function Child() {
        const store = useStore();
        renders += 1;

        return <div>{store.title.value}</div>;
      }

      function Parent() {
        const store = useStore();
        const [shown, setShown] = useState(true);

        /**
         * The parent drops the child in the same pass that wakes both: the
         * child's `AbortSignal` fires while the pass is still running, which
         * is `CI-24`'s shape reached the way an application reaches it.
         */
        if (store.title.value === 'gone' && shown) {
          setShown(false);
        }

        return <div>{shown ? <Child /> : null}</div>;
      }

      trender(<Parent />);
      renders = 0;

      act(() => {
        ref.title.value = 'gone';
      });

      const afterUnmount = renders;

      act(() => {
        ref.title.value = 'later';
      });

      expect(renders).toBe(afterUnmount);
    });
  });

  describe('trackDeps on a real component (DC-02)', () => {
    const build = (trackDeps: boolean) => {
      const watch = createStore<{ flag: boolean; a: number; b: number }>(
        { flag: true, a: 0, b: 0 },
        { trackDeps }
      );
      const useStore = connectReact(watch);
      const state = { renders: 0 };

      function Branch() {
        const store = useStore();
        state.renders += 1;

        return <div>{store.flag.value ? store.a.value : store.b.value}</div>;
      }

      return { ref: watch(), Branch, state };
    };

    it('keeps waking a component for a path it stopped reading when off (the default)', () => {
      const { ref, Branch, state } = build(false);

      trender(<Branch />);

      act(() => {
        ref.flag.value = false;
      });

      state.renders = 0;

      act(() => {
        ref.a.value = 99;
      });

      expect(state.renders).toBe(1);
    });

    it('stops waking it when on', () => {
      const { ref, Branch, state } = build(true);

      trender(<Branch />);

      act(() => {
        ref.flag.value = false;
      });

      state.renders = 0;

      act(() => {
        ref.a.value = 99;
      });

      expect(state.renders).toBe(0);

      /** The branch it did take still wakes it. */
      act(() => {
        ref.b.value = 5;
      });

      expect(state.renders).toBe(1);
    });
  });
}
