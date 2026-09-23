import { describe, expect, it } from 'vitest';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import {
  CITY,
  INITIAL_PROFILE,
  createControlledEnvironment,
  createMockServer,
  reorderContacts,
  requestPanel,
  toSaveDto,
} from './index';
import type { Profile } from './index';

/**
 * The fixture's own suite (step 2 of docs/server-sync/PHASE8_5.md).
 *
 * All five demos read the same fixture, so a fault here shows up as five
 * screens that agree with each other and lie together. That is the one
 * failure the connector comparison in Phase 8.7 could not detect, which is
 * why these run before any demo code is written.
 */

async function loadedQuery() {
  const server = createMockServer(INITIAL_PROFILE);
  const client = createSyncClient({ ssr: true });
  const query = client.query<Profile>({
    queryKey: ['profile'],
    queryFn: server.read,
  });
  const loading = query.load();
  server.settle('READ');
  await loading;
  return { server, client, query };
}

describe('mock server request records', () => {
  it('counts every call and numbers the requests it hands out', async () => {
    const { server, query } = await loadedQuery();

    expect(server.counts()).toEqual({ read: 1, write: 0 });
    expect(server.requests().map(row => row.id)).toEqual(['READ-1']);
    expect(server.requests()[0].outcome).toBe('success');
    expect(server.requests()[0].settledAt).not.toBeNull();

    const refetching = query.refetch();
    // The second READ is recorded before it settles, so the panel can show a
    // request that is still in flight.
    expect(server.counts().read).toBe(2);
    expect(server.inFlight().map(row => row.id)).toEqual(['READ-2']);
    expect(requestPanel(server).inFlight).toBe(1);

    server.settle('READ');
    await refetching;
    expect(server.inFlight()).toHaveLength(0);
  });

  it('reports an aborted READ as aborted rather than dropping it', async () => {
    const { server, query } = await loadedQuery();

    const refetching = query.refetch();
    expect(server.inFlight()).toHaveLength(1);
    query.invalidate(); // Phase 7.1: invalidate aborts an in-flight READ.
    await expect(refetching).rejects.toThrow();

    const aborted = server.requests().find(row => row.id === 'READ-2');
    expect(aborted?.outcome).toBe('aborted');
    expect(server.inFlight()).toHaveLength(0);
  });
});

describe('controlled environment', () => {
  it('drives an automatic refetch from an injected focus event', async () => {
    const server = createMockServer(INITIAL_PROFILE);
    const environment = createControlledEnvironment({ focused: false });
    const client = createSyncClient({ environment });
    const query = client.query<Profile>({
      queryKey: ['profile'],
      queryFn: server.read,
      staleTime: 0,
    });

    const loading = query.load();
    server.settle('READ');
    await loading;
    expect(server.counts().read).toBe(1);

    environment.setFocused(true);
    // The refetch has to be started by the event itself - the fixture cannot
    // move sync's own timers (DC8-5-12), so this is the control the demos
    // actually have over automatic refetch.
    expect(server.counts().read).toBe(2);
    expect(environment.events).toEqual(['focus']);

    server.settleAll();
    query.dispose();
  });

  it('does not refetch while the environment is unfocused', async () => {
    const server = createMockServer(INITIAL_PROFILE);
    const environment = createControlledEnvironment({ focused: false });
    const client = createSyncClient({ environment });
    const query = client.query<Profile>({
      queryKey: ['profile'],
      queryFn: server.read,
      staleTime: 0,
    });

    const loading = query.load();
    server.settle('READ');
    await loading;

    environment.emit('reconnect'); // Event delivered, but nothing is focused.
    expect(server.counts().read).toBe(1);

    query.dispose();
  });
});

