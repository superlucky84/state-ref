/**
 * The peek (docs/sync-query-hooks, IMPLEMENT 단계 1): a display-shaped read of
 * the cache that creates nothing and owns nothing (DC-QH-12), live and
 * identity-stable (DC-QH-29). The observer that will use it comes in 단계 2,
 * so these reach it through the package-internal client hook.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'state-ref';
import { createSyncClient } from '../index';
import type { SyncCacheEvent } from '../index';
import { internalsOf } from '../internal';
import type { PeekOptions } from '../peek';

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

const peekOf = <T, S = T>(
  client: ReturnType<typeof createSyncClient>,
  options: () => PeekOptions<T, S>
) => internalsOf(client).peek<T, S>(options);

afterEach(() => vi.useRealTimers());

describe('peek: reading without taking part (T-QH-01)', () => {
  it('creates no entry and announces nothing for a missing key', async () => {
    const client = createSyncClient();
    const events: SyncCacheEvent[] = [];
    client.subscribeCache(event => events.push(event));
    const reader = peekOf<Account>(client, () => ({ queryKey: ['missing'] }));
    for (let index = 0; index < 5; index += 1) {
      void reader.ref.status.value;
      void reader.ref.data.name.value;
      reader.state();
    }
    expect(client.size()).toBe(0);
    await Promise.resolve();
    expect(events).toEqual([]);
  });

  it('leaves owners, events and the gc timer of an existing entry alone', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
      gcTime: 100,
    });
    await query.load();
    query.dispose();
    await Promise.resolve();
    const events: SyncCacheEvent[] = [];
    client.subscribeCache(event => events.push(event));
    // Read late in the gc window: a read that re-armed the timer would push
    // the eviction past 100ms.
    await vi.advanceTimersByTimeAsync(60);
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    for (let index = 0; index < 5; index += 1) {
      expect(reader.ref.data.name.value).toBe('Lee');
    }
    expect(client.inspectCache().map(entry => entry.owners)).toEqual([0]);
    await Promise.resolve();
    expect(events).toEqual([]);
    await vi.advanceTimersByTimeAsync(40);
    expect(client.size()).toBe(0);
    expect(reader.ref.status.value).toBe('pending');
    expect(reader.ref.data.value).toBeUndefined();
  });
});

describe('peek: what it shows (T-QH-02)', () => {
  it('follows a key from missing through in flight to loaded and edited', async () => {
    const client = createSyncClient();
    const read = deferred<Account>();
    const reader = peekOf<Account>(client, () => ({
      queryKey: ['account', 1],
    }));
    expect(reader.state()).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      loaded: false,
      data: undefined,
      enabled: true,
      errorSource: null,
    });
    expect(reader.ref.queryKey.value).toEqual(['account', 1]);

    const query = client.query<Account>({
      queryKey: ['account', 1],
      queryFn: () => read.promise,
    });
    // An existing entry with no READ yet: still idle (DC-QH-32).
    expect(reader.ref.fetchStatus.value).toBe('idle');
    const loading = query.load();
    // Never `fetching` ahead of a READ that has not started (DC-QH-32), but a
    // started one shows.
    expect(reader.ref.fetchStatus.value).toBe('fetching');
    expect(reader.ref.status.value).toBe('pending');
    read.resolve({ name: 'Lee', age: 3 });
    await loading;
    expect(reader.ref.status.value).toBe('success');
    expect(reader.ref.fetchStatus.value).toBe('idle');
    expect(reader.ref.data.name.value).toBe('Lee');
    query.ref.name.value = 'Kim';
    expect(reader.ref.data.name.value).toBe('Kim');
    expect(reader.ref.dirty.value).toBe(true);
    query.dispose();
  });

  it('is idle with its key while disabled', () => {
    const client = createSyncClient();
    const reader = peekOf<Account>(client, () => ({
      queryKey: ['account', 2],
      enabled: false,
    }));
    expect(reader.state()).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      enabled: false,
      data: undefined,
      queryKey: ['account', 2],
    });
  });

  it('refuses a ref in a query key when opening, too', () => {
    const client = createSyncClient();
    const id = create({ id: 7 }, { autoSync: true }).watch();
    expect(() =>
      client.query({ queryKey: ['user', id.id], queryFn: () => 1 })
    ).toThrow('read a ref with `.value`');
    expect(client.size()).toBe(0);
  });

  it('shows what opening the options would refuse, as a source error', async () => {
    const client = createSyncClient();
    const feed = client.infiniteQuery({
      queryKey: ['feed'],
      initialPageParam: 0,
      queryFn: () => 1,
      getNextPageParam: () => undefined,
    });
    await feed.load();
    const account = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await account.load();
    const refusals: Array<[PeekOptions<any>, () => unknown]> = [
      [
        { queryKey: ['feed'] },
        () => client.query({ queryKey: ['feed'], queryFn: () => 1 }),
      ],
      [
        { queryKey: ['account'], editable: false },
        () =>
          client.query({
            queryKey: ['account'],
            queryFn: () => ({ name: 'Lee', age: 3 }),
            editable: false,
          }),
      ],
      [
        { queryKey: ['other'], initialData: { a: 1 }, initialUpdatedAt: -5 },
        () =>
          client.query({
            queryKey: ['other'],
            queryFn: () => ({ a: 1 }),
            initialData: { a: 1 },
            initialUpdatedAt: -5,
          }),
      ],
      [
        { queryKey: ['dated'], initialData: { at: new Date(0) } },
        () =>
          client.query({
            queryKey: ['dated'],
            queryFn: () => ({ at: new Date(0) }),
            initialData: { at: new Date(0) },
          }),
      ],
    ];
    for (const [options, open] of refusals) {
      const state = peekOf(client, () => options).state();
      expect(state.errorSource).toBe('source');
      expect(state.status).toBe('error');
      expect(open).toThrow((state.error as Error).message);
    }
    // Readonly data may be any value, as opening it allows.
    const readonly = peekOf(client, () => ({
      queryKey: ['dated-readonly'],
      editable: false,
      initialData: { at: new Date(0) },
    })).state();
    expect(readonly.status).toBe('success');
    feed.dispose();
    account.dispose();
  });

  it('shows invalid options as a source error instead of throwing', () => {
    const client = createSyncClient();
    const id = create({ id: 7 }, { autoSync: true }).watch();
    const cases: Array<PeekOptions<Account>> = [
      { queryKey: ['user', undefined] },
      { queryKey: ['user', new Map()] },
      // A forgotten `.value`: a ref is not key data, even a ref to a number.
      { queryKey: ['user', id.id] },
      { queryKey: ['user', id] },
      { queryKey: ['user', 1], enabled: 1 as unknown as boolean },
    ];
    for (const options of cases) {
      const reader = peekOf<Account>(client, () => options);
      expect(() => reader.ref.status.value).not.toThrow();
      const state = reader.state();
      expect(state).toMatchObject({
        status: 'error',
        errorSource: 'source',
        queryKey: null,
        enabled: false,
      });
      expect(state.error).toBeInstanceOf(TypeError);
    }
    expect(client.size()).toBe(0);
  });
});

describe('peek: display options (T-QH-06)', () => {
  it('projects select and placeholderData like the display does', async () => {
    const client = createSyncClient();
    const read = deferred<Account>();
    const options = {
      queryKey: ['account'],
      select: (data: Account) => `${data.name}:${data.age}`,
      placeholderData: { name: '대기', age: 0 },
    };
    const query = client.query<Account, string>({
      ...options,
      queryFn: () => read.promise,
    });
    const reader = peekOf<Account, string>(client, () => options);
    const compare = () => {
      const shown = query.display.value;
      const peeked = reader.state();
      expect(peeked.data).toBe(shown.data);
      expect(peeked.isPlaceholder).toBe(shown.isPlaceholder);
      expect(peeked.status).toBe(shown.status);
    };
    compare();
    expect(reader.ref.data.value).toBe('대기:0');
    const loading = query.load();
    read.resolve({ name: 'Lee', age: 3 });
    await loading;
    compare();
    expect(reader.ref.data.value).toBe('Lee:3');
    query.dispose();
  });

  it('keeps a select failure to itself', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const reader = peekOf<Account, string>(client, () => ({
      queryKey: ['account'],
      select: () => {
        throw new RangeError('no');
      },
    }));
    expect(reader.state()).toMatchObject({
      status: 'error',
      errorSource: 'select',
    });
    expect(query.status.value.status).toBe('success');
    query.dispose();
  });

  it('keeps the previous data object when equals says nothing changed', async () => {
    const client = createSyncClient();
    let age = 3;
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age }),
    });
    await query.load();
    const reader = peekOf<Account, { name: string }>(client, () => ({
      queryKey: ['account'],
      select: data => ({ name: data.name }),
      equals: (next, previous) => next.name === previous.name,
    }));
    const before = reader.ref.data.value;
    age = 4;
    await query.refetch();
    expect(query.ref.age.value).toBe(4);
    expect(reader.ref.data.value).toBe(before);
    query.dispose();
  });
});

describe('peek: a failing equals (T-QH-06)', () => {
  it('shows the select error the display shows', async () => {
    const client = createSyncClient();
    let age = 3;
    const options = {
      queryKey: ['account'],
      select: (data: Account) => ({ age: data.age }),
      equals: (): boolean => {
        throw new Error('cannot compare');
      },
    };
    const query = client.query<Account, { age: number }>({
      ...options,
      queryFn: () => ({ name: 'Lee', age }),
    });
    void query.display.value;
    await query.load();
    const reader = peekOf<Account, { age: number }>(client, () => options);
    void reader.state();
    age = 4;
    await query.refetch();
    const shown = query.display.value;
    const peeked = reader.state();
    expect(shown.errorSource).toBe('select');
    expect(peeked.errorSource).toBe(shown.errorSource);
    expect(peeked.status).toBe('error');
    expect(peeked.data).toBeUndefined();
    expect(reader.state()).toBe(peeked);
    query.dispose();
  });
});

describe('peek: read-only (T-QH-07)', () => {
  it('refuses writes and leaves the cache as it was', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    expect(() => {
      (reader.ref.data.value as Account).name = 'Kim';
    }).toThrow('Resource snapshots cannot be modified directly.');
    expect(() => {
      (reader.ref.data as unknown as { value: Account }).value = {
        name: 'Kim',
        age: 1,
      };
    }).toThrow();
    // A select gets the same read-only snapshot a display hands it.
    const mutating = peekOf<Account, string>(client, () => ({
      queryKey: ['account'],
      select: (data: Account) => {
        data.name = 'Park';
        return data.name;
      },
    })).state();
    expect(mutating.errorSource).toBe('select');
    expect((mutating.error as Error).message).toBe(
      'Resource snapshots cannot be modified directly.'
    );
    expect(query.ref.name.value).toBe('Lee');
    expect(query.isDirty()).toBe(false);
    query.dispose();
  });

  it('hands out read-only state and key, for a readonly query too', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account', 1],
      queryFn: () => ({ name: 'Lee', age: 3 }),
      editable: false,
    });
    await query.load();
    const reader = peekOf<Account>(client, () => ({
      queryKey: ['account', 1],
      editable: false,
    }));
    const state = reader.state();
    expect(() => {
      (state.data as Account).name = 'Kim';
    }).toThrow();
    expect(() => {
      (state.queryKey as unknown[]).push('x');
    }).toThrow();
    expect(query.ref.name.value).toBe('Lee');
    expect(reader.ref.queryKey.value).toEqual(['account', 1]);
    query.dispose();
  });
});

describe('peek: live and identity-stable (T-QH-15)', () => {
  it('shows data that arrived after the ref was made, at any depth', async () => {
    const client = createSyncClient();
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    const data = reader.ref.data;
    expect(reader.ref.data.name.value).toBeUndefined();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    // Held from before the load: the read still recomputes.
    expect(data.name.value).toBe('Lee');
    query.dispose();
  });

  it('recomputes when a held ref is inspected, not only read', async () => {
    const client = createSyncClient();
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    const data = reader.ref.data;
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    expect('name' in data).toBe(true);
    expect(Object.keys(data)).toEqual(['name', 'age']);
    query.dispose();
  });

  it('follows a change of display options alone', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    let options: PeekOptions<Account, string> = {
      queryKey: ['account'],
      select: data => data.name,
    };
    const reader = peekOf<Account, string>(client, () => options);
    const ref = reader.ref;
    const first = ref.value;
    expect(ref.data.value).toBe('Lee');
    options = { queryKey: ['account'], select: data => String(data.age) };
    expect(ref.data.value).toBe('3');
    const second = ref.value;
    expect(second).not.toBe(first);
    expect(ref.value).toBe(second);

    // Before a load, placeholderData and initialData are what show.
    const empty = createSyncClient();
    let pending: PeekOptions<Account> = {
      queryKey: ['account'],
      placeholderData: { name: 'one', age: 0 },
    };
    const before = peekOf<Account>(empty, () => pending);
    expect(before.ref.data.name.value).toBe('one');
    pending = {
      queryKey: ['account'],
      placeholderData: { name: 'two', age: 0 },
    };
    expect(before.ref.data.name.value).toBe('two');
    pending = { queryKey: ['account'], initialData: { name: 'i1', age: 0 } };
    expect(before.ref.data.name.value).toBe('i1');
    pending = { queryKey: ['account'], initialData: { name: 'i2', age: 0 } };
    expect(before.ref.data.name.value).toBe('i2');
    pending = { ...pending, initialUpdatedAt: 1 };
    expect(before.ref.updatedAt.value).toBe(1);
    pending = { ...pending, initialUpdatedAt: 2 };
    expect(before.ref.updatedAt.value).toBe(2);
    const settled = before.ref.value;
    expect(before.ref.value).toBe(settled);
    query.dispose();
  });

  it('survives a select that returns a new cyclic value each time', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const cyclic = (tag: string) => (data: Account) => {
      const node: { tag: string; name: string; self?: unknown } = {
        tag,
        name: data.name,
      };
      node.self = node;
      return node;
    };
    let options: PeekOptions<Account, { tag: string }> = {
      queryKey: ['account'],
      select: cyclic('first'),
    };
    const reader = peekOf<Account, { tag: string }>(client, () => options);
    expect(reader.ref.data.tag.value).toBe('first');
    options = { queryKey: ['account'], select: cyclic('second') };
    expect(reader.ref.data.tag.value).toBe('second');
    options = { queryKey: ['account'], select: cyclic('second') };
    expect(reader.ref.data.tag.value).toBe('second');
    query.dispose();
  });

  it('follows its options when they change', async () => {
    const client = createSyncClient();
    for (const id of [1, 2]) {
      const query = client.query<Account>({
        queryKey: ['account', id],
        queryFn: () => ({ name: `user${id}`, age: id }),
      });
      await query.load();
      query.dispose();
    }
    let options: PeekOptions<Account> = { queryKey: ['account', 1] };
    const reader = peekOf<Account>(client, () => options);
    const ref = reader.ref;
    expect(ref.data.name.value).toBe('user1');
    options = { queryKey: ['account', 2] };
    expect(ref.data.name.value).toBe('user2');
    expect(ref.queryKey.value).toEqual(['account', 2]);
  });

  it('returns the same objects while nothing it depends on changed', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    const first = reader.ref.value;
    expect(reader.ref.value).toBe(first);
    expect(reader.ref.data.value).toBe(reader.ref.data.value);
    expect(reader.state()).toBe(reader.state());

    const other = client.query({
      queryKey: ['other'],
      queryFn: () => ({ count: 1 }),
    });
    await other.load();
    expect(reader.ref.value).toBe(first);

    query.ref.age.value = 4;
    const edited = reader.ref.value;
    expect(edited).not.toBe(first);
    expect(reader.ref.value).toBe(edited);
    query.dispose();
    other.dispose();
  });

  it('keeps the same object when the status is republished unchanged', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const reader = peekOf<Account>(client, () => ({ queryKey: ['account'] }));
    query.invalidate();
    const invalidated = reader.ref.value;
    expect(invalidated.invalidated).toBe(true);
    // A second invalidate publishes a new status object with the same fields.
    const statusBefore = query.status.value;
    query.invalidate();
    expect(query.status.value).not.toBe(statusBefore);
    expect(reader.ref.value).toBe(invalidated);
    query.dispose();
  });

  it('keeps each reader stable when two are read in turn', async () => {
    const client = createSyncClient();
    for (const id of [1, 2]) {
      const query = client.query<Account>({
        queryKey: ['account', id],
        queryFn: () => ({ name: `user${id}`, age: id }),
      });
      await query.load();
      query.dispose();
    }
    const confirmed = peekOf<Account>(client, () => ({
      queryKey: ['account', 1],
    }));
    const rendered = peekOf<Account>(client, () => ({
      queryKey: ['account', 2],
    }));
    const a = confirmed.ref.value;
    const b = rendered.ref.value;
    for (let index = 0; index < 3; index += 1) {
      expect(confirmed.ref.value).toBe(a);
      expect(rendered.ref.value).toBe(b);
    }
  });

  it('keeps an invalid key on one error object (DC-QH-13)', () => {
    const client = createSyncClient();
    // A new key array per read, as a render passes one.
    const reader = peekOf<Account>(client, () => ({
      queryKey: ['user', undefined],
    }));
    const first = reader.ref.value;
    expect(reader.ref.value).toBe(first);
    expect(reader.state().error).toBe(first.error);
  });
});

describe('peek: initialData (T-QH-17)', () => {
  it('shows initialData for a missing key without seeding it', () => {
    const client = createSyncClient();
    const reader = peekOf<Account, string>(client, () => ({
      queryKey: ['account'],
      initialData: { name: '초기', age: 1 },
      initialUpdatedAt: 123,
      select: data => data.name,
    }));
    expect(reader.state()).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      loaded: true,
      data: '초기',
      updatedAt: 123,
      isPlaceholder: false,
    });
    expect(client.size()).toBe(0);
    const untimed = peekOf<Account>(client, () => ({
      queryKey: ['account'],
      initialData: { name: '초기', age: 1 },
    }));
    expect(untimed.ref.updatedAt.value).toBeNull();
  });

  it('matches what opening the query shows over a failed prefetch', async () => {
    const client = createSyncClient();
    const failing = vi.fn(async (): Promise<Account> => {
      throw new Error('down');
    });
    await client.prefetch({
      queryKey: ['account'],
      queryFn: failing,
      retry: 0,
    });
    expect(client.inspectCache()[0]).toMatchObject({
      owners: 0,
      status: { status: 'error' },
    });
    const options = {
      queryKey: ['account'],
      initialData: { name: '초기', age: 1 },
      initialUpdatedAt: 123,
      staleTime: Infinity,
    };
    const reader = peekOf<Account>(client, () => options);
    const before = reader.state();
    expect(before).toMatchObject({ status: 'success', loaded: true });
    const query = client.query<Account>({ ...options, queryFn: failing });
    const shown = query.display.value;
    expect(shown.status).toBe(before.status);
    expect(shown.loaded).toBe(before.loaded);
    expect(shown.updatedAt).toBe(before.updatedAt);
    expect(shown.data).toEqual(before.data);
    query.dispose();
  });

  it('does not seed over a READ in flight, as opening does not', async () => {
    const client = createSyncClient();
    void client.prefetch({
      queryKey: ['account'],
      queryFn: () => new Promise<Account>(() => {}),
    });
    const options = {
      queryKey: ['account'],
      initialData: { name: '초기', age: 1 },
    };
    const peeked = peekOf<Account>(client, () => options).state();
    expect(peeked).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    });
    const query = client.query<Account>({
      ...options,
      queryFn: () => new Promise<Account>(() => {}),
    });
    const shown = query.display.value;
    expect(shown.status).toBe(peeked.status);
    expect(shown.fetchStatus).toBe(peeked.fetchStatus);
    expect(shown.data).toBe(peeked.data);
    query.dispose();
  });

  it('shows the loaded value, not initialData, once there is one', async () => {
    const client = createSyncClient();
    const query = client.query<Account>({
      queryKey: ['account'],
      queryFn: () => ({ name: 'Lee', age: 3 }),
    });
    await query.load();
    const reader = peekOf<Account>(client, () => ({
      queryKey: ['account'],
      initialData: { name: '초기', age: 1 },
    }));
    expect(reader.ref.data.name.value).toBe('Lee');
    query.dispose();
  });
});
