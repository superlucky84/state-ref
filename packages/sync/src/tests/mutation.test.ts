import { describe, expect, it, vi } from 'vitest';
import { createSyncClient, MutationRejectedError } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

describe('mutation and submitted resource edits', () => {
  it('runs a standalone command with a DTO unrelated to query data', async () => {
    const client = createSyncClient({ ssr: true });
    const calls: string[] = [];
    const command = client.mutation({
      mutationFn: async (input: { send: number }, { operationId }) => {
        calls.push(`write:${operationId}:${input.send}`);
        return { ok: true };
      },
      onSuccess: () => {
        calls.push('success');
      },
      onSettled: () => {
        calls.push('settled');
      },
    });
    const input = { send: 1 };
    const task = command.start(input);
    input.send = 9;
    expect(task.status.phase.value).toBe('pending');
    expect(() => {
      task.status.phase.value = 'success';
    }).toThrow();
    expect(command.status.pending.value).toBe(1);
    expect(await task.result).toMatchObject({
      kind: 'success',
      data: { ok: true },
    });
    expect(calls).toEqual([`write:${task.id}:1`, 'success', 'settled']);
    expect(command.status.pending.value).toBe(0);
    expect(task.status.phase.value).toBe('success');
    task.dispose();
    command.dispose();
  });

  it('accepts only captured edits and retains later input and unsubmitted fields', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['account'],
      queryFn: () => ({ city: '서울', zip: 100 }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const cityId = query.changes()[0].id;
    query.ref.zip.value = 200;
    const submission = query.capture([cityId]);
    expect(Object.isFrozen(submission)).toBe(true);
    expect(Object.isFrozen(submission.changes)).toBe(true);
    const write = deferred<void>();
    const fn = vi.fn(() => write.promise);
    const mutation = client.mutation({ mutationFn: fn });
    const result = mutation.run(
      { city: submission.value.city },
      {
        links: [{ query, submission, accept: { kind: 'submitted' } }],
      }
    );
    expect(query.status.pending.value).toBe(1);
    query.ref.city.value = '대전';
    write.resolve();
    expect((await result).kind).toBe('success');
    expect(query.status.pending.value).toBe(0);
    expect(query.ref.value).toEqual({ city: '대전', zip: 200 });
    expect(query.changes().map(change => change.path)).toEqual([
      ['city'],
      ['zip'],
    ]);
    expect(query.changes()[0].before.value).toBe('부산');
    expect(query.changes()[0].conflict).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
    query.dispose();
  });

  it('uses a corrected response as baseline while preserving post-submit input', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['corrected'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const submission = query.capture();
    const response = deferred<{ city: string }>();
    const mutation = client.mutation({ mutationFn: () => response.promise });
    const result = mutation.run(
      { updateCity: '부산' },
      {
        links: [
          {
            query,
            submission,
            accept: { kind: 'response', select: data => data },
          },
        ],
      }
    );
    query.ref.city.value = '대전';
    response.resolve({ city: '광주' });
    expect((await result).kind).toBe('success');
    expect(query.ref.city.value).toBe('대전');
    expect(query.changes()[0].before.value).toBe('광주');
    expect(query.changes()[0].conflict).toBe(false);
    query.dispose();
  });

  it('clears a submitted edit when the server corrects it and there is no later input', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['corrected-clean'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const submission = query.capture();
    const mutation = client.mutation({ mutationFn: () => ({ city: '광주' }) });
    expect(
      (
        await mutation.run(
          { city: '부산' },
          {
            links: [
              {
                query,
                submission,
                accept: { kind: 'response', select: data => data },
              },
            ],
          }
        )
      ).kind
    ).toBe('success');
    expect(query.ref.city.value).toBe('광주');
    expect(query.isDirty()).toBe(false);
    query.dispose();
  });

  it('keeps a post-submit return to the old baseline as a later input', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['return-after-submit'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();
    query.ref.city.value = '부산';
    const submission = query.capture();
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const result = mutation.run(
      { city: '부산' },
      {
        links: [{ query, submission, accept: { kind: 'submitted' } }],
      }
    );
    query.ref.city.value = '서울';
    expect(query.isDirty()).toBe(false);
    expect(query.status.pending.value).toBe(1);
    write.resolve();
    expect((await result).kind).toBe('success');
    expect(query.ref.city.value).toBe('서울');
    expect(query.isDirty()).toBe(true);
    expect(query.changes()[0].before.value).toBe('부산');
    query.dispose();
  });

  it('pins a linked query even if its last handle is disposed while clean', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['pinned'],
      queryFn: () => ({ n: 1 }),
    });
    await query.load();
    query.ref.n.value = 2;
    const submission = query.capture();
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const result = mutation.run(2, {
      links: [{ query, submission, accept: { kind: 'submitted' } }],
    });
    query.ref.n.value = 1;
    query.dispose();
    expect(client.remove(['pinned'])).toBe(false);
    write.resolve();
    expect((await result).kind).toBe('success');
    expect(client.size()).toBe(1);
    const next = client.query({
      queryKey: ['pinned'],
      queryFn: () => ({ n: 2 }),
    });
    expect(next.ref.n.value).toBe(1);
    expect(next.isDirty()).toBe(true);
    next.dispose();
  });

  it('rejects a stale capture before sending the WRITE', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['stale-capture'],
      queryFn: () => ({ n: 1 }),
    });
    await query.load();
    query.ref.n.value = 2;
    const submission = query.capture();
    query.ref.n.value = 1;
    const write = vi.fn();
    const mutation = client.mutation({ mutationFn: write });
    expect(() =>
      mutation.start(2, {
        links: [{ query, submission, accept: { kind: 'submitted' } }],
      })
    ).toThrow('stale');
    expect(write).not.toHaveBeenCalled();
    query.dispose();
  });

  it('distinguishes a successful WRITE followed by a failed READ', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockRejectedValueOnce(new Error('read offline'));
    const query = client.query<{ n: number }>({
      queryKey: ['refetch'],
      queryFn: read,
    });
    await query.load();
    query.ref.n.value = 2;
    const submission = query.capture();
    const write = vi.fn().mockResolvedValue({ accepted: true });
    const mutation = client.mutation({ mutationFn: write });
    const result = await mutation.run(
      { n: 2 },
      {
        links: [{ query, submission, accept: { kind: 'refetch' } }],
      }
    );
    expect(result).toMatchObject({
      kind: 'sync-error',
      data: { accepted: true },
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(2);
    expect(query.isDirty()).toBe(true);
    expect(query.status.pending.value).toBe(0);
    query.dispose();
  });

  it('removes only unchanged failed edits after confirmed rejection', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['reject'],
      queryFn: () => ({ a: 1, b: 1 }),
    });
    await query.load();
    query.ref.a.value = 2;
    query.ref.b.value = 2;
    const submission = query.capture([query.changes()[0].id]);
    const pending = deferred<never>();
    const mutation = client.mutation({ mutationFn: () => pending.promise });
    const result = mutation.run(
      { value: 2 },
      {
        links: [{ query, submission, onReject: 'remove' }],
      }
    );
    query.ref.b.value = 3;
    pending.reject(new MutationRejectedError('validation failed'));
    expect((await result).kind).toBe('rejected');
    expect(query.ref.value).toEqual({ a: 1, b: 3 });
    expect(query.changes().map(change => change.path)).toEqual([['b']]);
    query.dispose();
  });

  it('keeps a later dependent child edit when its submitted parent is rejected', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['dependent'],
      queryFn: () => ({ parent: { a: 1 } }),
    });
    await query.load();
    query.ref.parent.value = { a: 2 };
    const submission = query.capture();
    const pending = deferred<never>();
    const mutation = client.mutation({ mutationFn: () => pending.promise });
    const result = mutation.run(
      { parent: { a: 2 } },
      {
        links: [{ query, submission, onReject: 'remove' }],
      }
    );
    query.ref.parent.a.value = 3;
    pending.reject(new MutationRejectedError('rejected'));
    expect((await result).kind).toBe('rejected');
    expect(query.ref.parent.a.value).toBe(3);
    expect(query.isDirty()).toBe(true);
    query.dispose();
  });

  it('keeps an unknown result and never retries it automatically', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['unknown'],
      queryFn: () => ({ n: 1 }),
    });
    await query.load();
    query.ref.n.value = 2;
    const submission = query.capture();
    const write = vi.fn().mockRejectedValue(new Error('connection lost'));
    const mutation = client.mutation({ mutationFn: write });
    const result = await mutation.run(
      { n: 2 },
      {
        links: [{ query, submission, onReject: 'remove' }],
      }
    );
    expect(result.kind).toBe('unknown');
    expect(query.ref.n.value).toBe(2);
    expect(query.isDirty()).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    query.dispose();
  });

  it('blocks stale READs and another linked operation on the same key', async () => {
    const client = createSyncClient({ ssr: true });
    const old = deferred<{ n: number }>();
    const read = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockImplementationOnce(() => old.promise);
    const query = client.query<{ n: number }>({
      queryKey: ['racing'],
      queryFn: read,
    });
    await query.load();
    const firstRead = query.refetch();
    query.ref.n.value = 2;
    const submission = query.capture();
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const first = mutation.run(
      { n: 2 },
      { links: [{ query, submission, accept: { kind: 'submitted' } }] }
    );
    expect(() => mutation.start({ n: 3 }, { links: [{ query }] })).toThrow(
      'already pending'
    );
    await expect(query.refetch()).rejects.toThrow('pending');
    old.resolve({ n: 999 });
    await firstRead;
    expect(query.ref.n.value).toBe(2);
    write.resolve();
    expect((await first).kind).toBe('success');
    expect(query.ref.n.value).toBe(2);
    expect(query.isDirty()).toBe(false);
    query.dispose();
  });

  it('requires an idempotency key for explicit retry and keeps one operation ID', async () => {
    const client = createSyncClient({ ssr: true });
    const ids: number[] = [];
    const keys: Array<string | undefined> = [];
    const fn = vi
      .fn()
      .mockImplementationOnce((_input, context) => {
        ids.push(context.operationId);
        keys.push(context.idempotencyKey);
        throw new Error('temporary');
      })
      .mockImplementationOnce((_input, context) => {
        ids.push(context.operationId);
        keys.push(context.idempotencyKey);
        return 'saved';
      });
    const mutation = client.mutation({ mutationFn: fn });
    expect(() => mutation.start(1, { retry: 1 })).toThrow('idempotencyKey');
    const result = await mutation.run(1, {
      retry: 1,
      idempotencyKey: 'stable',
      retryDelay: () => 0,
    });
    expect(result.kind).toBe('success');
    expect(ids).toEqual([ids[0], ids[0]]);
    expect(keys).toEqual(['stable', 'stable']);
  });

  it('serializes an explicit scope across mutation handles and continues after failure', async () => {
    const client = createSyncClient({ ssr: true });
    const firstWrite = deferred<never>();
    const calls: string[] = [];
    const first = client.mutation({
      mutationFn: () => {
        calls.push('first');
        return firstWrite.promise;
      },
    });
    const second = client.mutation({
      mutationFn: () => {
        calls.push('second');
        return 'saved';
      },
    });
    const one = first.run(1, { scope: 'account' });
    const two = second.run(2, { scope: 'account' });
    await Promise.resolve();
    expect(calls).toEqual(['first']);
    firstWrite.reject(new Error('offline'));
    expect((await one).kind).toBe('unknown');
    expect((await two).kind).toBe('success');
    expect(calls).toEqual(['first', 'second']);
  });

  it('accepts a known server value without a WRITE and maps one result to two keys', async () => {
    const client = createSyncClient({ ssr: true });
    const one = client.query({ queryKey: ['one'], queryFn: () => ({ n: 1 }) });
    const two = client.query({ queryKey: ['two'], queryFn: () => ({ n: 10 }) });
    await Promise.all([one.load(), two.load()]);
    one.acceptServer({ n: 2 });
    expect(one.ref.n.value).toBe(2);
    const write = vi.fn().mockResolvedValue({ one: { n: 3 }, two: { n: 30 } });
    const mutation = client.mutation({ mutationFn: write });
    const result = await mutation.run('update', {
      links: [
        { query: one, accept: { kind: 'response', select: data => data.one } },
        { query: two, accept: { kind: 'response', select: data => data.two } },
      ],
    });
    expect(result.kind).toBe('success');
    expect(one.ref.n.value).toBe(3);
    expect(two.ref.n.value).toBe(30);
    expect(write).toHaveBeenCalledTimes(1);
    one.dispose();
    two.dispose();
  });

  it('lets an explicit cache acceptance supersede an in-flight READ', async () => {
    const client = createSyncClient({ ssr: true });
    const old = deferred<{ n: number }>();
    const query = client.query({
      queryKey: ['cache-only'],
      queryFn: () => old.promise,
    });
    const first = query.load();
    query.acceptServer({ n: 2 });
    old.resolve({ n: 1 });
    await first;
    expect(query.ref.n.value).toBe(2);
    query.dispose();
  });

  it('can populate an unloaded query from an explicitly mapped response', async () => {
    const client = createSyncClient({ ssr: true });
    const read = vi.fn();
    const query = client.query<{ n: number }>({
      queryKey: ['unloaded'],
      queryFn: read,
    });
    const mutation = client.mutation({ mutationFn: () => ({ n: 4 }) });
    expect(
      (
        await mutation.run('create', {
          links: [
            { query, accept: { kind: 'response', select: data => data } },
          ],
        })
      ).kind
    ).toBe('success');
    expect(query.ref.n.value).toBe(4);
    expect(read).not.toHaveBeenCalled();
    query.dispose();
  });

  it('reports callback failures without retrying an already successful WRITE', async () => {
    const client = createSyncClient({ ssr: true });
    const write = vi.fn(() => 'saved');
    const mutation = client.mutation({
      mutationFn: write,
      onSuccess: () => {
        throw new Error('UI callback failed');
      },
    });
    const result = await mutation.run(1);
    expect(result).toMatchObject({
      kind: 'success',
      callbackError: expect.any(Error),
    });
    expect(write).toHaveBeenCalledTimes(1);
  });
});
