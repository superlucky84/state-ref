import { createStore, createStoreManualSync } from '@/core';
import { createDraft } from '@/draft';

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('independent draft', () => {
    it('starts clean from the source current value even after an earlier edit', () => {
      const source = createStore({ city: '서울' })();
      source.city.value = '부산';
      const draft = createDraft(source);
      expect(draft.ref.city.value).toBe('부산');
      expect(draft.isDirty()).toBe(false);
      expect(draft.changes()).toEqual([]);
      draft.discard();
    });

    it('starts clean from a child ref, follows unedited fields, and applies only its edit', () => {
      const watch = createStore({
        address: { city: '서울', zip: 100 },
        count: 0,
      });
      const source = watch();
      const draft = createDraft(source.address);

      expect(draft.ref.value).toEqual({ city: '서울', zip: 100 });
      expect(draft.isDirty()).toBe(false);
      expect(draft.changes()).toEqual([]);

      draft.ref.city.value = '부산';
      expect(source.address.city.value).toBe('서울');
      expect(draft.changes()[0]).toMatchObject({
        path: ['city'],
        before: { exists: true, value: '서울' },
        after: { exists: true, value: '부산' },
        conflict: false,
      });

      source.address.zip.value = 200;
      expect(draft.ref.value).toEqual({ city: '부산', zip: 200 });
      expect(draft.changes()[0].conflict).toBe(false);
      expect(draft.apply()).toEqual({ ok: true, applied: 1 });
      expect(source.address.value).toEqual({ city: '부산', zip: 200 });
      expect(draft.isDirty()).toBe(false);
      draft.discard();
    });

    it('keeps two drafts independent and detects the same-field conflict', () => {
      const source = createStore({ city: '서울', zip: 100 })();
      const first = createDraft(source);
      const second = createDraft(source);

      first.ref.city.value = '부산';
      second.ref.city.value = '대전';
      expect(source.city.value).toBe('서울');
      expect(first.changes()[0].owner).not.toBe(second.changes()[0].owner);

      source.city.value = '광주';
      expect(first.ref.city.value).toBe('부산');
      expect(second.ref.city.value).toBe('대전');
      expect(first.changes()[0]).toMatchObject({
        before: { value: '서울' },
        after: { value: '부산' },
        source: { value: '광주' },
        conflict: true,
      });
      expect(first.apply()).toEqual({ ok: false, reason: 'conflict' });
      expect(source.city.value).toBe('광주');
      expect(second.resolve(first.changes()[0], 'source')).toEqual({
        ok: false,
        reason: 'stale',
      });

      const review = first.changes()[0];
      expect(first.resolve(review, 'draft')).toEqual({ ok: true });
      expect(first.apply()).toEqual({ ok: true, applied: 1 });
      expect(source.city.value).toBe('부산');
      expect(second.changes()[0].conflict).toBe(true);
      first.discard();
      second.discard();
    });

    it('adopts source on explicit resolution and drops converged edits', () => {
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      draft.ref.city.value = '부산';
      source.city.value = '대전';
      expect(draft.resolve(draft.changes()[0], 'source')).toEqual({ ok: true });
      expect(draft.ref.city.value).toBe('대전');
      expect(draft.isDirty()).toBe(false);

      draft.ref.city.value = '광주';
      source.city.value = '광주';
      expect(draft.isDirty()).toBe(false);
      expect(draft.ref.city.value).toBe('광주');
      draft.discard();
    });

    it('uses the latest source value as the baseline of a later edit', () => {
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      source.city.value = '대전';
      expect(draft.ref.city.value).toBe('대전');
      expect(draft.isDirty()).toBe(false);
      draft.ref.city.value = '부산';
      expect(draft.changes()[0].before.value).toBe('대전');
      draft.discard();
    });

    it('refuses stale review decisions and keeps snapshots frozen', () => {
      const source = createStore({ city: '서울', zip: 100 })();
      const draft = createDraft(source);
      draft.ref.city.value = '부산';
      const old = draft.changes()[0];
      expect(Object.isFrozen(old)).toBe(true);
      expect(Object.isFrozen(old.path)).toBe(true);
      expect(Object.isFrozen(old.before)).toBe(true);

      source.zip.value = 200;
      expect(draft.resolve(old, 'source')).toEqual({
        ok: false,
        reason: 'stale',
      });
      expect(draft.ref.city.value).toBe('부산');
      draft.discard();
    });

    it('respects readonly and missing source paths without losing local input', () => {
      const watch = createStore({ address: { city: '서울' } });
      const source = watch(() => {}, { editable: false });
      const draft = createDraft(source.address);
      draft.ref.city.value = '부산';
      expect(draft.apply()).toEqual({ ok: false, reason: 'readonly' });
      expect(source.address.city.value).toBe('서울');
      draft.discard();

      const writable = watch();
      const next = createDraft(writable.address);
      next.ref.city.value = '대전';
      writable.value = {} as { address: { city: string } };
      expect(next.ref.city.value).toBe('대전');
      expect(next.apply()).toEqual({ ok: false, reason: 'missing-source' });
      expect(next.changes()[0].conflict).toBe(true);
      writable.value = { address: { city: '서울' } };
      expect(next.changes()[0].conflict).toBe(false);
      next.discard();
    });

    it('keeps local input when a source parent changes type', () => {
      const source = createStore<{ branch: { city: string } | null }>({
        branch: { city: '서울' },
      })();
      const draft = createDraft<{ city: string }>(source.branch as any);
      draft.ref.city.value = '부산';
      source.branch.value = null;
      expect(draft.ref.city.value).toBe('부산');
      expect(draft.changes()[0].conflict).toBe(true);
      expect(draft.resolve(draft.changes()[0], 'draft')).toEqual({
        ok: false,
        reason: 'boundary',
      });
      expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });
      expect(draft.resolve(draft.changes()[0], 'source')).toEqual({
        ok: true,
      });
      expect(draft.ref.value).toBeNull();
      draft.discard();
    });

    it('treats array elements as an atomic edit', () => {
      const source = createStore({ items: [1, 2] })();
      const draft = createDraft(source.items);
      draft.ref[0].value = 3;
      expect(draft.changes()[0].path).toEqual([]);
      source.items[1].value = 4;
      expect(draft.changes()[0].conflict).toBe(true);
      expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });
      draft.discard();
    });

    it('rejects an array length write that would create holes', () => {
      const source = createStore({ items: [1, 2] })();
      const draft = createDraft(source);
      expect(() => {
        draft.ref.items.length.value = 4;
      }).toThrow('Draft arrays cannot contain holes.');
      expect(draft.ref.items.value).toEqual([1, 2]);
      expect(draft.isDirty()).toBe(false);
      draft.discard();
    });

    it('publishes several edits to the source in one complete update', () => {
      const watch = createStore({ city: '서울', zip: 100 });
      const source = watch();
      const draft = createDraft(source);
      draft.ref.city.value = '부산';
      draft.ref.zip.value = 200;
      const seen: Array<{ city: string; zip: number }> = [];
      const abort = new AbortController();
      watch(ref => {
        seen.push(ref.value);
        return abort.signal;
      });

      expect(draft.apply()).toEqual({ ok: true, applied: 2 });
      expect(seen).toEqual([
        { city: '서울', zip: 100 },
        { city: '부산', zip: 200 },
      ]);
      abort.abort();
      draft.discard();
    });

    it('does not apply a safe field when another field conflicts', () => {
      const source = createStore({ city: '서울', zip: 100 })();
      const draft = createDraft(source);
      draft.ref.city.value = '부산';
      draft.ref.zip.value = 200;
      source.city.value = '대전';
      expect(draft.apply()).toEqual({ ok: false, reason: 'conflict' });
      expect(source.value).toEqual({ city: '대전', zip: 100 });
      draft.discard();
    });

    it('settles a draft over a writable manual-sync source', () => {
      const store = createStoreManualSync({ city: '서울' });
      const draft = createDraft(store.updateRef);
      draft.ref.city.value = '부산';
      expect(draft.apply()).toEqual({ ok: true, applied: 1 });
      expect(store.updateRef.city.value).toBe('부산');
      expect(draft.isDirty()).toBe(false);
      store.sync();
      draft.discard();
    });

    it('preserves symbol segments in local change paths', () => {
      const key = Symbol('field');
      const source = createStore({ [key]: { count: 0 }, zip: 100 })();
      const draft = createDraft(source);
      draft.ref[key].count.value = 1;
      expect(draft.changes()[0].path).toEqual([key, 'count']);
      source.zip.value = 200;
      expect(draft.apply()).toEqual({ ok: true, applied: 1 });
      expect(source[key].count.value).toBe(1);
      expect(source.zip.value).toBe(200);
      draft.discard();
    });

    it('reset keeps the session, discard guards retained child refs', () => {
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      const held = draft.ref.city;
      draft.ref.city.value = '부산';
      draft.reset();
      expect(draft.ref.city.value).toBe('서울');
      expect(draft.isDirty()).toBe(false);
      draft.ref.city.value = '대전';
      draft.discard();
      draft.discard();
      expect(() => held.value).toThrow('This draft has been discarded.');
      expect(() => {
        held.value = '광주';
      }).toThrow('This draft has been discarded.');
      expect(() => draft.changes()).toThrow('This draft has been discarded.');
      expect(source.city.value).toBe('서울');
    });

    it('offers a normal Watch to connectors and publishes changes before subscribers run', () => {
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      const abort = new AbortController();
      const seen: Array<{ city: string; dirty: boolean }> = [];
      const renew = (ref: typeof draft.ref) => {
        seen.push({ city: ref.city.value, dirty: draft.isDirty() });
        return abort.signal;
      };

      const first = draft.watch(renew);
      expect(draft.watch(renew)).toBe(first);
      draft.ref.city.value = '부산';
      expect(seen).toEqual([
        { city: '서울', dirty: false },
        { city: '부산', dirty: true },
      ]);

      abort.abort();
      draft.ref.city.value = '대전';
      expect(seen).toHaveLength(2);
      draft.discard();
      expect(() => first.city.value).toThrow('discarded');
    });

    it('publishes readonly reactive status after the value is committed', () => {
      const source = createStore({ city: '서울' })();
      const draft = createDraft(source);
      const seen: Array<{
        dirty: boolean;
        conflicts: number;
        city: string;
        changes: number;
      }> = [];
      const abort = new AbortController();
      draft.watchStatus(status => {
        seen.push({
          dirty: status.dirty.value,
          conflicts: status.conflicts.value,
          city: draft.ref.city.value,
          changes: draft.changes().length,
        });
        return abort.signal;
      });

      draft.ref.city.value = '부산';
      source.city.value = '대전';
      expect(seen).toEqual([
        { dirty: false, conflicts: 0, city: '서울', changes: 0 },
        { dirty: true, conflicts: 0, city: '부산', changes: 1 },
        { dirty: true, conflicts: 1, city: '부산', changes: 1 },
      ]);
      expect(() => {
        draft.status.dirty.value = false;
      }).toThrow(/direct modification is not allowed/);
      abort.abort();
      draft.discard();
      expect(() => draft.status.dirty.value).toThrow('discarded');
    });

    it('preserves input made during the source notification of apply', () => {
      const watch = createStore({ city: '서울' });
      const source = watch();
      const draft = createDraft(source);
      draft.ref.city.value = '부산';
      const abort = new AbortController();
      watch(ref => {
        if (ref.city.value === '부산') draft.ref.city.value = '대전';
        return abort.signal;
      });

      expect(draft.apply()).toEqual({ ok: true, applied: 1 });
      expect(source.city.value).toBe('부산');
      expect(draft.ref.city.value).toBe('대전');
      expect(draft.isDirty()).toBe(true);
      expect(draft.changes()[0].before.value).toBe('부산');
      abort.abort();
      draft.discard();
    });

    it('releases source and draft subscriptions when discarded', () => {
      const connection = Symbol.for('state-ref.ref-link');
      const source = createStore({ city: '서울' })();
      const sourceSubs = (source as any)[connection][4] as Map<
        unknown,
        unknown
      >;
      const baseline = sourceSubs.size;
      const draft = createDraft(source);
      const draftSubs = (draft.ref as any)[connection][4] as Map<
        unknown,
        unknown
      >;
      draft.watch(ref => {
        void ref.city.value;
      });
      void draft.ref.city.value;

      expect(sourceSubs.size).toBe(baseline + 1);
      expect(draftSubs.size).toBeGreaterThan(0);
      draft.discard();
      expect(sourceSubs.size).toBe(baseline);
      expect(draftSubs.size).toBe(0);
    });

    it('rejects unsupported trees before creating a session or committing a setter', () => {
      const source = createStore({ item: new Date() })();
      expect(() => createDraft(source)).toThrow('plain, acyclic');
      expect(() => createDraft(createStore({ value: 1 })())).toThrow(
        'Draft payload key value is reserved.'
      );

      const shared = { count: 1 };
      const sharedDraft = createDraft(createStore({ a: shared, b: shared })());
      sharedDraft.discard();
      const cyclic: { self?: unknown } = {};
      cyclic.self = cyclic;
      expect(() => createDraft(createStore(cyclic)())).toThrow(
        'plain, acyclic'
      );

      const plain = createStore({ item: { count: 1 } })();
      const draft = createDraft(plain);
      expect(() => {
        draft.ref.item.value = new Date() as any;
      }).toThrow('plain, acyclic');
      expect(draft.ref.item.value).toEqual({ count: 1 });
      expect(draft.isDirty()).toBe(false);
      draft.discard();
    });

    it('rejects direct snapshot mutation without changing the source', () => {
      const value = Object.freeze({ nested: Object.freeze({ count: 1 }) });
      const source = createStore(value)();
      const draft = createDraft(source);
      expect(draft.ref.value.nested.count).toBe(1);
      expect(() => {
        (draft.ref.value.nested as { count: number }).count = 2;
      }).toThrow('Draft snapshots cannot be modified directly.');
      expect(source.nested.count.value).toBe(1);
      expect(draft.isDirty()).toBe(false);
      draft.discard();
    });
  });
}
