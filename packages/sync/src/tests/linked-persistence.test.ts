import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSyncClient,
  MutationRejectedError,
  openPersistedLinkedMutation,
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

function clientWithEdit() {
  const client = createSyncClient({ ssr: true });
  const query = client.query({
    queryKey: ['profile'],
    queryFn: () => ({ city: '서울', name: 'A' }),
  });
  return { client, query };
}

afterEach(() => vi.useRealTimers());

describe('persisted linked submission', () => {
  it('restores a queued DTO and selected edits, then sends only after a durable barrier', async () => {
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const { client, query } = clientWithEdit();
    await query.load();
    query.ref.city.value = '부산';
    query.ref.name.value = 'B';
    const cityId = query.changes().find(item => item.path[0] === 'city')!.id;
    const dto = { city: '부산' };
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(client, {
      id: 'update-city',
      input: dto,
      idempotencyKey: 'server-key',
      links: [
        {
          query: query,
          ids: [cityId],
          accept: 'submitted',
        },
      ],
    });
    dto.city = 'changed';
    expect(journal.entry()?.links[0].selected.map(item => item.id)).toEqual([
      cityId,
    ]);
    expect(journal.entry()?.input).toEqual({ city: '부산' });
    const reopened = await openPersistedLinkedMutation(options);
    const restored = createSyncClient({ ssr: true });
    expect(reopened.restore(restored)).toBe(true);
    const restoredQuery = restored.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '서버', name: 'A' }),
    });
    expect(restoredQuery.ref.value).toEqual({ city: '부산', name: 'B' });
    const pending = deferred<{ ok: boolean }>();
    const write = vi.fn((_input: { city: string }) => {
      const stored = JSON.parse(values.get('linked')!);
      expect(stored.job.state).toBe('inFlight');
      expect(stored.snapshot.queries[0].unconfirmed).toBe(true);
      return pending.promise;
    });
    const mutation = restored.mutation({ mutationFn: write });
    const sending = reopened.send(restored, [restoredQuery], mutation);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    restoredQuery.ref.name.value = 'C';
    pending.resolve({ ok: true });
    expect((await sending)?.kind).toBe('success');
    expect(write.mock.calls[0][0]).toEqual({ city: '부산' });
    expect(restoredQuery.ref.value).toEqual({ city: '부산', name: 'C' });
    expect(restoredQuery.changes().map(item => item.path)).toEqual([['name']]);
    expect(reopened.entry()?.state).toBe('success');
    const final = await openPersistedLinkedMutation(options);
    const nextClient = createSyncClient({ ssr: true });
    final.restore(nextClient);
    const nextQuery = nextClient.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '서버', name: 'A' }),
    });
    expect(nextQuery.ref.value).toEqual({ city: '부산', name: 'C' });
    expect(nextQuery.changes().map(item => item.path)).toEqual([['name']]);
  });

  it('holds an in-flight restart as unknown without a second WRITE', async () => {
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const { client, query } = clientWithEdit();
    await query.load();
    query.ref.city.value = '부산';
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(client, {
      id: 'one',
      input: { city: '부산' },
      idempotencyKey: 'same-key',
      links: [
        {
          query: query,
          accept: 'submitted',
        },
      ],
    });
    const pending = deferred<{ ok: boolean }>();
    const write = vi.fn(() => pending.promise);
    const mutation = client.mutation({ mutationFn: write });
    const sending = journal.send(client, [query], mutation);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const crashed = memoryStorage();
    crashed.values.set('linked', values.get('linked')!);
    const reopened = await openPersistedLinkedMutation({
      ...options,
      storage: crashed.storage,
    });
    expect(reopened.entry()?.state).toBe('unknown');
    const restored = createSyncClient({ ssr: true });
    reopened.restore(restored);
    const restoredQuery = restored.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '서버', name: 'A' }),
    });
    expect(restoredQuery.status.unconfirmed.value).toBe(true);
    await expect(
      reopened.send(
        restored,
        [restoredQuery],
        restored.mutation({ mutationFn: write })
      )
    ).rejects.toThrow('No queued');
    expect(write).toHaveBeenCalledTimes(1);
    pending.resolve({ ok: true });
    await sending;
  });

  it('blocks stale or failed durable writes before calling mutationFn', async () => {
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const { client, query } = clientWithEdit();
    await query.load();
    query.ref.city.value = '부산';
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(client, {
      id: 'one',
      input: { city: '부산' },
      idempotencyKey: 'same-key',
      links: [
        {
          query: query,
        },
      ],
    });
    const write = vi.fn(() => 'ok');
    const mutation = client.mutation({ mutationFn: write });
    query.ref.city.value = '대전';
    await expect(journal.send(client, [query], mutation)).rejects.toThrow(
      'changed'
    );
    expect(journal.entry()?.state).toBe('queued');
    expect(write).not.toHaveBeenCalled();
    query.ref.city.value = '부산';
    await expect(journal.send(client, [query], mutation)).rejects.toThrow(
      'changed'
    );
    await journal.discard();
    await journal.stage(client, {
      id: 'two',
      input: { city: '부산' },
      idempotencyKey: 'different-key',
      links: [
        {
          query: query,
        },
      ],
    });
    const original = values.get('linked');
    const failing: SyncStorage = {
      ...storage,
      setItem: () => {
        throw new Error('disk full');
      },
    };
    const reopened = await openPersistedLinkedMutation({
      ...options,
      storage: failing,
    });
    await expect(reopened.send(client, [query], mutation)).rejects.toThrow(
      'disk full'
    );
    expect(write).not.toHaveBeenCalled();
    expect(values.get('linked')).toBe(original);
  });

  it('holds offline work and records a confirmed rejection without retry', async () => {
    const { storage } = memoryStorage();
    let online = false;
    const options = {
      storage,
      key: 'linked',
      buster: 'v1',
      isOnline: () => online,
    };
    const { client, query } = clientWithEdit();
    await query.load();
    query.ref.city.value = '부산';
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(client, {
      id: 'one',
      input: { city: '부산' },
      idempotencyKey: 'same-key',
      links: [
        {
          query: query,
          onReject: 'remove',
        },
      ],
    });
    const write = vi.fn(() => {
      throw new MutationRejectedError('invalid');
    });
    const mutation = client.mutation({ mutationFn: write });
    expect(await journal.send(client, [query], mutation)).toBeNull();
    expect(write).not.toHaveBeenCalled();
    online = true;
    expect((await journal.send(client, [query], mutation))?.kind).toBe(
      'rejected'
    );
    expect(query.isDirty()).toBe(false);
    expect(journal.entry()?.state).toBe('rejected');
    await expect(journal.send(client, [query], mutation)).rejects.toThrow(
      'No queued'
    );
  });

  it('holds expired work and rejects busted or corrupt records without changing storage', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1', maxAge: 100 };
    const { client, query } = clientWithEdit();
    await query.load();
    query.ref.city.value = '부산';
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(client, {
      id: 'one',
      input: { city: '부산' },
      idempotencyKey: 'same-key',
      links: [
        {
          query: query,
        },
      ],
    });
    const original = values.get('linked');
    vi.setSystemTime(1101);
    const write = vi.fn(() => 'ok');
    expect(
      await journal.send(
        client,
        [query],
        client.mutation({ mutationFn: write })
      )
    ).toBeNull();
    expect(write).not.toHaveBeenCalled();
    await expect(
      openPersistedLinkedMutation({ ...options, buster: 'v2' })
    ).rejects.toThrow('buster differs');
    expect(values.get('linked')).toBe(original);
    const corrupt = JSON.parse(original!);
    corrupt.job.links[0].selected[0].after = 'wrong';
    values.set('linked', JSON.stringify(corrupt));
    const corruptText = values.get('linked');
    await expect(openPersistedLinkedMutation(options)).rejects.toThrow(
      'selected changes differ'
    );
    expect(values.get('linked')).toBe(corruptText);
  });

  it('records a successful WRITE with failed baseline refetch as sync-error', async () => {
    const { storage } = memoryStorage();
    const client = createSyncClient({ ssr: true });
    let reads = 0;
    const query = client.query({
      queryKey: ['profile'],
      queryFn: () => {
        if (reads++ === 0) return { city: '서울' };
        throw new Error('read failed');
      },
    });
    await query.load();
    query.ref.city.value = '부산';
    const journal = await openPersistedLinkedMutation({
      storage,
      key: 'linked',
      buster: 'v1',
    });
    await journal.stage(client, {
      id: 'one',
      input: { city: '부산' },
      idempotencyKey: 'same-key',
      links: [
        {
          query: query,
          accept: 'refetch',
        },
      ],
    });
    const write = vi.fn(() => 'saved');
    const result = await journal.send(
      client,
      [query],
      client.mutation({ mutationFn: write })
    );
    expect(result?.kind).toBe('sync-error');
    expect(journal.entry()?.state).toBe('sync-error');
    expect(query.status.unconfirmed.value).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    const reopened = await openPersistedLinkedMutation({
      storage,
      key: 'linked',
      buster: 'v1',
    });
    expect(reopened.entry()?.state).toBe('sync-error');
  });
});

