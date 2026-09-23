// @vitest-environment node
/**
 * Phase 8.4: what a server render leaves behind (docs/server-sync/PHASE8_4.md).
 *
 * A server render has no unmount, so a subscription made during it is never
 * released - one per request, each holding the framework's update closure.
 * These run in node, not jsdom: with a `window` present the connector takes
 * its browser path and the server branch under test is never reached.
 */
import { renderToString } from 'react-dom/server';
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { StateRefStore, Watch } from 'state-ref';
import { connectReact, connectReactView } from '@/index';

type Counter = { n: number };

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  /**
   * Counts the renews the core actually delivers. A renew-less call is
   * forwarded as one, so asking for no subscription really makes none - the
   * wrapper must not quietly add the subscription it is measuring.
   */
  const countingWatch = <T,>(source: Watch<T>, onRenew: () => void): Watch<T> =>
    ((renew?: any, opt?: any) => {
      if (!renew) return (source as any)(undefined, opt);
      return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
        onRenew();
        return renew(store, isFirst);
      }, opt);
    }) as Watch<T>;

  describe('React server rendering', () => {
    it('renders the current value and subscribes to nothing', () => {
      const watch = createStore<Counter>({ n: 7 });
      const writer = watch();
      let renews = 0;
      const useStore = connectReact(countingWatch(watch, () => (renews += 1)));
      function View() {
        const store = useStore();
        return <div>{store.n.value}</div>;
      }

      expect(renderToString(<View />)).toBe('<div>7</div>');
      for (let index = 0; index < 10; index += 1) renderToString(<View />);

      const before = renews;
      writer.n.value = 8;
      // Eleven renders must leave eleven nothings behind, not eleven live
      // subscriptions waiting for an unmount that never comes.
      expect(renews - before).toBe(0);
    });

    it('renders a readonly view without subscribing either', async () => {
      const client = createSyncClient({ ssr: true });
      const view = client.view<Counter, number>(
        { queryKey: ['ssr-view'], queryFn: () => ({ n: 3 }) },
        { select: data => data.n }
      );
      await view.query.load();
      let renews = 0;
      const useView = connectReactView(
        countingWatch(view.watch as never, () => (renews += 1)) as never
      );
      function View() {
        const ref = useView() as unknown as { data: { value: number } };
        return <div>{ref.data.value}</div>;
      }

      expect(renderToString(<View />)).toBe('<div>3</div>');
      for (let index = 0; index < 10; index += 1) renderToString(<View />);

      const before = renews;
      view.query.ref.n.value = 4; // a change every live view would be told about
      expect(renews - before).toBe(0);
      view.dispose();
    });

    it('keeps two SSR clients apart and moves only a clean baseline', async () => {
      const first = createSyncClient({ ssr: true });
      const second = createSyncClient({ ssr: true });
      const options = {
        queryKey: ['isolated'],
        queryFn: () => ({ n: 1 }),
      };
      const a = first.query<Counter>(options);
      const b = second.query<Counter>(options);
      await a.load();
      await b.load();

      a.ref.n.value = 99;
      // One request's edit is invisible to another's, even on the same key.
      expect(b.ref.n.value).toBe(1);
      expect(a.isDirty()).toBe(true);
      expect(b.isDirty()).toBe(false);
      const useFirst = connectReact(a.watch);
      const useSecond = connectReact(b.watch);
      function FirstRequest() {
        return <div>{useFirst().n.value}</div>;
      }
      function SecondRequest() {
        return <div>{useSecond().n.value}</div>;
      }
      expect(renderToString(<FirstRequest />)).toBe('<div>99</div>');
      expect(renderToString(<SecondRequest />)).toBe('<div>1</div>');

      // A dirty client cannot hand its work to the browser at all.
      expect(() => first.dehydrate()).toThrow('local or unresolved work');

      const snapshot = second.dehydrate();
      const restored = createSyncClient();
      restored.hydrate(snapshot);
      const revived = restored.query<Counter>(options);
      expect(revived.ref.n.value).toBe(1);
      expect(revived.isDirty()).toBe(false);

      revived.dispose();
      a.dispose();
      b.dispose();
    });
  });
}
