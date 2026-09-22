import { describe, expect, it, vi } from 'vitest';
import { createSyncClient } from '../index';
import type { QueryHandle, SyncClient } from '../index';
import { createDraft } from 'state-ref/draft';

type Account = { city: string; name: string };

function account() {
  const client = createSyncClient({ ssr: true });
  const reads = vi.fn((): Account => ({ city: '서울', name: 'A' }));
  const query = client.query({ queryKey: ['account'], queryFn: reads });
  return { client, query, reads };
}

describe('a draft branched from an editable resource', () => {
  it('branches clean from a dirty resource and applies locally only', async () => {
    const { client, query, reads } = account();
    await query.load();
    query.ref.city.value = '부산';
    expect(query.changes().map(change => change.path)).toEqual([['city']]);

    const draft = createDraft(query.ref);
    // The branch starts from the current local value, not the server baseline,
    // and does not inherit the parent's change record.
    expect(draft.ref.value).toEqual({ city: '부산', name: 'A' });
    expect(draft.isDirty()).toBe(false);
    expect(draft.changes()).toEqual([]);
    expect(query.changes()).toHaveLength(1);

    draft.ref.city.value = '대전';
    // An open draft edit stays out of the resource until it is applied.
    expect(query.ref.city.value).toBe('부산');
    expect(draft.status.dirty.value).toBe(true);

    expect(draft.apply()).toEqual({ ok: true, applied: 1 });
    expect(query.ref.city.value).toBe('대전');
    expect(draft.isDirty()).toBe(false);
    expect(query.isDirty()).toBe(true);
    // An apply is one atomic write at the root, so the resource records it as
    // a single root change measured against the server baseline.
    expect(
      query.changes().map(change => ({
        path: change.path,
        before: change.before.value,
        after: change.after.value,
      }))
    ).toEqual([
      {
        path: [],
        before: { city: '서울', name: 'A' },
        after: { city: '대전', name: 'A' },
      },
    ]);
    expect(reads).toHaveBeenCalledTimes(1); // A local apply is not a WRITE.
    expect(client.inspectMutations()).toEqual([]);

    const submission = query.capture();
    expect(submission.value).toEqual({ city: '대전', name: 'A' });
    const result = await client
      .mutation({ mutationFn: (input: { city: string }) => input })
      .run(
        { city: query.ref.city.value },
        { links: [{ query, submission, accept: { kind: 'submitted' } }] }
      );
    expect(result.kind).toBe('success');
    expect(query.isDirty()).toBe(false);
    expect(query.ref.city.value).toBe('대전');
    draft.discard();
  });

  it('flags an overlapping local update and keeps the draft input', async () => {
    const overlap = async (
      label: string,
      update: (context: {
        client: SyncClient;
        query: QueryHandle<Account>;
      }) => Promise<void> | void
    ) => {
      const { client, query } = account();
      await query.load();
      query.ref.city.value = '부산';
      const draft = createDraft(query.ref);
      draft.ref.city.value = '대전';

      await update({ client, query });

      expect(draft.ref.city.value, label).toBe('대전'); // Input is preserved.
      expect(draft.status.conflicts.value, label).toBe(1);
      expect(draft.changes()[0].conflict, label).toBe(true);
      expect(draft.apply(), label).toEqual({ ok: false, reason: 'conflict' });
      return { query, draft };
    };

    // A direct edit on the resource.
    const direct = await overlap('direct', ({ query }) => {
      query.ref.city.value = '광주';
    });
    // Resolving toward the draft lets the same input through.
    expect(direct.draft.resolve(direct.draft.changes()[0], 'draft')).toEqual({
      ok: true,
    });
    expect(direct.draft.apply()).toEqual({ ok: true, applied: 1 });
    expect(direct.query.ref.city.value).toBe('대전');
    direct.draft.discard();

    // Another draft applying to the same resource.
    const sibling = await overlap('sibling draft', ({ query }) => {
      const other = createDraft(query.ref);
      other.ref.city.value = '광주';
      expect(other.apply()).toEqual({ ok: true, applied: 1 });
      other.discard();
    });
    // Discarding before apply leaves the sibling's value in place.
    sibling.draft.discard();
    expect(sibling.query.ref.city.value).toBe('광주');

    // A linked WRITE accepting the submitted edits as the new baseline.
    const accepted = await overlap(
      'accepted WRITE',
      async ({ client, query }) => {
        query.ref.city.value = '광주';
        const result = await client
          .mutation({ mutationFn: () => ({ ok: true }) })
          .run(null, {
            links: [
              {
                query,
                submission: query.capture(),
                accept: { kind: 'submitted' },
              },
            ],
          });
        expect(result.kind).toBe('success');
      }
    );
    // The accepted WRITE left the resource clean; the draft input survives it.
    expect(accepted.query.isDirty()).toBe(false);
    accepted.draft.discard();
  });

  it('keeps a local edit over a refetched baseline and conflicts without one', async () => {
    const build = async () => {
      const client = createSyncClient({ ssr: true });
      let served = { city: '서울', name: 'A' };
      const query = client.query({
        queryKey: ['account'],
        queryFn: () => ({ ...served }),
      });
      await query.load();
      return {
        query,
        serve: (city: string) => {
          served = { city, name: 'A' };
        },
      };
    };

    // A resource edit outranks a refetched baseline, so the draft sees no change.
    const pinned = await build();
    pinned.query.ref.city.value = '부산';
    const overDirty = createDraft(pinned.query.ref);
    overDirty.ref.city.value = '대전';
    pinned.serve('광주');
    await pinned.query.refetch();
    expect(pinned.query.ref.city.value).toBe('부산');
    expect(overDirty.status.conflicts.value).toBe(0);
    expect(overDirty.apply()).toEqual({ ok: true, applied: 1 });
    expect(pinned.query.ref.city.value).toBe('대전');
    overDirty.discard();

    // With no competing local edit the refetched value reaches the draft.
    const clean = await build();
    const overClean = createDraft(clean.query.ref);
    overClean.ref.city.value = '대전';
    clean.serve('광주');
    await clean.query.refetch();
    expect(clean.query.ref.city.value).toBe('광주');
    expect(overClean.status.conflicts.value).toBe(1);
    expect(overClean.ref.city.value).toBe('대전');
    expect(overClean.apply()).toEqual({ ok: false, reason: 'conflict' });
    overClean.discard();
  });

  it('reports an unreachable source instead of rethrowing its owner error', async () => {
    const { client, query } = account();
    await query.load();
    const draft = createDraft(query.ref);
    draft.ref.city.value = '대전';

    query.dispose();
    expect(client.remove(['account'])).toBe(true);

    // The draft keeps its own value and record without the source.
    expect(draft.ref.city.value).toBe('대전');
    expect(draft.isDirty()).toBe(true);
    expect(draft.changes()[0].source).toEqual({ exists: true, value: '서울' });
    draft.ref.name.value = 'Z';
    expect(draft.status.dirty.value).toBe(true);

    // Reaching the source is reported in the draft's own vocabulary.
    expect(draft.apply()).toEqual({ ok: false, reason: 'missing-source' });
    expect(() => draft.reset()).not.toThrow();
    expect(() => draft.discard()).not.toThrow();

    // Asking a disposed handle for a ref is the owner's own guard, before any
    // draft exists; the draft contract covers a source lost after creation.
    const other = createSyncClient({ ssr: true });
    const gone = other.query({
      queryKey: ['gone'],
      queryFn: () => ({ city: '서울' }),
    });
    await gone.load();
    gone.dispose();
    expect(() => gone.ref).toThrow('This query handle has been disposed.');
  });

  it('aggregates unsaved state across the resource and its open drafts', async () => {
    const { client, query } = account();
    await query.load();
    const unsaved = (drafts: readonly { isDirty: () => boolean }[]) =>
      query.isDirty() || drafts.some(draft => draft.isDirty());

    expect(unsaved([])).toBe(false); // Neither side has input.

    query.ref.city.value = '부산';
    expect(unsaved([])).toBe(true); // Resource only.

    const write = client.mutation({
      mutationFn: (_input: null, { signal }) =>
        new Promise<{ ok: boolean }>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
    });
    const operation = write.start(null, {
      links: [
        { query, submission: query.capture(), accept: { kind: 'submitted' } },
      ],
    });
    // A linked WRITE is visible both as an operation and on the resource.
    expect(client.inspectMutations()).toHaveLength(1);
    expect(query.status.pending.value).toBe(1);

    // A draft may still branch while the resource has a WRITE in flight.
    const draft = createDraft(query.ref);
    expect(draft.isDirty()).toBe(false);
    expect(unsaved([draft])).toBe(true); // Resource dirty, draft clean.
    draft.ref.name.value = 'Z';
    expect(draft.isDirty()).toBe(true);
    // A draft never resolves the resource's own WRITE.
    expect(client.inspectMutations()).toHaveLength(1);

    draft.discard();
    operation.abort();
    expect((await operation.result).kind).toBe('unknown');
    expect(query.status.unconfirmed.value).toBe(true);
    expect(unsaved([])).toBe(true);
    operation.dispose();
    write.dispose();
  });
});
