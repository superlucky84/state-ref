/**
 * Does `trackDeps` drop a path a component will need again?
 *
 * Re-collection narrows a subscription to what the last run read. If what a
 * callback reads depends on something outside the store, the store can move a
 * path that is no longer subscribed and nothing wakes the reader.
 *
 * Through a connector that mostly cannot happen, and this pins why: the reads
 * happen during render, and anything outside the store that changes what gets
 * rendered goes through a render of its own - which re-reads, and re-registers.
 *
 * `trackDeps` is off by default (`DC-02`), so these ask for it explicitly -
 * without that there is nothing here to test.
 */
import { render as trender, cleanup, act } from '@testing-library/react';
import { useState } from 'react';
import { createStore } from 'state-ref';
import { connectReact } from '@/index';

type Pair = { a: number; b: number };

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  afterEach(cleanup);

  describe('trackDeps and a condition outside the store', () => {
    it('re-registers the path when the condition is component state', () => {
      const watch = createStore<Pair>({ a: 0, b: 0 }, { trackDeps: true });
      const ref = watch();
      const useStore = connectReact(watch);
      let setMode: (m: 'a' | 'b') => void = () => {};
      const seen: string[] = [];

      function View() {
        const store = useStore();
        const [mode, set] = useState<'a' | 'b'>('a');
        setMode = set;
        const shown =
          mode === 'a' ? `a=${store.a.value}` : `b=${store.b.value}`;
        seen.push(shown);

        return <div>{shown}</div>;
      }

      trender(<View />);

      act(() => {
        ref.a.value = 1;
      });
      act(() => {
        setMode('b');
      });

      /** Nothing in the store changed, but the render re-read - and only "b". */
      act(() => {
        setMode('a');
      });

      seen.length = 0;

      act(() => {
        ref.a.value = 2;
      });

      /**
       * Switching back re-rendered, that render read "a" again, and the
       * collector registered it again. The write lands.
       */
      expect(seen).toEqual(['a=2']);
    });

    it('does not narrow when the re-render came from component state', () => {
      const watch = createStore<Pair>({ a: 0, b: 0 }, { trackDeps: true });
      const ref = watch();
      const useStore = connectReact(watch);
      let setMode: (m: 'a' | 'b') => void = () => {};
      let renders = 0;

      function View() {
        const store = useStore();
        const [mode, set] = useState<'a' | 'b'>('a');
        setMode = set;
        renders += 1;

        return <div>{mode === 'a' ? store.a.value : store.b.value}</div>;
      }

      trender(<View />);

      act(() => {
        setMode('b');
      });

      renders = 0;

      act(() => {
        ref.a.value = 9;
      });

      /**
       * "a" is off-screen now and it still renders - which is the mechanism
       * behind the test above, stated directly.
       *
       * Re-collection is driven by the store: `run` drops the old set only
       * when a store change invokes it. A render caused by component state
       * never calls `run`, so its reads are *added* and nothing is dropped.
       * Through a connector the subscription therefore only grows on external
       * changes, which is why `trackDeps` cannot lose a path a component still
       * needs - and equally why its narrowing only pays off when the branch
       * condition lives in the store.
       */
      expect(renders).toBe(1);
    });
  });
}
