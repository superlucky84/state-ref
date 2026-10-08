/**
 * The query observer (docs/sync-query-hooks, IMPLEMENT 단계 2): made and read
 * without touching the cache, attached while something subscribes, moved
 * between keys by `setOptions`, and released on a schedule.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'state-ref';
import { createSyncClient } from '../index';
import type {
  ObserveOptions,
  QueryHandle,
  QueryKey,
  QueryObserver,
  SyncCacheEvent,
  SyncClient,
  SyncEnvironment,
  SyncEnvironmentEvent,
} from '../index';

type Account = { name: string; age: number };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, refuse) => {
    resolve = accept;
    reject = refuse;
  });
  return { promise, resolve, reject };
}

/** One macrotask: the default release schedule has run by the end of it. */
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const sameKey = (a: QueryKey, b: QueryKey) =>
  JSON.stringify(a) === JSON.stringify(b);

const ownersOf = (client: SyncClient, key: QueryKey) =>
  client.inspectCache().find(entry => sameKey(entry.queryKey, key))?.owners;

/** The owner counts a key's cache updates reported, in order. */
function ownerTrail(client: SyncClient, key: QueryKey) {
  const trail: number[] = [];
  client.subscribeCache(event => {
    if (event.type === 'updated' && sameKey(event.entry.queryKey, key))
      trail.push(event.entry.owners);
  });
  return trail;
}

/** A subscription the way a connector makes one: ended by its signal. */
function subscribe<T, S>(observer: QueryObserver<T, S>) {
  const controller = new AbortController();
  const seen: unknown[] = [];
  const ref = observer.watch((current, first) => {
    seen.push(current.value);
    if (first) return controller.signal;
  });
  return { ref, seen, end: () => controller.abort() };
}

/** A query function that counts its READs and keeps their signals. */
function reads<T>(answer: (call: number) => T | Promise<T>) {
  const signals: AbortSignal[] = [];
  const fn = vi.fn(({ signal }: { signal: AbortSignal }) => {
    signals.push(signal);
    return answer(signals.length);
  });
  return {
    fn,
    cancelled: () => signals.filter(signal => signal.aborted).length,
  };
}

const lee = (): Account => ({ name: 'Lee', age: 3 });

function fakeEnvironment() {
  const listeners = new Set<(event: SyncEnvironmentEvent) => void>();
  const environment: SyncEnvironment = {
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isFocused: () => true,
    isOnline: () => true,
  };
  return {
    environment,
    emit: (event: SyncEnvironmentEvent) =>
      [...listeners].forEach(listener => listener(event)),
  };
}

afterEach(() => vi.useRealTimers());

describe('making and reading an observer (T-QH-01)', () => {
  it('creates no entry, starts no READ and announces nothing', async () => {
    const client = createSyncClient();
    const events: SyncCacheEvent[] = [];
    client.subscribeCache(event => events.push(event));
    const queryFn = vi.fn(lee);
    const observer = client.observe<Account>({
      queryKey: ['account', 1],
      queryFn,
    });
    const other = { queryKey: ['account', 2], queryFn };
    for (let index = 0; index < 3; index += 1) {
      void observer.watch().status.value;
      void observer.watch().data.name.value;
      void observer.peek(other).data.value;
      observer.matches(other);
    }
    observer.setOptions(other);
    expect(client.size()).toBe(0);
    expect(queryFn).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(events).toEqual([]);
  });

  it('leaves the owners of an existing entry alone', async () => {
    const client = createSyncClient();
    await client.prefetch({ queryKey: ['account'], queryFn: lee });
    const events: SyncCacheEvent[] = [];
    client.subscribeCache(event => events.push(event));
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    expect(observer.watch().data.name.value).toBe('Lee');
    observer.setOptions({ queryKey: ['account'], queryFn: lee, staleTime: 5 });
    expect(
      observer.peek({ queryKey: ['account'], queryFn: lee }).value
    ).toEqual(observer.watch().value);
    expect(ownersOf(client, ['account'])).toBe(0);
    await Promise.resolve();
    expect(events).toEqual([]);
  });
});

