/**
 * Lifetime repetition and the reasons a cache entry is retained (Phase 7.4 / R2-22).
 *
 * Reclamation has exactly four guards, and `evict()` and `remove()` share them:
 * an owner, local edits, an unconfirmed baseline, and an in-flight linked
 * WRITE. Every one of them is visible through `inspectCache()`, which is the
 * whole point - an app can see why memory is held, and a reason that cannot be
 * observed would be a leak whatever the implementation calls it.
 *
 * `scheduleGc()` adds a fifth condition that `evict()` does not check: an
 * in-flight READ. That asymmetry is only safe because `detach()` cancels such a
 * READ when the last owner leaves, so the tests below pin the cancellation
 * rather than the guard that depends on it.
 *
 * The repetition tests measure counts that must not grow: cached entries, timers
 * and environment listeners. They compare one round against twenty instead of
 * asserting an absolute number, so they keep working when a round legitimately
 * costs more than it did.
 *
 * Nothing here measures the heap. `WeakRef` and `FinalizationRegistry` observe
 * collection non-deterministically, and a test that waits for a collector is a
 * test that fails on someone else's machine.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'state-ref';
import { createDraft } from 'state-ref/draft';
import {
  createSyncClient,
  MutationRejectedError,
  openPersistedMutationQueue,
} from '../index';
import type { SyncCacheEvent, SyncStorage } from '../index';

afterEach(() => vi.useRealTimers());

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

function testEnvironment(online = true) {
  const listeners = new Set<(event: 'focus' | 'reconnect') => void>();
  return {
    listenerCount: () => listeners.size,
    emit: (event: 'focus' | 'reconnect') =>
      listeners.forEach(listener => listener(event)),
    setOnline: (value: boolean) => {
      online = value;
    },
    environment: {
      subscribe(listener: (event: 'focus' | 'reconnect') => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      isFocused: () => true,
      isOnline: () => online,
    },
  };
}

function memoryStorage(): SyncStorage {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: key => {
      values.delete(key);
    },
  };
}

/** The only entry in the cache, as tooling sees it. */
function only(client: ReturnType<typeof createSyncClient>) {
  const entries = client.inspectCache();
  expect(entries).toHaveLength(1);
  return entries[0]!.status;
}

