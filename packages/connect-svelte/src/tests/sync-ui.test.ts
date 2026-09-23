/**
 * Phase 8.1 for Svelte: a server resource and a draft branched off it, driven
 * through the editable connector in one real component.
 *
 * This is the server-sync plan's Phase 8 (docs/server-sync/PHASE8_1.md), not
 * the core plan's Phase 8 that `integration.test.ts` belongs to.
 */
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { tick } from 'svelte';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import SyncPanel from '@/tests/svelte/SyncPanel.svelte';

type Address = { city: string; zip: string };

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