describe("the confirmed options' state (T-QH-02)", () => {
  it('shows a missing, in-flight, loaded and edited key', async () => {
    const client = createSyncClient();
    const read = deferred<Account>();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: () => read.promise,
    });
    const ref = observer.watch();
    expect(ref.value).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
      queryKey: ['account'],
      enabled: true,
    });
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => read.promise,
    });
    const loading = query.load();
    expect(ref.value).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
    });
    read.resolve(lee());
    await loading;
    expect(ref.value).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: { name: 'Lee', age: 3 },
    });
    query.ref.name.value = 'Kim';
    expect(ref.data.name.value).toBe('Kim');
    query.dispose();
  });

  it('shows a disabled key as idle, with its key', () => {
    const client = createSyncClient();
    const observer = client.observe<Account>({
      queryKey: ['account', null],
      queryFn: lee,
      enabled: false,
    });
    expect(observer.watch().value).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      enabled: false,
      queryKey: ['account', null],
    });
  });

  it('shows options it cannot open as a source error, attached or not', () => {
    const client = createSyncClient();
    const store = create({ user: { id: 1 } });
    const cases: Array<ObserveOptions<Account>> = [
      { queryKey: ['account', undefined], queryFn: lee },
      { queryKey: ['account', store.watch().user], queryFn: lee },
      {
        queryKey: ['account'],
        queryFn: lee,
        enabled: 'yes' as unknown as boolean,
      },
    ];
    const failed = {
      status: 'error',
      errorSource: 'source',
      enabled: false,
      queryKey: null,
    };
    for (const options of cases) {
      const observer = client.observe<Account>(options);
      expect(observer.watch().value).toMatchObject(failed);
      expect(observer.peek({ ...options }).value).toMatchObject(failed);
      // The same failure is the same options: nothing to switch to.
      expect(observer.matches({ ...options })).toBe(true);
      expect(observer.setOptions({ ...options })).toBe(false);
      const subscription = subscribe(observer);
      expect(subscription.ref.value).toMatchObject(failed);
      subscription.end();
    }
    expect(client.size()).toBe(0);
    // A different failure is a change.
    const observer = client.observe<Account>(cases[0]);
    expect(observer.matches(cases[2])).toBe(false);
    expect(observer.setOptions(cases[2])).toBe(true);
  });
});

describe('attaching (T-QH-03, T-QH-04)', () => {
  it('attaches and loads on the first subscription', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: read.fn,
    });
    const subscription = subscribe(observer);
    expect(ownersOf(client, ['account'])).toBe(1);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    expect(subscription.ref.data.name.value).toBe('Lee');
    expect(observer.watch().data.name.value).toBe('Lee');
    subscription.end();
  });

  it('reads nothing for a fresh key and shares a READ in flight', async () => {
    const client = createSyncClient();
    const fresh = reads(lee);
    await client.prefetch({ queryKey: ['fresh'], queryFn: fresh.fn });
    const one = subscribe(
      client.observe<Account>({
        queryKey: ['fresh'],
        queryFn: fresh.fn,
        staleTime: 60_000,
      })
    );
    await tick();
    expect(fresh.fn).toHaveBeenCalledTimes(1);
    expect(one.ref.data.name.value).toBe('Lee');

    const answer = deferred<Account>();
    const slow = reads(() => answer.promise);
    const prefetching = client.prefetch({
      queryKey: ['slow'],
      queryFn: slow.fn,
    });
    const two = subscribe(
      client.observe<Account>({ queryKey: ['slow'], queryFn: slow.fn })
    );
    answer.resolve(lee());
    await prefetching;
    await tick();
    expect(slow.fn).toHaveBeenCalledTimes(1);
    expect(slow.cancelled()).toBe(0);
    expect(two.ref.data.name.value).toBe('Lee');
  });

  it('holds one handle for all its subscriptions, released after the last', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const options = { queryKey: ['account'], queryFn: read.fn };
    const mine = client.observe<Account>(options);
    const theirs = client.observe<Account>(options);
    const subscriptions = [subscribe(mine), subscribe(mine), subscribe(mine)];
    const other = subscribe(theirs);
    expect(ownersOf(client, ['account'])).toBe(2);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    subscriptions[0].end();
    subscriptions[1].end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(2);
    subscriptions[2].end();
    // The handle waits for the release schedule.
    expect(ownersOf(client, ['account'])).toBe(2);
    await tick();
    expect(ownersOf(client, ['account'])).toBe(1);
    expect(other.ref.data.name.value).toBe('Lee');
    other.end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
    expect(client.size()).toBe(1);
  });
});

