import { create } from 'state-ref';
import { describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';
import type { SyncSnapshot } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

describe('pagination and infinite queries', () => {
  it('switches page keys without accepting an abandoned READ as the new page', async () => {
    const client = createSyncClient({ ssr: true });
    const cursor = create(1);
    const first = deferred<{ page: number }>();
    let firstSignal: AbortSignal | undefined;
    const live = client.liveView(
      cursor.watch,
      page => ({
        queryKey: ['paged', page],
        queryFn: ({ signal }) => {
          if (page === 1) {
            firstSignal = signal;
            return first.promise;
          }
          return { page };
        },
      }),
      { placeholderData: { page: -1 }, select: data => data.page }
    );
    expect(live.ref.data.value).toBe(-1);
    cursor.updateRef.value = 2;
    expect(firstSignal?.aborted).toBe(true);
    await live.query?.load();
    expect(live.ref.data.value).toBe(2);
    first.resolve({ page: 1 });
    await first.promise;
    expect(live.ref.data.value).toBe(2);
    const pageOne = client.query({
      queryKey: ['paged', 1],
      queryFn: () => ({ page: 1 }),
    });
    expect(pageOne.status.loaded.value).toBe(false);
    pageOne.dispose();
    live.dispose();
  });

  it('loads both directions, tracks terminal cursors, and trims maxPages by direction', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi.fn(({ pageParam }: { pageParam: number }) => ({
      id: pageParam,
    }));
    const options = {
      queryKey: ['feed'],
      queryFn: read,
      initialPageParam: 1,
      getNextPageParam: (page: { id: number }) =>
        page.id < 3 ? page.id + 1 : undefined,
      getPreviousPageParam: (page: { id: number }) =>
        page.id > 0 ? page.id - 1 : undefined,
      maxPages: 2,
      staleTime: Infinity,
    };
    const feed = client.infiniteQuery(options);
    expect(feed.hasNextPage()).toBe(false);
    await feed.load();
    expect(feed.ref.value).toEqual({ pages: [{ id: 1 }], pageParams: [1] });
    await feed.fetchNextPage();
    await feed.fetchNextPage();
    expect(feed.ref.value.pageParams).toEqual([2, 3]);
    expect(feed.hasNextPage()).toBe(false);
    expect(read).toHaveBeenCalledTimes(3);
    await feed.fetchNextPage();
    expect(read).toHaveBeenCalledTimes(3);
    await feed.fetchPreviousPage();
    expect(feed.ref.value.pageParams).toEqual([1, 2]);
    expect(feed.hasPreviousPage()).toBe(true);
    expect(() => {
      (feed.ref as unknown as { value: unknown }).value = {
        pages: [],
        pageParams: [],
      };
    }).toThrow('readonly');
    feed.dispose();
  });

  it('refetches retained pages sequentially with recalculated cursors', async () => {
    const client = createSyncClient({ ssr: true });
    let shifted = false;
    const read = vi.fn(({ pageParam }: { pageParam: number }) => ({
      id: pageParam,
      next: shifted ? pageParam + 4 : pageParam + 1,
    }));
    const feed = client.infiniteQuery({
      queryKey: ['cursor'],
      queryFn: read,
      initialPageParam: 0,
      getNextPageParam: page => page.next,
      maxPages: 3,
    });
    await feed.load();
    await feed.fetchNextPage();
    await feed.fetchNextPage();
    expect(feed.ref.value.pageParams).toEqual([0, 1, 2]);
    shifted = true;
    read.mockClear();
    await feed.refetch();
    expect(read.mock.calls.map(([context]) => context.pageParam)).toEqual([
      0, 4, 8,
    ]);
    expect(feed.ref.value.pageParams).toEqual([0, 4, 8]);
    feed.dispose();
  });

  it('shares one key across handles and excludes a late cancelled page', async () => {
    const client = createSyncClient({ ssr: true });
    const late = deferred<{ id: number }>();
    let pending = true;
    let signal: AbortSignal | undefined;
    const read = vi.fn(
      ({
        pageParam,
        signal: requestSignal,
      }: {
        pageParam: number;
        signal: AbortSignal;
      }) => {
        if (pageParam === 1 && pending) {
          signal = requestSignal;
          return late.promise;
        }
        return Promise.resolve({ id: pageParam });
      }
    );
    const options = {
      queryKey: ['shared-infinite'],
      queryFn: read,
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const first = client.infiniteQuery(options);
    const second = client.infiniteQuery(options);
    await Promise.all([first.load(), second.load()]);
    expect(read).toHaveBeenCalledTimes(1);
    const next = first.fetchNextPage();
    await Promise.resolve();
    await Promise.resolve();
    expect(signal).toBeDefined();
    pending = false;
    await second.refetch();
    expect(signal?.aborted).toBe(true);
    late.resolve({ id: 1 });
    await expect(next).rejects.toMatchObject({ name: 'AbortError' });
    expect(second.ref.value.pageParams).toEqual([0]);
    await second.fetchNextPage();
    expect(first.ref.value.pageParams).toEqual([0, 1]);
    first.dispose();
    second.dispose();
  });

  it('sequences simultaneous page additions and applies client invalidation', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi.fn(({ pageParam }: { pageParam: number }) => ({
      id: pageParam,
    }));
    const options = {
      queryKey: ['ordered-feed'],
      queryFn: read,
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const first = client.infiniteQuery(options);
    const second = client.infiniteQuery(options);
    await first.load();
    await Promise.all([first.fetchNextPage(), second.fetchNextPage()]);
    expect(first.ref.value.pageParams).toEqual([0, 1, 2]);
    expect(read).toHaveBeenCalledTimes(3);
    client.invalidate(['ordered-feed']);
    expect(first.status.invalidated.value).toBe(true);
    await second.load();
    expect(read).toHaveBeenCalledTimes(6);
    first.dispose();
    second.dispose();
    expect(client.remove(['ordered-feed'])).toBe(true);
  });

  it('round-trips an infinite SSR baseline and rejects mixed query kinds', async () => {
    const options = {
      queryKey: ['ssr-feed'],
      queryFn: ({ pageParam }: { pageParam: number }) => ({ id: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (page: { id: number }) => page.id + 1,
      staleTime: Infinity,
    };
    const server = createSyncClient({ ssr: true });
    const source = server.infiniteQuery(options);
    await source.load();
    await source.fetchNextPage();
    const snapshot = JSON.parse(
      JSON.stringify(server.dehydrate())
    ) as SyncSnapshot;
    expect(snapshot.queries[0]).toMatchObject({
      kind: 'infinite',
      editable: false,
      data: { pageParams: [0, 1] },
    });
    const browser = createSyncClient({ ssr: true });
    browser.hydrate(snapshot);
    const restored = browser.infiniteQuery(options);
    expect(restored.ref.value.pageParams).toEqual([0, 1]);
    await restored.load();
    expect(restored.ref.value.pageParams).toEqual([0, 1]);
    expect(() =>
      browser.query({
        queryKey: ['ssr-feed'],
        queryFn: () => 1,
        editable: false,
      })
    ).toThrow('kinds');
    const bad = JSON.parse(JSON.stringify(snapshot)) as SyncSnapshot;
    (bad.queries[0].data as { pageParams: number[] }).pageParams.pop();
    expect(() => createSyncClient({ ssr: true }).hydrate(bad)).toThrow(
      'equal nonzero'
    );
    const repeated = JSON.parse(JSON.stringify(snapshot)) as SyncSnapshot;
    (repeated.queries[0].data as { pageParams: number[] }).pageParams[1] = 0;
    expect(() => createSyncClient({ ssr: true }).hydrate(repeated)).toThrow(
      'cannot repeat'
    );
    restored.dispose();
    source.dispose();
  });

  it('validates page parameters, maxPages and seeded shape before opening a cache entry', () => {
    const client = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['invalid'],
      queryFn: ({ pageParam }: { pageParam: number }) => pageParam,
      initialPageParam: 0,
      getNextPageParam: () => 1,
    };
    expect(() => client.infiniteQuery({ ...options, maxPages: 0 })).toThrow(
      'maxPages'
    );
    expect(() =>
      client.infiniteQuery({
        ...options,
        initialData: { pages: [0], pageParams: [] },
      })
    ).toThrow('equal nonzero');
    expect(() =>
      client.infiniteQuery({
        ...options,
        initialPageParam: undefined as unknown as number,
      })
    ).toThrow('JSON-compatible');
    expect(client.size()).toBe(0);
    const first = client.infiniteQuery({ ...options, maxPages: 2 });
    expect(() => client.infiniteQuery({ ...options, maxPages: 3 })).toThrow(
      'policies'
    );
    first.dispose();
  });
});