function clientWithTwoEdits() {
  const client = createSyncClient({ ssr: true });
  const profile = client.query({
    queryKey: ['profile'],
    queryFn: () => ({ city: '서울', name: 'A' }),
  });
  const prefs = client.query({
    queryKey: ['prefs'],
    queryFn: () => ({ theme: 'light' }),
  });
  return { client, profile, prefs };
}

describe('persisted linked submission across several queries', () => {
  it('stores one record per job and writes nothing when a link is invalid', async () => {
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const { client, profile, prefs } = clientWithTwoEdits();
    await profile.load();
    await prefs.load();
    profile.ref.city.value = '부산';
    profile.ref.name.value = 'B';
    prefs.ref.theme.value = 'dark';
    const cityId = profile.changes().find(item => item.path[0] === 'city')!.id;
    const journal = await openPersistedLinkedMutation(options);

    await expect(
      journal.stage(client, {
        id: 'save',
        input: {},
        idempotencyKey: 'key-1',
        links: [{ query: profile }, { query: profile }],
      })
    ).rejects.toThrow('linked only once');
    expect(values.get('linked')).toBeUndefined();

    // An unloaded link cannot be described, so the whole job stays unstored.
    const unloaded = client.query({
      queryKey: ['unloaded'],
      queryFn: () => ({ n: 1 }),
    });
    await expect(
      journal.stage(client, {
        id: 'save',
        input: {},
        idempotencyKey: 'key-1',
        links: [{ query: profile }, { query: unloaded }],
      })
    ).rejects.toThrow('not loaded');
    expect(values.get('linked')).toBeUndefined();
    unloaded.dispose();

    await journal.stage(client, {
      id: 'save',
      input: { city: '부산', theme: 'dark' },
      idempotencyKey: 'key-1',
      links: [
        { query: profile, ids: [cityId], accept: 'submitted' },
        { query: prefs, accept: 'refetch', onReject: 'remove' },
      ],
    });
    const entry = journal.entry()!;
    expect(entry.links.map(link => link.queryKey)).toEqual([
      ['profile'],
      ['prefs'],
    ]);
    expect(entry.links[0].selected.map(item => item.id)).toEqual([cityId]);
    expect(entry.links[0].accept).toBe('submitted');
    expect(entry.links[0].onReject).toBe('keep');
    expect(entry.links[1].accept).toBe('refetch');
    expect(entry.links[1].onReject).toBe('remove');

    // The earlier single-link format is a different schema, not a migration.
    const stored = values.get('linked')!;
    values.set(
      'linked',
      JSON.stringify({ ...JSON.parse(stored), schemaVersion: 1 })
    );
    await expect(openPersistedLinkedMutation(options)).rejects.toThrow(
      'Unsupported linked mutation schema version'
    );
    values.set('linked', stored);
    const reopened = await openPersistedLinkedMutation(options);
    expect(reopened.entry()?.links).toHaveLength(2);
  });

  it('rechecks every link before the barrier and marks them all unconfirmed', async () => {
    const { storage, values } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const { client, profile, prefs } = clientWithTwoEdits();
    await profile.load();
    await prefs.load();
    profile.ref.city.value = '부산';
    prefs.ref.theme.value = 'dark';
    const journal = await openPersistedLinkedMutation(options);
    const stage = () =>
      journal.stage(client, {
        id: 'save',
        input: { ok: true },
        idempotencyKey: 'key-1',
        links: [
          { query: profile, accept: 'submitted' },
          { query: prefs, accept: 'submitted' },
        ],
      });
    await stage();

    // Editing only the second link must still stop the WRITE.
    prefs.ref.theme.value = 'sepia';
    const blocked = vi.fn(() => 'ok');
    await expect(
      journal.send(
        client,
        [profile, prefs],
        client.mutation({ mutationFn: blocked })
      )
    ).rejects.toThrow('discard and stage again');
    expect(blocked).not.toHaveBeenCalled();
    expect(journal.entry()?.state).toBe('queued');

    await journal.discard();
    await stage();
    await expect(
      journal.send(client, [profile], client.mutation({ mutationFn: blocked }))
    ).rejects.toThrow('handles differ from the submission');
    expect(blocked).not.toHaveBeenCalled();

    const write = vi.fn(() => {
      const record = JSON.parse(values.get('linked')!);
      expect(record.job.state).toBe('inFlight');
      expect(
        record.snapshot.queries.every(
          (item: { unconfirmed: boolean; invalidated: boolean }) =>
            item.unconfirmed && item.invalidated
        )
      ).toBe(true);
      return 'saved';
    });
    const result = await journal.send(
      client,
      [prefs, profile], // Handle order does not matter.
      client.mutation({ mutationFn: write })
    );
    expect(result?.kind).toBe('success');
    expect(write).toHaveBeenCalledTimes(1);
    expect(journal.entry()?.state).toBe('success');
    expect(profile.isDirty()).toBe(false);
    expect(prefs.isDirty()).toBe(false);
  });

  it('applies each link rejection policy and holds a restarted job as unknown', async () => {
    const { storage } = memoryStorage();
    const options = { storage, key: 'linked', buster: 'v1' };
    const rejecting = clientWithTwoEdits();
    await rejecting.profile.load();
    await rejecting.prefs.load();
    rejecting.profile.ref.city.value = '부산';
    rejecting.prefs.ref.theme.value = 'dark';
    const journal = await openPersistedLinkedMutation(options);
    await journal.stage(rejecting.client, {
      id: 'save',
      input: { ok: true },
      idempotencyKey: 'key-1',
      links: [
        { query: rejecting.profile, onReject: 'keep' },
        { query: rejecting.prefs, onReject: 'remove' },
      ],
    });
    const rejected = await journal.send(
      rejecting.client,
      [rejecting.profile, rejecting.prefs],
      rejecting.client.mutation({
        mutationFn: () => {
          throw new MutationRejectedError('invalid');
        },
      })
    );
    expect(rejected?.kind).toBe('rejected');
    expect(journal.entry()?.state).toBe('rejected');
    expect(rejecting.profile.ref.city.value).toBe('부산');
    expect(rejecting.prefs.ref.theme.value).toBe('light');

    const restart = memoryStorage();
    const restartOptions = {
      storage: restart.storage,
      key: 'linked',
      buster: 'v1',
    };
    const live = clientWithTwoEdits();
    await live.profile.load();
    await live.prefs.load();
    live.profile.ref.city.value = '대전';
    live.prefs.ref.theme.value = 'dark';
    const running = await openPersistedLinkedMutation(restartOptions);
    await running.stage(live.client, {
      id: 'save',
      input: { ok: true },
      idempotencyKey: 'key-2',
      links: [{ query: live.profile }, { query: live.prefs }],
    });
    const pending = deferred<string>();
    const slow = vi.fn(() => pending.promise);
    const sending = running.send(
      live.client,
      [live.profile, live.prefs],
      live.client.mutation({ mutationFn: slow })
    );
    await vi.waitFor(() => expect(slow).toHaveBeenCalledTimes(1));

    const afterRestart = await openPersistedLinkedMutation(restartOptions);
    expect(afterRestart.entry()?.state).toBe('unknown');
    const restored = createSyncClient({ ssr: true });
    expect(afterRestart.restore(restored)).toBe(true);
    const restoredProfile = restored.query({
      queryKey: ['profile'],
      queryFn: () => ({ city: '서버', name: 'A' }),
    });
    const restoredPrefs = restored.query({
      queryKey: ['prefs'],
      queryFn: () => ({ theme: 'light' }),
    });
    expect(restoredProfile.status.unconfirmed.value).toBe(true);
    expect(restoredPrefs.status.unconfirmed.value).toBe(true);
    await expect(
      afterRestart.send(
        restored,
        [restoredProfile, restoredPrefs],
        restored.mutation({ mutationFn: slow })
      )
    ).rejects.toThrow('No queued');
    expect(slow).toHaveBeenCalledTimes(1);
    pending.resolve('saved');
    await sending;
  });
});
