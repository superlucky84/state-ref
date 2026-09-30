/**
 * Phase 8.1 for Svelte: a server resource and a draft branched off it, driven
 * through the editable connector in one real component.
 *
 * This is the server-sync plan's Phase 8 (docs/server-sync/PHASE8_1.md), not
 * the core plan's Phase 8 that `integration.test.ts` belongs to.
 */
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { tick } from 'svelte';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import SyncPanel from '@/tests/svelte/SyncPanel.svelte';
import ReleasePanel from '@/tests/svelte/ReleasePanel.svelte';
import TwoDrafts from '@/tests/svelte/TwoDrafts.svelte';
import WritePanel from '@/tests/svelte/WritePanel.svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type Address = { city: string; zip: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

const load = async () => {
  const client = createSyncClient({ ssr: true });
  const query = client.query<Address>({
    queryKey: ['address'],
    queryFn: () => ({ city: '서울', zip: '01' }),
  });
  await query.load();
  return { client, query };
};

describe('Svelte resource and draft in one component', () => {
  afterEach(cleanup);

  it('branches a clean draft off a dirty source and keeps the two inputs apart', async () => {
    const { query } = await load();
    query.ref.city.value = '부산';
    const draft = createDraft(query.ref);
    expect(draft.isDirty()).toBe(false); // A dirty source still branches clean.

    const screen = render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
      },
    });
    expect(screen.getByTestId('source').textContent).toBe('부산');
    expect(screen.getByTestId('branch').textContent).toBe('부산');

    await fireEvent.click(screen.getByTestId('edit-branch'));
    expect(screen.getByTestId('branch').textContent).toBe('대전');
    expect(screen.getByTestId('source').textContent).toBe('부산');
    expect(screen.getByTestId('conflicts').textContent).toBe('0');
    expect(query.ref.city.value).toBe('부산'); // No write reached the source.

    await fireEvent.click(screen.getByTestId('edit-source'));
    expect(screen.getByTestId('source').textContent).toBe('광주');
    expect(screen.getByTestId('branch').textContent).toBe('대전');
    expect(screen.getByTestId('conflicts').textContent).toBe('1');
    expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });

    draft.discard();
    expect(screen.getByTestId('source').textContent).toBe('광주');
    expect(query.ref.city.value).toBe('광주');
    query.dispose();
  });

  it('applies the branch as one root change and shows it', async () => {
    const { query } = await load();
    const draft = createDraft(query.ref);
    const screen = render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
      },
    });
    await fireEvent.click(screen.getByTestId('edit-branch'));
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    await tick();

    expect(screen.getByTestId('source').textContent).toBe('대전');
    // An apply is one atomic root write, so the per-path record is gone and a
    // per-path submission has to be captured before applying (Phase 6).
    const changes = query.changes();
    expect(changes).toHaveLength(1);
    expect(changes[0]!.path).toEqual([]);
    expect(draft.isDirty()).toBe(false);
    expect(query.isDirty()).toBe(true);
    draft.discard();
    query.dispose();
  });

  it('stops selecting on destroy without disposing the query', async () => {
    const { client, query } = await load();
    const draft = createDraft(query.ref);
    let selections = 0;
    render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
        onSelect: () => (selections += 1),
      },
    });
    query.ref.city.value = '부산';
    const mounted = selections;
    expect(mounted).toBeGreaterThan(0);

    cleanup();
    query.ref.city.value = '대전';
    expect(selections).toBe(mounted);
    // Unmounting a consumer never takes the query with it: the owner does.
    expect(client.size()).toBe(1);
    expect(query.ref.city.value).toBe('대전');
    draft.discard();
    query.dispose();
  });

  it('refuses a write from a component that outlived its query', async () => {
    const { query } = await load();
    const draft = createDraft(query.ref);
    const screen = render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
      },
    });
    query.dispose();

    // Svelte writes back from its own store subscriber, so the refusal is
    // raised there and reported as an uncaught error rather than handed to the
    // caller. The contract cannot be "the caller catches it" - it is "do not
    // dispose a query while a component still writes to it".
    const uncaught: string[] = [];
    const record = (event: ErrorEvent) => {
      uncaught.push(event.error?.message ?? event.message);
      event.preventDefault();
    };
    window.addEventListener('error', record);
    await fireEvent.click(screen.getByTestId('edit-source'));
    window.removeEventListener('error', record);

    expect(uncaught).toContain('This query handle has been disposed.');
    draft.discard();
  });
});

