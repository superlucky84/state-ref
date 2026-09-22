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

describe('infinite cache preparation and views', () => {
  it('uses temporary ownership without replacing an active query function', async () => {
    const client = createSyncClient({ ssr: true });
    const original = vi.fn(({ pageParam }: { pageParam: number }) => ({
      id: pageParam,
      source: 'original',
    }));
    const temporary = vi.fn(({ pageParam }: { pageParam: number }) => ({
      id: pageParam,
      source: 'temporary',
    }));
    const options = {
      queryKey: ['prepared-feed'],
      queryFn: original,
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const active = client.infiniteQuery(options);
    await active.load();
    expect(client.inspectCache()[0].owners).toBe(1);
    const prepared = { ...options, queryFn: temporary };
    expect(await client.fetchInfinite(prepared)).toEqual({
      pages: [{ id: 0, source: 'original' }],
      pageParams: [0],
    });
    expect(temporary).not.toHaveBeenCalled();
    expect(client.inspectCache()[0].owners).toBe(1);

    client.invalidate(options.queryKey);
    expect(await client.ensureInfinite(prepared)).toEqual({
      pages: [{ id: 0, source: 'original' }],
      pageParams: [0],
    });
    expect(temporary).not.toHaveBeenCalled();
    expect((await client.fetchInfinite(prepared)).pages[0].source).toBe(
      'temporary'
    );
    await active.refetch();
    expect(active.ref.value.pages[0].source).toBe('original');
    expect(original).toHaveBeenCalledTimes(2);
    expect(temporary).toHaveBeenCalledTimes(1);
    await expect(
      client.fetchInfinite({ ...prepared, maxPages: 2 })
    ).rejects.toThrow('policies');
    expect(() => client.infiniteView({ ...options, maxPages: 2 })).toThrow(
      'policies'
    );
    expect(client.dehydrate().queries[0].kind).toBe('infinite');
    active.dispose();
  });

  it('rechecks a restored unconfirmed infinite baseline before ensure returns', async () => {
    const source = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['uncertain-feed'],
      queryFn: ({ pageParam }: { pageParam: number }) => ({ id: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const query = source.infiniteQuery(options);
    await query.load();
    const local = JSON.parse(JSON.stringify(source.dehydrateLocal()));
    local.queries[0].unconfirmed = true;
    local.queries[0].invalidated = true;
    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(local);
    const read = vi.fn(options.queryFn);
    expect(
      (await restored.ensureInfinite({ ...options, queryFn: read })).pages
    ).toEqual([{ id: 0 }]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(restored.inspectCache()[0].status.unconfirmed).toBe(false);
    expect(restored.inspectCache()[0].owners).toBe(0);
    query.dispose();
  });

  it('shares a pending READ, releases temporary owners, and preserves errors', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const read = deferred<{ id: number }>();
    const fn = vi.fn(() => read.promise);
    const options = {
      queryKey: ['pending-feed'],
      queryFn: fn,
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      gcTime: 10,
      retry: 0,
    };
    const first = client.fetchInfinite(options);
    const second = client.fetchInfinite(options);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(client.inspectCache()[0].owners).toBe(2);
    read.resolve({ id: 0 });
    await Promise.all([first, second]);
    expect(client.inspectCache()[0].owners).toBe(0);
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);

    const failed = {
      ...options,
      queryKey: ['failed-feed'],
      queryFn: vi.fn(() => Promise.reject(new Error('offline'))),
    };
    await expect(client.prefetchInfinite(failed)).resolves.toBeUndefined();
    expect(client.inspectCache()[0]).toMatchObject({
      owners: 0,
      status: { status: 'error' },
    });
    await expect(
      client.prefetchInfinite({
        ...options,
        initialPageParam: new Date() as unknown as number,
      })
    ).rejects.toThrow('JSON-compatible');
    expect(client.size()).toBe(1);
  });

  it('keeps placeholders and selectors local while sharing page additions', async () => {
    const client = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['view-feed'],
      queryFn: ({ pageParam }: { pageParam: number }) => ({ id: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const first = client.infiniteView(options, {
      placeholderData: { pages: [{ id: -1 }], pageParams: [-1] },
      select: data => data.pages.map(page => page.id).join(','),
    });
    const second = client.infiniteView(options, {
      placeholderData: { pages: [{ id: -2 }], pageParams: [-2] },
      select: data => data.pages.length,
    });
    expect(first.ref.data.value).toBe('-1');
    expect(second.ref.data.value).toBe(1);
    expect(client.dehydrate().queries).toEqual([]);
    await first.query.load();
    expect(first.ref.data.value).toBe('0');
    expect(second.ref.data.value).toBe(1);
    await second.query.fetchNextPage();
    expect(first.ref.data.value).toBe('0,1');
    expect(second.ref.data.value).toBe(2);
    expect(first.query.ref.value.pageParams).toEqual([0, 1]);
    expect(() => {
      (first.ref.data as { value: string }).value = 'changed';
    }).toThrow();
    first.dispose();
    expect(() => first.ref.data.value).toThrow('disposed');
    await second.query.fetchNextPage();
    expect(second.ref.data.value).toBe(3);
    second.dispose();
  });

  it('isolates selection errors and keeps a shared READ after one view exits', async () => {
    const client = createSyncClient({ ssr: true });
    const read = deferred<{ id: number }>();
    let signal: AbortSignal | undefined;
    const fn = vi.fn(({ signal: requestSignal }) => {
      signal = requestSignal;
      return read.promise;
    });
    const options = {
      queryKey: ['shared-view-feed'],
      queryFn: fn,
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
    };
    const broken = client.infiniteView(options, {
      select: data => {
        if (data.pages[0].id === 0) throw new Error('selector');
        return data.pages.length;
      },
    });
    const healthy = client.infiniteView(options, {
      select: data => data.pages[0].id,
    });
    const pending = broken.query.load();
    const shared = healthy.query.load();
    expect(fn).toHaveBeenCalledTimes(1);
    broken.dispose();
    expect(signal?.aborted).toBe(false);
    read.resolve({ id: 0 });
    await Promise.all([pending, shared]);
    expect(healthy.ref.data.value).toBe(0);
    const selectorError = client.infiniteView(options, {
      select: () => {
        throw new Error('selector');
      },
    });
    expect(selectorError.ref.errorSource.value).toBe('select');
    expect(healthy.ref.errorSource.value).toBe(null);
    expect(healthy.ref.data.value).toBe(0);
    selectorError.dispose();
    healthy.dispose();

    const badPlaceholder = {
      pages: [{ id: 0 }],
      pageParams: [] as number[],
    };
    expect(() =>
      client.infiniteView(
        { ...options, queryKey: ['invalid-placeholder'] },
        { placeholderData: badPlaceholder }
      )
    ).toThrow('equal nonzero');
    expect(client.size()).toBe(1);
  });
});