describe('what keeps a cache entry alive', () => {
  it('evicts a clean unowned entry once gcTime expires', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const events: SyncCacheEvent['type'][] = [];
    const stop = client.subscribeCache(event => events.push(event.type));
    const query = client.query({
      queryKey: ['clean'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    query.dispose();
    expect(client.size()).toBe(1); // Disposing an owner only arms the timer.

    await vi.advanceTimersByTimeAsync(1500);
    expect(client.size()).toBe(0);
    expect(events.at(-1)).toBe('removed');
    stop();
  });

  it('refuses to remove an entry while a handle owns it', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query({
      queryKey: ['owned'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();

    expect(client.remove(['owned'])).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1);
    expect(client.inspectCache()[0]!.owners).toBe(1);

    query.dispose();
    expect(client.remove(['owned'])).toBe(true);
    expect(client.size()).toBe(0);
  });

  it('refuses to remove an entry holding local edits until they are accepted', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query({
      queryKey: ['dirty'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    const draft = createDraft(query.ref);
    draft.ref.n.value = 7;
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    draft.discard();

    expect(only(client).dirty).toBe(true);
    // The owner has to go first, or the owners guard answers instead of this one.
    query.dispose();
    expect(client.remove(['dirty'])).toBe(false);
    expect(vi.getTimerCount()).toBe(0); // Not even armed while edits are held.
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1); // Local input is never dropped by a timer.

    // A submitted acceptance consumes the edits, which is what makes the entry
    // collectable again - nothing else clears `dirty` without an owner.
    const resumed = client.query({
      queryKey: ['dirty'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    expect(resumed.isDirty()).toBe(true); // The same entry, edits intact.
    const submission = resumed.capture();
    const result = await client.mutation({ mutationFn: () => ({ n: 7 }) }).run(
      { n: 7 },
      {
        links: [{ query: resumed, submission, accept: { kind: 'submitted' } }],
      }
    );
    expect(result.kind).toBe('success');
    expect(only(client).dirty).toBe(false);

    resumed.dispose();
    await vi.advanceTimersByTimeAsync(1500);
    expect(client.size()).toBe(0);
  });

  it('refuses to remove an entry whose linked WRITE is in flight', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const gate = deferred<{ n: number }>();
    const query = client.query({
      queryKey: ['linked'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    const mutation = client.mutation({ mutationFn: () => gate.promise });
    const operation = mutation.start({ n: 2 }, { links: [{ query }] });
    await Promise.resolve();

    expect(only(client).pending).toBe(1);
    expect(only(client).dirty).toBe(false); // The reason is the link, nothing else.
    query.dispose();
    expect(client.remove(['linked'])).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1);

    gate.resolve({ n: 2 });
    expect((await operation.result).kind).toBe('success');
    operation.dispose();
    mutation.dispose();
  });
});

describe('recovery pins an entry that lost its baseline', () => {
  it('pins an entry left unconfirmed by an unknown WRITE until an owner confirms it', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query({
      queryKey: ['unknown'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    const result = await client
      .mutation({
        mutationFn: () => Promise.reject(new Error('connection lost')),
      })
      .run({ n: 2 }, { links: [{ query }] });
    expect(result.kind).toBe('unknown');

    // Unconfirmed on its own, with no local edits and no owner: the WRITE may
    // have reached the server, so the entry outlives its gcTime.
    expect(only(client)).toMatchObject({
      unconfirmed: true,
      dirty: false,
      pending: 0,
    });
    query.dispose();
    expect(client.remove(['unknown'])).toBe(false);
    expect(vi.getTimerCount()).toBe(0); // Not even armed while unconfirmed.
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1);

    const recovered = client.query({
      queryKey: ['unknown'],
      queryFn: () => ({ n: 9 }),
      gcTime: 1000,
    });
    recovered.acceptServer({ n: 9 });
    expect(only(client).unconfirmed).toBe(false);
    recovered.dispose();
    await vi.advanceTimersByTimeAsync(1500);
    expect(client.size()).toBe(0);
  });

  it('pins an entry whose baseline reconciliation failed after a successful WRITE', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const query = client.query({
      queryKey: ['sync-error'],
      queryFn: vi
        .fn()
        .mockResolvedValueOnce({ n: 1 })
        .mockRejectedValueOnce(new Error('read failed')),
      retry: 0,
      gcTime: 1000,
    });
    await query.load();
    const result = await client
      .mutation({ mutationFn: () => ({ accepted: true }) })
      .run({ n: 2 }, { links: [{ query, accept: { kind: 'refetch' } }] });

    expect(result.kind).toBe('sync-error');
    expect(only(client)).toMatchObject({ unconfirmed: true, dirty: false });
    query.dispose();
    expect(client.remove(['sync-error'])).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1);
  });
});

describe('an in-flight READ is cancelled by the last detach', () => {
  it('cancels the READ so eviction stays safe and the late value never revives the cache', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const gate = deferred<{ n: number }>();
    let first = true;
    const query = client.query({
      queryKey: ['mid-read'],
      queryFn: () => {
        if (!first) return gate.promise;
        first = false;
        return { n: 1 };
      },
      gcTime: 1000,
    });
    await query.load();
    const refetching = query.refetch();
    expect(query.status.fetchStatus.value).toBe('fetching');

    query.dispose();
    // `evict()` never looks at a pending READ; it is safe only because detach
    // cancelled this one.
    expect(only(client).fetchStatus).toBe('idle');
    expect(client.remove(['mid-read'])).toBe(true);
    expect(client.size()).toBe(0);

    gate.resolve({ n: 99 });
    await expect(refetching).resolves.toEqual({ n: 99 });
    // A queryFn that ignores its signal still resolves, into a cache that
    // dropped the entry (Phase 7.1 / DC7-1-04).
    expect(client.size()).toBe(0);
  });

  it('keeps an entry with a linked WRITE in flight instead of cancelling it', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const gate = deferred<{ n: number }>();
    const query = client.query({
      queryKey: ['linked-detach'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    const mutation = client.mutation({ mutationFn: () => gate.promise });
    const operation = mutation.start({ n: 2 }, { links: [{ query }] });
    await Promise.resolve();

    query.dispose(); // The last owner leaves mid-WRITE.
    await vi.advanceTimersByTimeAsync(5000);
    expect(client.size()).toBe(1);
    expect(only(client).pending).toBe(1);

    gate.resolve({ n: 2 });
    expect((await operation.result).kind).toBe('success');
    // The link is over, but the WRITE left no confirmed baseline behind.
    expect(only(client)).toMatchObject({ pending: 0, unconfirmed: true });
    operation.dispose();
    mutation.dispose();
  });
});

describe('repetition leaves nothing behind', () => {
  async function round(
    client: ReturnType<typeof createSyncClient>,
    index: number
  ) {
    const query = client.query({
      queryKey: ['round'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
      refetchOnFocus: true,
      refetchInterval: 50,
    });
    await query.load();
    const view = client.view({
      queryKey: ['round'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await view.query.load();

    const draft = createDraft(query.ref);
    draft.ref.n.value = index;
    draft.apply();
    draft.discard();

    const submission = query.capture();
    const mutation = client.mutation({ mutationFn: () => ({ n: index }) });
    const result = await mutation.run(
      { n: index },
      { links: [{ query, submission, accept: { kind: 'submitted' } }] }
    );
    expect(result.kind).toBe('success');
    mutation.dispose();
    view.dispose();
    query.dispose();

    const source = create({ id: 1 });
    const live = client.liveView(source.watch, (input: { id: number }) => ({
      queryKey: ['live', input.id],
      queryFn: () => ({ n: input.id }),
      gcTime: 1000,
    }));
    await vi.advanceTimersByTimeAsync(0);
    source.updateRef.id.value = 2; // Switching keys releases the previous entry.
    await vi.advanceTimersByTimeAsync(0);
    live.dispose();

    const infinite = client.infiniteQuery({
      queryKey: ['infinite'],
      queryFn: ({ pageParam }) => ({ page: pageParam as number }),
      initialPageParam: 0,
      getNextPageParam: (last: { page: number }) =>
        last.page < 2 ? last.page + 1 : undefined,
      gcTime: 1000,
    });
    await infinite.load();
    await infinite.fetchNextPage();
    infinite.dispose();
  }

  it('returns to the same cache, timer and listener counts after twenty rounds', async () => {
    vi.useFakeTimers();
    const host = testEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const measure = async (rounds: number) => {
      for (let index = 0; index < rounds; index += 1)
        await round(client, index);
      await vi.advanceTimersByTimeAsync(5000);
      return {
        size: client.size(),
        timers: vi.getTimerCount(),
        listeners: host.listenerCount(),
      };
    };

    const settled = { size: 0, timers: 0, listeners: 0 };
    expect(await measure(1)).toEqual(settled);
    expect(await measure(20)).toEqual(settled);
  });

  it('releases the environment subscription on every autoResume detach', async () => {
    const host = testEnvironment();
    const client = createSyncClient({ ssr: true });
    const command = client.mutation({
      mutationFn: (input: { id: string }) => input.id,
    });
    const queue = await openPersistedMutationQueue({
      storage: memoryStorage(),
      key: 'jobs',
      buster: 'v1',
      commands: { update: command },
      isOnline: () => host.environment.isOnline(),
    });

    for (let index = 0; index < 20; index += 1) {
      const stop = queue.autoResume(host.environment);
      expect(host.listenerCount()).toBe(1);
      stop();
      expect(host.listenerCount()).toBe(0);
    }
    command.dispose();
  });
});

describe('release after an error', () => {
  it('releases after a failed READ and after a rejected WRITE', async () => {
    vi.useFakeTimers();
    const host = testEnvironment();
    const client = createSyncClient({ environment: host.environment });
    const settled = { size: 0, timers: 0, listeners: 0 };
    const measure = async () => {
      await vi.advanceTimersByTimeAsync(5000);
      return {
        size: client.size(),
        timers: vi.getTimerCount(),
        listeners: host.listenerCount(),
      };
    };

    for (let index = 0; index < 20; index += 1) {
      const failing = client.query({
        queryKey: ['read-error'],
        queryFn: () => Promise.reject(new Error('read failed')),
        retry: 0,
        gcTime: 1000,
        refetchOnReconnect: true,
      });
      await expect(failing.load()).rejects.toThrow('read failed');
      failing.dispose();
    }
    expect(await measure()).toEqual(settled);

    for (let index = 0; index < 20; index += 1) {
      const query = client.query({
        queryKey: ['write-error'],
        queryFn: () => ({ n: 1 }),
        gcTime: 1000,
      });
      await query.load();
      const mutation = client.mutation({
        mutationFn: () => Promise.reject(new MutationRejectedError('refused')),
      });
      const result = await mutation.run({ n: 2 }, { links: [{ query }] });
      expect(result.kind).toBe('rejected');
      mutation.dispose();
      query.dispose();
    }
    // A confirmed rejection leaves a confirmed baseline, so nothing is pinned.
    expect(await measure()).toEqual(settled);
  });

  it('releases even when an observer callback throws', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const seen: SyncCacheEvent['type'][] = [];
    const stopThrowing = client.subscribeCache(() => {
      throw new Error('observer blew up');
    });
    const stopWatching = client.subscribeCache(event => seen.push(event.type));
    const stopMutations = client.subscribeMutations(() => {
      throw new Error('mutation observer blew up');
    });

    const query = client.query({
      queryKey: ['observed'],
      queryFn: () => ({ n: 1 }),
      gcTime: 1000,
    });
    await query.load();
    const result = await client
      .mutation({ mutationFn: () => ({ n: 2 }) })
      .run({ n: 2 });
    expect(result.kind).toBe('success');
    query.dispose();
    await vi.advanceTimersByTimeAsync(1500);

    // A thrown observer isolates itself: the next observer still sees the
    // events and the entry is still collected.
    expect(seen.at(-1)).toBe('removed');
    expect(client.size()).toBe(0);
    stopThrowing();
    stopWatching();
    stopMutations();
  });

  it('refuses reuse of a disposed handle with a named error', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['reuse'],
      queryFn: () => ({ n: 1 }),
    });
    await query.load();
    const heldRef = query.ref;
    const heldStatus = query.status;
    query.dispose();

    // A reference held from before the dispose reports the dispose, not a
    // silent empty read - that is what separates an expired ref from an
    // ordinary query replacement.
    expect(() => heldRef.n.value).toThrow(
      'This query handle has been disposed.'
    );
    expect(() => heldStatus.pending.value).toThrow(
      'This query handle has been disposed.'
    );
    expect(() => query.isDirty()).toThrow(
      'This query handle has been disposed.'
    );
    expect(() => query.dispose()).not.toThrow(); // Disposing twice is a no-op.

    const view = client.view({
      queryKey: ['reuse-view'],
      queryFn: () => ({ n: 1 }),
    });
    await view.query.load();
    const heldView = view.ref;
    view.dispose();
    expect(() => heldView.data.value).toThrow(
      'This query view has been disposed.'
    );
    expect(() => view.query.isDirty()).toThrow(
      'This query handle has been disposed.'
    );

    const mutation = client.mutation({ mutationFn: () => ({ ok: true }) });
    const operation = mutation.start({ n: 1 });
    await operation.result;
    const operationStatus = operation.status;
    operation.dispose();
    expect(() => operationStatus.phase.value).toThrow(
      'This mutation status has been disposed.'
    );
    const mutationStatus = mutation.status;
    mutation.dispose();
    expect(() => mutationStatus.phase.value).toThrow(
      'This mutation status has been disposed.'
    );
    expect(() => mutation.start({ n: 1 })).toThrow(
      'This mutation handle has been disposed.'
    );
  });
});
