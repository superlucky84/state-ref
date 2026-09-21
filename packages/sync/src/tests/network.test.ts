import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserSyncEnvironment, createSyncClient } from '../index';
import type { SyncEnvironment, SyncEnvironmentEvent } from '../index';

function fakeEnvironment() {
  let online = false;
  let focused = true;
  const listeners = new Set<(event: SyncEnvironmentEvent) => void>();
  const environment: SyncEnvironment = {
    isOnline: () => online,
    isFocused: () => focused,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    environment,
    setOnline(value: boolean) {
      online = value;
    },
    setFocused(value: boolean) {
      focused = value;
    },
    emit(event: SyncEnvironmentEvent) {
      [...listeners].forEach(listener => listener(event));
    },
    listeners: () => listeners.size,
  };
}

afterEach(() => vi.useRealTimers());

describe('query network modes', () => {
  it('pauses one shared online READ offline, resumes it, and releases listeners', async () => {
    const host = fakeEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const read = vi.fn(() => ({ n: 1 }));
    const options = { queryKey: ['paused'], queryFn: read };
    const first = client.query(options);
    const second = client.query(options);
    const a = first.load();
    const b = second.load();
    expect(a).toBe(b);
    expect(first.status.status.value).toBe('pending');
    expect(first.status.fetchStatus.value).toBe('paused');
    expect(read).not.toHaveBeenCalled();
    expect(() => client.dehydrate()).toThrow('unresolved work');
    host.setOnline(true);
    host.emit('reconnect');
    expect(await a).toEqual({ n: 1 });
    expect(read).toHaveBeenCalledOnce();
    expect(second.ref.n.value).toBe(1);
    first.dispose();
    second.dispose();
    expect(host.listeners()).toBe(0);
  });

  it('cancels paused READs on invalidation and last-owner dispose', async () => {
    const host = fakeEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const read = vi.fn(() => ({ n: 1 }));
    const query = client.query({ queryKey: ['cancel-pause'], queryFn: read });
    const pending = query.load();
    query.invalidate();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(query.status.fetchStatus.value).toBe('idle');
    expect(host.listeners()).toBe(1); // Started observer remains active.
    const again = query.load();
    query.dispose();
    await expect(again).rejects.toMatchObject({ name: 'AbortError' });
    expect(host.listeners()).toBe(0);
    host.setOnline(true);
    host.emit('reconnect');
    expect(read).not.toHaveBeenCalled();
  });

  it('keeps a loaded resource and local edits while an offline refetch waits', async () => {
    const host = fakeEnvironment();
    host.setOnline(true);
    const client = createSyncClient({ environment: host.environment });
    const read = vi
      .fn()
      .mockResolvedValueOnce({ city: '서울', count: 1 })
      .mockResolvedValueOnce({ city: '광주', count: 2 });
    const query = client.query<{ city: string; count: number }>({
      queryKey: ['edited-pause'],
      queryFn: read,
    });
    await query.load();
    query.ref.city.value = '부산';
    host.setOnline(false);
    const pending = query.refetch();
    expect(query.status.status.value).toBe('success');
    expect(query.status.fetchStatus.value).toBe('paused');
    expect(query.ref.city.value).toBe('부산');
    expect(read).toHaveBeenCalledOnce();
    host.setOnline(true);
    host.emit('reconnect');
    await pending;
    expect(query.ref.city.value).toBe('부산');
    expect(query.ref.count.value).toBe(2);
    expect(query.status.conflicts.value).toBe(1);
    query.dispose();
  });

  it('treats SSR as online and avoids environment subscriptions', async () => {
    const host = fakeEnvironment();
    const client = createSyncClient({
      ssr: true,
      environment: host.environment,
    });
    const query = client.query({
      queryKey: ['ssr-network'],
      queryFn: () => ({ n: 1 }),
    });
    await query.load();
    expect(query.ref.n.value).toBe(1);
    expect(host.listeners()).toBe(0);
    query.dispose();
  });

  it('runs always mode offline and respects reconnect and polling policies', async () => {
    vi.useFakeTimers();
    const host = fakeEnvironment();
    const read = vi.fn(() => ({ n: read.mock.calls.length + 1 }));
    const client = createSyncClient({ environment: host.environment });
    const query = client.query({
      queryKey: ['always'],
      queryFn: read,
      networkMode: 'always',
      refetchInterval: 10,
      staleTime: Infinity,
    });
    await query.load();
    expect(read).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10);
    expect(read).toHaveBeenCalledTimes(2);
    host.setOnline(true);
    host.emit('reconnect');
    await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(2);
    host.setOnline(false);
    host.emit('focus');
    await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(2); // Fresh data.
    query.dispose();

    const explicit = client.query({
      queryKey: ['always-explicit'],
      queryFn: read,
      networkMode: 'always',
      refetchOnReconnect: 'always',
      refetchOnFocus: 'always',
    });
    await explicit.load();
    host.emit('focus');
    await Promise.resolve();
    await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(4);
    host.emit('reconnect');
    await Promise.resolve();
    await Promise.resolve();
    expect(read).toHaveBeenCalledTimes(5);
    explicit.dispose();
  });

  it('retries always mode offline without entering paused state', async () => {
    vi.useFakeTimers();
    const host = fakeEnvironment();
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error('local miss'))
      .mockResolvedValueOnce({ n: 2 });
    const query = createSyncClient({ environment: host.environment }).query({
      queryKey: ['always-retry'],
      queryFn: read,
      networkMode: 'always',
      retry: 1,
      retryDelay: () => 0,
    });
    const pending = query.load();
    await Promise.resolve();
    expect(query.status.fetchStatus.value).toBe('fetching');
    await vi.advanceTimersByTimeAsync(0);
    expect(await pending).toEqual({ n: 2 });
    expect(read).toHaveBeenCalledTimes(2);
    query.dispose();
  });

  it('tries offlineFirst once offline and pauses a failed retry until reconnect', async () => {
    const host = fakeEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const cached = client.query({
      queryKey: ['cache-hit'],
      queryFn: () => ({ n: 1 }),
      networkMode: 'offlineFirst',
    });
    expect(await cached.load()).toEqual({ n: 1 });
    expect(cached.status.fetchStatus.value).toBe('idle');
    cached.dispose();

    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error('cache miss'))
      .mockResolvedValueOnce({ n: 2 });
    const miss = client.query({
      queryKey: ['cache-miss'],
      queryFn: read,
      networkMode: 'offlineFirst',
      retry: 1,
      retryDelay: () => 0,
    });
    const pending = miss.load();
    await Promise.resolve();
    expect(miss.status.fetchStatus.value).toBe('paused');
    expect(read).toHaveBeenCalledOnce();
    host.setOnline(true);
    host.emit('reconnect');
    expect(await pending).toEqual({ n: 2 });
    expect(read).toHaveBeenCalledTimes(2);
    miss.dispose();
  });

  it('uses network mode for infinite page loads and validates unknown modes', async () => {
    const host = fakeEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const feed = client.infiniteQuery({
      queryKey: ['offline-feed'],
      queryFn: ({ pageParam }) => ({ id: pageParam }),
      initialPageParam: 0,
      getNextPageParam: page => page.id + 1,
      networkMode: 'online',
    });
    const initial = feed.load();
    expect(feed.status.fetchStatus.value).toBe('paused');
    host.setOnline(true);
    host.emit('reconnect');
    await initial;
    host.setOnline(false);
    const next = feed.fetchNextPage();
    await Promise.resolve();
    await Promise.resolve();
    expect(feed.status.fetchStatus.value).toBe('paused');
    host.setOnline(true);
    host.emit('reconnect');
    await next;
    expect(feed.ref.value.pageParams).toEqual([0, 1]);
    feed.dispose();
    expect(() =>
      client.query({
        queryKey: ['bad-mode'],
        queryFn: () => 1,
        networkMode: 'offline' as never,
      })
    ).toThrow('networkMode');
  });
});

