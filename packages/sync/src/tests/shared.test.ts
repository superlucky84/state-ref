/**
 * docs/shared-store: a provider that builds its store with this package is
 * consumed exactly like one that used `createStore`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ensureShared,
  getShared,
  isProvided,
  isReady,
  onShared,
  provideShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';
import { createSyncClient } from '../index';
import type { QueryDisplayState, SyncClient } from '../index';

type Sub = { id: number };

afterEach(() => {
  delete (globalThis as any)[Symbol.for('state-ref.shared')];
});

describe('a sync query behind a shared name', () => {
  it('shares the display watch: status and data in one tree', async () => {
    type Display = QueryDisplayState<Sub[]>;
    type Loaded = Display & { loaded: true; data: Sub[] };

    // Consumer bundle, loaded first.
    const stages: string[] = [];
    sharedWatch<Display, Loaded>('subs')(ref => {
      if (!isProvided(ref)) return void stages.push('pending');
      if (!isReady(ref)) return void stages.push(ref.fetchStatus.value);
      stages.push(`ready:${ref.data.value.length}`);
    });
    const opened: number[] = [];
    whenReady<Display>('subs', ref => opened.push(ref.data.value!.length));

    // Provider bundle.
    const query = createSyncClient({ ssr: true }).query({
      queryKey: ['subs'],
      queryFn: async (): Promise<Sub[]> => [{ id: 1 }, { id: 2 }],
    });
    provideShared('subs', query.watchDisplay, {
      ready: ref => ref.loaded.value,
    });
    expect(stages).toEqual(['pending', 'idle']);

    await query.load();
    expect(stages.at(-1)).toBe('ready:2');
    expect(opened).toEqual([2]);

    // A local edit on the provider's query reaches the consumer.
    query.ref.value = [{ id: 3 }];
    expect(stages.at(-1)).toBe('ready:1');
    expect(opened).toEqual([2]);
  });

  it('shares the editable data watch once the query has loaded', async () => {
    // A query's `watch` cannot be read before its first load, so the provider
    // provides it afterwards and the consumer stays pending until then.
    const lengths: number[] = [];
    const subsWatch = sharedWatch<Sub[]>('subs');
    subsWatch(ref => {
      if (isReady(ref)) lengths.push(ref.value.length);
    });

    const query = createSyncClient({ ssr: true }).query({
      queryKey: ['subs'],
      queryFn: async (): Promise<Sub[]> => [{ id: 1 }],
    });
    await query.load();
    provideShared('subs', query.watch);
    expect(lengths).toEqual([1]);

    // The consumer edits through the shared ref; the query records it.
    const ref = subsWatch();
    if (isProvided(ref)) ref.value = [{ id: 1 }, { id: 2 }];
    expect(lengths).toEqual([1, 2]);
    expect(query.isDirty()).toBe(true);
  });
});

describe('a sync client behind a shared name', () => {
  // What each bundle writes, once, in a module of its own.
  const sharedClient = () =>
    ensureShared('sync', () => createSyncClient({ ssr: true }));

  it('gives every bundle one client, whichever asks first', () => {
    const create = vi.fn(() => createSyncClient({ ssr: true }));
    const a = ensureShared('sync', create);
    const b = ensureShared('sync', create);
    expect(b).toBe(a);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('reads a key once however many bundles query it', async () => {
    const queryFn = vi.fn(async (): Promise<Sub[]> => [{ id: 1 }]);
    const options = { queryKey: ['subs'], queryFn };

    // Two bundles, the same lines, no provider and no consumer.
    const a = sharedClient().query(options);
    const b = sharedClient().query(options);

    await Promise.all([a.load(), b.load()]);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(b.ref.value).toEqual([{ id: 1 }]);
    expect(b.status.loaded.value).toBe(true);

    a.ref.value = [{ id: 9 }];
    expect(b.ref.value).toEqual([{ id: 9 }]);
  });

  it('lets any bundle run a mutation that refreshes another bundle query', async () => {
    let server: Sub[] = [{ id: 1 }];

    // One bundle shows the list.
    const subs = sharedClient().query({
      queryKey: ['subs'],
      queryFn: async () => server,
    });
    await subs.load();
    const shown: number[] = [];
    subs.watch(ref => {
      shown.push(ref.value.length);
    });

    // Another bundle subscribes, with the same API and no guard.
    const client = sharedClient();
    const subscribe = client.mutation({
      mutationFn: async (input: Sub) => {
        server = [...server, input];
        return input;
      },
      onSuccess: () => client.invalidate(['subs']),
    });
    expect((await subscribe.run({ id: 2 })).kind).toBe('success');
    await subs.refetch();
    expect(subs.ref.value).toEqual([{ id: 1 }, { id: 2 }]);
    expect(shown).toEqual([1, 2]);
  });

  it('still reaches a client through onShared and getShared', () => {
    const seen: SyncClient[] = [];
    onShared<SyncClient>('sync', client => seen.push(client));
    const client = sharedClient();
    expect(seen).toEqual([client]);
    expect(getShared<SyncClient>('sync')).toBe(client);
  });
});
