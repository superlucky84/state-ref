// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, onServerPrefetch } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createSyncClient } from '@stateref/sync';
import type { SyncClient } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

describe('Vue query hook server rendering', () => {
  it.each([true, false])(
    'does not subscribe or READ a missing key (ssr client=%s)',
    async ssr => {
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
      const Panel = defineComponent({
        setup() {
          const [account, q] = useSyncQuery(observed, () => ({
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
          return () => h('p', text.value);
        },
      });
      for (let i = 0; i < 5; i += 1)
        expect(await renderToString(createSSRApp(Panel))).toBe(
          '<p>idle:missing</p>'
        );
      expect(subscriptions).toBe(0);
      expect(queryFn).not.toHaveBeenCalled();
      expect(client.size()).toBe(0);
    }
  );

  it('reads live peek data after onServerPrefetch, including a selection read earlier in setup', async () => {
    const client = createSyncClient({ ssr: true });
    const queryFn = vi.fn(async () => ({ name: 'prefetched' }));
    const options = {
      queryKey: ['ssr'],
      queryFn,
      staleTime: Infinity,
      gcTime: Infinity,
    };
    const Panel = defineComponent({
      setup() {
        const [account, q] = useSyncQuery(client, options);
        const name = account(display => display.data.name.value);
        expect(name.value).toBeUndefined();
        onServerPrefetch(() => client.prefetch(options));
        expect(q.handle()).toBeNull();
        return () => h('p', name.value);
      },
    });
    expect(await renderToString(createSSRApp(Panel))).toBe('<p>prefetched</p>');
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(client.inspectCache()[0].owners).toBe(0);
  });
});
