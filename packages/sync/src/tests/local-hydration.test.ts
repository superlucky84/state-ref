import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSyncClient,
  restoreLocalSyncSnapshot,
  saveLocalSyncSnapshot,
} from '../index';
import type { LocalSyncSnapshot, SyncStorage } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

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
  return { storage, values };
}

afterEach(() => vi.useRealTimers());

describe('local resource recovery snapshot', () => {
  it('preserves dirty values, conflict origins and change IDs across clients', async () => {
    const original = createSyncClient({ ssr: true });
    const account = original.query({
      queryKey: ['account'],
      queryFn: () => ({ city: '서울', zip: 100 }),
    });
    await account.load();
    account.ref.city.value = '부산';
    const cityId = account.changes()[0].id;
    account.acceptServer({ city: '광주', zip: 100 });
    expect(account.status.conflicts.value).toBe(1);
    const snapshot = JSON.parse(
      JSON.stringify(original.dehydrateLocal())
    ) as LocalSyncSnapshot;
    expect(() => original.dehydrate()).toThrow('local or unresolved work');

    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(snapshot);
    const read = vi.fn(() => ({ city: '대전', zip: 100 }));
    const recovered = restored.query({
      queryKey: ['account'],
      queryFn: read,
    });
    expect(recovered.ref.value).toEqual({ city: '부산', zip: 100 });
    expect(recovered.status.dirty.value).toBe(true);
    expect(recovered.status.conflicts.value).toBe(1);
    expect(recovered.changes()[0].id).toBe(cityId);
    expect(recovered.changes()[0].before.value).toBe('광주');
    expect(recovered.capture([cityId]).value.city).toBe('부산');
    expect(read).not.toHaveBeenCalled();

    recovered.ref.zip.value = 200;
    expect(recovered.changes().map(change => change.id)).toEqual([
      cityId,
      cityId + 1,
    ]);
    recovered.acceptServer({ city: '대전', zip: 100 });
    expect(recovered.ref.value).toEqual({ city: '부산', zip: 200 });
    expect(recovered.status.conflicts.value).toBe(1);
    expect(account.ref.value).toEqual({ city: '부산', zip: 100 });
    account.dispose();
    recovered.dispose();
  });

  it('preserves an unknown linked WRITE without replay and clears it after a READ', async () => {
    const original = createSyncClient({ ssr: true });
    const source = original.query({
      queryKey: ['uncertain'],
      queryFn: () => ({ n: 1 }),
    });
    await source.load();
    source.ref.n.value = 2;
    const write = vi.fn().mockRejectedValue(new Error('lost reply'));
    const mutation = original.mutation({ mutationFn: write });
    expect(
      (
        await mutation.run(2, {
          links: [{ query: source, submission: source.capture() }],
        })
      ).kind
    ).toBe('unknown');
    const snapshot = original.dehydrateLocal();
    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(snapshot);
    const read = vi.fn(() => ({ n: 2 }));
    const recovered = restored.query({
      queryKey: ['uncertain'],
      queryFn: read,
    });
    expect(recovered.ref.n.value).toBe(2);
    expect(recovered.status.unconfirmed.value).toBe(true);
    expect(recovered.status.invalidated.value).toBe(true);
    expect(() => restored.dehydrate()).toThrow('local or unresolved work');
    expect(write).toHaveBeenCalledOnce();
    await recovered.load();
    expect(read).toHaveBeenCalledOnce();
    expect(recovered.status.unconfirmed.value).toBe(false);
    expect(recovered.isDirty()).toBe(false);
    source.dispose();
    recovered.dispose();
  });

  it('accepts a fresh submission after restore while retaining later input', async () => {
    const sourceClient = createSyncClient({ ssr: true });
    const source = sourceClient.query({
      queryKey: ['submit-after-recovery'],
      queryFn: () => ({ city: '서울' }),
    });
    await source.load();
    source.ref.city.value = '부산';
    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(sourceClient.dehydrateLocal());
    const recovered = restored.query({
      queryKey: ['submit-after-recovery'],
      queryFn: () => ({ city: '서울' }),
    });
    const submission = recovered.capture();
    const pending = deferred<void>();
    const mutation = restored.mutation({ mutationFn: () => pending.promise });
    const result = mutation.run(
      { city: '부산' },
      {
        links: [
          { query: recovered, submission, accept: { kind: 'submitted' } },
        ],
      }
    );
    recovered.ref.city.value = '대전';
    pending.resolve();
    expect((await result).kind).toBe('success');
    expect(recovered.ref.city.value).toBe('대전');
    expect(recovered.changes()[0].before.value).toBe('부산');
    source.dispose();
    recovered.dispose();
  });

  it('rejects active READ, linked WRITE and unloaded unknown work', async () => {
    const client = createSyncClient({ ssr: true });
    const read = deferred<{ n: number }>();
    const source = client.query({
      queryKey: ['pending-read'],
      queryFn: () => read.promise,
    });
    const pendingRead = source.load();
    expect(() => client.dehydrateLocal()).toThrow('active READ');
    read.resolve({ n: 1 });
    await pendingRead;
    const write = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => write.promise });
    const pendingWrite = mutation.run(1, {
      links: [{ query: source, accept: { kind: 'none' } }],
    });
    expect(() => client.dehydrateLocal()).toThrow('linked WRITE');
    write.resolve();
    await pendingWrite;
    expect(client.dehydrateLocal().queries[0].unconfirmed).toBe(true);
    source.dispose();

    const unloaded = createSyncClient({ ssr: true });
    const handle = unloaded.query({
      queryKey: ['unloaded'],
      queryFn: () => ({ n: 1 }),
    });
    const failed = unloaded.mutation({
      mutationFn: () => Promise.reject(new Error('unknown')),
    });
    expect((await failed.run(1, { links: [{ query: handle }] })).kind).toBe(
      'unknown'
    );
    expect(() => unloaded.dehydrateLocal()).toThrow('unloaded unconfirmed');
    handle.dispose();
  });

  it('rejects corrupt edits before installing any query', async () => {
    const original = createSyncClient({ ssr: true });
    const one = original.query({
      queryKey: ['one'],
      queryFn: () => ({ n: 1 }),
    });
    const two = original.query({
      queryKey: ['two'],
      queryFn: () => ({ n: 2 }),
    });
    await Promise.all([one.load(), two.load()]);
    two.ref.n.value = 3;
    const snapshot = JSON.parse(
      JSON.stringify(original.dehydrateLocal())
    ) as LocalSyncSnapshot;
    const corrupt = structuredClone(snapshot);
    const local = corrupt.queries[1].local!;
    Reflect.set(local.edits[0], 'path', ['__proto__']);
    const empty = createSyncClient({ ssr: true });
    expect(() => empty.hydrateLocal(corrupt)).toThrow(
      'Invalid local edit path'
    );
    expect(empty.size()).toBe(0);
    const duplicate = structuredClone(snapshot);
    Reflect.set(duplicate.queries[1], 'queryKey', ['one']);
    expect(() => empty.hydrateLocal(duplicate)).toThrow('Repeated');
    expect(empty.size()).toBe(0);
    const missing = structuredClone(snapshot);
    Reflect.set(missing.queries[1], 'local', null);
    expect(() => empty.hydrateLocal(missing)).toThrow('Invalid local recovery');
    expect(empty.size()).toBe(0);
    const forged = structuredClone(snapshot);
    Reflect.set(forged.queries[1].local!.edits[0], 'conflict', true);
    expect(() => empty.hydrateLocal(forged)).toThrow('conflict flag');
    expect(empty.size()).toBe(0);
    const untracked = structuredClone(snapshot);
    Reflect.set(untracked.queries[1].local!.current as object, 'extra', 9);
    expect(() => empty.hydrateLocal(untracked)).toThrow('recorded edits');
    expect(empty.size()).toBe(0);
    one.dispose();
    two.dispose();
  });

  it('retains atomic array edits after restore', async () => {
    const original = createSyncClient({ ssr: true });
    const source = original.query({
      queryKey: ['array'],
      queryFn: () => ({ items: [1, 2] }),
    });
    await source.load();
    source.ref.items[0].value = 3;
    expect(source.changes()[0].path).toEqual(['items']);
    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(original.dehydrateLocal());
    const recovered = restored.query({
      queryKey: ['array'],
      queryFn: () => ({ items: [1, 2] }),
    });
    expect(recovered.ref.items.value).toEqual([3, 2]);
    expect(recovered.changes()[0].path).toEqual(['items']);
    source.dispose();
    recovered.dispose();
  });

  it('keeps a failed READ baseline but marks restored data for a new READ', async () => {
    const original = createSyncClient({ ssr: true });
    const read = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockRejectedValueOnce(new Error('offline'));
    const source = original.query<{ n: number }>({
      queryKey: ['error'],
      queryFn: read,
    });
    await source.load();
    source.ref.n.value = 2;
    await expect(source.refetch()).rejects.toThrow('offline');
    expect(source.status.status.value).toBe('error');
    const snapshot = original.dehydrateLocal();
    expect(snapshot.queries[0].invalidated).toBe(true);
    const restored = createSyncClient({ ssr: true });
    restored.hydrateLocal(snapshot);
    const refresh = vi.fn(() => ({ n: 3 }));
    const recovered = restored.query({ queryKey: ['error'], queryFn: refresh });
    expect(recovered.ref.n.value).toBe(2);
    expect(recovered.status.status.value).toBe('success');
    await recovered.load();
    expect(refresh).toHaveBeenCalledOnce();
    expect(recovered.ref.n.value).toBe(2);
    expect(recovered.status.conflicts.value).toBe(1);
    source.dispose();
    recovered.dispose();
  });
});

