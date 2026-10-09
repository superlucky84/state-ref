import { describe, expect, it, vi } from 'vitest';
import { h, mount } from 'lithent';
import { renderToString } from 'lithent/ssr';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@/sync';

describe('Lithent server query (T-QH-53)', () => {
  it.each([false, true])(
    'reads initial data without subscriptions (ssr=%s)',
    ssr => {
      const client = createSyncClient({ ssr });
      const queryFn = vi.fn(() => ({ name: 'loaded' }));
      const Panel = mount(() => {
        const [account, q] = createSyncQuery(client, {
          queryKey: ['account'],
          queryFn,
          initialData: { name: 'seeded' },
        });
        expect(q.handle()).toBeNull();
        return () => h('p', {}, account().data.name.value ?? '');
      });
      expect(renderToString(h(Panel, {}))).toBe('<p>seeded</p>');
      expect(queryFn).not.toHaveBeenCalled();
      expect(client.size()).toBe(0);
    }
  );

  it('renders hydrated cached data without a new READ', async () => {
    const server = createSyncClient({ ssr: true });
    await server.prefetch({
      queryKey: ['account', 1],
      queryFn: () => ({ name: 'cached' }),
    });
    const client = createSyncClient({ ssr: true });
    client.hydrate(server.dehydrate());
    const queryFn = vi.fn(() => ({ name: 'wrong' }));
    const Panel = mount<{ id?: number }>((_renew, props) => {
      const [account] = createSyncQuery(client, () => ({
        queryKey: ['account', props.id],
        queryFn,
      }));
      return () => h('p', {}, account().data.name.value ?? '');
    });
    expect(renderToString(h(Panel, { id: 1 }))).toBe('<p>cached</p>');
    expect(queryFn).not.toHaveBeenCalled();
    expect(client.inspectCache()[0].owners).toBe(0);
  });
});
