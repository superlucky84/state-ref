/** Query hook lifecycle, pure renders and key-specific path collection. */
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createSyncClient } from '@stateref/sync';
import type {
  ObserveOptions,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { useSyncQuery } from '@/sync';

type Account = { name: string; age: number };
const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));
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
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('react useSyncQuery', () => {
    it('shares the pending READ through StrictMode cleanup and remount', async () => {
      const client = createSyncClient();
      const signals: AbortSignal[] = [];
      const read = deferred<Account>();
      const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
        signals.push(signal);
        return read.promise;
      });
      function Panel() {
        const [display] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn,
          gcTime: Infinity,
        });
        return <p>{display.fetchStatus.value}</p>;
      }
      const screen = render(
        <StrictMode>
          <Panel />
        </StrictMode>
      );
      await act(async () => {
        await sleep(20);
      });
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(signals.every(signal => !signal.aborted)).toBe(true);
      expect(owners(client)).toBe(1);
      screen.unmount();
      await waitFor(() => expect(owners(client)).toBe(0));
      expect(signals[0].aborted).toBe(true);
    });

    it('hydrates cached server markup with the same initial fetchStatus', async () => {
      const server = createSyncClient({ ssr: true });
      const options = {
        queryKey: ['account', 1],
        queryFn: () => ({ name: 'hydrated', age: 3 }),
        staleTime: Infinity,
        gcTime: Infinity,
      };
      await server.prefetch(options);
      const client = createSyncClient();
      client.hydrate(server.dehydrate());
      const frames: string[] = [];
      const queryFn = vi.fn(options.queryFn);
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Panel({ client }: { client: SyncClient }) {
        const [display] = useSyncQuery(client, { ...options, queryFn });
        const text = `${display.fetchStatus.value}:${display.data.name.value}`;
        frames.push(text);
        return <p>{text}</p>;
      }
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Panel client={server} />);
      document.body.appendChild(container);
      const html = container.innerHTML;
      const screen = render(<Panel client={client} />, {
        container,
        hydrate: true,
      });
      expect(frames[0]).toBe('idle:hydrated');
      expect(frames[1]).toBe(frames[0]);
      expect(screen.container.innerHTML).toBe(html);
      expect(queryFn).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    });

    it('starts idle without cache writes during render, loads on commit, and releases on unmount', async () => {
      const client = createSyncClient();
      const read = deferred<Account>();
      const queryFn = vi.fn(() => read.promise);
      const frames: { status: string; fetching: string; size: number }[] = [];
      let controls!: QueryObserverControls<Account>;
      function Panel() {
        const [display, q] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn,
          gcTime: Infinity,
        });
        controls = q;
        frames.push({
          status: display.status.value,
          fetching: display.fetchStatus.value,
          size: client.size(),
        });
        return <p>{display.data.name.value ?? 'waiting'}</p>;
      }
      const screen = render(<Panel />);
      expect(frames[0]).toEqual({
        status: 'pending',
        fetching: 'idle',
        size: 0,
      });
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(owners(client)).toBe(1);
      const firstControls = controls;
      await act(async () => {
        read.resolve({ name: 'Lee', age: 3 });
      });
      expect(screen.container.textContent).toBe('Lee');
      expect(controls).toBe(firstControls);
      expect(controls.handle()?.queryKey).toEqual(['account', 1]);
      screen.unmount();
      expect(controls.handle()).toBeNull();
      await waitFor(() => expect(owners(client)).toBe(0));
    });

    it('shares one pending READ across two component observers', async () => {
      const client = createSyncClient();
      const read = deferred<Account>();
      const queryFn = vi.fn(() => read.promise);
      function Panel() {
        const [display] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn,
          gcTime: Infinity,
        });
        return <span>{display.data.name.value ?? 'waiting'}</span>;
      }
      const screen = render(
        <div>
          <Panel />
          <Panel />
        </div>
      );
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(owners(client)).toBe(2);
      await act(async () => {
        read.resolve({ name: 'shared', age: 3 });
      });
      expect(screen.container.textContent).toBe('sharedshared');
      screen.unmount();
      await waitFor(() => expect(owners(client)).toBe(0));
    });

    it.each([true, false])(
      'shows the new key in its first render (cached=%s)',
      async cached => {
        const client = createSyncClient();
        const options = (id: number): ObserveOptions<Account> => ({
          queryKey: ['account', id],
          queryFn: id === 1 ? () => ({ name: 'old', age: 1 }) : queryFn,
          staleTime: Infinity,
          gcTime: Infinity,
        });
        const read = deferred<Account>();
        const queryFn = vi.fn(() => read.promise);
        await client.prefetch(options(1));
        if (cached)
          await client.prefetch({
            ...options(2),
            queryFn: () => ({ name: 'cached', age: 2 }),
          });
        const frames: {
          id: number;
          name: string | undefined;
          key: unknown;
          reads: number;
        }[] = [];
        function Panel({ id }: { id: number }) {
          const [display] = useSyncQuery(client, options(id));
          const name = display.data.name.value;
          frames.push({
            id,
            name,
            key: display.queryKey.value,
            reads: queryFn.mock.calls.length,
          });
          return <p>{name ?? 'waiting'}</p>;
        }
        const screen = render(<Panel id={1} />);
        const before = frames.length;
        screen.rerender(<Panel id={2} />);
        expect(frames[before]).toEqual({
          id: 2,
          name: cached ? 'cached' : undefined,
          key: ['account', 2],
          reads: 0,
        });
        expect(
          frames
            .slice(before)
            .every(frame => frame.id === 2 && frame.name !== 'old')
        ).toBe(true);
        expect(queryFn).toHaveBeenCalledTimes(cached ? 0 : 1);
        if (!cached) {
          await act(async () => {
            read.resolve({ name: 'new', age: 2 });
          });
          expect(screen.container.textContent).toBe('new');
        } else expect(screen.container.textContent).toBe('cached');
      }
    );

    it('collects a field first read on the new key and reacts to its later edit', async () => {
      const client = createSyncClient();
      const options = (id: number) => ({
        queryKey: ['account', id],
        queryFn: () => ({ name: 'Lee', age: id }),
        staleTime: Infinity,
        gcTime: Infinity,
      });
      await client.prefetch(options(1));
      await client.prefetch(options(2));
      let controls!: QueryObserverControls<Account>;
      function Panel({ id }: { id: number }) {
        const [display, q] = useSyncQuery(client, options(id));
        controls = q;
        return (
          <p>{id === 1 ? display.data.name.value : display.data.age.value}</p>
        );
      }
      const screen = render(<Panel id={1} />);
      const firstControls = controls;
      screen.rerender(<Panel id={2} />);
      expect(screen.container.textContent).toBe('2');
      expect(controls).toBe(firstControls);
      act(() => {
        controls.handle()!.ref.age.value = 99;
      });
      expect(screen.container.textContent).toBe('99');
    });

    it('keeps an inline query and projection from causing repeated READs or renders', async () => {
      const client = createSyncClient();
      let reads = 0;
      let renders = 0;
      function Panel({ tick }: { tick: number }) {
        renders += 1;
        const [display] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn: () => {
            reads += 1;
            return { name: 'Lee', age: 3 };
          },
          select: data => ({ label: data.name }),
          retryDelay: n => n,
          initialData: { name: 'Lee', age: 3 },
          gcTime: Infinity,
        });
        return (
          <p>
            {tick}:{display.data.label.value}
          </p>
        );
      }
      const screen = render(<Panel tick={0} />);
      await act(async () => {});
      for (let tick = 1; tick < 4; tick += 1)
        screen.rerender(<Panel tick={tick} />);
      const count = renders;
      await act(async () => {
        await sleep(20);
      });
      expect(reads).toBe(1);
      expect(renders).toBe(count);
      expect(screen.container.textContent).toBe('3:Lee');
    });

    it('switches enabled in the first render and owns a handle only while enabled', async () => {
      const client = createSyncClient();
      const queryFn = vi.fn(() => ({ name: 'Lee', age: 3 }));
      const frames: { enabled: boolean; status: string }[] = [];
      let controls!: QueryObserverControls<Account>;
      function Panel({ enabled }: { enabled: boolean }) {
        const [display, q] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn,
          enabled,
          gcTime: Infinity,
        });
        controls = q;
        frames.push({
          enabled: display.enabled.value,
          status: display.status.value,
        });
        return <p>{display.status.value}</p>;
      }
      const screen = render(<Panel enabled={false} />);
      expect(client.size()).toBe(0);
      expect(queryFn).not.toHaveBeenCalled();
      expect(controls.handle()).toBeNull();
      screen.rerender(<Panel enabled />);
      await act(async () => {});
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(controls.handle()).not.toBeNull();
      const before = frames.length;
      screen.rerender(<Panel enabled={false} />);
      expect(frames[before]).toEqual({ enabled: false, status: 'pending' });
      expect(controls.handle()).toBeNull();
      await waitFor(() => expect(owners(client)).toBe(0));
    });

    it.each(['key', 'enabled'])(
      'shows invalid %s options without snapshot loops',
      async invalid => {
        const client = createSyncClient();
        const queryFn = vi.fn(() => ({ name: 'Lee', age: 3 }));
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        let renders = 0;
        function Panel({ tick }: { tick: number }) {
          renders += 1;
          const [display] = useSyncQuery(client, {
            queryKey: ['account', invalid === 'key' ? undefined : 1] as never,
            enabled: (invalid === 'enabled' ? 'yes' : true) as never,
            queryFn,
          });
          return (
            <p>
              {tick}:{display.status.value}:{display.errorSource.value}
            </p>
          );
        }
        const screen = render(<Panel tick={0} />);
        expect(screen.container.textContent).toBe('0:error:source');
        for (let tick = 1; tick < 4; tick += 1)
          screen.rerender(<Panel tick={tick} />);
        const count = renders;
        await act(async () => {
          await sleep(20);
        });
        expect(renders).toBe(count);
        expect(queryFn).not.toHaveBeenCalled();
        expect(client.size()).toBe(0);
        expect(errors).not.toHaveBeenCalled();
      }
    );

    it('confirms options and delivers subscription updates outside render', async () => {
      const client = createSyncClient();
      let rendering = false;
      let renderWrites = 0;
      let renderSubscriptions = 0;
      const observedClient: SyncClient = {
        ...client,
        observe: (options, settings) => {
          const observer = client.observe(options, settings);
          return {
            ...observer,
            setOptions: next => {
              if (rendering) renderWrites += 1;
              return observer.setOptions(next);
            },
            watch: (renew, config) => {
              if (!renew) return observer.watch(undefined, config);
              if (rendering) renderSubscriptions += 1;
              return observer.watch((ref, first) => {
                if (rendering) renderWrites += 1;
                return renew(ref, first);
              }, config);
            },
          };
        },
      };
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Panel({ id }: { id: number }) {
        rendering = true;
        const [display] = useSyncQuery(observedClient, {
          queryKey: ['account', id],
          queryFn: () => ({ name: String(id), age: id }),
          gcTime: Infinity,
        });
        const name = display.data.name.value;
        rendering = false;
        return <p>{name}</p>;
      }
      const screen = render(
        <StrictMode>
          <Panel id={1} />
        </StrictMode>
      );
      await act(async () => {});
      screen.rerender(
        <StrictMode>
          <Panel id={2} />
        </StrictMode>
      );
      await act(async () => {});
      expect(screen.container.textContent).toBe('2');
      expect(renderWrites).toBe(0);
      expect(renderSubscriptions).toBe(0);
      expect(errors).not.toHaveBeenCalled();
    });

    it('reports a client replacement explicitly', () => {
      const first = createSyncClient();
      const second = createSyncClient();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      function Panel({ client }: { client: SyncClient }) {
        useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn: () => ({ name: 'Lee', age: 3 }),
          enabled: false,
        });
        return <p />;
      }
      const screen = render(<Panel client={first} />);
      expect(() => screen.rerender(<Panel client={second} />)).toThrow(
        'This query observer is bound to another client.'
      );
    });

    it('reports a shared client from an old sync bundle explicitly', () => {
      const client = {
        ...createSyncClient(),
        observe: undefined,
      } as unknown as SyncClient;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      function Panel() {
        useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn: () => ({ name: 'Lee', age: 3 }),
        });
        return <p />;
      }
      expect(() => render(<Panel />)).toThrow(
        'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
      );
    });
  });
}
