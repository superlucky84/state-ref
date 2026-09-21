import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'state-ref';
import { createSyncClient } from '../index';
import type { SyncEnvironment, SyncEnvironmentEvent } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

function fakeEnvironment() {
  let focused = true;
  let online = true;
  const listeners = new Set<(event: SyncEnvironmentEvent) => void>();
  const subscribe = vi.fn((listener: (event: SyncEnvironmentEvent) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  });
  const environment: SyncEnvironment = {
    subscribe,
    isFocused: () => focused,
    isOnline: () => online,
  };
  return {
    environment,
    subscribe,
    emit(event: SyncEnvironmentEvent) {
      [...listeners].forEach(listener => listener(event));
    },
    focused(value: boolean) {
      focused = value;
    },
    online(value: boolean) {
      online = value;
    },
    subscriptions: () => listeners.size,
  };
}

async function flushAutomaticRead() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => vi.useRealTimers());

describe('automatic query refetch', () => {
  it('starts with a handle load and applies stale and always event policies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const host = fakeEnvironment();
    let value = 0;
    const read = vi.fn(() => ({ n: ++value }));
    const client = createSyncClient({ environment: host.environment });

    await client.fetch({
      queryKey: ['automatic-start'],
      queryFn: read,
      staleTime: 100,
    });
    const query = client.query({
      queryKey: ['automatic-start'],
      queryFn: read,
      staleTime: 100,
      refetchOnFocus: true,
      refetchOnReconnect: 'always',
    });
    host.emit('focus');
    expect(read).toHaveBeenCalledTimes(1);
    expect(host.subscribe).not.toHaveBeenCalled();

    await query.load();
    expect(read).toHaveBeenCalledTimes(1);
    expect(host.subscribe).toHaveBeenCalledTimes(1);
    expect(host.subscriptions()).toBe(1);

    host.emit('focus');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(1);
    vi.setSystemTime(1100);
    host.focused(false);
    host.emit('focus');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(1);
    host.focused(true);
    host.online(false);
    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(1);
    host.online(true);
    host.emit('focus');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(2);
    expect(query.ref.n.value).toBe(2);

    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(3);
    expect(query.ref.n.value).toBe(3);
    query.dispose();
    expect(host.subscriptions()).toBe(0);
    host.emit('reconnect');
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('allows each observer to disable focus and reconnect refetch', async () => {
    const host = fakeEnvironment();
    const read = vi.fn(() => ({ n: 1 }));
    const query = createSyncClient({ environment: host.environment }).query({
      queryKey: ['disabled-automatic'],
      queryFn: read,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    });
    await query.load();
    host.emit('focus');
    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(1);
    query.dispose();
  });

  it('keeps focus events scoped to the client environment', async () => {
    const firstHost = fakeEnvironment();
    const secondHost = fakeEnvironment();
    const firstRead = vi.fn(() => ({ n: 1 }));
    const secondRead = vi.fn(() => ({ n: 2 }));
    const first = createSyncClient({
      environment: firstHost.environment,
    }).query({
      queryKey: ['same-key'],
      queryFn: firstRead,
      refetchOnFocus: 'always',
    });
    const second = createSyncClient({
      environment: secondHost.environment,
    }).query({
      queryKey: ['same-key'],
      queryFn: secondRead,
      refetchOnFocus: 'always',
    });
    await Promise.all([first.load(), second.load()]);
    firstHost.emit('focus');
    await flushAutomaticRead();
    expect(firstRead).toHaveBeenCalledTimes(2);
    expect(secondRead).toHaveBeenCalledTimes(1);
    first.dispose();
    second.dispose();
    expect(firstHost.subscriptions()).toBe(0);
    expect(secondHost.subscriptions()).toBe(0);
  });

  it('groups same-key observers and never restarts an in-flight automatic read', async () => {
    const host = fakeEnvironment();
    const firstRead = deferred<{ n: number }>();
    const secondRead = deferred<{ n: number }>();
    const read = vi
      .fn()
      .mockImplementationOnce(() => firstRead.promise)
      .mockImplementationOnce(() => secondRead.promise);
    const client = createSyncClient({ environment: host.environment });
    const staleOnly = client.query<{ n: number }>({
      queryKey: ['shared-automatic'],
      queryFn: read,
      staleTime: Infinity,
      refetchOnFocus: true,
    });
    const always = client.query<{ n: number }>({
      queryKey: ['shared-automatic'],
      queryFn: read,
      staleTime: Infinity,
      refetchOnFocus: 'always',
    });

    const one = staleOnly.load();
    const two = always.load();
    expect(one).toBe(two);
    firstRead.resolve({ n: 1 });
    await one;

    host.emit('focus');
    host.emit('focus');
    expect(read).toHaveBeenCalledTimes(2);
    secondRead.resolve({ n: 2 });
    await secondRead.promise;
    await flushAutomaticRead();
    expect(staleOnly.ref.n.value).toBe(2);

    staleOnly.dispose();
    expect(host.subscriptions()).toBe(1);
    always.dispose();
    expect(host.subscriptions()).toBe(0);
  });

  it('recovers a failed first read from a later reconnect without leaking rejection', async () => {
    const host = fakeEnvironment();
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ n: 2 });
    const query = createSyncClient({ environment: host.environment }).query<{
      n: number;
    }>({
      queryKey: ['automatic-recovery'],
      queryFn: read,
      retry: 0,
    });

    await expect(query.load()).rejects.toThrow('offline');
    expect(query.status.status.value).toBe('error');
    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(2);
    expect(query.status.status.value).toBe('success');
    expect(query.ref.n.value).toBe(2);
    query.dispose();
  });

  it('polls only while online and permits background polling by opt-in', async () => {
    vi.useFakeTimers();
    const host = fakeEnvironment();
    const foregroundRead = vi.fn(() => ({ n: 1 }));
    const backgroundRead = vi.fn(() => ({ n: 2 }));
    const client = createSyncClient({ environment: host.environment });
    const foreground = client.query({
      queryKey: ['foreground-poll'],
      queryFn: foregroundRead,
      refetchInterval: 10,
    });
    const background = client.query({
      queryKey: ['background-poll'],
      queryFn: backgroundRead,
      refetchInterval: 10,
      refetchIntervalInBackground: true,
    });
    await foreground.load();
    await background.load();

    host.focused(false);
    await vi.advanceTimersByTimeAsync(10);
    expect(foregroundRead).toHaveBeenCalledTimes(1);
    expect(backgroundRead).toHaveBeenCalledTimes(2);

    host.online(false);
    await vi.advanceTimersByTimeAsync(10);
    expect(foregroundRead).toHaveBeenCalledTimes(1);
    expect(backgroundRead).toHaveBeenCalledTimes(2);

    host.focused(true);
    host.online(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(foregroundRead).toHaveBeenCalledTimes(2);
    expect(backgroundRead).toHaveBeenCalledTimes(3);

    foreground.dispose();
    background.dispose();
    await vi.advanceTimersByTimeAsync(100);
    expect(foregroundRead).toHaveBeenCalledTimes(2);
    expect(backgroundRead).toHaveBeenCalledTimes(3);
    expect(host.subscriptions()).toBe(0);
  });

  it('shares one polling tick between same-key observers', async () => {
    vi.useFakeTimers();
    const read = vi.fn(() => ({ n: 1 }));
    const client = createSyncClient();
    const first = client.query({
      queryKey: ['shared-poll'],
      queryFn: read,
      refetchInterval: 10,
    });
    const second = client.query({
      queryKey: ['shared-poll'],
      queryFn: read,
      refetchInterval: 10,
    });
    await Promise.all([first.load(), second.load()]);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10);
    expect(read).toHaveBeenCalledTimes(2);
    first.dispose();
    second.dispose();
  });

  it('keeps local edits and blocks automatic reads during a linked write', async () => {
    const host = fakeEnvironment();
    const read = vi
      .fn()
      .mockResolvedValueOnce({ city: '서울', count: 1 })
      .mockResolvedValueOnce({ city: '대전', count: 2 })
      .mockResolvedValueOnce({ city: '부산', count: 3 });
    const client = createSyncClient({ environment: host.environment });
    const query = client.query<{ city: string; count: number }>({
      queryKey: ['automatic-edit'],
      queryFn: read,
      retry: 0,
    });
    await query.load();
    query.ref.city.value = '로컬';

    host.emit('focus');
    await flushAutomaticRead();
    expect(query.ref.value).toEqual({ city: '로컬', count: 2 });
    expect(query.status.conflicts.value).toBe(1);

    const submission = query.capture();
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const result = mutation.run(
      { city: '로컬' },
      {
        links: [
          {
            query,
            submission,
            accept: { kind: 'submitted' },
          },
        ],
      }
    );
    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(2);

    write.resolve();
    expect((await result).kind).toBe('success');
    host.emit('reconnect');
    await flushAutomaticRead();
    expect(read).toHaveBeenCalledTimes(3);
    expect(query.ref.value).toEqual({ city: '부산', count: 3 });
    mutation.dispose();
    query.dispose();
  });

  it('makes an active live view participate and releases it on dispose', async () => {
    const host = fakeEnvironment();
    const source = create(1);
    let value = 0;
    const read = vi.fn(() => ({ n: ++value }));
    const live = createSyncClient({ environment: host.environment }).liveView(
      source.watch,
      id => ({ queryKey: ['automatic-live', id], queryFn: read }),
      { select: data => data.n }
    );
    await flushAutomaticRead();
    expect(live.ref.data.value).toBe(1);

    host.emit('focus');
    await flushAutomaticRead();
    expect(live.ref.data.value).toBe(2);
    live.dispose();
    expect(host.subscriptions()).toBe(0);
  });

  it('validates policies and leaves timers and environment events off in SSR', async () => {
    vi.useFakeTimers();
    const host = fakeEnvironment();
    expect(() =>
      createSyncClient().query({
        queryKey: ['zero-interval'],
        queryFn: () => 1,
        refetchInterval: 0,
      })
    ).toThrow('positive finite');
    expect(() =>
      createSyncClient().query({
        queryKey: ['infinite-interval'],
        queryFn: () => 1,
        refetchInterval: Infinity,
      })
    ).toThrow('positive finite');
    expect(() =>
      createSyncClient().query({
        queryKey: ['bad-focus'],
        queryFn: () => 1,
        refetchOnFocus: 'stale' as 'always',
      })
    ).toThrow("boolean or 'always'");
    expect(() =>
      createSyncClient({
        environment: {} as SyncEnvironment,
      })
    ).toThrow('SyncEnvironment');

    const browserRead = vi.fn(() => ({ n: 1 }));
    const browserOptions = {
      queryKey: ['poll-without-environment'],
      queryFn: browserRead,
      refetchInterval: 10,
      gcTime: Infinity,
    };
    const browserQuery = createSyncClient().query(browserOptions);
    await browserQuery.load();
    await vi.advanceTimersByTimeAsync(10);
    expect(browserRead).toHaveBeenCalledTimes(2);
    browserOptions.refetchInterval = 20;
    browserQuery.dispose();
    expect(vi.getTimerCount()).toBe(0);

    const read = vi.fn(() => ({ n: 1 }));
    const query = createSyncClient({
      ssr: true,
      environment: host.environment,
    }).query({
      queryKey: ['ssr-automatic'],
      queryFn: read,
      refetchInterval: 10,
    });
    await query.load();
    host.emit('focus');
    await vi.advanceTimersByTimeAsync(100);
    expect(read).toHaveBeenCalledTimes(1);
    expect(host.subscribe).not.toHaveBeenCalled();
    query.dispose();
  });
});
