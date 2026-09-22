import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient, MutationRejectedError } from '../index';
import { createDraft } from 'state-ref/draft';

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

describe('value boundaries under an open draft', () => {
  it('resolves an A to B to A return and drops a converged edit', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['aba'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();

    const aba = createDraft(query.ref);
    aba.ref.city.value = '대전';
    query.ref.city.value = '부산';
    expect(aba.status.conflicts.value).toBe(1);
    query.ref.city.value = '서울';
    // A conflict is a function of the current source value, not of history.
    expect(aba.status.conflicts.value).toBe(0);
    expect(aba.apply()).toEqual({ ok: true, applied: 1 });
    expect(query.ref.city.value).toBe('대전');
    aba.discard();

    const converged = createDraft(query.ref);
    converged.ref.city.value = '광주';
    query.ref.city.value = '광주'; // The source reaches the same value alone.
    expect(converged.status.conflicts.value).toBe(0);
    expect(converged.isDirty()).toBe(false);
    expect(converged.apply()).toEqual({ ok: true, applied: 0 });
    converged.discard();
  });

  it('refuses an apply whose path now points at another array element', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['items'],
      queryFn: () => ({ items: [{ name: 'a' }, { name: 'b' }] }),
    });
    await query.load();
    const draft = createDraft(query.ref);
    draft.ref.items[0].name.value = 'EDITED';

    query.ref.items.value = [{ name: 'b' }, { name: 'a' }];
    expect(draft.status.conflicts.value).toBe(1);
    // The draft keeps showing its own branch and never overwrites the source.
    expect(draft.ref.items.value).toEqual([{ name: 'EDITED' }, { name: 'b' }]);
    expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });
    expect(query.ref.items.value).toEqual([{ name: 'b' }, { name: 'a' }]);
    draft.discard();
  });

  it('keeps a local apply made before a pending READ settles', async () => {
    const client = createSyncClient({ ssr: true });
    const gate = deferred<{ city: string }>();
    let first = true;
    const query = client.query({
      queryKey: ['late'],
      queryFn: () => {
        if (!first) return gate.promise;
        first = false;
        return { city: '서울' };
      },
    });
    await query.load();
    const draft = createDraft(query.ref);
    draft.ref.city.value = '대전';

    const refetching = query.refetch();
    expect(query.status.fetchStatus.value).toBe('fetching');
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    expect(query.ref.city.value).toBe('대전');

    gate.resolve({ city: '광주' });
    await refetching;
    // The arriving baseline does not overwrite the applied local input.
    expect(query.ref.city.value).toBe('대전');
    expect(query.isDirty()).toBe(true);
    expect(draft.status.conflicts.value).toBe(0);
    draft.discard();
  });
});