describe('the release schedule (T-QH-05, T-QH-46)', () => {
  it('lets a subscription made within the schedule take over', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    const read = reads(() => answer.promise);
    const trail = ownerTrail(client, ['account']);
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: read.fn,
    });
    const first = subscribe(observer);
    // StrictMode, or a route that unmounts and mounts the same query.
    first.end();
    const second = subscribe(observer);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    expect(read.cancelled()).toBe(0);
    answer.resolve(lee());
    await tick();
    expect(second.ref.data.name.value).toBe('Lee');
    second.end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
    expect(trail.at(-1)).toBe(0);
    expect(trail.slice(0, -1)).not.toContain(0);
  });

  it('follows the schedule it is given', async () => {
    const client = createSyncClient();
    const queue: Array<() => void> = [];
    const observer = client.observe<Account>(
      { queryKey: ['account'], queryFn: lee },
      { scheduleRelease: release => queue.push(release) }
    );
    const subscription = subscribe(observer);
    subscription.end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(1);
    expect(queue).toHaveLength(1);
    queue.shift()!();
    expect(ownersOf(client, ['account'])).toBe(0);
  });

  it('releases under fake timers only once they advance', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(0);
    subscription.end();
    await Promise.resolve();
    expect(ownersOf(client, ['account'])).toBe(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(ownersOf(client, ['account'])).toBe(0);
  });
});

describe('display options on a peek (T-QH-06, T-QH-07)', () => {
  it('projects a peek as the attached display does', async () => {
    const client = createSyncClient();
    await client.prefetch({ queryKey: ['account'], queryFn: lee });
    const options = {
      queryKey: ['account'],
      queryFn: lee,
      staleTime: Infinity,
      select: (account: Account) => account.name.toUpperCase(),
    };
    const observer = client.observe<Account, string>(options);
    const before = observer.watch().value;
    expect(before).toMatchObject({ status: 'success', data: 'LEE' });
    expect(observer.peek(options).value).toEqual(before);
    const subscription = subscribe(observer);
    expect(subscription.ref.value).toEqual(before);
    subscription.end();
  });

  it('shows a placeholder and a select failure the same way', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    const observer = client.observe<Account, string>({
      queryKey: ['account'],
      queryFn: () => answer.promise,
      placeholderData: { name: 'someone', age: 0 },
      select: account => {
        if (account.age > 10) throw new RangeError('too old');
        return account.name;
      },
    });
    expect(observer.watch().value).toMatchObject({
      status: 'pending',
      data: 'someone',
      isPlaceholder: true,
    });
    const subscription = subscribe(observer);
    expect(subscription.ref.value).toMatchObject({
      status: 'pending',
      data: 'someone',
      isPlaceholder: true,
    });
    answer.resolve({ name: 'Old', age: 99 });
    await tick();
    const failure = {
      status: 'error',
      errorSource: 'select',
      data: undefined,
      isPlaceholder: false,
    };
    expect(subscription.ref.value).toMatchObject(failure);
    expect(observer.watch().value).toMatchObject(failure);
    expect(observer.watch().error.value).toBeInstanceOf(RangeError);
    subscription.end();
  });

  it('keeps the previous data object when equals says so, in both', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    await query.load();
    const observer = client.observe<Account, { name: string }>({
      queryKey: ['account'],
      queryFn: lee,
      staleTime: Infinity,
      select: account => ({ name: account.name }),
      equals: (next, previous) => next.name === previous.name,
    });
    const peeked = observer.watch().data.value;
    const subscription = subscribe(observer);
    const shown = subscription.ref.data.value;
    query.ref.age.value = 4;
    expect(subscription.ref.data.value).toBe(shown);
    expect(observer.watch().data.value).toBe(peeked);
    query.ref.name.value = 'Kim';
    expect(subscription.ref.data.name.value).toBe('Kim');
    expect(observer.watch().data.name.value).toBe('Kim');
    subscription.end();
    query.dispose();
  });

  it('is read-only and leaves the cache as it was', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    await query.load();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    const ref = observer.watch();
    expect(() => {
      (ref.data as unknown as { name: { value: string } }).name.value = 'Kim';
    }).toThrow();
    expect(() => {
      (ref.value.data as Account).name = 'Kim';
    }).toThrow();
    expect(() => {
      (
        observer.peek({ queryKey: ['account'], queryFn: lee }).status as {
          value: string;
        }
      ).value = 'error';
    }).toThrow();
    expect(query.ref.name.value).toBe('Lee');
    query.dispose();
  });
});

