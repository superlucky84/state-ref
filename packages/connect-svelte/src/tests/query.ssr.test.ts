import { describe, expect, it, vi } from 'vitest';
import { VERSION } from 'svelte/compiler';
import { readable } from 'svelte/store';
import { createSyncClient } from '@stateref/sync';
import QueryPanel from '@/tests/svelte/QueryPanel.svelte';
import QueryUnused from '@/tests/svelte/QueryUnused.svelte';

async function serverRenderer(
  component: unknown
): Promise<(props: unknown) => string> {
  if (Number(VERSION.split('.')[0]) >= 5) {
    const id = 'svelte/server';
    const { render } = (await import(/* @vite-ignore */ id)) as {
      render: (
        component: unknown,
        options: { props: unknown }
      ) => { body: string };
    };
    return props =>
      render(component, { props })
        .body.replace(/<!--[^>]*-->/g, '')
        .trim();
  }
  const legacy = component as { render: (props: unknown) => { html: string } };
  return props => legacy.render(props).html.trim();
}

describe('Svelte query hook server rendering', () => {
  it.each(['object', 'store'] as const)(
    'peeks without cache entries or READs (%s options)',
    async kind => {
      const client = createSyncClient({ ssr: true });
      const queryFn = vi.fn(() => ({ name: 'loaded', age: 3 }));
      const value = { queryKey: ['account', 1], queryFn };
      let starts = 0;
      let stops = 0;
      const store = readable(value, () => {
        starts += 1;
        return () => {
          stops += 1;
        };
      });
      const render = await serverRenderer(QueryPanel);
      for (let i = 0; i < 5; i += 1) {
        const html = render({
          client,
          options: kind === 'store' ? store : value,
        });
        expect(html).toContain('>waiting</span>');
        expect(html).toContain('>pending:idle:null</span>');
      }
      expect(client.size()).toBe(0);
      expect(queryFn).not.toHaveBeenCalled();
      expect(starts).toBe(kind === 'store' ? 5 : 0);
      expect(stops).toBe(starts);
    }
  );

  it('releases its options subscription even without a display selection', async () => {
    const client = createSyncClient({ ssr: true });
    let stops = 0;
    const source = readable(
      { queryKey: ['account', 1], queryFn: () => ({ name: 'unused', age: 3 }) },
      () => () => {
        stops += 1;
      }
    );
    const render = await serverRenderer(QueryUnused);
    expect(render({ client, options: source })).toBe('<p>unused</p>');
    expect(stops).toBe(1);
    expect(client.size()).toBe(0);
  });

  it('renders hydrated data while keeping the existing zero owners', async () => {
    const server = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['account', 1],
      queryFn: () => ({ name: 'hydrated', age: 3 }),
      staleTime: Infinity,
      gcTime: Infinity,
    };
    await server.prefetch(options);
    const client = createSyncClient({ ssr: true });
    client.hydrate(server.dehydrate());
    const queryFn = vi.fn(options.queryFn);
    const render = await serverRenderer(QueryPanel);
    for (let i = 0; i < 5; i += 1)
      expect(render({ client, options: { ...options, queryFn } })).toContain(
        '>hydrated</span>'
      );
    expect(client.inspectCache()[0].owners).toBe(0);
    expect(queryFn).not.toHaveBeenCalled();
  });
});
