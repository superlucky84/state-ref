// @vitest-environment node
/**
 * Phase 8.4: what a server render leaves behind (docs/server-sync/PHASE8_4.md).
 *
 * A server render has no unmount, so a subscription made during it is never
 * released - one per request, each holding the framework's update closure.
 * These run in node, not jsdom: with a `window` present the connector takes
 * its browser path and the server branch under test is never reached.
 */
import renderToString from 'preact-render-to-string';
import { h } from 'preact';
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { StateRefStore, Watch } from 'state-ref';
import { connectPreact, connectPreactView } from '@/index';

void h;

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

  describe('Preact server rendering', () => {
    it('renders the current value and subscribes to nothing', () => {
      const watch = createStore<Counter>({ n: 7 });
      const writer = watch();
      let renews = 0;
      const useStore = connectPreact(countingWatch(watch, () => (renews += 1)));
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
      const useView = connectPreactView(
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
  });
}