describe('changing the key (T-QH-09, T-QH-10)', () => {
  const optionsFor = (
    id: number,
    queryFn: () => Account | Promise<Account> = lee
  ) => ({ queryKey: ['account', id], queryFn });

  it('only changes the confirmed options while detached', () => {
    const client = createSyncClient();
    const observer = client.observe<Account>(optionsFor(1));
    const ref = observer.watch();
    expect(observer.setOptions(optionsFor(2))).toBe(true);
    expect(ref.queryKey.value).toEqual(['account', 2]);
    expect(observer.matches(optionsFor(2))).toBe(true);
    expect(observer.matches(optionsFor(1))).toBe(false);
    expect(client.size()).toBe(0);
  });

  it('moves an attached observer and keeps the old key out of view', async () => {
    const client = createSyncClient();
    const one = deferred<Account>();
    const two = deferred<Account>();
    const observer = client.observe<Account>(optionsFor(1, () => one.promise));
    const subscription = subscribe(observer);
    expect(observer.setOptions(optionsFor(2, () => two.promise))).toBe(true);
    expect(subscription.ref.queryKey.value).toEqual(['account', 2]);
    expect(subscription.ref.status.value).toBe('pending');
    // The old key is released on the schedule, not now.
    expect(ownersOf(client, ['account', 1])).toBe(1);
    expect(ownersOf(client, ['account', 2])).toBe(1);
    one.resolve({ name: 'One', age: 1 });
    await tick();
    expect(subscription.ref.data.value).toBeUndefined();
    expect(ownersOf(client, ['account', 1])).toBe(0);
    expect(client.size()).toBe(2);
    expect(observer.peek(optionsFor(1)).data.name.value).toBe('One');
    two.resolve({ name: 'Two', age: 2 });
    await tick();
    expect(subscription.ref.data.name.value).toBe('Two');
    // A new object with the same key is not a switch.
    expect(observer.setOptions(optionsFor(2, () => two.promise))).toBe(false);
    subscription.end();
  });

  it('stays detached while disabled and attaches once enabled', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const options = (enabled: boolean) => ({
      queryKey: ['account', 1],
      queryFn: read.fn,
      enabled,
    });
    const observer = client.observe<Account>(options(false));
    const subscription = subscribe(observer);
    expect(client.size()).toBe(0);
    expect(subscription.ref.value).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      enabled: false,
      queryKey: ['account', 1],
    });
    expect(observer.setOptions(options(true))).toBe(true);
    expect(ownersOf(client, ['account', 1])).toBe(1);
    await tick();
    expect(subscription.ref.data.name.value).toBe('Lee');
    expect(read.fn).toHaveBeenCalledTimes(1);
    expect(observer.setOptions(options(false))).toBe(true);
    expect(subscription.ref.enabled.value).toBe(false);
    await tick();
    expect(ownersOf(client, ['account', 1])).toBe(0);
    subscription.end();
  });
});

describe('automatic refetch (T-QH-11)', () => {
  it('runs on focus, reconnect and an interval only while attached', async () => {
    vi.useFakeTimers();
    const host = fakeEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const read = reads(lee);
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: read.fn,
      refetchInterval: 1000,
    });
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(0);
    expect(read.fn).toHaveBeenCalledTimes(1);
    host.emit('focus');
    await vi.advanceTimersByTimeAsync(0);
    expect(read.fn).toHaveBeenCalledTimes(2);
    host.emit('reconnect');
    await vi.advanceTimersByTimeAsync(0);
    expect(read.fn).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1000);
    expect(read.fn).toHaveBeenCalledTimes(4);
    subscription.end();
    await vi.advanceTimersByTimeAsync(0);
    host.emit('focus');
    host.emit('reconnect');
    await vi.advanceTimersByTimeAsync(5000);
    expect(read.fn).toHaveBeenCalledTimes(4);
  });
});

describe('a server client (T-QH-12)', () => {
  it('never attaches, and subscribes to what the cache holds', async () => {
    const server = createSyncClient({ ssr: true });
    await server.prefetch({ queryKey: ['account'], queryFn: lee });
    const read = vi.fn(lee);
    const observer = server.observe<Account>({
      queryKey: ['account'],
      queryFn: read,
    });
    const seen: Array<string | undefined> = [];
    const controller = new AbortController();
    const ref = observer.watch((current, first) => {
      seen.push(current.data.name.value);
      if (first) return controller.signal;
    });
    expect(seen).toEqual(['Lee']);
    expect(ref.data.name.value).toBe('Lee');
    expect(() => {
      (ref.data as unknown as { name: { value: string } }).name.value = 'Kim';
    }).toThrow();
    expect(ownersOf(server, ['account'])).toBe(0);
    const missing = server.observe<Account>({
      queryKey: ['missing'],
      queryFn: read,
    });
    expect(subscribe(missing).ref.status.value).toBe('pending');
    expect(server.size()).toBe(1);
    expect(read).not.toHaveBeenCalled();
    await expect(observer.controls.refetch()).rejects.toThrow(
      'This query observer is not attached.'
    );
    expect(observer.controls.handle()).toBeNull();
    controller.abort();
  });
});

