import { describe, expect, it } from 'vitest';
import { createSyncClient, MutationRejectedError } from '../index';
import type { SyncCacheEvent, SyncMutationEvent } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

describe('client mutation observation', () => {
  it('reports one standalone operation without its input or response', async () => {
    const client = createSyncClient({ ssr: true });
    const events: SyncMutationEvent[] = [];
    const unsubscribe = client.subscribeMutations(event => events.push(event));
    const gate = deferred<{ receipt: string }>();
    const command = client.mutation({
      mutationFn: (_input: { city: string }) => gate.promise,
    });
    const task = command.start({ city: '서울' });

    expect(client.inspectMutations()).toMatchObject([
      {
        operationId: task.id,
        phase: 'pending',
        scope: null,
        attempt: 0,
        idempotent: false,
        linkedKeys: [],
        settledAt: null,
      },
    ]);
    await Promise.resolve();
    expect(events.map(event => event.type)).toEqual(['started']);

    gate.resolve({ receipt: '부산' });
    await task.result;
    await Promise.resolve();

    expect(events.map(event => event.type)).toEqual(['started', 'settled']);
    const settled = events[1].entry;
    expect(settled.phase).toBe('success');
    expect(settled.settledAt).toBeGreaterThanOrEqual(settled.startedAt);
    expect(JSON.stringify(events)).not.toContain('서울');
    expect(JSON.stringify(events)).not.toContain('부산');
    // Settled operations are not retained; observers own any history.
    expect(client.inspectMutations()).toEqual([]);
    unsubscribe();
    task.dispose();
    command.dispose();
  });

  it('separates scope waiting from the running write and reports retry attempts', async () => {
    const client = createSyncClient({ ssr: true });
    const events: SyncMutationEvent[] = [];
    client.subscribeMutations(event => events.push(event));
    const first = deferred<number>();
    const ordered = client.mutation({ mutationFn: () => first.promise });
    const leading = ordered.start(null, { scope: 'account' });
    const trailing = ordered.start(null, { scope: 'account' });
    await Promise.resolve();

    expect(client.inspectMutations().map(entry => entry.phase)).toEqual([
      'pending',
      'queued',
    ]);
    expect(client.inspectMutations().map(entry => entry.scope)).toEqual([
      'account',
      'account',
    ]);

    first.resolve(1);
    await leading.result;
    await trailing.result;
    await Promise.resolve();

    const trailingPhases = events
      .filter(event => event.entry.operationId === trailing.id)
      .map(event => `${event.type}:${event.entry.phase}`);
    expect(trailingPhases).toEqual([
      'started:queued',
      'updated:pending',
      'settled:success',
    ]);

    let attempts = 0;
    const flaky = client.mutation({
      mutationFn: () => {
        attempts += 1;
        if (attempts < 3) throw new Error('offline');
        return attempts;
      },
    });
    events.length = 0;
    const retried = flaky.start(null, {
      retry: 2,
      idempotencyKey: 'write-1',
      retryDelay: () => 0,
    });
    await retried.result;
    await Promise.resolve();

    expect(events.map(event => `${event.type}:${event.entry.attempt}`)).toEqual(
      ['started:0', 'updated:1', 'updated:2', 'settled:2']
    );
    expect(events[0].entry.idempotent).toBe(true);
    // The key itself is caller-owned and stays out of diagnostics.
    expect(JSON.stringify(events)).not.toContain('write-1');
  });

  it('records linked keys and distinguishes rejected, unknown, and sync-error', async () => {
    const client = createSyncClient({ ssr: true });
    const events: SyncMutationEvent[] = [];
    client.subscribeMutations(event => events.push(event));
    const query = client.query({
      queryKey: ['account', { id: 7 }],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';

    const rejected = await client
      .mutation({
        mutationFn: () => {
          throw new MutationRejectedError('invalid');
        },
      })
      .run(null, {
        links: [{ query, submission: query.capture(), onReject: 'keep' }],
      });
    expect(rejected.kind).toBe('rejected');

    const unknown = await client
      .mutation({ mutationFn: () => Promise.reject(new Error('timeout')) })
      .run(null, { links: [{ query }] });
    expect(unknown.kind).toBe('unknown');

    const syncError = await client
      .mutation({ mutationFn: () => ({ city: '대전' }) })
      .run(null, {
        links: [
          {
            query,
            accept: {
              kind: 'response',
              select: () => {
                throw new Error('mapping failed');
              },
            },
          },
        ],
      });
    expect(syncError.kind).toBe('sync-error');
    await Promise.resolve();

    const settled = events
      .filter(event => event.type === 'settled')
      .map(event => event.entry);
    expect(settled.map(entry => entry.phase)).toEqual([
      'rejected',
      'unknown',
      'sync-error',
    ]);
    for (const entry of settled) {
      expect(entry.linkedKeys).toEqual([['account', { id: 7 }]]);
      expect(Object.isFrozen(entry.linkedKeys[0])).toBe(true);
    }
    expect(JSON.stringify(events)).not.toContain('timeout');
    expect(JSON.stringify(events)).not.toContain('mapping failed');
    query.dispose();
  });

  it('isolates observers, ignores failed starts, and keeps stream order', async () => {
    const client = createSyncClient({ ssr: true });
    const cacheEvents: SyncCacheEvent[] = [];
    const order: string[] = [];
    client.subscribeCache(event => {
      cacheEvents.push(event);
      order.push(`cache:${event.type}`);
    });
    client.subscribeMutations(event => {
      order.push(`mutation:${event.type}`);
      throw new Error('observer failed');
    });
    const other = createSyncClient({ ssr: true });
    const otherEvents: SyncMutationEvent[] = [];
    other.subscribeMutations(event => otherEvents.push(event));

    const query = client.query({
      queryKey: ['isolated'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const stale = query.capture();
    query.ref.city.value = '광주';

    const command = client.mutation({ mutationFn: () => ({ ok: true }) });
    // A stale submission fails before the operation becomes pending.
    expect(() =>
      command.start(null, { links: [{ query, submission: stale }] })
    ).toThrow(/Submission is stale/);
    expect(client.inspectMutations()).toEqual([]);

    const result = await command.run(null, {
      links: [
        { query, submission: query.capture(), accept: { kind: 'submitted' } },
      ],
    });
    await Promise.resolve();

    // A throwing observer cannot change the write outcome.
    expect(result.kind).toBe('success');
    expect(order.filter(entry => entry.startsWith('mutation:'))).toEqual([
      'mutation:started',
      'mutation:settled',
    ]);
    // Both streams share one queue, so the started event precedes later cache events.
    expect(order.indexOf('mutation:started')).toBeLessThan(
      order.lastIndexOf('cache:updated')
    );
    expect(otherEvents).toEqual([]);

    const pendingDrop = client.mutation({ mutationFn: () => ({ ok: true }) });
    const dropped: SyncMutationEvent[] = [];
    const stop = client.subscribeMutations(event => dropped.push(event));
    void pendingDrop.run(null);
    stop();
    await Promise.resolve();
    expect(dropped).toEqual([]);
    query.dispose();
  });
});
