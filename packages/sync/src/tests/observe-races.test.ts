import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';
import type { QueryObserver, SyncClient } from '../index';

type Account = { name: string };
const queues: Array<Array<() => void>> = [];
const controllers: AbortController[] = [];
const flush = (queue: Array<() => void>) => {
  for (const release of queue.splice(0)) release();
};
const owners = (client: SyncClient, id: number) =>
  client.inspectCache().find(entry => entry.queryKey[1] === id)?.owners;
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}
function subscribe(observer: QueryObserver<Account>) {
  const controller = new AbortController();
  controllers.push(controller);
  const seen: Array<string | undefined> = [];
  const ref = observer.watch((current, first) => {
    seen.push(current.data.name.value);
    if (first) return controller.signal;
  });
  return { ref, seen, stop: () => controller.abort() };
}
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.abort();
  for (const queue of queues.splice(0)) flush(queue);
});

describe('release races (T-QH-43)', () => {
  it('confirms a new key while detached, then releases only the old key', async () => {
    const client = createSyncClient();
    const releases: Array<() => void> = [];
    queues.push(releases);
    const one = deferred<Account>();
    const two = deferred<Account>();
    const signals: AbortSignal[] = [];
    const reads: number[] = [];
    const options = (id: number) => ({
      queryKey: ['race', id],
      gcTime: Infinity,
      queryFn: ({ signal }: { signal: AbortSignal }) => {
        reads.push(id);
        signals.push(signal);
        return id === 1 ? one.promise : two.promise;
      },
    });
    const observer = client.observe(options(1), {
      scheduleRelease: release => releases.push(release),
    });
    const first = subscribe(observer);
    first.stop();
    expect(observer.controls.handle()).toBeNull();
    expect(observer.setOptions(options(2))).toBe(true);
    expect(observer.watch().queryKey.value).toEqual(['race', 2]);
    expect(reads).toEqual([1]);
    expect(owners(client, 2)).toBeUndefined();
    const next = subscribe(observer);
    const handle = observer.controls.handle();
    expect(reads).toEqual([1, 2]);
    expect(owners(client, 1)).toBe(1);
    expect(owners(client, 2)).toBe(1);
    flush(releases);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(owners(client, 1)).toBe(0);
    expect(owners(client, 2)).toBe(1);
    expect(observer.controls.handle()).toBe(handle);
    one.resolve({ name: 'old' });
    two.resolve({ name: 'new' });
    await tick();
    expect(next.ref.data.name.value).toBe('new');
    expect(next.seen).not.toContain('old');
    expect(first.seen).toEqual([undefined]);
    next.stop();
    flush(releases);
    expect(owners(client, 2)).toBe(0);
  });

  it('an old queued release cannot cancel the same key after resubscription', async () => {
    const client = createSyncClient();
    const releases: Array<() => void> = [];
    queues.push(releases);
    const answer = deferred<Account>();
    let signal!: AbortSignal;
    const queryFn = vi.fn((context: { signal: AbortSignal }) => {
      signal = context.signal;
      return answer.promise;
    });
    const observer = client.observe(
      { queryKey: ['race', 1], queryFn, gcTime: Infinity },
      { scheduleRelease: release => releases.push(release) }
    );
    const first = subscribe(observer);
    const oldHandle = observer.controls.handle();
    first.stop();
    const second = subscribe(observer);
    const newHandle = observer.controls.handle();
    expect(newHandle !== oldHandle).toBe(true);
    expect(owners(client, 1)).toBe(2);
    flush(releases);
    expect(owners(client, 1)).toBe(1);
    expect(observer.controls.handle()).toBe(newHandle);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(false);
    answer.resolve({ name: 'shared' });
    await tick();
    expect(second.ref.data.name.value).toBe('shared');
    expect(first.seen).toEqual([undefined]);
    second.stop();
    flush(releases);
    expect(owners(client, 1)).toBe(0);
  });

  it('a first connector callback exception releases its pending READ and permits a clean retry', async () => {
    const client = createSyncClient();
    const releases: Array<() => void> = [];
    queues.push(releases);
    const old = deferred<Account>();
    const fresh = deferred<Account>();
    const signals: AbortSignal[] = [];
    const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
      signals.push(signal);
      return signals.length === 1 ? old.promise : fresh.promise;
    });
    const observer = client.observe(
      { queryKey: ['race', 1], queryFn, gcTime: 0 },
      { scheduleRelease: release => releases.push(release) }
    );
    const throwing = vi.fn((current: ReturnType<typeof observer.watch>) => {
      void current.data.name.value;
      throw new Error('selection failed');
    });
    expect(() => observer.watch(throwing)).toThrow('selection failed');
    expect(observer.controls.handle()).toBeNull();
    expect(releases).toHaveLength(1);
    flush(releases);
    expect(signals[0].aborted).toBe(true);
    expect(owners(client, 1)).toBe(0);
    await tick();
    expect(client.size()).toBe(0);
    const retry = subscribe(observer);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(signals[1].aborted).toBe(false);
    old.resolve({ name: 'late old' });
    fresh.resolve({ name: 'fresh' });
    await tick();
    expect(throwing).toHaveBeenCalledTimes(1);
    expect(retry.ref.data.name.value).toBe('fresh');
    expect(retry.seen).not.toContain('late old');
    retry.stop();
    flush(releases);
    await tick();
    expect(client.size()).toBe(0);
  });
});