describe('Svelte releases its write-back on destroy', () => {
  afterEach(cleanup);

  it('stops writing into the resource once the component is gone', async () => {
    const { query } = await load();
    let mirror!: Writable<string>;
    render(ReleasePanel, {
      props: {
        sourceWatch: query.watch,
        onMirror: (value: unknown) => (mirror = value as Writable<string>),
      },
    });

    mirror.set('부산'); // While mounted the mirror writes through, as it must.
    expect(query.ref.city.value).toBe('부산');

    cleanup();
    mirror.set('대전');
    // Svelte only auto-unsubscribes the `$store` reads in markup, so the
    // connector has to release its own subscription. Without that the
    // destroyed component keeps a live path into the resource.
    expect(query.ref.city.value).toBe('부산');
    query.dispose();
  });

  it('keeps every other store alive when a write is refused', async () => {
    const { query } = await load();
    let mirror!: Writable<string>;
    render(ReleasePanel, {
      props: {
        sourceWatch: query.watch,
        onMirror: (value: unknown) => (mirror = value as Writable<string>),
      },
    });
    query.dispose(); // The next write through the mirror will be refused.

    const uncaught: string[] = [];
    const record = (event: ErrorEvent) => {
      uncaught.push(event.error?.message ?? event.message);
      event.preventDefault();
    };
    window.addEventListener('error', record);
    mirror.set('부산');
    window.removeEventListener('error', record);

    // The refusal is reported, but not from inside the store flush: Svelte
    // leaves its global subscriber queue unflushed when a subscriber throws,
    // and every store in the process - including ones created afterwards -
    // then stops notifying. That failure is silent, which is why it is pinned
    // here rather than left to be discovered as an unrelated test failure.
    expect(uncaught).toContain('This query handle has been disposed.');

    const existing = writable(0);
    let seen = -1;
    const stop = existing.subscribe(value => (seen = value));
    existing.set(1);
    expect(seen).toBe(1);
    stop();
  });
});

describe('Svelte two consumers and two drafts', () => {
  afterEach(cleanup);

  it('counts owners by handle and keeps two drafts apart', async () => {
    const { client, query } = await load();
    const second = client.query<Address>({
      queryKey: ['address'],
      queryFn: () => ({ city: '서울', zip: '01' }),
    });
    // Owners follow handles, not components: a second handle on the same key
    // makes two, and a component mounting or leaving changes neither.
    expect(client.inspectCache()[0]!.owners).toBe(2);

    const left = createDraft(query.ref);
    const right = createDraft(query.ref);
    const screen = render(TwoDrafts, {
      props: {
        sourceWatch: query.watch,
        sharedWatch: second.watch,
        leftWatch: left.watch,
        rightWatch: right.watch,
        rightStatusWatch: right.watchStatus,
      },
    });

    // Two handles on one key share the baseline and the edits.
    query.ref.city.value = '부산';
    await tick();
    expect(screen.getByTestId('shared').textContent).toBe('부산');
    expect(client.inspectCache()[0]!.status.dirty).toBe(true);

    // Each draft branched before that edit, so each holds its own value.
    await fireEvent.click(screen.getByTestId('edit-left'));
    await fireEvent.click(screen.getByTestId('edit-right'));
    await tick();
    expect(screen.getByTestId('left').textContent).toBe('대전');
    expect(screen.getByTestId('right').textContent).toBe('광주');
    expect(screen.getByTestId('source').textContent).toBe('부산');

    // Applying one reaches the other as a source update on the same path,
    // which is exactly what a conflict is.
    expect(left.apply()).toEqual({ ok: true, applied: 1 });
    await tick();
    expect(screen.getByTestId('source').textContent).toBe('대전');
    expect(screen.getByTestId('shared').textContent).toBe('대전');
    expect(screen.getByTestId('right-conflicts').textContent).toBe('1');
    expect(right.apply()).toEqual({ ok: false, reason: 'conflict' });

    cleanup();
    expect(client.inspectCache()[0]!.owners).toBe(2); // unmount owns nothing
    second.dispose();
    expect(client.inspectCache()[0]!.owners).toBe(1);
    left.discard();
    right.discard();
    query.dispose();
  });
});

