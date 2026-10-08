/**
 * docs/shared-store: a provider that builds its store with this package is
 * consumed exactly like one that used `createStore`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getShared,
  isProvided,
  isReady,
  onShared,
  provideShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';
import { createSyncClient } from '../index';
import type { QueryDisplayState, QueryHandle, SyncClient } from '../index';

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
  it('gives every bundle one cache, so one read serves both', async () => {
    const queryFn = vi.fn(async (): Promise<Sub[]> => [{ id: 1 }]);
    const options = { queryKey: ['subs'], queryFn };

    // Consumer bundle, loaded first: it queries as soon as the client exists.
    let consumer!: QueryHandle<Sub[]>;
    onShared<SyncClient>('sync', client => {
      consumer = client.query(options);
    });

    // Provider bundle.
    const provider = provideShared(
      'sync',
      createSyncClient({ ssr: true })
    ).query(options);

    await Promise.all([provider.load(), consumer.load()]);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(consumer.ref.value).toEqual([{ id: 1 }]);

    provider.ref.value = [{ id: 9 }];
    expect(consumer.ref.value).toEqual([{ id: 9 }]);
  });

  it('lets a consumer run a mutation and refresh the provider query', async () => {
    let server: Sub[] = [{ id: 1 }];
    const client = provideShared('sync', createSyncClient({ ssr: true }));
    const subs = client.query({
      queryKey: ['subs'],
      queryFn: async () => server,
    });
    await subs.load();

    // Consumer bundle.
    const shared = getShared<SyncClient>('sync')!;
    const subscribe = shared.mutation({
      mutationFn: async (input: Sub) => {
        server = [...server, input];
        return input;
      },
      onSuccess: () => shared.invalidate(['subs']),
    });
    expect((await subscribe.run({ id: 2 })).kind).toBe('success');
    await subs.refetch();
    expect(subs.ref.value).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
