/**
 * Phase 8.4: what a server render leaves behind (docs/server-sync/PHASE8_4.md).
 *
 * `onCleanup` does not run for a server render, so a subscription made there
 * is never released. Runs under `vite.ssr.config.js`: `solid-js/web` resolves
 * to a browser build unless the server conditions are selected, and that build
 * refuses to render at all.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'solid-js/web';
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { QueryViewState } from '@stateref/sync';
import type { StateRefStore, Watch } from 'state-ref';
import { connectSolid, connectSolidView } from '@/index';

type Counter = { n: number };

const countingWatch = <T,>(source: Watch<T>, onRenew: () => void): Watch<T> =>
  ((renew?: any, opt?: any) => {
    if (!renew) return (source as any)(undefined, opt);
    return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
      onRenew();
      return renew(store, isFirst);
    }, opt);
  }) as Watch<T>;

describe('Solid server rendering', () => {
  it('renders the current value and subscribes to nothing', () => {
    const watch = createStore<Counter>({ n: 7 });
    const writer = watch();
    let renews = 0;
    const useStore = connectSolid(countingWatch(watch, () => (renews += 1)));
    const View = () => {
      const [n] = useStore(store => store.n);
      return <div>{n()}</div>;
    };

    expect(renderToString(() => <View />)).toContain('>7<');
    for (let index = 0; index < 10; index += 1) renderToString(() => <View />);

    const before = renews;
    writer.n.value = 8;
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
    const display = connectSolidView(
      countingWatch(
        view.watch as unknown as Watch<QueryViewState<number>>,
        () => (renews += 1)
      )
    );
    const View = () => {
      const data = display(ref => ref.data.value);
      return <div>{data()}</div>;
    };

    expect(renderToString(() => <View />)).toContain('>3<');
    for (let index = 0; index < 10; index += 1) {
      renderToString(() => <View />);
    }

    const before = renews;
    view.query.ref.n.value = 4;
    expect(renews - before).toBe(0);
    view.dispose();
  });
});
