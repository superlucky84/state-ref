import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';
import type { SyncSnapshot } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

afterEach(() => vi.useRealTimers());

describe('clean server baseline hydration', () => {
  it('round-trips a settled SSR result with its freshness time and client isolation', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const server = createSyncClient({ ssr: true });
    const source = server.query({
      queryKey: ['account', { id: 1 }],
      queryFn: () => ({ city: '서울' }),
      staleTime: 500,
    });
    await source.load();
    const snapshot = JSON.parse(
      JSON.stringify(server.dehydrate())
    ) as SyncSnapshot;
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      capturedAt: 1000,
      queries: [
        { updatedAt: 1000, invalidated: false, data: { city: '서울' } },
      ],
    });

    const browser = createSyncClient();
    browser.hydrate(snapshot);
    expect(browser.size()).toBe(1);
    const fetch = vi.fn(() => ({ city: '부산' }));
    const restored = browser.query({
      queryKey: ['account', { id: 1 }],
      queryFn: fetch,
      staleTime: 500,
    });
    expect(restored.ref.city.value).toBe('서울');
    expect(restored.status.fetchStatus.value).toBe('idle');
    expect(restored.status.updatedAt.value).toBe(1000);
    await restored.load();
    expect(fetch).not.toHaveBeenCalled();
    vi.setSystemTime(1500);
    await restored.load();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(restored.ref.city.value).toBe('부산');
    expect(source.ref.city.value).toBe('서울');
    source.dispose();
    restored.dispose();
  });

  it('copies data so a snapshot and two restored clients do not share objects', async () => {
    const server = createSyncClient({ ssr: true });
    const query = server.query({
      queryKey: ['copy'],
      queryFn: () => ({ nested: { n: 1 } }),
    });
    await query.load();
    const snapshot = server.dehydrate();
    const first = createSyncClient({ ssr: true });
    const second = createSyncClient({ ssr: true });
    first.hydrate(snapshot);
    second.hydrate(snapshot);
    const a = first.query({
      queryKey: ['copy'],
      queryFn: () => ({ nested: { n: 9 } }),
    });
    const b = second.query({
      queryKey: ['copy'],
      queryFn: () => ({ nested: { n: 9 } }),
    });
    a.ref.nested.n.value = 2;
    expect(a.ref.nested.n.value).toBe(2);
    expect(b.ref.nested.n.value).toBe(1);
    expect(query.ref.nested.n.value).toBe(1);
    expect(snapshot.queries[0].data).toEqual({ nested: { n: 1 } });
    query.dispose();
    a.dispose();
    b.dispose();
  });

  it('preserves invalidation so a restored load fetches a new baseline', async () => {
    const server = createSyncClient({ ssr: true });
    const source = server.query({
      queryKey: ['invalidated'],
      queryFn: () => ({ n: 1 }),
      staleTime: Infinity,
    });
    await source.load();
    source.invalidate();
    const snapshot = server.dehydrate();
    expect(snapshot.queries[0].invalidated).toBe(true);

    const browser = createSyncClient();
    browser.hydrate(snapshot);
    const fetch = vi.fn(() => ({ n: 2 }));
    const restored = browser.query({
      queryKey: ['invalidated'],
      queryFn: fetch,
      staleTime: Infinity,
    });
    expect(restored.ref.n.value).toBe(1);
    expect(restored.status.invalidated.value).toBe(true);
    await restored.load();
    expect(fetch).toHaveBeenCalledOnce();
    expect(restored.ref.n.value).toBe(2);
    source.dispose();
    restored.dispose();
  });

  it('rejects dirty, pending READ and linked WRITE state instead of dropping it', async () => {
    const client = createSyncClient({ ssr: true });
    const read = deferred<{ n: number }>();
    const query = client.query({
      queryKey: ['pending'],
      queryFn: () => read.promise,
    });
    const load = query.load();
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    read.resolve({ n: 1 });
    await load;
    query.ref.n.value = 2;
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    query.ref.n.value = 1;
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const result = mutation.run(1, {
      links: [{ query, accept: { kind: 'none' } }],
    });
    expect(query.status.pending.value).toBe(1);
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    write.resolve();
    expect((await result).kind).toBe('success');
    expect(query.status.unconfirmed.value).toBe(true);
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    query.acceptServer({ n: 3 });
    expect(query.status.unconfirmed.value).toBe(false);
    expect(client.dehydrate().queries).toHaveLength(1);
    query.dispose();
  });

  it('retains an unknown linked WRITE as unconfirmed until a successful READ', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockResolvedValueOnce({ n: 2 });
    const query = client.query<{ n: number }>({
      queryKey: ['unknown'],
      queryFn: read,
    });
    await query.load();
    const mutation = client.mutation({
      mutationFn: () => Promise.reject(new Error('offline')),
    });
    const result = await mutation.run(2, { links: [{ query }] });
    expect(result.kind).toBe('unknown');
    expect(query.status.unconfirmed.value).toBe(true);
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    await query.refetch();
    expect(query.status.unconfirmed.value).toBe(false);
    expect(client.dehydrate().queries[0].data).toEqual({ n: 2 });
    query.dispose();
  });

  it('keeps an unconfirmed entry past GC until an explicit server value is accepted', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const options = {
      queryKey: ['unconfirmed'],
      queryFn: () => ({ n: 1 }),
      gcTime: 10,
    };
    const query = client.query(options);
    await query.load();
    const outcome = await client
      .mutation({ mutationFn: () => Promise.reject(new Error('offline')) })
      .run(1, { links: [{ query }] });
    expect(outcome.kind).toBe('unknown');
    query.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(1);
    expect(client.remove(['unconfirmed'])).toBe(false);

    const restored = client.query(options);
    expect(restored.status.unconfirmed.value).toBe(true);
    restored.acceptServer({ n: 2 });
    expect(restored.status.unconfirmed.value).toBe(false);
    restored.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);
  });

  it('expires untouched hydrated entries on the normal client GC timer', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    client.hydrate({
      schemaVersion: 1,
      capturedAt: 1,
      queries: [
        {
          queryKey: ['unused'],
          data: { n: 1 },
          updatedAt: 1,
          invalidated: false,
          editable: true,
        },
      ],
    });
    await vi.advanceTimersByTimeAsync(299_999);
    expect(client.size()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(client.size()).toBe(0);
  });

  it('blocks dehydration after WRITE success when baseline reconciliation fails', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['sync-error'],
      queryFn: vi
        .fn()
        .mockResolvedValueOnce({ n: 1 })
        .mockRejectedValueOnce(new Error('read failed')),
    });
    await query.load();
    const result = await client
      .mutation({ mutationFn: () => ({ accepted: true }) })
      .run(2, { links: [{ query, accept: { kind: 'refetch' } }] });
    expect(result.kind).toBe('sync-error');
    expect(query.status.unconfirmed.value).toBe(true);
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    query.dispose();
  });

  it('validates the whole snapshot before changing an empty client', () => {
    const client = createSyncClient({ ssr: true });
    const good = {
      queryKey: ['one'],
      data: { n: 1 },
      updatedAt: 1,
      invalidated: false,
      editable: true,
    };
    const duplicate = { ...good, queryKey: ['one'] };
    const invalid = { ...good, queryKey: ['two'], data: { value: 1 } };
    expect(() =>
      client.hydrate({
        schemaVersion: 1,
        capturedAt: 1,
        queries: [good, duplicate],
      })
    ).toThrow('Repeated');
    expect(client.size()).toBe(0);
    expect(() =>
      client.hydrate({
        schemaVersion: 1,
        capturedAt: 1,
        queries: [good, invalid],
      })
    ).toThrow('reserved');
    expect(client.size()).toBe(0);
    expect(() =>
      client.hydrate({
        schemaVersion: 2,
        capturedAt: 1,
        queries: [],
      } as unknown as SyncSnapshot)
    ).toThrow('schema version');
    expect(client.size()).toBe(0);
  });

  it('rejects unsupported data and hydration after query creation', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['date'],
      queryFn: () => ({ date: new Date() }),
      editable: false,
    });
    await query.load();
    expect(() => client.dehydrate()).toThrow('JSON-compatible');
    expect(() =>
      client.hydrate({ schemaVersion: 1, capturedAt: 1, queries: [] })
    ).toThrow('empty client');
    query.dispose();
  });
});