describe('option identity on one key (T-QH-13)', () => {
  it('uses a new queryFn and retryDelay without reopening', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const first = vi.fn(lee);
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: first,
      retry: 1,
    });
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(0);
    const handle = observer.controls.handle();
    let fail = true;
    const second = vi.fn((): Account => {
      if (fail) {
        fail = false;
        throw new Error('flaky');
      }
      return { name: 'Second', age: 2 };
    });
    const delay = vi.fn(() => 50);
    expect(
      observer.setOptions({
        queryKey: ['account'],
        queryFn: second,
        retry: 1,
        retryDelay: delay,
      })
    ).toBe(false);
    expect(observer.controls.handle() === handle).toBe(true);
    void observer.controls.refetch();
    await vi.advanceTimersByTimeAsync(0);
    expect(second).toHaveBeenCalledTimes(1);
    expect(delay).toHaveBeenCalledWith(0);
    await vi.advanceTimersByTimeAsync(50);
    expect(second).toHaveBeenCalledTimes(2);
    expect(first).toHaveBeenCalledTimes(1);
    expect(subscription.ref.data.name.value).toBe('Second');
    subscription.end();
  });

  it('ignores fresh functions and literals a render makes every time', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const render = () => ({
      queryKey: ['account'],
      queryFn: read.fn,
      retryDelay: () => 10,
      initialData: { name: 'Seed', age: 0 },
    });
    const observer = client.observe<Account>(render());
    const subscription = subscribe(observer);
    await tick();
    const handle = observer.controls.handle();
    const runs = subscription.seen.length;
    for (let index = 0; index < 3; index += 1) {
      expect(observer.setOptions(render())).toBe(false);
    }
    await tick();
    expect(observer.controls.handle() === handle).toBe(true);
    expect(read.fn).toHaveBeenCalledTimes(1);
    expect(subscription.seen).toHaveLength(runs);
    subscription.end();
  });

  it('reopens the same key for a new primitive without letting go of it', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const answer = deferred<Account>();
    const read = reads(call => (call === 1 ? answer.promise : lee()));
    const trail = ownerTrail(client, ['account']);
    const options = (refetchInterval?: number) => ({
      queryKey: ['account'],
      queryFn: read.fn,
      staleTime: 60_000,
      refetchInterval,
    });
    const observer = client.observe<Account>(options());
    const subscription = subscribe(observer);
    const before = observer.controls.handle();
    expect(observer.setOptions(options(1000))).toBe(false);
    // Compared by hand: a failed toBe reads every getter, and `ref` throws
    // before the first load.
    expect(observer.controls.handle() === before).toBe(false);
    await vi.advanceTimersByTimeAsync(0);
    // The READ in flight carried over: not cancelled, not issued again.
    expect(read.fn).toHaveBeenCalledTimes(1);
    expect(read.cancelled()).toBe(0);
    answer.resolve(lee());
    await vi.advanceTimersByTimeAsync(0);
    expect(subscription.ref.data.name.value).toBe('Lee');
    expect(trail).not.toContain(0);
    expect(ownersOf(client, ['account'])).toBe(1);
    // The new handle polls; a fresh key is not read again on reopening.
    await vi.advanceTimersByTimeAsync(1000);
    expect(read.fn).toHaveBeenCalledTimes(2);
    observer.setOptions(options(undefined));
    await vi.advanceTimersByTimeAsync(5000);
    expect(read.fn).toHaveBeenCalledTimes(2);
    subscription.end();
  });

  it('reprojects a select that changed and publishes only a real change', async () => {
    type Feed = { items: Array<{ id: number; kind: string }> };
    const client = createSyncClient();
    const feed: Feed = {
      items: [
        { id: 1, kind: 'a' },
        { id: 2, kind: 'b' },
        { id: 3, kind: 'a' },
      ],
    };
    // A select that closes over a prop, as an inline one in a render does.
    const render = (kind: string) => ({
      queryKey: ['feed'],
      queryFn: () => feed,
      staleTime: Infinity,
      select: (data: Feed) =>
        data.items.filter(item => item.kind === kind).map(item => item.id),
    });
    const observer = client.observe<Feed, number[]>(render('a'));
    const subscription = subscribe(observer);
    await tick();
    const shown = subscription.ref.data.value;
    expect(shown).toEqual([1, 3]);
    const runs = subscription.seen.length;
    observer.setOptions(render('a'));
    expect(subscription.seen).toHaveLength(runs);
    expect(subscription.ref.data.value).toBe(shown);
    observer.setOptions(render('b'));
    expect(subscription.ref.data.value).toEqual([2]);
    expect(subscription.seen).toHaveLength(runs + 1);
    subscription.end();
  });

  it('does not publish an inline select that fails or dates the same way', async () => {
    const client = createSyncClient();
    const base = {
      queryKey: ['account'],
      queryFn: lee,
      staleTime: Infinity,
    };
    const failing = () => ({
      ...base,
      select: (): string => {
        throw new RangeError('bad');
      },
    });
    const observer = client.observe<Account, string>(failing());
    const subscription = subscribe(observer);
    await tick();
    expect(subscription.ref.errorSource.value).toBe('select');
    const runs = subscription.seen.length;
    for (let index = 0; index < 3; index += 1) observer.setOptions(failing());
    expect(subscription.seen).toHaveLength(runs);
    subscription.end();

    const dated = () => ({ ...base, select: () => new Date(5) });
    const clock = client.observe<Account, Date>(dated());
    const watching = subscribe(clock);
    await tick();
    const date = watching.ref.data.value;
    const dateRuns = watching.seen.length;
    for (let index = 0; index < 3; index += 1) clock.setOptions(dated());
    expect(watching.seen).toHaveLength(dateRuns);
    expect(watching.ref.data.value).toBe(date);
    watching.end();
  });

  it('follows retryDelay as it comes and goes on the same key', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const queryFn = vi.fn((): Account => {
      throw new Error('down');
    });
    const options = (retryDelay?: (attempt: number) => number) => ({
      queryKey: ['account'],
      queryFn,
      retry: 1,
      retryDelay,
    });
    const observer = client.observe<Account>(options(() => 10));
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(10);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(subscription.ref.status.value).toBe('error');

    observer.setOptions(options(undefined));
    void observer.controls.refetch().catch(() => {});
    await vi.advanceTimersByTimeAsync(999);
    expect(queryFn).toHaveBeenCalledTimes(3);
    // The default delay: 1000ms before the first retry.
    await vi.advanceTimersByTimeAsync(1);
    expect(queryFn).toHaveBeenCalledTimes(4);
    expect(subscription.ref.status.value).toBe('error');

    const delay = vi.fn(() => 5);
    observer.setOptions(options(delay));
    void observer.controls.refetch().catch(() => {});
    await vi.advanceTimersByTimeAsync(5);
    expect(queryFn).toHaveBeenCalledTimes(6);
    expect(delay).toHaveBeenCalledWith(0);
    expect(subscription.ref.status.value).toBe('error');
    subscription.end();
  });

  it('retries a READ in flight with the latest queryFn after a reopen', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const first = vi.fn((): Account => {
      throw new Error('first');
    });
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: first,
      retryDelay: () => 100,
    });
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(0);
    expect(first).toHaveBeenCalledTimes(1);
    const latest = vi.fn(() => ({ name: 'Latest', age: 1 }));
    observer.setOptions({
      queryKey: ['account'],
      queryFn: latest,
      retryDelay: () => 100,
      refetchInterval: 60_000,
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(first).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(subscription.ref.data.name.value).toBe('Latest');
    subscription.end();
  });
});

