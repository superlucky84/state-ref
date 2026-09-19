import { create } from '@/core';
import type { RefWrite } from '@/types';

function relativePath(write: RefWrite) {
  const path: (string | symbol)[] =
    write.segment === null ? [] : [write.segment];
  for (let current = write.parent; current.parent; current = current.parent) {
    path.unshift(current.segment);
  }
  return path.slice(1); // The first segment is the store wrapper's root.
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('opt-in ref write observation', () => {
    it('publishes the path and change before subscribers read metadata', () => {
      const writes: RefWrite[] = [];
      const observed: Array<{ city: string; write?: RefWrite }> = [];
      const { watch } = create(
        { address: { city: '서울' }, changes: 'payload' },
        { onWrite: write => writes.push(write) }
      );
      const ref = watch(store => {
        observed.push({
          city: store.address.city.value,
          write: writes[writes.length - 1],
        });
      });

      ref.address.city.value = '부산';
      expect(writes).toHaveLength(1);
      expect(relativePath(writes[0])).toEqual(['address', 'city']);
      expect(writes[0].before).toBe('서울');
      expect(writes[0].after).toBe('부산');
      expect(observed.at(-1)).toEqual({
        city: '부산',
        write: writes[0],
      });
      expect(ref.changes.value).toBe('payload');

      ref.value = { address: { city: '대전' }, changes: 'payload' };
      expect(relativePath(writes[1])).toEqual([]);
      expect(writes[1].before).toEqual({
        address: { city: '부산' },
        changes: 'payload',
      });
    });

    it('does not record a rejected, readonly, or equal-value setter', () => {
      const writes: RefWrite[] = [];
      const { watch } = create(
        { user: null as null | { name: string }, count: 0 },
        { onWrite: write => writes.push(write) }
      );
      const ref = watch();
      ref.count.value = 0;
      expect(() => {
        (ref.user as any).name.value = '새 이름';
      }).toThrow(/does not create missing intermediate paths/);

      const readonly = watch(() => {}, { editable: false });
      expect(() => {
        readonly.count.value = 1;
      }).toThrow(/direct modification is not allowed/);
      expect(writes).toEqual([]);
      expect(ref.value).toEqual({ user: null, count: 0 });
    });

    it('leaves the store unchanged when the observer rejects a write', () => {
      const { watch } = create(
        { count: 0 },
        {
          onWrite: () => {
            throw new Error('reject write');
          },
        }
      );
      const seen: number[] = [];
      const ref = watch(store => {
        seen.push(store.count.value);
      });

      expect(() => {
        ref.count.value = 1;
      }).toThrow('reject write');
      expect(ref.count.value).toBe(0);
      expect(seen).toEqual([0]);
    });

    it('preserves symbol segments instead of parsing a debug path', () => {
      const key = Symbol('item');
      const writes: RefWrite[] = [];
      const { watch } = create(
        { [key]: { count: 1 } },
        { onWrite: write => writes.push(write) }
      );

      watch()[key].count.value = 2;
      expect(relativePath(writes[0])).toEqual([key, 'count']);
    });
  });
}
