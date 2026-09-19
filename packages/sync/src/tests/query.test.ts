import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient, hashQueryKey } from '../index';

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

describe('query cache', () => {
  it('hashes only acyclic JSON keys with stable object order', () => {
    expect(hashQueryKey(['a', { z: 1, a: 2 }])).toBe(
      hashQueryKey(['a', { a: 2, z: 1 }])
    );
    expect(hashQueryKey(['a', 1])).not.toBe(hashQueryKey([1, 'a']));
    expect(() => hashQueryKey(['a', undefined])).toThrow('JSON-compatible');
    expect(() => hashQueryKey(['a', new Date()])).toThrow('JSON-compatible');
    expect(() => hashQueryKey(new Array(1))).toThrow('JSON-compatible');
    expect(() =>
      hashQueryKey([
        {
          get x() {
            return 1;
          },
        },
      ])
    ).toThrow('JSON-compatible');
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(() => hashQueryKey(cycle)).toThrow('JSON-compatible');
  });

  it('shares an in-flight read and fresh baseline inside one client only', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const firstClient = createSyncClient();
    const otherClient = createSyncClient({ ssr: true });
    const read = deferred<{ city: string }>();
    const fn = vi.fn(() => read.promise);
    const first = firstClient.query({
      queryKey: ['account', 1],
      queryFn: fn,
      staleTime: 50,
    });
    const second = firstClient.query({
      queryKey: ['account', 1],
      queryFn: fn,
      staleTime: 50,
    });
    const other = otherClient.query({
      queryKey: ['account', 1],
      queryFn: () => ({ city: '다른 요청' }),
    });

    expect(() => first.ref).toThrow('not loaded');
    expect(first.status.loaded.value).toBe(false);
    expect(() => {
      first.status.loaded.value = true;
    }).toThrow();
    const one = first.load();
    const two = second.load();
    expect(one).toBe(two);
    expect(fn).toHaveBeenCalledTimes(1);
    read.resolve({ city: '서울' });
    await one;
    expect(first.ref.city.value).toBe('서울');
    expect(second.ref.city.value).toBe('서울');
    expect(first.status.fetchStatus.value).toBe('idle');
    await other.load();
    expect(other.ref.city.value).toBe('다른 요청');
    await first.load();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.setSystemTime(1050);
    await first.load();
    expect(fn).toHaveBeenCalledTimes(2);
    first.dispose();
    second.dispose();
    other.dispose();
  });

  it('discards late reads after invalidation even if queryFn ignores abort', async () => {
    const client = createSyncClient({ ssr: true });
    const oldRead = deferred<{ city: string }>();
    const newRead = deferred<{ city: string }>();
    let signal!: AbortSignal;
    const fn = vi
      .fn()
      .mockImplementationOnce(({ signal: current }) => {
        signal = current;
        return oldRead.promise;
      })
      .mockImplementationOnce(() => newRead.promise);
    const query = client.query<{ city: string }>({
      queryKey: ['user'],
      queryFn: fn,
    });
    const first = query.load();
    client.invalidate(['user']);
    expect(signal.aborted).toBe(true);
    const second = query.load();
    newRead.resolve({ city: '대전' });
    await second;
    oldRead.resolve({ city: '부산' });
    await first;
    expect(query.ref.city.value).toBe('대전');
    expect(query.status.invalidated.value).toBe(false);
    query.dispose();
  });

  it('retains data on refetch failure and recovers on the next read', async () => {
    const client = createSyncClient({ ssr: true });
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ city: '서울' })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ city: '부산' });
    const query = client.query<{ city: string }>({
      queryKey: ['user'],
      queryFn: fn,
    });
    await query.load();
    await expect(query.refetch()).rejects.toThrow('offline');
    expect(query.ref.city.value).toBe('서울');
    expect(query.status.status.value).toBe('error');
    expect(query.status.error.value).toBeInstanceOf(Error);
    expect((query.status.error.value as Error).message).toBe('offline');
    await query.refetch();
    expect(query.ref.city.value).toBe('부산');
    expect(query.status.status.value).toBe('success');
    query.dispose();
  });

  it('does not notify an unchanged leaf after replacing the server response', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ city: '서울', zip: 100 })
      .mockResolvedValueOnce({ city: '서울', zip: 200 });
    const query = createSyncClient({ ssr: true }).query<{
      city: string;
      zip: number;
    }>({ queryKey: ['leaf'], queryFn: fn });
    await query.load();
    const held = query.ref.city;
    let calls = 0;
    query.watch(ref => {
      void ref.city.value;
      calls += 1;
    });
    await query.refetch();
    expect(held.value).toBe('서울');
    expect(query.ref.zip.value).toBe(200);
    expect(calls).toBe(1);
    query.dispose();
  });

  it('retries client reads but not SSR reads by default', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue({ n: 1 });
    const query = client.query({ queryKey: ['retry'], queryFn: fn });
    const result = query.load();
    await vi.advanceTimersByTimeAsync(1000);
    await result;
    expect(fn).toHaveBeenCalledTimes(2);
    query.dispose();

    const ssr = createSyncClient({ ssr: true });
    const ssrFn = vi.fn().mockRejectedValue(new Error('offline'));
    const ssrQuery = ssr.query({ queryKey: ['retry'], queryFn: ssrFn });
    await expect(ssrQuery.load()).rejects.toThrow('offline');
    expect(ssrFn).toHaveBeenCalledTimes(1);
    ssrQuery.dispose();
  });

  it('collects inactive clean entries, retaining SSR entries by default', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query({
      queryKey: ['gc'],
      queryFn: () => ({ n: 1 }),
      gcTime: 10,
    });
    await query.load();
    const held = query.ref.n;
    query.dispose();
    expect(() => held.value).toThrow('disposed');
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);

    const ssr = createSyncClient({ ssr: true });
    const request = ssr.query({ queryKey: ['gc'], queryFn: () => ({ n: 1 }) });
    await request.load();
    request.dispose();
    await vi.advanceTimersByTimeAsync(300_000);
    expect(ssr.size()).toBe(1);
    expect(ssr.remove(['gc'])).toBe(true);
  });

  it('keeps a dirty entry until a later handle resolves its local edit', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const options = {
      queryKey: ['dirty-gc'],
      queryFn: () => ({ n: 1 }),
      gcTime: 10,
    };
    const first = client.query(options);
    await first.load();
    first.ref.n.value = 2;
    first.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(1);
    expect(client.remove(['dirty-gc'])).toBe(false);
    const next = client.query(options);
    expect(next.ref.n.value).toBe(2);
    next.ref.n.value = 1;
    expect(next.isDirty()).toBe(false);
    next.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);
  });
});