describe('browser environment adapter', () => {
  it('maps browser signals, filters hidden/offline events, and unregisters listeners', () => {
    const browserWindow = new EventTarget();
    const browserDocument = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    });
    const browserNavigator = { onLine: true };
    const environment = createBrowserSyncEnvironment({
      window: browserWindow,
      document: browserDocument,
      navigator: browserNavigator,
    });
    const events: SyncEnvironmentEvent[] = [];
    const unsubscribe = environment.subscribe(event => events.push(event));
    browserWindow.dispatchEvent(new Event('focus'));
    browserDocument.visibilityState = 'hidden';
    browserDocument.dispatchEvent(new Event('visibilitychange'));
    browserWindow.dispatchEvent(new Event('focus'));
    browserDocument.visibilityState = 'visible';
    browserDocument.dispatchEvent(new Event('visibilitychange'));
    browserNavigator.onLine = false;
    browserWindow.dispatchEvent(new Event('online'));
    browserNavigator.onLine = true;
    browserWindow.dispatchEvent(new Event('online'));
    expect(events).toEqual(['focus', 'focus', 'reconnect']);
    expect(environment.isFocused()).toBe(true);
    expect(environment.isOnline()).toBe(true);
    unsubscribe();
    unsubscribe();
    browserWindow.dispatchEvent(new Event('focus'));
    expect(events).toHaveLength(3);
  });

  it('does not read browser globals until explicitly constructed', () => {
    expect(() => createBrowserSyncEnvironment()).toThrow('browser host');
  });
});
