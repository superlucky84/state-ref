import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

afterEach(() => vi.useRealTimers());

describe('explicit cache preparation', () => {
  it('installs a known initial baseline with its freshness time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const client = createSyncClient({ ssr: true });
    const read = vi.fn(() => ({ city: '부산' }));
    const query = client.query({
      queryKey: ['initial'],
      queryFn: read,
      initialData: { city: '서울' },
      initialUpdatedAt: 900,
      staleTime: 200,
    });
    expect(query.status.loaded.value).toBe(true);
    expect(query.status.updatedAt.value).toBe(900);
    expect(query.ref.city.value).toBe('서울');
    await query.load();
    expect(read).not.toHaveBeenCalled();
    expect(client.dehydrate().queries[0].data).toEqual({ city: '서울' });
    vi.setSystemTime(1100);
    await query.load();
    expect(read).toHaveBeenCalledOnce();
    expect(query.ref.city.value).toBe('부산');
    query.dispose();
  });

  it('seeds only an empty entry and rejects invalid initial data without a partial cache entry', async () => {
    const client = createSyncClient({ ssr: true });
    expect(() =>
      client.query({
        queryKey: ['bad'],
        queryFn: () => ({ value: 1 }),
        initialData: { value: 1 },
      })
    ).toThrow('reserved');
    expect(client.size()).toBe(0);
    expect(() =>
      client.query({
        queryKey: ['bad-time'],
        queryFn: () => ({ n: 1 }),
        initialData: { n: 1 },
        initialUpdatedAt: -1,
      })
    ).toThrow('initialUpdatedAt');
    expect(client.size()).toBe(0);

    const first = client.query({
      queryKey: ['shared'],
      queryFn: () => ({ n: 1 }),
      initialData: { n: 2 },
    });
    const second = client.query({
      queryKey: ['shared'],
      queryFn: () => ({ n: 3 }),
      initialData: { n: 4 },
    });
    expect(second.ref.n.value).toBe(2);
    first.dispose();
    second.dispose();

    const pendingRead = deferred<{ n: number }>();
    const pending = client.query({
      queryKey: ['pending-seed'],
      queryFn: () => pendingRead.promise,
    });
    const load = pending.load();
    const lateSeed = client.query({
      queryKey: ['pending-seed'],
      queryFn: () => ({ n: 7 }),
      initialData: { n: 8 },
    });
    expect(lateSeed.status.loaded.value).toBe(false);
    pendingRead.resolve({ n: 6 });
    await load;
    expect(lateSeed.ref.n.value).toBe(6);
    pending.dispose();
    lateSeed.dispose();
  });

  it('isolates an editable baseline from caller-owned seed and READ objects', async () => {
    const client = createSyncClient({ ssr: true });
    const seed = { nested: { n: 1 } };
    const response = { nested: { n: 2 } };
    const query = client.query({
      queryKey: ['isolated'],
      queryFn: () => response,
      initialData: seed,
      staleTime: 0,
    });
    seed.nested.n = 9;
    expect(query.ref.nested.n.value).toBe(1);
    const loaded = await query.load();
    expect(Object.isFrozen(loaded.nested)).toBe(true);
    response.nested.n = 8;
    expect(query.ref.nested.n.value).toBe(2);
    expect(client.dehydrate().queries[0].data).toEqual({ nested: { n: 2 } });
    query.dispose();
  });

  it('fetches into the shared cache without retaining a handle or replacing an existing query function', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const client = createSyncClient();
    const original = vi.fn(() => ({ n: 1 }));
    const query = client.query({
      queryKey: ['fetch'],
      queryFn: original,
      staleTime: 0,
      gcTime: 10,
    });
    const fetched = await client.fetch({
      queryKey: ['fetch'],
      queryFn: () => ({ n: 2 }),
      staleTime: 0,
    });
    expect(fetched).toEqual({ n: 2 });
    expect(Object.isFrozen(fetched)).toBe(true);
    expect(query.ref.n.value).toBe(2);
    await query.load();
    expect(original).toHaveBeenCalledOnce();
    expect(query.ref.n.value).toBe(1);
    query.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);
  });

  it('shares an in-flight READ with a prefetch and collects its unused result', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const read = deferred<{ n: number }>();
    const fn = vi.fn(() => read.promise);
    const options = {
      queryKey: ['prefetch'],
      queryFn: fn,
      gcTime: 10,
    };
    const prefetch = client.prefetch(options);
    const query = client.query(options);
    const load = query.load();
    expect(fn).toHaveBeenCalledOnce();
    read.resolve({ n: 4 });
    await Promise.all([prefetch, load]);
    expect(query.ref.n.value).toBe(4);
    query.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);
  });

  it('swallows load failures in prefetch but rejects invalid setup', async () => {
    const client = createSyncClient({ ssr: true });
    await expect(
      client.prefetch({
        queryKey: ['failed'],
        queryFn: () => Promise.reject(new Error('offline')),
      })
    ).resolves.toBeUndefined();
    const query = client.query({
      queryKey: ['failed'],
      queryFn: () => ({ n: 5 }),
    });
    expect(query.status.status.value).toBe('error');
    await query.load();
    expect(query.ref.n.value).toBe(5);
    query.dispose();
    await expect(
      client.prefetch({
        queryKey: ['invalid', undefined],
        queryFn: () => ({ n: 1 }),
      })
    ).rejects.toThrow('JSON-compatible');
  });

  it('ensures a confirmed baseline even when stale or locally edited', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi.fn(() => ({ n: 2 }));
    const query = client.query({
      queryKey: ['ensure'],
      queryFn: read,
      initialData: { n: 1 },
      staleTime: 0,
    });
    query.ref.n.value = 3;
    query.invalidate();
    const cached = await client.ensure({
      queryKey: ['ensure'],
      queryFn: read,
    });
    expect(cached).toEqual({ n: 1 });
    expect(Object.isFrozen(cached)).toBe(true);
    expect(read).not.toHaveBeenCalled();
    await client.fetch({ queryKey: ['ensure'], queryFn: read });
    expect(read).toHaveBeenCalledOnce();
    expect(query.ref.n.value).toBe(3);
    query.dispose();
  });

  it('loads data when ensure finds no confirmed baseline', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi.fn(() => ({ n: 7 }));
    expect(
      await client.ensure({ queryKey: ['ensure-empty'], queryFn: read })
    ).toEqual({ n: 7 });
    expect(read).toHaveBeenCalledOnce();
    const query = client.query({
      queryKey: ['ensure-empty'],
      queryFn: read,
      staleTime: Infinity,
    });
    expect(query.ref.n.value).toBe(7);
    query.dispose();
  });

  it('reconciles an unconfirmed WRITE before ensure returns data', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockResolvedValueOnce({ n: 2 });
    const query = client.query<{ n: number }>({
      queryKey: ['uncertain'],
      queryFn: read,
    });
    await query.load();
    const result = await client
      .mutation({ mutationFn: () => Promise.reject(new Error('offline')) })
      .run(1, { links: [{ query }] });
    expect(result.kind).toBe('unknown');
    const value = await client.ensure({
      queryKey: ['uncertain'],
      queryFn: read,
    });
    expect(value).toEqual({ n: 2 });
    expect(read).toHaveBeenCalledTimes(2);
    expect(query.status.unconfirmed.value).toBe(false);
    query.dispose();
  });

  it('does not let late initial data erase an unloaded key’s unknown WRITE', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['unknown-empty'],
      queryFn: () => ({ n: 1 }),
    });
    const result = await client
      .mutation({ mutationFn: () => Promise.reject(new Error('offline')) })
      .run(1, { links: [{ query }] });
    expect(result.kind).toBe('unknown');
    expect(query.status.unconfirmed.value).toBe(true);

    const later = client.query({
      queryKey: ['unknown-empty'],
      queryFn: () => ({ n: 2 }),
      initialData: { n: 9 },
    });
    expect(later.status.loaded.value).toBe(false);
    expect(later.status.unconfirmed.value).toBe(true);
    expect(() => client.dehydrate()).toThrow('local or unresolved work');
    await later.load();
    expect(later.ref.n.value).toBe(2);
    expect(later.status.unconfirmed.value).toBe(false);
    query.dispose();
    later.dispose();
  });
});
