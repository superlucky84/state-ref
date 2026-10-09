import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'solid-js/web';
import { createSyncClient } from '@stateref/sync';
import type { SyncClient } from '@stateref/sync';
import { createSyncQuery } from '@/sync';

describe('Solid query hook server rendering', () => {
  it.each([true, false])(
    'does not subscribe or READ a missing key (ssr client=%s)',
    ssr => {
      const client = createSyncClient({ ssr });
      let subscriptions = 0;
      const observed: SyncClient = {
        ...client,
        observe: (options, settings) => {
          const observer = client.observe(options, settings);
          return {
            ...observer,
            watch: (renew, config) => {
              if (renew) subscriptions += 1;
              return observer.watch(renew, config);
            },
          };
        },
      };
      const queryFn = vi.fn(() => ({ name: 'loaded' }));
      function Panel() {
        const [account, q] = createSyncQuery(observed, () => ({
          queryKey: ['ssr'],
          queryFn,
        }));
        expect(q.handle()).toBeNull();
        const text = account(
          display =>
            `${display.fetchStatus.value}:${
              display.data.name.value ?? 'missing'
            }`
        );
        return <p>{text()}</p>;
      }
      for (let i = 0; i < 5; i += 1)
        expect(renderToString(() => <Panel />)).toContain('>idle:missing<');
      expect(subscriptions).toBe(0);
      expect(queryFn).not.toHaveBeenCalled();
      expect(client.size()).toBe(0);
    }
  );

  it('renders hydrated data and leaves its zero owners unchanged', async () => {
    const server = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['ssr'],
      queryFn: () => ({ name: 'hydrated' }),
      staleTime: Infinity,
      gcTime: Infinity,
    };
    await server.prefetch(options);
    const client = createSyncClient({ ssr: true });
    client.hydrate(server.dehydrate());
    const queryFn = vi.fn(options.queryFn);
    function Panel() {
      const [account] = createSyncQuery(client, { ...options, queryFn });
      const name = account(display => display.data.name.value);
      return <p>{name()}</p>;
    }
    for (let i = 0; i < 5; i += 1)
      expect(renderToString(() => <Panel />)).toContain('>hydrated<');
    expect(client.inspectCache()[0].owners).toBe(0);
    expect(queryFn).not.toHaveBeenCalled();
  });
});