describe('a live, stable peek (T-QH-15)', () => {
  const optionsFor = (id: number) => ({
    queryKey: ['account', id],
    queryFn: lee,
  });

  it('keeps refs made before the data, and after a change of options', async () => {
    const client = createSyncClient();
    const observer = client.observe<Account>(optionsFor(1));
    const ref = observer.watch();
    const data = ref.data;
    expect(data.name.value).toBeUndefined();
    await client.prefetch(optionsFor(1));
    expect(data.name.value).toBe('Lee');
    observer.setOptions(optionsFor(2));
    expect(ref.queryKey.value).toEqual(['account', 2]);
    expect(data.name.value).toBeUndefined();
  });

  it('gives the same root while nothing changed, alternating with a peek', async () => {
    const client = createSyncClient();
    const observer = client.observe<Account>(optionsFor(1));
    const confirmed = observer.watch().value;
    const other = observer.peek(optionsFor(2)).value;
    for (let index = 0; index < 3; index += 1) {
      expect(observer.watch().value).toBe(confirmed);
      expect(observer.peek(optionsFor(2)).value).toBe(other);
    }
    await client.prefetch(optionsFor(2));
    expect(observer.watch().value).toBe(confirmed);
    expect(observer.peek(optionsFor(2)).value).not.toBe(other);
    expect(observer.peek(optionsFor(2)).data.name.value).toBe('Lee');
  });
});