describe('editable resource', () => {
  it('records direct writes before notifying data subscribers and never sends a WRITE', async () => {
    const fn = vi.fn(() => ({ city: '서울', zip: 100 }));
    const query = createSyncClient({ ssr: true }).query({
      queryKey: ['account'],
      queryFn: fn,
    });
    await query.load();
    const observed: Array<{ city: string; changes: number; dirty: boolean }> =
      [];
    const stop = new AbortController();
    query.watch(ref => {
      observed.push({
        city: ref.city.value,
        changes: query.changes().length,
        dirty: query.isDirty(),
      });
      return stop.signal;
    });
    query.ref.city.value = '부산';
    expect(observed.at(-1)).toEqual({ city: '부산', changes: 1, dirty: true });
    expect(query.changes()[0]).toMatchObject({
      path: ['city'],
      before: { exists: true, value: '서울' },
      after: { exists: true, value: '부산' },
      conflict: false,
    });
    expect(query.status.dirty.value).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
    query.ref.city.value = '서울';
    expect(query.isDirty()).toBe(false);
    expect(query.changes()).toEqual([]);
    const version = query.version();
    query.ref.city.value = '서울'; // The core skips a strict same-value setter.
    expect(query.version()).toBe(version);
    query.ref.value = { city: '서울', zip: 100 }; // New object, same data.
    expect(query.isDirty()).toBe(false);
    expect(query.version()).toBe(version + 1);
    await Promise.resolve();
    expect(query.status.version.value).toBe(version + 1);
    stop.abort();
    query.dispose();
  });

  it('shares edits and rebases an unrelated server refresh without losing held refs', async () => {
    const client = createSyncClient({ ssr: true });
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        address: { city: '서울', zip: 100 },
        dirty: 'payload',
      })
      .mockResolvedValueOnce({
        address: { city: '서울', zip: 200 },
        dirty: 'payload',
      });
    type Account = { address: { city: string; zip: number }; dirty: string };
    const one = client.query<Account>({ queryKey: ['account'], queryFn: fn });
    const two = client.query<Account>({ queryKey: ['account'], queryFn: fn });
    await one.load();
    const held = one.ref.address.city;
    one.ref.address.city.value = '부산';
    expect(two.ref.address.city.value).toBe('부산');
    expect(two.changes()[0].path).toEqual(['address', 'city']);
    await two.refetch();
    expect(held.value).toBe('부산');
    expect(one.ref.address.zip.value).toBe(200);
    expect(one.changes()[0].before.value).toBe('서울');
    expect(one.status.dirty.value).toBe(true);
    one.dispose();
    two.dispose();
  });

  it('marks overlapping server changes as conflicts without overwriting local input', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ city: '서울' })
      .mockResolvedValueOnce({ city: '대전' });
    const query = createSyncClient({ ssr: true }).query<{ city: string }>({
      queryKey: ['user'],
      queryFn: fn,
    });
    await query.load();
    query.ref.city.value = '부산';
    await query.refetch();
    expect(query.ref.city.value).toBe('부산');
    expect(query.changes()[0]).toMatchObject({
      before: { value: '대전' },
      after: { value: '부산' },
      conflict: true,
    });
    expect(query.status.conflicts.value).toBe(1);
    query.dispose();
  });

  it('separates readonly arbitrary query results from editable plain data', async () => {
    const client = createSyncClient({ ssr: true });
    const date = new Date();
    const readonly = client.query({
      queryKey: ['date'],
      queryFn: () => ({ date }),
      editable: false,
    });
    await readonly.load();
    expect(readonly.ref.value.date).toBe(date);
    expect(() => {
      readonly.ref.value = { date: new Date() };
    }).toThrow();
    const nextDate = new Date(date.getTime() + 1000);
    const refreshed = client.query<{ date: Date }>({
      queryKey: ['date-refresh'],
      queryFn: vi
        .fn()
        .mockResolvedValueOnce({ date })
        .mockResolvedValueOnce({ date: nextDate }),
      editable: false,
    });
    await refreshed.load();
    const held = refreshed.ref.date;
    await refreshed.refetch();
    expect(held.value).toBe(nextDate);
    refreshed.dispose();
    readonly.dispose();

    const invalidFn = vi.fn(() => ({ date }));
    const invalid = client.query({ queryKey: ['invalid'], queryFn: invalidFn });
    await expect(invalid.load()).rejects.toThrow('plain, acyclic');
    expect(invalid.status.status.value).toBe('error');
    expect(invalidFn).toHaveBeenCalledTimes(1);
    invalid.dispose();
  });

  it('rejects direct payload mutation and reserved proxy keys', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['tree'],
      queryFn: () => ({ branch: { n: 1 } }),
    });
    await query.load();
    expect(() => {
      query.ref.value.branch.n = 2;
    }).toThrow('cannot be modified directly');
    expect(query.ref.branch.n.value).toBe(1);
    query.dispose();

    const reserved = client.query({
      queryKey: ['reserved'],
      queryFn: () => ({ value: 1 }),
      retry: 0,
    });
    await expect(reserved.load()).rejects.toThrow('reserved');
    reserved.dispose();
  });

  it('keeps arrays atomic and removes disposed handle subscriptions', async () => {
    const client = createSyncClient({ ssr: true });
    const first = client.query({
      queryKey: ['items'],
      queryFn: () => ({ items: [1, 2] }),
    });
    const second = client.query({
      queryKey: ['items'],
      queryFn: () => ({ items: [1, 2] }),
    });
    await first.load();
    let notifications = 0;
    first.watch(ref => {
      void ref.items[0].value;
      notifications += 1;
    });
    first.ref.items[0].value = 3;
    expect(first.changes()[0].path).toEqual(['items']);
    expect(notifications).toBe(2);
    first.dispose();
    second.ref.items[0].value = 4;
    expect(notifications).toBe(2);
    expect(() => {
      second.ref.items.length.value = 4;
    }).toThrow('holes');
    expect(second.ref.items.value).toEqual([4, 2]);
    second.dispose();
  });
});
