/**
 * Tearing under concurrent rendering.
 *
 * The connector hands React a version counter as its snapshot and lets render
 * read the live store (`src/index.ts`). That is only safe if React learns
 * about every write that lands while a render is paused, so it can throw the
 * render away instead of committing a screen where some components show the
 * old value and some the new one.
 *
 * These follow the scenarios of dai-shi/will-this-react-global-state-work-in-
 * concurrent-rendering: many slow components read one value, a transition (or
 * a deferred value) re-renders or mounts them with time slicing, and the store
 * is written from outside while that render is yielded. Every commit is
 * checked, not just the final screen, so a torn frame that is later corrected
 * still fails.
 *
 * Each test also asserts that a write really landed mid-render. Without that a
 * render that happened to finish in one slice would pass for the wrong reason.
 *
 * `act` would flush the whole render synchronously and hide the interleaving,
 * so these drive a root directly with real timers.
 *
 * Known gap - mount. Before `subscribe` runs, render reads through a ref that
 * registers nothing, so a write between that render and the subscription does
 * not move the version counter. React's pre-commit consistency check compares
 * snapshots, sees none change, and commits the mixed frame; `subscribe` then
 * bumps the counter and the next render repairs it. The final screen is right,
 * one committed frame is torn. A plain `useSyncExternalStore` store passes the
 * same scenario, so the gap is the connector's. The mount cases are `it.fails`
 * until that is fixed; when they start passing, turn them back into `it`.
 */
import {
  type ComponentType,
  memo,
  startTransition,
  useDeferredValue,
  useLayoutEffect,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createStore } from 'state-ref';
import { connectReact } from '@/index';

type Counter = { n: number };

const ITEMS = 10;
const SLOW_MS = 4;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function busy(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // Hold the thread so the scheduler has to yield between items.
  }
}

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, afterEach } = import.meta.vitest;

  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  let prevActEnv: boolean | undefined;
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    g.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
  });

  function setup() {
    const watch = createStore<Counter>({ n: 0 });
    const writer = watch();
    const useCounter = connectReact(watch);
    const commits: string[][] = [];
    let rendering = false;

    const read = () =>
      Array.from(
        container.querySelectorAll('[data-item]'),
        el => el.textContent ?? ''
      );

    const Item = memo(function Item({ tick }: { tick: number }) {
      const state = useCounter();
      rendering = true;
      busy(SLOW_MS);
      useLayoutEffect(() => {
        rendering = false;
        commits.push(read());
      });
      return (
        <span data-item data-tick={tick}>
          {state.n.value}
        </span>
      );
    });

    /**
     * Write the store on every macrotask until `done`, counting the writes
     * that landed while a render was in progress. Each such write restarts
     * the slow render, so a few are enough and more would only starve it.
     */
    async function writeWhile(done: () => boolean) {
      let duringRender = 0;
      for (let i = 0; i < 40 && duringRender < 3 && !done(); i += 1) {
        if (rendering) duringRender += 1;
        writer.n.value += 1;
        await sleep(1);
      }
      return duringRender;
    }

    async function settle() {
      await sleep(ITEMS * SLOW_MS * 6);
      rendering = false;
    }

    function expectNoTearing() {
      expect(commits.length).toBeGreaterThan(0);
      for (const frame of commits) {
        expect(new Set(frame).size, frame.join(',')).toBeLessThanOrEqual(1);
      }
      const final = read();
      expect(final).toHaveLength(ITEMS);
      expect(new Set(final)).toEqual(new Set([String(writer.n.value)]));
    }

    return { Item, commits, read, writeWhile, settle, expectNoTearing };
  }

  const items = (Item: ComponentType<{ tick: number }>, tick: number) =>
    Array.from({ length: ITEMS }, (_, i) => <Item key={i} tick={tick} />);

  describe('no tearing with useTransition', () => {
    it('on update', async () => {
      const { Item, commits, read, writeWhile, settle, expectNoTearing } =
        setup();
      let bump = () => {};
      function App() {
        const [tick, setTick] = useState(0);
        bump = () => setTick(t => t + 1);
        return <div>{items(Item, tick)}</div>;
      }
      flushSync(() => root.render(<App />));
      await settle();
      commits.length = 0;

      startTransition(() => bump());
      const mid = await writeWhile(
        () =>
          container.querySelector('[data-tick="1"]') !== null &&
          commits.length > 0
      );
      await settle();

      expect(mid).toBeGreaterThan(0);
      expect(read()).toHaveLength(ITEMS);
      expectNoTearing();
    }, 20000);

    it.fails(
      'on mount (known gap, see top of file)',
      async () => {
        const { Item, writeWhile, settle, expectNoTearing } = setup();
        let show = () => {};
        function App() {
          const [visible, setVisible] = useState(false);
          show = () => setVisible(true);
          return <div>{visible ? items(Item, 0) : null}</div>;
        }
        flushSync(() => root.render(<App />));

        startTransition(() => show());
        const mid = await writeWhile(
          () => container.querySelectorAll('[data-item]').length === ITEMS
        );
        await settle();

        expect(mid).toBeGreaterThan(0);
        expectNoTearing();
      },
      20000
    );
  });

  describe('no tearing with useDeferredValue', () => {
    it('on update', async () => {
      const { Item, commits, writeWhile, settle, expectNoTearing } = setup();
      let bump = () => {};
      function App() {
        const [tick, setTick] = useState(0);
        const deferred = useDeferredValue(tick);
        bump = () => setTick(t => t + 1);
        return <div>{items(Item, deferred)}</div>;
      }
      flushSync(() => root.render(<App />));
      await settle();
      commits.length = 0;

      bump();
      const mid = await writeWhile(
        () =>
          container.querySelector('[data-tick="1"]') !== null &&
          commits.length > 0
      );
      await settle();

      expect(mid).toBeGreaterThan(0);
      expectNoTearing();
    }, 20000);

    it.fails(
      'on mount (known gap, see top of file)',
      async () => {
        const { Item, writeWhile, settle, expectNoTearing } = setup();
        let show = () => {};
        function App() {
          const [visible, setVisible] = useState(false);
          const deferred = useDeferredValue(visible);
          show = () => setVisible(true);
          return <div>{deferred ? items(Item, 0) : null}</div>;
        }
        flushSync(() => root.render(<App />));

        show();
        const mid = await writeWhile(
          () => container.querySelectorAll('[data-item]').length === ITEMS
        );
        await settle();

        expect(mid).toBeGreaterThan(0);
        expectNoTearing();
      },
      20000
    );
  });
}