describe('outcome controls', () => {
  it('leaves an unknown WRITE unsettled forever', async () => {
    const { server, query } = await loadedQuery();

    server.nextWrite('unknown');
    const write = server.write(toSaveDto(server.value(), query.version()));
    let settled: 'resolved' | 'rejected' | null = null;
    void write.then(
      () => (settled = 'resolved'),
      () => (settled = 'rejected')
    );

    // `settle` reports that it could not finish this one, and repeated
    // attempts must not quietly resolve it: Phase 8.3 keeps `unknown` apart
    // from both success and confirmed rejection.
    expect(server.settle('WRITE')).toBe(false);
    expect(server.settleAll()).toBe(0);
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBeNull();
    expect(server.inFlight().map(row => row.id)).toEqual(['WRITE-1']);
    expect(server.requests()[1].outcome).toBe('in-flight');
    expect(server.counts().write).toBe(1);
  });

  it('accepts the WRITE and then fails the recovery READ', async () => {
    const { server, query } = await loadedQuery();

    server.nextWrite('success-then-read-failure');
    const write = server.write({
      addressLine: CITY.resource,
      postalCode: '02',
      submittedRevision: query.version(),
    });
    server.settle('WRITE');
    const response = await write;

    // The WRITE landed - the server value moved. Only the follow-up READ
    // fails, which is what `sync-error` means (Phase 8.3).
    expect(response.storedCity).toBe(CITY.resource);
    expect(server.value().city).toBe(CITY.resource);
    expect(server.revision()).toBe(2);

    const failing = query.refetch();
    server.settle('READ');
    await expect(failing).rejects.toThrow();
  });

  it('queues one outcome at a time and falls back to success', async () => {
    const server = createMockServer(INITIAL_PROFILE);
    server.nextRead('error');

    const first = server.read({ signal: new AbortController().signal });
    server.settle('READ');
    await expect(first).rejects.toThrow();

    const second = server.read({ signal: new AbortController().signal });
    server.settle('READ');
    await expect(second).resolves.toMatchObject({ city: CITY.server });
  });
});

describe('pre-load contract the demos are built around', () => {
  it('throws on the query handle until the first load', () => {
    const server = createMockServer(INITIAL_PROFILE);
    const client = createSyncClient({ ssr: true });
    const query = client.query<Profile>({
      queryKey: ['profile'],
      queryFn: server.read,
    });

    // Not just reading a field - touching `watch` or `ref` at all throws.
    // That is why every demo connects `watchStatus` first and mounts the
    // value-reading component only once `loaded` is true (M2-04).
    expect(() => query.watch).toThrow(/not loaded/);
    expect(() => query.ref).toThrow(/not loaded/);
    // Status is readable from the start, and says nothing has loaded.
    expect(query.status.loaded.value).toBe(false);
    expect(query.status.status.value).toBe('pending');

    query.dispose();
  });
});

describe('draft scenarios', () => {
  it('makes a reordered array refuse a draft apply', async () => {
    const { server, query } = await loadedQuery();
    const draft = createDraft(query.ref);

    draft.ref.contacts[0].name.value = '최';
    expect(draft.isDirty()).toBe(true);

    // The same path now points at a different contact.
    query.ref.contacts.value = reorderContacts(server.value()).contacts;

    const result = draft.apply();
    expect(result.ok).toBe(false);
    expect(result).toEqual({ ok: false, reason: 'conflict' });
    // The input survives the refusal; only `resolve` clears it.
    expect(draft.changes()).toHaveLength(1);
    expect(draft.changes()[0].conflict).toBe(true);
  });

  it('keeps an unrelated field change out of the draft conflict', async () => {
    const { query } = await loadedQuery();
    const draft = createDraft(query.ref);

    draft.ref.city.value = CITY.draft;
    query.ref.memo.value = '다른 메모'; // Unrelated path.

    const result = draft.apply();
    expect(result).toEqual({ ok: true, applied: 1 });
    expect(query.ref.city.value).toBe(CITY.draft);
    expect(query.ref.memo.value).toBe('다른 메모');
  });
});
