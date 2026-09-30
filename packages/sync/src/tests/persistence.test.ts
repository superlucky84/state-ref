import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSyncClient,
  MutationRejectedError,
  openPersistedMutationQueue,
  restoreSyncSnapshot,
  saveSyncSnapshot,
} from '../index';
import type { SyncStorage } from '../index';

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: SyncStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: key => {
      values.delete(key);
    },
  };
  return { values, storage };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

afterEach(() => vi.useRealTimers());

describe('explicit clean baseline persistence', () => {
  it('round-trips a clean baseline and skips expired or busted data', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { storage, values } = memoryStorage();
    const server = createSyncClient({ ssr: true });
    const source = server.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '서울' }),
    });
    await source.load();
    const config = { key: 'baseline', buster: 'app-v1', maxAge: 100 };
    await saveSyncSnapshot(server, storage, config);
    expect(values.get('baseline')).toContain('"schemaVersion":1');
    const restored = createSyncClient({ ssr: true });
    expect(await restoreSyncSnapshot(restored, storage, config)).toBe(true);
    const query = restored.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '부산' }),
    });
    expect(query.ref.city.value).toBe('서울');
    query.ref.city.value = '대전';
    expect(source.ref.city.value).toBe('서울');

    expect(
      await restoreSyncSnapshot(createSyncClient(), storage, {
        ...config,
        buster: 'app-v2',
      })
    ).toBe(false);
    vi.setSystemTime(1101);
    const expired = createSyncClient();
    expect(await restoreSyncSnapshot(expired, storage, config)).toBe(false);
    expect(expired.size()).toBe(0);
    expect(values.has('baseline')).toBe(true);
    source.dispose();
    query.dispose();
  });

  it('never writes dirty or pending baselines and rejects corrupt restore atomically', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const pending = deferred<{ n: number }>();
    const query = client.query({
      queryKey: ['dirty'],
      queryFn: () => pending.promise,
    });
    const load = query.load();
    const config = { key: 'baseline', buster: 'v1' };
    await expect(saveSyncSnapshot(client, storage, config)).rejects.toThrow(
      'local or unresolved work'
    );
    expect(values.size).toBe(0);
    pending.resolve({ n: 1 });
    await load;
    query.ref.n.value = 2;
    await expect(saveSyncSnapshot(client, storage, config)).rejects.toThrow(
      'local or unresolved work'
    );
    expect(values.size).toBe(0);
    values.set(
      'baseline',
      JSON.stringify({
        schemaVersion: 1,
        buster: 'v1',
        savedAt: Date.now(),
        snapshot: {
          schemaVersion: 1,
          capturedAt: 1,
          queries: [
            {
              queryKey: ['valid'],
              data: { n: 1 },
              updatedAt: 1,
              editable: true,
              invalidated: false,
            },
            {
              queryKey: ['invalid'],
              data: { value: 2 },
              updatedAt: 1,
              editable: true,
              invalidated: false,
            },
          ],
        },
      })
    );
    const empty = createSyncClient({ ssr: true });
    await expect(restoreSyncSnapshot(empty, storage, config)).rejects.toThrow(
      'reserved'
    );
    expect(empty.size()).toBe(0);
    query.dispose();
  });
});

