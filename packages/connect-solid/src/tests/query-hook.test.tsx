import { createRenderEffect, createRoot, createSignal } from 'solid-js';
import { render, cleanup, waitFor } from '@solidjs/testing-library';
import { createSyncClient } from '@stateref/sync';
import type {
  ObserveOptions,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { createSyncQuery } from '@/sync';

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

if (import.meta.vitest) {
  const { describe, it, expect, afterEach, vi } = import.meta.vitest;
  afterEach(cleanup);
  describe('Solid createSyncQuery', () => {
    it('waits for a selection to attach, and several selections share one handle', async () => {
      const client = createSyncClient();
      const read = deferred<Account>();
      const queryFn = vi.fn(() => read.promise);
      let q!: QueryObserverControls<Account>;
      function Panel() {
        const [account, controls] = createSyncQuery(client, {
          ...options(1),
          queryFn,
        });
        q = controls;
        expect(client.size()).toBe(0);
        expect(q.handle()).toBeNull();
        const name = account(display => display.data.name.value);
        const status = account(display => display.status.value);
        return (
          <p>
            {status()}:{name() ?? 'waiting'}
          </p>
        );
      }
      const screen = render(() => <Panel />);
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(owners(client)).toBe(1);
      expect(screen.container.textContent).toBe('pending:waiting');
      read.resolve({ name: 'loaded', age: 3 });
      await waitFor(() =>
        expect(screen.container.textContent).toBe('success:loaded')
      );
      screen.unmount();
      expect(q.handle()).toBeNull();
      await waitFor(() => expect(owners(client)).toBe(0));
    });

    it('confirms an accessor synchronously and collects a new key field', async () => {
      const client = createSyncClient();
      await client.prefetch(options(1));
      await client.prefetch(options(2));
      const [id, setId] = createSignal(1);
      let q!: QueryObserverControls<Account>;
      function Panel() {
        const [account, controls] = createSyncQuery(client, () =>
          options(id())
        );
        q = controls;
        const label = account(display =>
          display.queryKey.value?.[1] === 1
            ? display.data.name.value
            : display.data.age.value
        );
        return <p>{label()}</p>;
      }
      const screen = render(() => <Panel />);
      const handle = q.handle();
      expect(screen.container.textContent).toBe('name-1');
      setId(2);
      expect(q.handle()?.queryKey).toEqual(['account', 2]);
      expect(q.handle()).not.toBe(handle);
      expect(screen.container.textContent).toBe('2');
      q.handle()!.ref.age.value = 99;
      expect(screen.container.textContent).toBe('99');
      screen.unmount();
      await waitFor(() => expect(owners(client, 2)).toBe(0));
      setId(3);
      expect(client.inspectCache().some(entry => entry.queryKey[1] === 3)).toBe(
        false
      );
    });

    it('keeps a missing new key separate from the old data', async () => {
      const client = createSyncClient();
      await client.prefetch(options(1));
      const read = deferred<Account>();
      const queryFn = vi.fn(() => read.promise);
      const [id, setId] = createSignal(1);
      function Panel() {
        const [account] = createSyncQuery(client, () => ({
          ...options(id()),
          queryFn,
        }));
        const text = account(
          display =>
            `${display.queryKey.value?.[1]}:${
              display.data.name.value ?? 'waiting'
            }`
        );
        return <p>{text()}</p>;
      }
      const screen = render(() => <Panel />);
      setId(2);
      expect(screen.container.textContent).toBe('2:waiting');
      expect(queryFn).toHaveBeenCalledTimes(1);
      read.resolve({ name: 'new', age: 2 });
      await waitFor(() => expect(screen.container.textContent).toBe('2:new'));
    });

    it('shares a READ across owners and releases only the disposed owner', async () => {
      const client = createSyncClient();
      let signal!: AbortSignal;
      const queryFn = vi.fn((context: { signal: AbortSignal }) => {
        signal = context.signal;
        return new Promise<Account>(() => {});
      });
      const mount = () =>
        createRoot(dispose => {
          const [account, q] = createSyncQuery(client, {
            ...options(1),
            queryFn,
          });
          account(display => display.fetchStatus.value);
          return { dispose, q };
        });
      const first = mount();
      const second = mount();
      try {
        expect(queryFn).toHaveBeenCalledTimes(1);
        expect(owners(client)).toBe(2);
        first.dispose();
        await waitFor(() => expect(owners(client)).toBe(1));
        expect(signal.aborted).toBe(false);
        expect(second.q.handle()).not.toBeNull();
      } finally {
        first.dispose();
        second.dispose();
      }
      await waitFor(() => expect(owners(client)).toBe(0));
      expect(signal.aborted).toBe(true);
    });

    it('does not attach an unused observer, even when its accessor changes', () => {
      const client = createSyncClient();
      const [id, setId] = createSignal(1);
      const mounted = createRoot(dispose => {
        const [, q] = createSyncQuery(client, () => options(id()));
        return { dispose, q };
      });
      try {
        setId(2);
        expect(mounted.q.handle()).toBeNull();
        expect(client.size()).toBe(0);
      } finally {
        mounted.dispose();
      }
    });

    it('confirms the new key before a dependent render computation runs', async () => {
      const client = createSyncClient();
      await client.prefetch(options(1));
      await client.prefetch(options(2));
      const [id, setId] = createSignal(1);
      const frames: { id: number; key: unknown; name: string | undefined }[] =
        [];
      const dispose = createRoot(dispose => {
        const [account] = createSyncQuery(client, () => options(id()));
        const selected = account(display => ({
          key: display.queryKey.value?.[1],
          name: display.data.name.value,
        }));
        createRenderEffect(() => frames.push({ id: id(), ...selected() }));
        return dispose;
      });
      try {
        frames.length = 0;
        setId(2);
        expect(frames.length).toBeGreaterThan(0);
        for (const frame of frames)
          expect(frame).toEqual({ id: 2, key: 2, name: 'name-2' });
      } finally {
        dispose();
      }
    });

    it('reprojects accessor options without reopening a fresh key', async () => {
      const client = createSyncClient();
      await client.prefetch(options(1));
      const [prefix, setPrefix] = createSignal('a:');
      const mounted = createRoot(dispose => {
        const [account, q] = createSyncQuery(client, () => {
          const current = prefix();
          const { queryKey, queryFn, staleTime, gcTime } = options(1);
          return {
            queryKey,
            queryFn,
            staleTime,
            gcTime,
            select: data => current + data.name,
          };
        });
        return { dispose, q, name: account(display => display.data.value) };
      });
      try {
        const handle = mounted.q.handle();
        expect(mounted.name()).toBe('a:name-1');
        setPrefix('b:');
        expect(mounted.name()).toBe('b:name-1');
        expect(mounted.q.handle()).toBe(handle);
      } finally {
        mounted.dispose();
      }
    });

    it('attaches and releases as the accessor enables and disables the query', async () => {
      const client = createSyncClient();
      const [enabled, setEnabled] = createSignal(false);
      const queryFn = vi.fn(options(1).queryFn);
      const mounted = createRoot(dispose => {
        const [account, q] = createSyncQuery(client, () => ({
          ...options(1),
          enabled: enabled(),
          queryFn,
        }));
        return {
          dispose,
          q,
          active: account(display => display.enabled.value),
        };
      });
      try {
        expect(client.size()).toBe(0);
        expect(mounted.active()).toBe(false);
        setEnabled(true);
        expect(queryFn).toHaveBeenCalledTimes(1);
        expect(owners(client)).toBe(1);
        setEnabled(false);
        expect(mounted.active()).toBe(false);
        expect(mounted.q.handle()).toBeNull();
        await waitFor(() => expect(owners(client)).toBe(0));
      } finally {
        mounted.dispose();
      }
    });

    it('shows an invalid source without READs and can recover through its accessor', async () => {
      const client = createSyncClient();
      const [id, setId] = createSignal<number | undefined>(undefined);
      const queryFn = vi.fn(options(1).queryFn);
      const mounted = createRoot(dispose => {
        const [account, q] = createSyncQuery(client, () => ({
          ...options(1),
          queryKey: ['account', id()] as never,
          queryFn,
        }));
        return {
          dispose,
          q,
          status: account(
            display => `${display.status.value}:${display.errorSource.value}`
          ),
        };
      });
      try {
        expect(mounted.status()).toBe('error:source');
        expect(queryFn).not.toHaveBeenCalled();
        expect(client.size()).toBe(0);
        setId(1);
        expect(mounted.q.handle()?.queryKey).toEqual(['account', 1]);
        await waitFor(() => expect(mounted.status()).toBe('success:null'));
      } finally {
        mounted.dispose();
      }
    });

    it('reports an old shared client explicitly', () => {
      const client = {
        ...createSyncClient(),
        observe: undefined,
      } as unknown as SyncClient;
      expect(() => createSyncQuery(client, options(1))).toThrow(
        'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
      );
    });
  });
}
