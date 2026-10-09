import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { derived, readable, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import { createSyncClient } from '@stateref/sync';
import type {
  ObserveOptions,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { createSyncQuery } from '@/sync';
import QueryPanel from '@/tests/svelte/QueryPanel.svelte';
import QueryUnused from '@/tests/svelte/QueryUnused.svelte';

type Account = { name: string; age: number };
const options = (id: number): ObserveOptions<Account> => ({
  queryKey: ['account', id],
  queryFn: () => ({ name: `name-${id}`, age: id }),
  staleTime: Infinity,
  gcTime: Infinity,
});
const owners = (client: SyncClient, id = 1) =>
  client
    .inspectCache()
    .find(
      entry =>
        JSON.stringify(entry.queryKey) === JSON.stringify(['account', id])
    )?.owners;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}
afterEach(cleanup);

describe('Svelte createSyncQuery', () => {
  it('loads on selection, shares one handle for several stores, and releases on destroy', async () => {
    const client = createSyncClient();
    const read = deferred<Account>();
    const queryFn = vi.fn(() => read.promise);
    let q!: QueryObserverControls<Account>;
    const screen = render(QueryPanel, {
      client,
      options: { ...options(1), queryFn },
      onReady: (value: QueryObserverControls<Account>) => {
        q = value;
      },
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(1);
    expect(screen.getByTestId('label').textContent).toBe('waiting');
    read.resolve({ name: 'loaded', age: 3 });
    await waitFor(() =>
      expect(screen.getByTestId('label').textContent).toBe('loaded')
    );
    expect(screen.getByTestId('state').textContent).toBe('success:idle:null');
    screen.unmount();
    expect(q.handle()).toBeNull();
    await waitFor(() => expect(owners(client)).toBe(0));
  });

  it('does not own a handle before any selection', () => {
    const client = createSyncClient();
    const queryFn = vi.fn(options(1).queryFn);
    let q!: QueryObserverControls<Account>;
    render(QueryUnused, {
      client,
      options: { ...options(1), queryFn },
      onReady: (value: QueryObserverControls<Account>) => {
        q = value;
      },
    });
    expect(q.handle()).toBeNull();
    expect(client.size()).toBe(0);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('shares one pending READ between two components', async () => {
    const client = createSyncClient();
    let signal!: AbortSignal;
    const queryFn = vi.fn((context: { signal: AbortSignal }) => {
      signal = context.signal;
      return new Promise<Account>(() => {});
    });
    const first = render(QueryPanel, {
      client,
      options: { ...options(1), queryFn },
    });
    const second = render(QueryPanel, {
      client,
      options: { ...options(1), queryFn },
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(2);
    first.unmount();
    await waitFor(() => expect(owners(client)).toBe(1));
    expect(signal.aborted).toBe(false);
    second.unmount();
    await waitFor(() => expect(owners(client)).toBe(0));
    expect(signal.aborted).toBe(true);
  });

  it('follows derived options and tracks a field first read on the new key', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    await client.prefetch(options(2));
    const id = writable(1);
    const source = derived(id, current => options(current));
    let q!: QueryObserverControls<Account>;
    const screen = render(QueryPanel, {
      client,
      options: source,
      onReady: (value: QueryObserverControls<Account>) => {
        q = value;
      },
    });
    const controls = q;
    expect(screen.getByTestId('label').textContent).toBe('name-1');
    id.set(2);
    expect(q.handle()?.queryKey).toEqual(['account', 2]);
    await tick();
    expect(screen.getByTestId('key').textContent).toBe('2');
    expect(screen.getByTestId('label').textContent).toBe('2');
    expect(q).toBe(controls);
    q.handle()!.ref.age.value = 99;
    await tick();
    expect(screen.getByTestId('label').textContent).toBe('99');
    screen.unmount();
    await waitFor(() => expect(owners(client, 2)).toBe(0));
    id.set(3);
    expect(client.inspectCache().some(entry => entry.queryKey[1] === 3)).toBe(
      false
    );
  });

  it('shows a missing new key separately from cached old data', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    const read = deferred<Account>();
    const queryFn = vi.fn(() => read.promise);
    const source = writable(options(1));
    const screen = render(QueryPanel, { client, options: source });
    source.set({ ...options(3), queryFn });
    await tick();
    expect(screen.getByTestId('key').textContent).toBe('3');
    expect(screen.getByTestId('label').textContent).toBe('waiting');
    expect(queryFn).toHaveBeenCalledTimes(1);
    read.resolve({ name: 'new', age: 3 });
    await waitFor(() =>
      expect(screen.getByTestId('label').textContent).toBe('new')
    );
  });

  it('starts its options store once and ends both options and view subscriptions on destroy', async () => {
    const client = createSyncClient();
    let starts = 0;
    let stops = 0;
    let publish!: (value: ObserveOptions<Account>) => void;
    const source = readable(options(1), set => {
      starts += 1;
      publish = set;
      return () => {
        stops += 1;
      };
    });
    let selections = 0;
    const screen = render(QueryPanel, {
      client,
      options: source,
      onSelect: () => {
        selections += 1;
      },
    });
    expect(starts).toBe(1);
    expect(stops).toBe(0);
    await waitFor(() =>
      expect(screen.getByTestId('label').textContent).toBe('name-1')
    );
    screen.unmount();
    expect(stops).toBe(1);
    await waitFor(() => expect(owners(client)).toBe(0));
    const before = selections;
    publish(options(3));
    await tick();
    expect(selections).toBe(before);
    expect(client.size()).toBe(1);
  });

  it('releases an options store even when no view was selected', () => {
    const client = createSyncClient();
    let starts = 0;
    let stops = 0;
    const source = readable(options(1), () => {
      starts += 1;
      return () => {
        stops += 1;
      };
    });
    const screen = render(QueryUnused, { client, options: source });
    expect(starts).toBe(1);
    screen.unmount();
    expect(stops).toBe(1);
    expect(client.size()).toBe(0);
  });

  it('cleans up the options subscription if observer initialization fails', () => {
    const client: SyncClient = {
      ...createSyncClient(),
      observe: () => {
        throw new Error('broken observe');
      },
    };
    let stops = 0;
    const source = readable(options(1), () => () => {
      stops += 1;
    });
    expect(() => render(QueryPanel, { client, options: source })).toThrow(
      'broken observe'
    );
    expect(stops).toBe(1);
  });

  it('enables and disables through its options store', async () => {
    const client = createSyncClient();
    const queryFn = vi.fn(options(1).queryFn);
    const source = writable({ ...options(1), enabled: false, queryFn });
    let q!: QueryObserverControls<Account>;
    const screen = render(QueryPanel, {
      client,
      options: source,
      onReady: (value: QueryObserverControls<Account>) => {
        q = value;
      },
    });
    expect(client.size()).toBe(0);
    expect(screen.getByTestId('state').textContent).toBe('pending:idle:null');
    source.set({ ...options(1), enabled: true, queryFn });
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(1);
    source.set({ ...options(1), enabled: false, queryFn });
    expect(q.handle()).toBeNull();
    await waitFor(() => expect(owners(client)).toBe(0));
  });

  it('reprojects store options without reopening a fresh key', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    const projection = (prefix: string): ObserveOptions<Account> => ({
      ...options(1),
      select: data => ({ ...data, name: prefix + data.name }),
    });
    const source = writable(projection('a:'));
    let q!: QueryObserverControls<Account>;
    const screen = render(QueryPanel, {
      client,
      options: source,
      onReady: (value: QueryObserverControls<Account>) => {
        q = value;
      },
    });
    const handle = q.handle();
    expect(screen.getByTestId('label').textContent).toBe('a:name-1');
    source.set(projection('b:'));
    await tick();
    expect(screen.getByTestId('label').textContent).toBe('b:name-1');
    expect(q.handle()).toBe(handle);
  });

  it('shows invalid source options and recovers through the store', async () => {
    const client = createSyncClient();
    const queryFn = vi.fn(options(1).queryFn);
    const source = writable({
      ...options(1),
      queryKey: ['account', undefined] as never,
      queryFn,
    });
    const screen = render(QueryPanel, { client, options: source });
    expect(screen.getByTestId('state').textContent).toBe('error:idle:source');
    expect(queryFn).not.toHaveBeenCalled();
    expect(client.size()).toBe(0);
    source.set({ ...options(1), queryKey: ['account', 1] as never, queryFn });
    await waitFor(() =>
      expect(screen.getByTestId('label').textContent).toBe('name-1')
    );
  });

  it('reports an old shared client before subscribing to the options store', () => {
    const client = {
      ...createSyncClient(),
      observe: undefined,
    } as unknown as SyncClient;
    const subscribe = vi.fn();
    const source = { subscribe } as unknown as Readable<
      ObserveOptions<Account>
    >;
    expect(() => createSyncQuery(client, source)).toThrow(
      'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
    );
    expect(subscribe).not.toHaveBeenCalled();
  });
});