describe('Svelte tells a local apply from a server WRITE', () => {
  afterEach(cleanup);

  const mount = (query: any, mutation: any) =>
    render(WritePanel, {
      props: {
        sourceWatch: query.watch,
        statusWatch: query.watchStatus,
        phaseWatch: mutation.watchStatus,
      },
    });

  it('shows a local apply with no sign of a server call', async () => {
    const { client, query } = await load();
    const write = vi.fn(() => ({ ok: true }));
    const mutation = client.mutation({ mutationFn: write });
    const screen = mount(query, mutation);

    const draft = createDraft(query.ref);
    draft.ref.city.value = '부산';
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    await tick();

    // A local apply is not a save. `dirty` moves; the two marks a server call
    // leaves - the linked count and the mutation phase - do not.
    expect(screen.getByTestId('city').textContent).toBe('부산');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    expect(screen.getByTestId('pending').textContent).toBe('0');
    expect(screen.getByTestId('phase').textContent).toBe('idle');
    expect(write).not.toHaveBeenCalled();
    draft.discard();
    mutation.dispose();
    query.dispose();
  });

  it('marks a WRITE in flight and takes an input unlike the query shape', async () => {
    const { client, query } = await load();
    const gate = deferred<{ accepted: boolean }>();
    const write = vi.fn((_input: { full: string }) => gate.promise);
    const mutation = client.mutation({ mutationFn: write });
    const screen = mount(query, mutation);

    query.ref.city.value = '부산';
    const submission = query.capture();
    const operation = mutation.start(
      { full: '부산 01' },
      { links: [{ query, submission, accept: { kind: 'submitted' } }] }
    );
    await Promise.resolve();
    await tick();

    expect(screen.getByTestId('pending').textContent).toBe('1');
    expect(screen.getByTestId('phase').textContent).toBe('pending');
    // The DTO is the caller's, not the query's shape.
    expect(write.mock.calls[0]![0]).toEqual({ full: '부산 01' });

    gate.resolve({ accepted: true });
    expect((await operation.result).kind).toBe('success');
    await tick();
    expect(screen.getByTestId('pending').textContent).toBe('0');
    expect(screen.getByTestId('phase').textContent).toBe('success');
    expect(screen.getByTestId('dirty').textContent).toBe('false');
    operation.dispose();
    mutation.dispose();
    query.dispose();
  });

  it('keeps input typed while the WRITE was in flight', async () => {
    const { client, query } = await load();
    const gate = deferred<{ accepted: boolean }>();
    const mutation = client.mutation({ mutationFn: () => gate.promise });
    const screen = mount(query, mutation);

    query.ref.city.value = '부산';
    const submission = query.capture();
    const operation = mutation.start(
      { full: '부산 01' },
      { links: [{ query, submission, accept: { kind: 'submitted' } }] }
    );
    await Promise.resolve();
    query.ref.city.value = '대전'; // same path, after the capture
    query.ref.zip.value = '02'; // a path the submission never covered

    gate.resolve({ accepted: true });
    expect((await operation.result).kind).toBe('success');
    await tick();
    // Acceptance consumes the captured revision only, so everything typed
    // after it survives and the query stays dirty.
    expect(screen.getByTestId('city').textContent).toBe('대전');
    expect(screen.getByTestId('zip').textContent).toBe('02');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    operation.dispose();
    mutation.dispose();
    query.dispose();
  });

  it('shows an unknown result as unconfirmed and never resends it', async () => {
    const { client, query } = await load();
    const write = vi.fn((_input: { full: string }) =>
      Promise.reject(new Error('connection lost'))
    );
    const mutation = client.mutation({ mutationFn: write });
    const screen = mount(query, mutation);

    query.ref.city.value = '부산';
    const result = await mutation.run(
      { full: '부산 01' },
      { links: [{ query, submission: query.capture() }] }
    );
    expect(result.kind).toBe('unknown');
    await tick();

    // Unknown is neither success nor a settled failure: the WRITE may have
    // reached the server, so the input stays and the baseline is unconfirmed.
    expect(screen.getByTestId('unconfirmed').textContent).toBe('true');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    expect(screen.getByTestId('city').textContent).toBe('부산');
    expect(screen.getByTestId('phase').textContent).toBe('unknown');
    expect(write).toHaveBeenCalledTimes(1); // no automatic resend
    mutation.dispose();
    query.dispose();
  });

  it('shows a failed baseline recovery as unconfirmed rather than as success', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Address>({
      queryKey: ['sync-error'],
      queryFn: vi
        .fn()
        .mockResolvedValueOnce({ city: '서울', zip: '01' })
        .mockRejectedValueOnce(new Error('read failed')),
      retry: 0,
    });
    await query.load();
    const mutation = client.mutation({ mutationFn: () => ({ ok: true }) });
    const screen = mount(query, mutation);

    const result = await mutation.run(
      { full: '부산 01' },
      { links: [{ query, accept: { kind: 'refetch' } }] }
    );
    expect(result.kind).toBe('sync-error');
    await tick();

    // The WRITE succeeded but the baseline could not be refetched. Showing
    // this as success would invite a second submit against a baseline the
    // client no longer has.
    expect(screen.getByTestId('unconfirmed').textContent).toBe('true');
    expect(screen.getByTestId('dirty').textContent).toBe('false');
    expect(screen.getByTestId('phase').textContent).toBe('sync-error');
    mutation.dispose();
    query.dispose();
  });
});
