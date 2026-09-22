import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';
import type { SyncCacheEvent } from '../index';

afterEach(() => vi.useRealTimers());

describe('client cache observation', () => {
  it('reports time-of-change metadata for shared reads, edits, and removal', async () => {
    const client = createSyncClient({ ssr: true });
    const events: SyncCacheEvent[] = [];
    const unsubscribe = client.subscribeCache(event => events.push(event));
    const options = {
      queryKey: ['account', { id: 1 }],
      queryFn: () => ({ city: '서울' }),
    };
    const first = client.query(options);
    const second = client.query(options);
    expect(events).toEqual([]);
    expect(client.inspectCache()).toMatchObject([
      { kind: 'query', owners: 2, status: { loaded: false } },
    ]);
    await first.load();
    first.ref.city.value = '부산';
    client.invalidate(options.queryKey);
    first.dispose();
    second.dispose();
    expect(client.remove(options.queryKey)).toBe(false); // Dirty edits pin the entry.
    const again = client.query(options);
    again.acceptServer({ city: '부산' });
    again.dispose();
    expect(client.remove(options.queryKey)).toBe(true);
    await Promise.resolve();

    expect(events[0]).toMatchObject({
      type: 'added',
      entry: { owners: 0, status: { loaded: false } },
    });
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'updated',
        entry: expect.objectContaining({
          owners: 2,
          status: expect.objectContaining({ loaded: false }),
        }),
      })
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'updated',
        entry: expect.objectContaining({
          status: expect.objectContaining({ dirty: true }),
        }),
      })
    );
    expect(events.at(-1)).toMatchObject({
      type: 'removed',
      entry: { owners: 0, status: { dirty: false } },
    });
    expect(events[0].entry.queryKey).toEqual(['account', { id: 1 }]);
    expect(Object.isFrozen(events[0].entry.queryKey)).toBe(true);
    expect(Object.isFrozen(events[0].entry.queryKey[1])).toBe(true);
    expect(JSON.stringify(events)).not.toContain('서울');
    expect(JSON.stringify(events)).not.toContain('부산');
    expect(client.inspectCache()).toEqual([]);
    unsubscribe();
  });

  it('reports restored entries and infinite query kind, including GC removal', async () => {
    vi.useFakeTimers();
    const source = createSyncClient({ ssr: true });
    const sourceQuery = source.query({
      queryKey: ['local'],
      queryFn: () => ({ n: 1 }),
    });
    await sourceQuery.load();
    sourceQuery.ref.n.value = 2;
    const snapshot = source.dehydrateLocal();
    const restored = createSyncClient();
    const events: SyncCacheEvent[] = [];
    restored.subscribeCache(event => events.push(event));
    restored.hydrateLocal(snapshot);
    await Promise.resolve();
    expect(events).toMatchObject([
      { type: 'added', entry: { status: { loaded: true, dirty: true } } },
    ]);
    expect(restored.inspectCache()[0].status.dirty).toBe(true);
    sourceQuery.dispose();

    const infinite = restored.infiniteQuery({
      queryKey: ['pages'],
      queryFn: ({ pageParam }: { pageParam: number }) => ({ id: pageParam }),
      initialPageParam: 0,
      getNextPageParam: lastPage => lastPage.id + 1,
      gcTime: 10,
    });
    await infinite.load();
    expect(restored.inspectCache().map(entry => entry.kind)).toEqual([
      'query',
      'infinite',
    ]);
    infinite.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'removed',
        entry: expect.objectContaining({ kind: 'infinite' }),
      })
    );
    expect(restored.inspectCache()).toHaveLength(1);
  });

  it('isolates listener exceptions, unsubscribes pending events, and defers reentry', async () => {
    const client = createSyncClient({ ssr: true });
    const other = createSyncClient({ ssr: true });
    const seen: string[] = [];
    client.subscribeCache(event => {
      if (event.type === 'added') {
        seen.push('reenter');
        expect(client.remove(event.entry.queryKey)).toBe(true);
      }
      throw new Error('tooling failure');
    });
    client.subscribeCache(event => seen.push(event.type));
    const unsubscribed = vi.fn();
    const stop = client.subscribeCache(unsubscribed);
    client.query({ queryKey: ['observe'], queryFn: () => 1 }).dispose();
    other.query({ queryKey: ['observe'], queryFn: () => 1 }).dispose();
    stop();
    expect(seen).toEqual([]);
    await Promise.resolve();
    expect(seen).toEqual(['reenter', 'added', 'updated', 'updated', 'removed']);
    expect(unsubscribed).not.toHaveBeenCalled();
    expect(client.size()).toBe(0);
    expect(other.size()).toBe(1);

    const resubscribed = createSyncClient({ ssr: true });
    const reused = vi.fn();
    const stopOld = resubscribed.subscribeCache(reused);
    resubscribed.query({ queryKey: ['old'], queryFn: () => 1 }).dispose();
    stopOld();
    const stopNew = resubscribed.subscribeCache(reused);
    await Promise.resolve();
    expect(reused).not.toHaveBeenCalled();
    resubscribed.query({ queryKey: ['new'], queryFn: () => 2 }).dispose();
    await Promise.resolve();
    expect(reused).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'added' })
    );
    expect(reused).toHaveBeenCalledTimes(3);
    stopNew();
  });

  it('omits caller-owned error objects from diagnostic events', async () => {
    const client = createSyncClient({ ssr: true });
    const events: SyncCacheEvent[] = [];
    client.subscribeCache(event => events.push(event));
    const query = client.query({
      queryKey: ['failure'],
      queryFn: () => Promise.reject({ secret: 'private-response' }),
    });
    await expect(query.load()).rejects.toEqual({ secret: 'private-response' });
    await Promise.resolve();
    expect(client.inspectCache()[0].status.status).toBe('error');
    expect(JSON.stringify(events)).not.toContain('private-response');
    expect('error' in client.inspectCache()[0].status).toBe(false);
    query.dispose();
  });
});