describe('durable standalone mutation queue', () => {
  it('holds offline, then resumes queued commands in order without replaying success', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const calls: string[] = [];
    const command = client.mutation({
      mutationFn: (input: { n: number }, context) => {
        calls.push(`${input.n}:${context.idempotencyKey}`);
        return input.n;
      },
    });
    let online = false;
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { update: command },
      isOnline: () => online,
    };
    const queue = await openPersistedMutationQueue(options);
    const input = { n: 1 };
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input,
      idempotencyKey: 'request-one',
    });
    input.n = 9;
    await queue.enqueue({
      id: 'two',
      command: 'update',
      input: { n: 2 },
      idempotencyKey: 'request-two',
    });
    expect(await queue.resume()).toEqual([]);
    expect(calls).toEqual([]);
    const restored = await openPersistedMutationQueue(options);
    expect(restored.entries()).toHaveLength(2);
    online = true;
    const [first, second] = await Promise.all([
      restored.resume(),
      restored.resume(),
    ]);
    expect(first.map(item => item.result.kind)).toEqual(['success', 'success']);
    expect(second).toEqual([]);
    expect(calls).toEqual(['1:request-one', '2:request-two']);
    expect(restored.entries()).toEqual([]);
    expect((await openPersistedMutationQueue(options)).entries()).toEqual([]);
  });

  it('holds an expired queued command without deleting or sending it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const write = vi.fn(() => 'saved');
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      maxAge: 100,
      commands: { send: client.mutation({ mutationFn: write }) },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    vi.setSystemTime(1101);
    expect(await queue.resume()).toEqual([]);
    expect(write).not.toHaveBeenCalled();
    expect(queue.entries()[0].state).toBe('queued');
    await queue.discard('one');
    expect(queue.entries()).toEqual([]);
  });

  it('records an in-flight marker before WRITE and never auto-replays it after restart', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const pending = deferred<string>();
    const write = vi.fn(() => pending.promise);
    const command = client.mutation({ mutationFn: write });
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: command },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: { n: 1 },
      idempotencyKey: 'stable-key',
    });
    const running = queue.resume();
    await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
    expect(JSON.parse(values.get('jobs')!).jobs[0].state).toBe('inFlight');
    const restarted = await openPersistedMutationQueue(options);
    expect(restarted.entries()[0].state).toBe('unknown');
    expect(await restarted.resume()).toEqual([]);
    expect(write).toHaveBeenCalledOnce();
    pending.resolve('saved');
    expect((await running)[0].result.kind).toBe('success');
  });

  it('requires an explicit retry for unknown and keeps the idempotency key', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const keys: (string | undefined)[] = [];
    const write = vi
      .fn()
      .mockImplementationOnce((_input, context) => {
        keys.push(context.idempotencyKey);
        throw new Error('connection lost');
      })
      .mockImplementationOnce((_input, context) => {
        keys.push(context.idempotencyKey);
        return 'saved';
      });
    const command = client.mutation({ mutationFn: write });
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: command },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'stable-key',
    });
    expect((await queue.resume())[0].result.kind).toBe('unknown');
    expect(await queue.resume()).toEqual([]);
    expect(write).toHaveBeenCalledOnce();
    const restarted = await openPersistedMutationQueue(options);
    expect(restarted.entries()[0].state).toBe('unknown');
    await restarted.retryUnknown('one');
    expect((await restarted.resume())[0].result.kind).toBe('success');
    expect(keys).toEqual(['stable-key', 'stable-key']);
    expect(restarted.entries()).toEqual([]);
  });

  it('holds later jobs after an unknown outcome until the first is resolved', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error('unknown result'))
      .mockResolvedValueOnce('saved')
      .mockResolvedValueOnce('next');
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: client.mutation({ mutationFn: write }) },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    await queue.enqueue({
      id: 'two',
      command: 'send',
      input: 2,
      idempotencyKey: 'two',
    });
    expect((await queue.resume()).map(item => item.result.kind)).toEqual([
      'unknown',
    ]);
    expect(write).toHaveBeenCalledOnce();
    expect(queue.entries().map(job => job.state)).toEqual([
      'unknown',
      'queued',
    ]);
    expect(await queue.resume()).toEqual([]);
    expect(write).toHaveBeenCalledOnce();
    await queue.retryUnknown('one');
    expect((await queue.resume()).map(item => item.result.kind)).toEqual([
      'success',
      'success',
    ]);
    expect(write).toHaveBeenCalledTimes(3);
  });

  it('does not start WRITE if the in-flight marker cannot be stored', async () => {
    const { storage, values } = memoryStorage();
    let writes = 0;
    const failing: SyncStorage = {
      ...storage,
      setItem: (key, value) => {
        writes += 1;
        if (writes === 2) throw new Error('storage unavailable');
        return storage.setItem(key, value);
      },
    };
    const client = createSyncClient({ ssr: true });
    const write = vi.fn(() => 'saved');
    const queue = await openPersistedMutationQueue({
      storage: failing,
      key: 'jobs',
      buster: 'v1',
      commands: { send: client.mutation({ mutationFn: write }) },
    });
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    await expect(queue.resume()).rejects.toThrow('storage unavailable');
    expect(write).not.toHaveBeenCalled();
    expect(queue.entries()[0].state).toBe('queued');
    expect(JSON.parse(values.get('jobs')!).jobs[0].state).toBe('queued');
  });

  it('holds a completed WRITE if removing its durable marker fails', async () => {
    const { storage, values } = memoryStorage();
    let writes = 0;
    const failing: SyncStorage = {
      ...storage,
      setItem: (key, value) => {
        writes += 1;
        if (writes === 3) throw new Error('storage unavailable');
        return storage.setItem(key, value);
      },
    };
    const client = createSyncClient({ ssr: true });
    const write = vi.fn(() => 'saved');
    const options = {
      storage: failing,
      key: 'jobs',
      buster: 'v1',
      commands: { send: client.mutation({ mutationFn: write }) },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    await expect(queue.resume()).rejects.toThrow('storage unavailable');
    expect(write).toHaveBeenCalledOnce();
    expect(queue.entries()[0].state).toBe('inFlight');
    expect(JSON.parse(values.get('jobs')!).jobs[0].state).toBe('inFlight');
    expect(await queue.resume()).toEqual([]);
    const restarted = await openPersistedMutationQueue(options);
    expect(restarted.entries()[0].state).toBe('unknown');
    expect(write).toHaveBeenCalledOnce();
  });

  it('does not mark or execute a restored job whose command is missing', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const write = vi.fn(() => 'saved');
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: client.mutation({ mutationFn: write }) },
    };
    const original = await openPersistedMutationQueue(options);
    await original.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    const before = values.get('jobs');
    const restored = await openPersistedMutationQueue({
      ...options,
      commands: {},
    });
    await expect(restored.resume()).rejects.toThrow('No mutation command');
    expect(values.get('jobs')).toBe(before);
    expect(write).not.toHaveBeenCalled();
  });

  it('keeps a confirmed rejection and continues the next queued command', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const write = vi
      .fn()
      .mockRejectedValueOnce(new MutationRejectedError('invalid'))
      .mockResolvedValueOnce('saved');
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: client.mutation({ mutationFn: write }) },
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    await queue.enqueue({
      id: 'two',
      command: 'send',
      input: 2,
      idempotencyKey: 'two',
    });
    expect((await queue.resume()).map(item => item.result.kind)).toEqual([
      'rejected',
      'success',
    ]);
    expect(queue.entries().map(job => [job.id, job.state])).toEqual([
      ['one', 'rejected'],
    ]);
    await expect(queue.retryUnknown('one')).rejects.toThrow('Only unknown');
    await queue.discard('one');
    expect(queue.entries()).toEqual([]);
  });

  it('rejects a busted or corrupt queue without changing its stored jobs', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const command = client.mutation({ mutationFn: () => 'saved' });
    const queue = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { send: command },
    });
    await expect(
      queue.enqueue({
        id: 'bad',
        command: 'send',
        input: { date: new Date() },
        idempotencyKey: 'bad',
      })
    ).rejects.toThrow('JSON-compatible');
    expect(values.has('jobs')).toBe(false);
    await queue.enqueue({
      id: 'one',
      command: 'send',
      input: 1,
      idempotencyKey: 'one',
    });
    const original = values.get('jobs');
    await expect(
      openPersistedMutationQueue({
        storage,
        key: 'jobs',
        buster: 'v2',
        commands: { send: command },
      })
    ).rejects.toThrow('buster differs');
    expect(values.get('jobs')).toBe(original);
    values.set(
      'jobs',
      JSON.stringify({
        schemaVersion: 1,
        buster: 'v1',
        savedAt: 1,
        jobs: [
          {
            id: 'one',
            command: 'send',
            input: 1,
            idempotencyKey: 'one',
            enqueuedAt: 1,
            state: 'queued',
          },
          {
            id: 'one',
            command: 'send',
            input: 2,
            idempotencyKey: 'two',
            enqueuedAt: 1,
            state: 'queued',
          },
        ],
      })
    );
    const corrupt = values.get('jobs');
    await expect(
      openPersistedMutationQueue({
        storage,
        key: 'jobs',
        buster: 'v1',
        commands: { send: command },
      })
    ).rejects.toThrow('Repeated');
    expect(values.get('jobs')).toBe(corrupt);
  });
});