describe('counting subscriptions (T-QH-16, T-QH-43)', () => {
  it('ends a subscription whose later run returns false', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: () => answer.promise,
    });
    let stop = false;
    observer.watch(current => {
      void current.value;
      if (stop) return false;
    });
    expect(ownersOf(client, ['account'])).toBe(1);
    stop = true;
    answer.resolve(lee());
    await tick();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
  });

  it('counts a renew it already holds once', async () => {
    const client = createSyncClient();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    const controller = new AbortController();
    const renew = (
      current: ReturnType<typeof observer.watch>,
      first: boolean
    ) => {
      void current.value;
      if (first) return controller.signal;
    };
    const one = observer.watch(renew);
    const two = observer.watch(renew);
    expect(two).toBe(one);
    controller.abort();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
  });

  it('is held by a subscription with no way to end', async () => {
    const client = createSyncClient();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    observer.watch(current => {
      void current.value;
    });
    const ending = subscribe(observer);
    ending.end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(1);
  });

  it('does not count a subscription whose first run throws', async () => {
    const client = createSyncClient();
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
    });
    expect(() =>
      observer.watch(() => {
        throw new Error('render');
      })
    ).toThrow('render');
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
    const subscription = subscribe(observer);
    expect(ownersOf(client, ['account'])).toBe(1);
    subscription.end();
    await tick();
    expect(ownersOf(client, ['account'])).toBe(0);
  });
});

describe('initialData (T-QH-17)', () => {
  it('shows it before attaching and seeds it on attach', async () => {
    const client = createSyncClient();
    const read = reads(() => ({ name: 'Server', age: 9 }));
    const options = {
      queryKey: ['account'],
      queryFn: read.fn,
      initialData: { name: 'Seed', age: 1 },
      initialUpdatedAt: 500,
      staleTime: Infinity,
      select: (account: Account) => account.name,
    };
    const observer = client.observe<Account, string>(options);
    expect(observer.watch().value).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      loaded: true,
      data: 'Seed',
      updatedAt: 500,
    });
    expect(
      client
        .observe<Account>({
          ...options,
          initialUpdatedAt: undefined,
          select: undefined,
        })
        .watch().value
    ).toMatchObject({ data: { name: 'Seed', age: 1 }, updatedAt: null });
    expect(client.size()).toBe(0);
    const subscription = subscribe(observer);
    await tick();
    expect(read.fn).not.toHaveBeenCalled();
    expect(subscription.ref.value).toMatchObject({
      status: 'success',
      data: 'Seed',
      updatedAt: 500,
    });
    subscription.end();
  });

  it('shows the same before and after attaching over a failed prefetch', async () => {
    const client = createSyncClient();
    await client.prefetch({
      queryKey: ['account'],
      queryFn: (): Account => {
        throw new Error('down');
      },
      retry: 0,
    });
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: lee,
      initialData: { name: 'Seed', age: 1 },
      initialUpdatedAt: 500,
      staleTime: Infinity,
    });
    const before = observer.watch().value;
    expect(before).toMatchObject({ status: 'success', data: { name: 'Seed' } });
    const subscription = subscribe(observer);
    expect(subscription.ref.value).toEqual(before);
    subscription.end();
  });
});

describe('controls (T-QH-18)', () => {
  it('refetch and handle work only while attached and enabled', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const options = (enabled: boolean) => ({
      queryKey: ['account'],
      queryFn: read.fn,
      enabled,
    });
    const observer = client.observe<Account>(options(true));
    const controls = observer.controls;
    const notAttached = 'This query observer is not attached.';
    await expect(controls.refetch()).rejects.toThrow(notAttached);
    expect(controls.handle()).toBeNull();
    const subscription = subscribe(observer);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    await expect(controls.refetch()).resolves.toEqual(lee());
    expect(read.fn).toHaveBeenCalledTimes(2);
    observer.setOptions(options(false));
    expect(controls.handle()).toBeNull();
    await expect(controls.refetch()).rejects.toThrow(notAttached);
    observer.setOptions(options(true));
    expect(controls.handle()).not.toBeNull();
    subscription.end();
    expect(controls.handle()).toBeNull();
    await expect(controls.refetch()).rejects.toThrow(notAttached);
    expect(observer.controls).toBe(controls);
  });

  it("lends the query's own handle, which a mutation link accepts", async () => {
    const client = createSyncClient();
    const optionsFor = (id: number) => ({
      queryKey: ['account', id],
      queryFn: lee,
    });
    const observer = client.observe<Account>(optionsFor(1));
    const subscription = subscribe(observer);
    await tick();
    const handle = observer.controls.handle()!;
    expect(observer.controls.handle() === handle).toBe(true);
    // The type leaves these out; the object is the query's own.
    expect(typeof (handle as QueryHandle<Account>).dispose).toBe('function');
    handle.ref.name.value = 'Kim';
    expect(subscription.ref.data.name.value).toBe('Kim');
    const mutation = client.mutation({
      mutationFn: (input: { name: string }) => input,
    });
    const result = await mutation.run(
      { name: 'Kim' },
      {
        links: [
          {
            query: handle,
            submission: handle.capture(),
            accept: { kind: 'submitted' },
          },
        ],
      }
    );
    expect(result.kind).toBe('success');
    expect(handle.isDirty()).toBe(false);
    observer.setOptions(optionsFor(2));
    expect(observer.controls.handle() === handle).toBe(false);
    expect(observer.controls.handle()!.queryKey).toEqual(['account', 2]);
    subscription.end();
  });

  it('invalidates, and reads again only while attached', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const options = {
      queryKey: ['account'],
      queryFn: read.fn,
      staleTime: Infinity,
    };
    await client.prefetch(options);
    const observer = client.observe<Account>(options);
    observer.controls.invalidate();
    expect(client.inspectCache()[0].status.invalidated).toBe(true);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    const subscription = subscribe(observer);
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(2);
    observer.controls.invalidate();
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(3);
    subscription.end();
  });

  it('replaces a READ in flight and swallows a failing one', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    const read = reads(call => {
      if (call === 1) return answer.promise;
      throw new Error('down');
    });
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: read.fn,
      retry: 0,
    });
    const subscription = subscribe(observer);
    observer.controls.invalidate();
    expect(read.cancelled()).toBe(1);
    expect(read.fn).toHaveBeenCalledTimes(2);
    await tick();
    expect(subscription.ref.status.value).toBe('error');
    subscription.end();
  });

  it('only invalidates while a linked WRITE is running', async () => {
    const client = createSyncClient();
    const read = reads(lee);
    const observer = client.observe<Account>({
      queryKey: ['account'],
      queryFn: read.fn,
    });
    const subscription = subscribe(observer);
    await tick();
    const write = deferred<string>();
    const running = client
      .mutation({ mutationFn: () => write.promise })
      .run(null, { links: [{ query: observer.controls.handle()! }] });
    await tick();
    observer.controls.invalidate();
    await tick();
    expect(read.fn).toHaveBeenCalledTimes(1);
    write.resolve('ok');
    await running;
    subscription.end();
  });
});

