/**
 * Phase 8.1 for Vue: a server resource and a draft branched off it, driven
 * through the editable connector in one real component.
 *
 * This is the server-sync plan's Phase 8 (docs/server-sync/PHASE8_1.md), not
 * the core plan's Phase 8 that `integration.test.ts` belongs to.
 *
 * Vue is the connector that writes back, so this also covers the two-way path:
 * a template write reaches the resource, and repeated writes to one path stay
 * a single change record rather than accumulating.
 */
import { render, cleanup, fireEvent } from '@testing-library/vue';
import { describe, it, expect, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import SyncPanel from '@/tests/vue/SyncPanel.vue';
import ReleasePanel from '@/tests/vue/ReleasePanel.vue';
import TwoDrafts from '@/tests/vue/TwoDrafts.vue';

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

describe('Vue resource and draft in one component', () => {
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
    await nextTick();
    expect(screen.getByTestId('branch').textContent).toBe('대전');
    expect(screen.getByTestId('source').textContent).toBe('부산');
    expect(screen.getByTestId('conflicts').textContent).toBe('0');
    expect(query.ref.city.value).toBe('부산'); // No write reached the source.

    await fireEvent.click(screen.getByTestId('edit-source'));
    await nextTick();
    expect(screen.getByTestId('source').textContent).toBe('광주');
    expect(screen.getByTestId('branch').textContent).toBe('대전');
    expect(screen.getByTestId('conflicts').textContent).toBe('1');
    expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });

    draft.discard();
    await nextTick();
    expect(screen.getByTestId('source').textContent).toBe('광주');
    expect(query.ref.city.value).toBe('광주');
    query.dispose();
  });

  it('writes back through the template and keeps one change record per path', async () => {
    const { query } = await load();
    const draft = createDraft(query.ref);
    const screen = render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
      },
    });

    await fireEvent.click(screen.getByTestId('edit-source'));
    await nextTick();
    expect(query.ref.city.value).toBe('광주');
    query.ref.city.value = '부산';
    await nextTick();
    // Two writes to the same path are one edit whose version moved, not two.
    const changes = query.changes();
    expect(changes).toHaveLength(1);
    expect(changes[0]!.path).toEqual(['city']);
    expect(changes[0]!.before.value).toBe('서울');
    expect(changes[0]!.after.value).toBe('부산');
    draft.discard();
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
    await nextTick();
    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    await nextTick();

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

  it('stops selecting on unmount without disposing the query', async () => {
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
    await nextTick();
    const mounted = selections;
    expect(mounted).toBeGreaterThan(0);

    cleanup();
    query.ref.city.value = '대전';
    await nextTick();
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
    const errors: string[] = [];
    const screen = render(SyncPanel, {
      props: {
        sourceWatch: query.watch,
        branchWatch: draft.watch,
        statusWatch: draft.watchStatus,
      },
      global: {
        config: {
          errorHandler: (error: unknown) =>
            errors.push((error as Error).message),
        },
      },
    });
    query.dispose();

    // The refusal is real, but it is raised inside Vue's own watcher, so it
    // arrives at the app-level error handler rather than at the call site.
    // The contract cannot be "the caller catches it" - it is "do not dispose a
    // query while a component still writes to it".
    await fireEvent.click(screen.getByTestId('edit-source'));
    await nextTick();
    expect(errors).toContain('This query handle has been disposed.');
    draft.discard();
  });
});

describe('Vue releases its write-back on unmount', () => {
  afterEach(cleanup);

  it('stops writing into the resource once the component is gone', async () => {
    const { query } = await load();
    let mirror!: { value: string };
    render(ReleasePanel, {
      props: {
        sourceWatch: query.watch,
        onMirror: (value: unknown) => (mirror = value as { value: string }),
      },
    });

    mirror.value = '부산'; // While mounted the mirror writes through, as it must.
    await nextTick();
    expect(query.ref.city.value).toBe('부산');

    cleanup();
    await nextTick();
    mirror.value = '대전';
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    // Vue's `watch` belongs to the setup scope, so unmount stops it. The same
    // contract is what `connectSvelte` had to be fixed to meet.
    expect(query.ref.city.value).toBe('부산');
    query.dispose();
  });
});

describe('Vue two consumers and two drafts', () => {
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
    await nextTick();
    expect(screen.getByTestId('shared').textContent).toBe('부산');
    expect(client.inspectCache()[0]!.status.dirty).toBe(true);

    // Each draft branched before that edit, so each holds its own value.
    await fireEvent.click(screen.getByTestId('edit-left'));
    await fireEvent.click(screen.getByTestId('edit-right'));
    await nextTick();
    expect(screen.getByTestId('left').textContent).toBe('대전');
    expect(screen.getByTestId('right').textContent).toBe('광주');
    expect(screen.getByTestId('source').textContent).toBe('부산');

    // Applying one reaches the other as a source update on the same path,
    // which is exactly what a conflict is.
    expect(left.apply()).toEqual({ ok: true, applied: 1 });
    await nextTick();
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