function testEnvironment(online = true) {
  const listeners = new Set<(event: 'focus' | 'reconnect') => void>();
  return {
    setOnline(value: boolean) {
      online = value;
    },
    emit(event: 'focus' | 'reconnect') {
      listeners.forEach(listener => listener(event));
    },
    listenerCount: () => listeners.size,
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

describe('automatic resume of queued commands', () => {
  it('resumes on attach and reconnect, but not on focus or while offline', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const calls: string[] = [];
    const command = client.mutation({
      mutationFn: (input: { id: string }) => {
        calls.push(input.id);
        return input.id;
      },
    });
    const host = testEnvironment(false);
    const queue = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { update: command },
      isOnline: () => host.environment.isOnline(),
    });
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input: { id: 'one' },
      idempotencyKey: 'request-one',
    });

    const settled: string[][] = [];
    const stop = queue.autoResume(host.environment, {
      onSettled: results => settled.push(results.map(item => item.id)),
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual([]); // Attaching while offline sends nothing.
    expect(settled).toEqual([]);

    host.setOnline(true);
    host.emit('focus');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual([]); // Focus is not a reconnect, even when online.
    expect(settled).toEqual([]);

    host.setOnline(false);
    host.emit('reconnect');
    await new Promise(resolve => setTimeout(resolve, 0));
    // An offline reconnect does not run a resume at all, so nothing reports.
    expect(settled).toEqual([]);

    host.setOnline(true);
    host.emit('reconnect');
    await vi.waitFor(() => expect(calls).toEqual(['one']));
    expect(settled).toEqual([['one']]);
    expect(queue.entries()).toEqual([]);

    await queue.enqueue({
      id: 'two',
      command: 'update',
      input: { id: 'two' },
      idempotencyKey: 'request-two',
    });
    stop();
    expect(host.listenerCount()).toBe(0);
    host.emit('reconnect');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual(['one']); // A disposed auto-resume stays silent.
    expect(queue.entries()).toHaveLength(1);
  });

  it('resumes immediately when it attaches while already online', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const calls: string[] = [];
    const host = testEnvironment(true);
    const options = {
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: {
        update: client.mutation({
          mutationFn: (input: { id: string }) => {
            calls.push(input.id);
            return input.id;
          },
        }),
      },
      isOnline: () => host.environment.isOnline(),
    };
    const queue = await openPersistedMutationQueue(options);
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input: { id: 'one' },
      idempotencyKey: 'request-one',
    });
    const restarted = await openPersistedMutationQueue(options);
    expect(restarted.entries()).toHaveLength(1);
    restarted.autoResume(host.environment);
    await vi.waitFor(() => expect(calls).toEqual(['one']));
  });

  it('never sends past an unknown job and needs an explicit retry', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const calls: string[] = [];
    let failing = true;
    const host = testEnvironment(true);
    const queue = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: {
        update: client.mutation({
          mutationFn: (input: { id: string }) => {
            calls.push(input.id);
            if (failing) throw new Error('timeout');
            return input.id;
          },
        }),
      },
      isOnline: () => host.environment.isOnline(),
    });
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input: { id: 'one' },
      idempotencyKey: 'request-one',
    });
    await queue.enqueue({
      id: 'two',
      command: 'update',
      input: { id: 'two' },
      idempotencyKey: 'request-two',
    });
    queue.autoResume(host.environment);
    await vi.waitFor(() => expect(queue.entries()[0].state).toBe('unknown'));
    expect(calls).toEqual(['one']);

    failing = false;
    // Reconnecting repeatedly must not resend an unknown job.
    host.emit('reconnect');
    host.emit('reconnect');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual(['one']);
    expect(queue.entries().map(job => job.state)).toEqual([
      'unknown',
      'queued',
    ]);

    // Only an explicit decision puts it back in line.
    await queue.retryUnknown('one');
    host.emit('reconnect');
    await vi.waitFor(() => expect(calls).toEqual(['one', 'one', 'two']));
    expect(queue.entries()).toEqual([]);
  });

  it('drops a trailing resume that was requested before disposal', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const host = testEnvironment(true);
    const gate = deferred<string>();
    const queue = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { update: client.mutation({ mutationFn: () => gate.promise }) },
      isOnline: () => host.environment.isOnline(),
    });
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input: { id: 'one' },
      idempotencyKey: 'request-one',
    });
    let runs = 0;
    const stop = queue.autoResume(host.environment, {
      onSettled: () => {
        runs += 1;
      },
    });
    await vi.waitFor(() => expect(queue.entries()[0].state).toBe('inFlight'));

    host.emit('reconnect'); // Requests a trailing resume behind the running one.
    stop();
    gate.resolve('done');
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    // The running resume still reports; the trailing one never starts.
    expect(runs).toBe(1);
    expect(queue.entries()).toEqual([]);
  });

  it('coalesces bursts and isolates a throwing report callback', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const host = testEnvironment(true);
    const gate = deferred<string>();
    let held = true;
    const queue = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: {
        update: client.mutation({
          mutationFn: () => (held ? gate.promise : 'later'),
        }),
        missing: client.mutation({ mutationFn: () => 'unused' }),
      },
      isOnline: () => host.environment.isOnline(),
    });
    await queue.enqueue({
      id: 'one',
      command: 'update',
      input: { id: 'one' },
      idempotencyKey: 'request-one',
    });
    let runs = 0;
    const stop = queue.autoResume(host.environment, {
      onSettled: () => {
        runs += 1;
        throw new Error('reporting failed');
      },
    });
    await vi.waitFor(() => expect(queue.entries()[0].state).toBe('inFlight'));

    // Five reconnects during one run collapse into a single trailing resume.
    for (let index = 0; index < 5; index += 1) host.emit('reconnect');
    held = false;
    gate.resolve('done');
    await vi.waitFor(() => expect(runs).toBe(2));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(runs).toBe(2);
    expect(queue.entries()).toEqual([]);
    stop();

    // A resume that throws is reported without stopping later ones.
    const broken = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { update: client.mutation({ mutationFn: () => 'ok' }) },
      isOnline: () => host.environment.isOnline(),
    });
    await broken.enqueue({
      id: 'gone',
      command: 'update',
      input: { id: 'gone' },
      idempotencyKey: 'request-gone',
    });
    const reopened = await openPersistedMutationQueue({
      storage,
      key: 'jobs',
      buster: 'v1',
      commands: { other: client.mutation({ mutationFn: () => 'ok' }) },
      isOnline: () => host.environment.isOnline(),
    });
    const errors: string[] = [];
    reopened.autoResume(host.environment, {
      onError: error => {
        errors.push((error as Error).message);
        throw new Error('reporting failed');
      },
    });
    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(errors[0]).toContain('No mutation command registered');
    host.emit('reconnect');
    await vi.waitFor(() => expect(errors).toHaveLength(2));
  });
});
