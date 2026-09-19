import { createStore, createStoreManualSync } from '@/core';
import { connectRef, observeRef } from '@/internal/ref-connection';
import type { RefPathCursor } from '@/types';

function pathOf(parent: RefPathCursor, segment: string | symbol | null) {
  const path: Array<string | symbol> = segment === null ? [] : [segment];

  for (
    let current: RefPathCursor | null = parent;
    current;
    current = current.parent
  ) {
    path.unshift(current.segment);
  }

  return path.slice(2); // Skip the empty path root and the store wrapper's root.
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('optional ref connection', () => {
    it('locates nested refs and listens through replacement without unrelated wakes', () => {
      const watch = createStore({ address: { city: '서울' }, count: 0 });
      const ref = watch();
      const source = ref.address.city;
      const link = connectRef(source);
      const seen: Array<string | undefined> = [];
      const stop = observeRef(source, value => seen.push(value));

      expect(link.owner).toBe(connectRef(ref).owner);
      expect(link.owner).not.toBe(connectRef(createStore(0)()).owner);
      expect(link.editable).toBe(true);
      expect(pathOf(link.parent, link.segment)).toEqual(['address', 'city']);

      ref.count.value = 1;
      expect(seen).toEqual([]);

      source.value = '부산';
      ref.address.value = { city: '대전' };
      expect(seen).toEqual(['부산', '대전']);
      expect(link.read()).toBe('대전');
      expect(link.exists()).toBe(true);

      ref.address.value = {} as { city: string };
      expect(seen).toEqual(['부산', '대전', undefined]);
      expect(link.exists()).toBe(false);

      ref.address.value = { city: undefined as unknown as string };
      expect(seen).toEqual(['부산', '대전', undefined, undefined]);
      expect(link.exists()).toBe(true);

      stop();
      stop();
      source.value = '광주';
      expect(seen).toEqual(['부산', '대전', undefined, undefined]);
    });

    it('preserves symbol paths and readonly provenance', () => {
      const key = Symbol('address');
      const watch = createStore({ [key]: { city: '서울' } });
      const ref = watch(() => {}, { editable: false });
      const link = connectRef(ref[key].city);

      expect(pathOf(link.parent, link.segment)).toEqual([key, 'city']);
      expect(link.editable).toBe(false);
      expect(() => {
        ref[key].city.value = '부산';
      }).toThrow(/direct modification is not allowed/);
    });

    it('follows manual sync and rejects an unrelated value-shaped object', () => {
      const store = createStoreManualSync({ count: 0 });
      const seen: Array<number | undefined> = [];
      const stop = observeRef(store.watch().count, value => seen.push(value));

      store.updateRef.count.value = 1;
      expect(seen).toEqual([]);
      store.sync();
      expect(seen).toEqual([1]);
      stop();

      expect(() => connectRef({ value: 1 })).toThrow(
        'Expected a state-ref reference.'
      );
    });
  });
}