describe('local snapshot storage', () => {
  it('restores dirty data and skips stale or busted storage without deleting it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { storage, values } = memoryStorage();
    const sourceClient = createSyncClient({ ssr: true });
    const source = sourceClient.query({
      queryKey: ['saved'],
      queryFn: () => ({ n: 1 }),
    });
    await source.load();
    source.ref.n.value = 2;
    const options = { key: 'local', buster: 'v1', maxAge: 100 };
    await saveLocalSyncSnapshot(sourceClient, storage, options);
    const recoveredClient = createSyncClient({ ssr: true });
    expect(
      await restoreLocalSyncSnapshot(recoveredClient, storage, options)
    ).toBe(true);
    const recovered = recoveredClient.query({
      queryKey: ['saved'],
      queryFn: () => ({ n: 1 }),
    });
    expect(recovered.ref.n.value).toBe(2);
    expect(recovered.isDirty()).toBe(true);
    expect(
      await restoreLocalSyncSnapshot(createSyncClient(), storage, {
        ...options,
        buster: 'v2',
      })
    ).toBe(false);
    vi.setSystemTime(1101);
    expect(
      await restoreLocalSyncSnapshot(createSyncClient(), storage, options)
    ).toBe(false);
    expect(values.has('local')).toBe(true);
    source.dispose();
    recovered.dispose();
  });

  it('leaves an existing saved value intact when active work blocks a new save', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const source = client.query({
      queryKey: ['saved'],
      queryFn: () => ({ n: 1 }),
    });
    await source.load();
    const options = { key: 'local', buster: 'v1' };
    await saveLocalSyncSnapshot(client, storage, options);
    const before = values.get('local');
    const pending = deferred<void>();
    const mutation = client.mutation({ mutationFn: () => pending.promise });
    const write = mutation.run(1, { links: [{ query: source }] });
    await expect(
      saveLocalSyncSnapshot(client, storage, options)
    ).rejects.toThrow('linked WRITE');
    expect(values.get('local')).toBe(before);
    pending.resolve();
    await write;
    source.dispose();
  });

  it('propagates storage failure without installing a partial recovery snapshot', async () => {
    const { storage, values } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    const source = client.query({
      queryKey: ['saved'],
      queryFn: () => ({ n: 1 }),
    });
    await source.load();
    source.ref.n.value = 2;
    const failing: SyncStorage = {
      ...storage,
      setItem: () => {
        throw new Error('storage full');
      },
    };
    await expect(
      saveLocalSyncSnapshot(client, failing, { key: 'local', buster: 'v1' })
    ).rejects.toThrow('storage full');
    expect(values.size).toBe(0);
    const empty = createSyncClient({ ssr: true });
    expect(
      await restoreLocalSyncSnapshot(empty, storage, {
        key: 'local',
        buster: 'v1',
      })
    ).toBe(false);
    expect(empty.size()).toBe(0);
    source.dispose();
  });
});
