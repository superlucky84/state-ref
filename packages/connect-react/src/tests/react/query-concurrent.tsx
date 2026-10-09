/** T-QH-23: actual timers, writes during yielded renders, every committed frame checked. */
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
import { createSyncClient } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

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
  let disposers: (() => void)[];

  beforeEach(() => {
    disposers = [];
    prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    disposers.forEach(dispose => dispose());
    container.remove();
    g.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
  });

  function setup(switching = false) {
    const client = createSyncClient();
    const options = (id: number) => ({
      queryKey: ['counter', id],
      queryFn: (): Counter => ({ n: 0 }),
      initialData: { n: 0 },
      staleTime: Infinity,
      gcTime: Infinity,
    });
    const first = client.query(options(1));
    const second = switching ? client.query(options(2)) : first;
    disposers.push(first.dispose);
    if (switching) disposers.push(second.dispose);
    const writer = second.ref;
    const commits: string[][] = [];
    let rendering = false;

    const read = () =>
      Array.from(
        container.querySelectorAll('[data-item]'),
        el => el.textContent ?? ''
      );

    const Item = memo(function Item({
      tick,
      id = 1,
    }: {
      tick: number;
      id?: number;
    }) {
      const [display] = useSyncQuery(client, options(id));
      rendering = true;
      busy(SLOW_MS);
      useLayoutEffect(() => {
        rendering = false;
        commits.push(read());
      });
      return (
        <span data-item data-tick={tick}>
          {id}:{display.data.n.value}
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
      expect(new Set(final)).toEqual(
        new Set([`${switching ? 2 : 1}:${writer.n.value}`])
      );
    }

    return { Item, commits, read, writeWhile, settle, expectNoTearing };
  }

  const items = (
    Item: ComponentType<{ tick: number; id?: number }>,
    tick: number,
    id = 1
  ) =>
    Array.from({ length: ITEMS }, (_, i) => (
      <Item key={i} tick={tick} id={id} />
    ));

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

    it('on mount', async () => {
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
    }, 20000);
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

    it('on mount', async () => {
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
    }, 20000);
  });
  it('checks the new cache root during a concurrent key switch', async () => {
    const { Item, commits, writeWhile, settle, expectNoTearing } = setup(true);
    let changeKey = () => {};
    function App() {
      const [id, setId] = useState(1);
      changeKey = () => setId(2);
      return <div>{items(Item, id, id)}</div>;
    }
    flushSync(() => root.render(<App />));
    await settle();
    commits.length = 0;
    startTransition(changeKey);
    const mid = await writeWhile(
      () =>
        container.querySelector('[data-tick="2"]') !== null &&
        commits.length > 0
    );
    await settle();
    expect(mid).toBeGreaterThan(0);
    expectNoTearing();
  }, 20000);
}