describe('READ ordering and epochs', () => {
  it('keeps the newest read when two refetches settle out of order', async () => {
    const client = createSyncClient({ ssr: true });
    const gates = [deferred<{ n: number }>(), deferred<{ n: number }>()];
    let started = -1;
    const query = client.query({
      queryKey: ['epoch'],
      queryFn: () => {
        started += 1;
        return started === 0 ? { n: 0 } : gates[started - 1].promise;
      },
    });
    await query.load();

    const first = query.refetch();
    const second = query.refetch();
    expect(first).not.toBe(second); // A forced refetch starts its own READ.
    gates[1].resolve({ n: 2 }); // The later READ settles first.
    gates[0].resolve({ n: 1 });
    expect(await first).toEqual({ n: 1 });
    expect(await second).toEqual({ n: 2 });
    // The cache holds the newest epoch regardless of settle order.
    expect(query.ref.n.value).toBe(2);
    query.dispose();
  });

  it('never lets a late read reach an entry that was removed and recreated', async () => {
    const client = createSyncClient({ ssr: true });
    const gate = deferred<{ n: number }>();
    let first = true;
    const options = {
      queryKey: ['recreated'],
      queryFn: () => {
        if (!first) return gate.promise;
        first = false;
        return { n: 0 };
      },
    };
    const query = client.query(options);
    await query.load();
    const refetching = query.refetch();
    query.dispose();
    expect(client.remove(['recreated'])).toBe(true);

    const recreated = client.query({
      queryKey: ['recreated'],
      queryFn: () => ({ n: 9 }),
    });
    await recreated.load();
    gate.resolve({ n: 1 }); // The old READ lands last.
    await refetching;
    expect(recreated.ref.n.value).toBe(9);
    expect(client.size()).toBe(1);
    recreated.dispose();
  });

  it('aborts a pending read on invalidate and recovers on the next one', async () => {
    const build = (honorSignal: boolean) => {
      const client = createSyncClient({ ssr: true });
      const gate = deferred<{ n: number }>();
      let first = true;
      const query = client.query({
        queryKey: ['invalidated'],
        queryFn: ({ signal }) => {
          if (first) {
            first = false;
            return { n: 0 };
          }
          if (!honorSignal) return gate.promise;
          return new Promise<{ n: number }>((resolve, reject) => {
            void gate.promise.then(resolve);
            signal.addEventListener('abort', () => reject(signal.reason), {
              once: true,
            });
          });
        },
      });
      return { client, query, gate };
    };

    const honoring = build(true);
    await honoring.query.load();
    const rejected = honoring.query.refetch().catch(error => error);
    honoring.client.invalidate(['invalidated']);
    honoring.gate.resolve({ n: 1 });
    expect((await rejected).name).toBe('AbortError');
    expect(honoring.query.ref.n.value).toBe(0);
    expect(honoring.query.status.invalidated.value).toBe(true);
    // An aborted READ is not a failed READ.
    expect(honoring.query.status.status.value).toBe('success');

    const ignoring = build(false);
    await ignoring.query.load();
    const resolved = ignoring.query.refetch();
    ignoring.client.invalidate(['invalidated']);
    ignoring.gate.resolve({ n: 1 });
    // A queryFn that ignores its signal still resolves, but the cache has
    // already dropped that READ, so the caller sees a value it never stored.
    expect(await resolved).toEqual({ n: 1 });
    expect(ignoring.query.ref.n.value).toBe(0);
    expect(ignoring.query.status.invalidated.value).toBe(true);

    // The next READ recovers normally.
    expect(await ignoring.query.refetch()).toEqual({ n: 1 });
    expect(ignoring.query.ref.n.value).toBe(1);
    expect(ignoring.query.status.invalidated.value).toBe(false);
  });
});

