import { render, cleanup, waitFor } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { create } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { connectSvelteView } from '@/index';
import LiveView from '@/tests/svelte/LiveView.svelte';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

describe('Svelte readonly live query view', () => {
  afterEach(cleanup);

  it('renders only the current key and ends its view subscription on destroy', async () => {
    const client = createSyncClient({ ssr: true });
    const input = create({ id: 1, enabled: false });
    const oldRead = deferred<{ name: string }>();
    const newRead = deferred<{ name: string }>();
    let oldSignal!: AbortSignal;
    const live = client.liveView(
      input.watch,
      ({ id, enabled }) => ({
        queryKey: ['svelte-live', id],
        enabled,
        queryFn: ({ signal }) => {
          if (id === 1) {
            oldSignal = signal;
            return oldRead.promise;
          }
          return id === 2 ? newRead.promise : { name: 'three' };
        },
        retry: 0,
      }),
      { select: data => data.name, placeholderData: { name: 'waiting' } }
    );
    const checkReadonly = (watch: typeof live.watch) => {
      const selected = connectSvelteView(watch)(ref => ref.data.value);
      // @ts-expect-error Svelte view stores do not expose set
      selected.set('changed');
    };
    void checkReadonly;
    let selections = 0;
    const screen = render(LiveView, {
      live,
      onSelect: () => (selections += 1),
    });
    expect(screen.getByTestId('live-view').textContent).toBe('1:undefined');
    input.updateRef.enabled.value = true;
    await waitFor(() =>
      expect(screen.getByTestId('live-view').textContent).toBe('1:waiting')
    );

    input.updateRef.id.value = 2;
    await waitFor(() =>
      expect(screen.getByTestId('live-view').textContent).toBe('2:waiting')
    );
    expect(oldSignal.aborted).toBe(true);
    oldRead.resolve({ name: 'old' });
    await Promise.resolve();
    expect(screen.getByTestId('live-view').textContent).toBe('2:waiting');
    newRead.resolve({ name: 'new' });
    await live.query!.load();
    await waitFor(() =>
      expect(screen.getByTestId('live-view').textContent).toBe('2:new')
    );
    live.query!.ref.name.value = 'edited';
    await waitFor(() =>
      expect(screen.getByTestId('live-view').textContent).toBe('2:edited')
    );

    screen.unmount();
    const afterUnmount = selections;
    input.updateRef.id.value = 3;
    await live.query!.load();
    expect(selections).toBe(afterUnmount);
    live.dispose();
  });
});