describe('releasing a key on a switch (T-QH-19)', () => {
  it('keeps the READ of key 1 through 1 → 2 → 1 within the schedule', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    const one = reads(() => answer.promise);
    const optionsFor = (id: number) => ({
      queryKey: ['account', id],
      queryFn: id === 1 ? one.fn : lee,
    });
    const observer = client.observe<Account>(optionsFor(1));
    const subscription = subscribe(observer);
    observer.setOptions(optionsFor(2));
    observer.setOptions(optionsFor(1));
    await tick();
    expect(one.fn).toHaveBeenCalledTimes(1);
    expect(one.cancelled()).toBe(0);
    answer.resolve({ name: 'One', age: 1 });
    await tick();
    expect(subscription.ref.data.name.value).toBe('One');
    subscription.end();
  });

  it('cancels key 1 and reads it again after a round trip past the schedule', async () => {
    const client = createSyncClient();
    const one = reads(() => new Promise<Account>(() => {}));
    const optionsFor = (id: number) => ({
      queryKey: ['account', id],
      queryFn: id === 1 ? one.fn : lee,
    });
    const observer = client.observe<Account>(optionsFor(1));
    const subscription = subscribe(observer);
    observer.setOptions(optionsFor(2));
    await tick();
    expect(one.cancelled()).toBe(1);
    observer.setOptions(optionsFor(1));
    expect(one.fn).toHaveBeenCalledTimes(2);
    subscription.end();
  });

  it("leaves key 1's functions to everyone else once an observer moves on", async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    let failNext = false;
    const called: number[] = [];
    // A queryFn that closes over the id, as an inline one in a render does.
    const optionsFor = (id: number) => ({
      queryKey: ['account', id],
      queryFn: (): Account => {
        called.push(id);
        if (failNext) {
          failNext = false;
          throw new Error('flaky');
        }
        return { name: `user ${id}`, age: id };
      },
      retryDelay: () => 100,
    });
    const explicit = client.query<Account>(optionsFor(1));
    await explicit.load();
    const observer = client.observe<Account>(optionsFor(1));
    const subscription = subscribe(observer);
    await vi.advanceTimersByTimeAsync(0);
    failNext = true;
    const retrying = explicit.refetch();
    await vi.advanceTimersByTimeAsync(0);
    observer.setOptions(optionsFor(2));
    await vi.advanceTimersByTimeAsync(100);
    await retrying;
    expect(explicit.ref.name.value).toBe('user 1');
    await explicit.refetch();
    await client
      .mutation({ mutationFn: () => 'ok' })
      .run(null, { links: [{ query: explicit, accept: { kind: 'refetch' } }] });
    expect(explicit.ref.name.value).toBe('user 1');
    expect(called.filter(id => id === 2)).toHaveLength(1);
    expect(subscription.ref.data.name.value).toBe('user 2');
    subscription.end();
    explicit.dispose();
  });
});