describe('WRITE boundaries', () => {
  it('refuses a read while a linked WRITE holds the query', async () => {
    const client = createSyncClient({ ssr: true });
    const write = deferred<{ ok: boolean }>();
    let served = { city: '서울' };
    const query = client.query({
      queryKey: ['linked'],
      queryFn: () => ({ ...served }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const operation = client
      .mutation({ mutationFn: () => write.promise })
      .start(null, {
        links: [
          { query, submission: query.capture(), accept: { kind: 'submitted' } },
        ],
      });

    served = { city: '광주' };
    await expect(query.refetch()).rejects.toThrow();
    expect(query.ref.city.value).toBe('부산');

    write.resolve({ ok: true });
    expect((await operation.result).kind).toBe('success');
    expect(query.ref.city.value).toBe('부산');
    expect(query.isDirty()).toBe(false);
    expect(query.status.unconfirmed.value).toBe(false);
    operation.dispose();
    query.dispose();
  });

  it('excludes a read that was already running when the WRITE started', async () => {
    const client = createSyncClient({ ssr: true });
    const gate = deferred<{ city: string }>();
    const write = deferred<{ ok: boolean }>();
    let first = true;
    const query = client.query({
      queryKey: ['overlap'],
      queryFn: () => {
        if (!first) return gate.promise;
        first = false;
        return { city: '서울' };
      },
    });
    await query.load();
    const refetching = query.refetch().catch(error => `rejected:${error.name}`);
    expect(query.status.fetchStatus.value).toBe('fetching');

    query.ref.city.value = '부산';
    const operation = client
      .mutation({ mutationFn: () => write.promise })
      .start(null, {
        links: [
          { query, submission: query.capture(), accept: { kind: 'submitted' } },
        ],
      });
    write.resolve({ ok: true });
    expect((await operation.result).kind).toBe('success');
    expect(query.ref.city.value).toBe('부산');

    // The READ that predates the WRITE cannot install its baseline afterwards.
    gate.resolve({ city: '광주' });
    await refetching;
    expect(query.ref.city.value).toBe('부산');
    expect(query.isDirty()).toBe(false);
    operation.dispose();
    query.dispose();
  });

  it('holds a cancelled WRITE as unknown and keeps the submitted input', async () => {
    const client = createSyncClient({ ssr: true });
    const started = deferred<void>();
    const query = client.query({
      queryKey: ['cancelled'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const operation = client
      .mutation({
        mutationFn: (_input: null, { signal }) => {
          started.resolve();
          return new Promise<{ ok: boolean }>((_resolve, reject) =>
            signal.addEventListener('abort', () => reject(signal.reason), {
              once: true,
            })
          );
        },
      })
      .start(null, {
        links: [
          { query, submission: query.capture(), accept: { kind: 'submitted' } },
        ],
      });
    await started.promise;
    operation.abort();

    expect((await operation.result).kind).toBe('unknown');
    // A cancelled WRITE may still have reached the server.
    expect(query.status.unconfirmed.value).toBe(true);
    expect(query.isDirty()).toBe(true);
    expect(query.ref.city.value).toBe('부산');
    operation.dispose();
    query.dispose();
  });

  it('removes only the rejected submission and leaves another path to a draft', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['rejected'],
      queryFn: () => ({ city: '서울', name: 'A' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const draft = createDraft(query.ref);
    draft.ref.name.value = 'Z';

    const result = await client
      .mutation({
        mutationFn: () => {
          throw new MutationRejectedError('no');
        },
      })
      .run(null, {
        links: [{ query, submission: query.capture(), onReject: 'remove' }],
      });
    expect(result.kind).toBe('rejected');
    expect(query.ref.value).toEqual({ city: '서울', name: 'A' });

    // The draft edited another path, so the removal does not conflict with it.
    expect(draft.status.conflicts.value).toBe(0);
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    expect(query.ref.value).toEqual({ city: '서울', name: 'Z' });
    draft.discard();
  });
});

describe('lifetime under an open draft', () => {
  it('reports a missing source after dispose and after garbage collection', async () => {
    vi.useFakeTimers();
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['gc'],
      queryFn: () => ({ city: '서울' }),
      gcTime: 1000,
    });
    await query.load();
    const draft = createDraft(query.ref);
    query.dispose();

    await vi.advanceTimersByTimeAsync(5000);
    // An open draft does not extend the resource lifetime.
    expect(client.size()).toBe(0);
    draft.ref.city.value = '대전';
    expect(draft.isDirty()).toBe(true);
    expect(draft.apply()).toEqual({ ok: false, reason: 'missing-source' });
    draft.discard();
  });

  it('keeps draft input when the source is disposed mid-read', async () => {
    const client = createSyncClient({ ssr: true });
    const gate = deferred<{ city: string }>();
    let first = true;
    const query = client.query({
      queryKey: ['mid-read'],
      queryFn: () => {
        if (!first) return gate.promise;
        first = false;
        return { city: '서울' };
      },
    });
    await query.load();
    const draft = createDraft(query.ref);
    draft.ref.city.value = '대전';
    const refetching = query.refetch();
    query.dispose();

    expect(draft.apply()).toEqual({ ok: false, reason: 'missing-source' });
    gate.resolve({ city: '광주' });
    await refetching;
    expect(draft.ref.city.value).toBe('대전');
    expect(draft.isDirty()).toBe(true);
    draft.discard();
  });
});
