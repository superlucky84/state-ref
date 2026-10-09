// @vitest-environment node
/** Server rendering must only peek, even with an ordinary browser client. */
import { renderToString } from 'react-dom/server';

import { createSyncClient } from '@stateref/sync';
import type { SyncClient } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  describe('react query hook server rendering', () => {
    it.each([true, false])(
      'never owns or reads a missing entry (ssr client=%s)',
      ssr => {
        const client = createSyncClient({ ssr });
        const queryFn = vi.fn(() => ({ name: 'Lee' }));
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
        function Panel() {
          const [display, q] = useSyncQuery(observed, {
            queryKey: ['ssr'],
            queryFn,
          });
          expect(q.handle()).toBeNull();
          return (
            <p>{`${display.fetchStatus.value}:${
              display.data.name.value ?? 'missing'
            }`}</p>
          );
        }
        for (let i = 0; i < 10; i += 1)
          expect(renderToString(<Panel />)).toBe('<p>idle:missing</p>');
        expect(client.size()).toBe(0);
        expect(queryFn).not.toHaveBeenCalled();
        expect(subscriptions).toBe(0);
      }
    );

    it('renders hydrated data and leaves zero owners after repeated requests', async () => {
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
        const [display] = useSyncQuery(client, { ...options, queryFn });
        return (
          <p>{`${display.fetchStatus.value}:${display.data.name.value}`}</p>
        );
      }
      const before = client.inspectCache();
      for (let i = 0; i < 10; i += 1)
        expect(renderToString(<Panel />)).toBe('<p>idle:hydrated</p>');
      expect(client.inspectCache()).toEqual(before);
      expect(client.inspectCache()[0].owners).toBe(0);
      expect(queryFn).not.toHaveBeenCalled();
    });
  });
}
