import * as React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { createSyncClient } from '@stateref/sync';
import type { QueryObserverControls, SyncClient } from '@stateref/sync';
import { useSyncQuery } from '@/sync';

type Account = { name: string; age: number };
const Boundary = (
  React as unknown as {
    Activity?: React.ComponentType<{
      mode: 'visible' | 'hidden';
      children: React.ReactNode;
    }>;
  }
).Activity!;
const owners = (client: SyncClient, id = 1) =>
  client.inspectCache().find(entry => entry.queryKey[1] === id)?.owners;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

if (import.meta.vitest) {
  const { afterEach, describe, expect, it, vi } = import.meta.vitest;
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('query Activity (T-QH-40, T-QH-41)', () => {
    it.skipIf(!Boundary).each([true, false])(
      'releases when hidden and reloads only a stale key (fresh=%s)',
      async fresh => {
        const client = createSyncClient();
        const queryFn = vi.fn(() => ({ name: 'loaded', age: 1 }));
        const options = {
          queryKey: ['account', 1],
          queryFn,
          staleTime: fresh ? Infinity : 0,
          gcTime: Infinity,
        };
        await client.prefetch(options);
        queryFn.mockClear();
        let q!: QueryObserverControls<Account>;
        function Panel() {
          const [display, controls] = useSyncQuery(client, options);
          q = controls;
          return <p>{display.data.name.value}</p>;
        }
        const tree = (mode: 'visible' | 'hidden') => (
          <Boundary mode={mode}>
            <Panel />
          </Boundary>
        );
        const screen = render(tree('visible'));
        await act(async () => {});
        expect(owners(client)).toBe(1);
        expect(queryFn).toHaveBeenCalledTimes(fresh ? 0 : 1);
        const controls = q;
        await act(async () => {
          screen.rerender(tree('hidden'));
        });
        await waitFor(() => expect(owners(client)).toBe(0));
        expect(q.handle()).toBeNull();
        const before = queryFn.mock.calls.length;
        await act(async () => {
          screen.rerender(tree('visible'));
        });
        expect(q).toBe(controls);
        expect(owners(client)).toBe(1);
        expect(queryFn).toHaveBeenCalledTimes(before + (fresh ? 0 : 1));
        expect(screen.container.textContent).toBe('loaded');
        screen.unmount();
        await waitFor(() => expect(owners(client)).toBe(0));
      }
    );

    it.skipIf(!Boundary)(
      'confirms a hidden key change before reconnecting effects',
      async () => {
        const client = createSyncClient();
        const pending = deferred<Account>();
        const reads: number[] = [];
        const signals: AbortSignal[] = [];
        const renders: number[] = [];
        let q!: QueryObserverControls<Account>;
        function Panel({ id }: { id: number }) {
          renders.push(id);
          const [display, controls] = useSyncQuery(client, {
            queryKey: ['account', id],
            retry: 0,
            gcTime: Infinity,
            queryFn: ({ signal }) => {
              reads.push(id);
              signals.push(signal);
              return id === 1 ? { name: 'one', age: 1 } : pending.promise;
            },
          });
          q = controls;
          return (
            <p>
              {id}:{display.data.name.value ?? 'waiting'}
            </p>
          );
        }
        const tree = (mode: 'visible' | 'hidden', id: number) => (
          <Boundary mode={mode}>
            <Panel id={id} />
          </Boundary>
        );
        const screen = render(tree('visible', 1));
        await waitFor(() => expect(screen.container.textContent).toBe('1:one'));
        const controls = q;
        await act(async () => {
          screen.rerender(tree('hidden', 1));
        });
        await waitFor(() => expect(owners(client)).toBe(0));
        const oldOwnerEvents: number[] = [];
        const stop = client.subscribeCache(event => {
          if (event.type === 'updated' && event.entry.queryKey[1] === 1)
            oldOwnerEvents.push(event.entry.owners);
        });
        try {
          await act(async () => {
            screen.rerender(tree('hidden', 2));
          });
          expect(renders).toContain(2);
          expect(reads).toEqual([1]);
          expect(owners(client, 2)).toBeUndefined();
          expect(q.handle()).toBeNull();
          await act(async () => {
            screen.rerender(tree('visible', 2));
          });
          expect(q).toBe(controls);
          expect(q.handle()?.queryKey).toEqual(['account', 2]);
          expect(owners(client, 2)).toBe(1);
          expect(oldOwnerEvents.every(count => count === 0)).toBe(true);
          expect(reads).toEqual([1, 2]);
          expect(signals.every(signal => !signal.aborted)).toBe(true);
          expect(screen.container.textContent).toBe('2:waiting');
          await act(async () => {
            pending.resolve({ name: 'two', age: 2 });
          });
          expect(screen.container.textContent).toBe('2:two');
        } finally {
          stop();
          screen.unmount();
        }
        await waitFor(() => expect(owners(client, 2)).toBe(0));
      }
    );
  });

  describe('query races and explicit handles (T-QH-43, T-QH-44)', () => {
    it('displays a failed automatic load and recovers through refetch', async () => {
      const client = createSyncClient();
      const failure = new Error('offline');
      let fail = true;
      const queryFn = vi.fn(async () => {
        if (fail) throw failure;
        return { name: 'recovered', age: 1 };
      });
      let q!: QueryObserverControls<Account>;
      function Panel() {
        const [display, controls] = useSyncQuery(client, {
          queryKey: ['account', 1],
          queryFn,
          retry: 0,
          gcTime: Infinity,
        });
        q = controls;
        return (
          <p>
            {display.status.value}:{String(display.errorSource.value)}:
            {display.data.name.value ?? 'waiting'}
          </p>
        );
      }
      const screen = render(<Panel />);
      await waitFor(() =>
        expect(screen.container.textContent).toBe('error:query:waiting')
      );
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(q.handle()?.status.value.error).toBe(failure);
      fail = false;
      await act(async () => {
        expect(await q.refetch()).toEqual({ name: 'recovered', age: 1 });
      });
      expect(screen.container.textContent).toBe('success:null:recovered');
      expect(queryFn).toHaveBeenCalledTimes(2);
      screen.unmount();
      await waitFor(() => expect(owners(client)).toBe(0));
    });

    it('keeps a readonly explicit handle intact when an editable hook conflicts', async () => {
      const client = createSyncClient();
      const explicitFn = vi.fn(() => ({ name: 'readonly', age: 1 }));
      const options = {
        queryKey: ['account', 1],
        staleTime: Infinity,
        gcTime: Infinity,
      };
      const explicit = client.query({
        ...options,
        queryFn: explicitFn,
        editable: false,
      });
      await explicit.load();
      const queryFn = vi.fn(() => ({ name: 'unexpected', age: 2 }));
      let q!: QueryObserverControls<Account>;
      function Panel({ editable }: { editable: boolean }) {
        const [display, controls] = useSyncQuery(client, {
          ...options,
          queryFn,
          editable,
        });
        q = controls;
        return (
          <p>
            {display.status.value}:{String(display.errorSource.value)}:
            {display.data.name.value ?? 'waiting'}
          </p>
        );
      }
      const screen = render(<Panel editable />);
      try {
        expect(screen.container.textContent).toBe('error:source:waiting');
        expect(q.handle()).toBeNull();
        expect(owners(client)).toBe(1);
        expect(explicit.ref.name.value).toBe('readonly');
        expect(explicitFn).toHaveBeenCalledTimes(1);
        expect(queryFn).not.toHaveBeenCalled();
        screen.rerender(<Panel editable={false} />);
        expect(screen.container.textContent).toBe('success:null:readonly');
        expect(q.handle()).not.toBeNull();
        expect(owners(client)).toBe(2);
        expect(queryFn).not.toHaveBeenCalled();
        screen.unmount();
        await waitFor(() => expect(owners(client)).toBe(1));
      } finally {
        screen.unmount();
        explicit.dispose();
      }
      expect(owners(client)).toBe(0);
    });

    it.each(['hook', 'explicit'] as const)(
      'releasing the %s owner leaves the other READ alive',
      async released => {
        const client = createSyncClient();
        const answer = deferred<Account>();
        let signal!: AbortSignal;
        const queryFn = vi.fn((context: { signal: AbortSignal }) => {
          signal = context.signal;
          return answer.promise;
        });
        const options = { queryKey: ['account', 1], queryFn, gcTime: Infinity };
        const explicit = client.query(options);
        const loading = explicit.load();
        void loading.catch(() => {});
        let q!: QueryObserverControls<Account>;
        function Panel() {
          const [display, controls] = useSyncQuery(client, options);
          q = controls;
          return <p>{display.data.name.value ?? 'waiting'}</p>;
        }
        const screen = render(<Panel />);
        try {
          expect(owners(client)).toBe(2);
          expect(queryFn).toHaveBeenCalledTimes(1);
          if (released === 'hook') screen.unmount();
          else explicit.dispose();
          await waitFor(() => expect(owners(client)).toBe(1));
          expect(signal.aborted).toBe(false);
          if (released === 'hook') expect(q.handle()).toBeNull();
          else expect(q.handle()).not.toBeNull();
          await act(async () => {
            answer.resolve({ name: 'shared', age: 1 });
            await loading;
          });
          if (released === 'hook') {
            expect(explicit.ref.name.value).toBe('shared');
            expect(await explicit.refetch()).toEqual({
              name: 'shared',
              age: 1,
            });
          } else {
            expect(screen.container.textContent).toBe('shared');
            act(() => {
              q.handle()!.ref.name.value = 'edited';
            });
            expect(screen.container.textContent).toBe('edited');
            await act(async () => {
              await q.refetch();
            });
            expect(screen.container.textContent).toBe('edited');
          }
          expect(queryFn).toHaveBeenCalledTimes(2);
        } finally {
          screen.unmount();
          explicit.dispose();
        }
        await waitFor(() => expect(owners(client)).toBe(0));
      }
    );
  });

  describe('committed key round trips (T-QH-45)', () => {
    it.each([false, true])(
      'shares or restarts key 1 across the release boundary (released=%s)',
      async released => {
        const client = createSyncClient();
        const releases: (() => void)[] = [];
        const observed: SyncClient = {
          ...client,
          observe: options =>
            client.observe(options, {
              scheduleRelease: release => releases.push(release),
            }),
        };
        const signals = new Map<number, AbortSignal[]>();
        const reads: number[] = [];
        const firstOwnerEvents: number[] = [];
        const stop = client.subscribeCache(event => {
          if (event.type === 'updated' && event.entry.queryKey[1] === 1)
            firstOwnerEvents.push(event.entry.owners);
        });
        let q!: QueryObserverControls<Account>;
        function Panel({ id }: { id: number }) {
          const [display, controls] = useSyncQuery(observed, {
            queryKey: ['account', id],
            gcTime: Infinity,
            queryFn: ({ signal }) => {
              reads.push(id);
              signals.set(id, [...(signals.get(id) ?? []), signal]);
              return new Promise<Account>(() => {});
            },
          });
          q = controls;
          return (
            <p>
              {String(display.queryKey.value?.[1])}:{display.fetchStatus.value}
            </p>
          );
        }
        const screen = render(<Panel id={1} />);
        try {
          const firstHandle = q.handle();
          screen.rerender(<Panel id={2} />);
          expect(q.handle()?.queryKey).toEqual(['account', 2]);
          expect(screen.container.textContent).toBe('2:fetching');
          expect(releases).toHaveLength(1);
          if (released) releases.shift()!();
          expect(signals.get(1)![0].aborted).toBe(released);
          screen.rerender(<Panel id={1} />);
          expect(q.handle()?.queryKey).toEqual(['account', 1]);
          expect(q.handle() !== firstHandle).toBe(true);
          expect(screen.container.textContent).toBe('1:fetching');
          expect(reads.filter(id => id === 1)).toHaveLength(released ? 2 : 1);
          expect(reads.filter(id => id === 2)).toHaveLength(1);
          for (const release of releases.splice(0)) release();
          expect(owners(client, 1)).toBe(1);
          expect(owners(client, 2)).toBe(0);
          expect(signals.get(1)!.at(-1)!.aborted).toBe(false);
          expect(signals.get(2)![0].aborted).toBe(true);
          await act(async () => {}); // Cache diagnostics are delivered in a microtask.
          expect(firstOwnerEvents.includes(0)).toBe(released);
        } finally {
          screen.unmount();
          for (const release of releases.splice(0)) release();
          stop();
        }
        expect(owners(client, 1)).toBe(0);
      }
    );
  });
}
