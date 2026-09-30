import { create } from '@/core';
import {
  createWriteJournal,
  guardWriteObserver,
} from '@/internal/write-journal';
import type { StateRefStore } from '@/types';

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('optional write journal', () => {
    it('publishes a versioned user change before the value subscriber runs', () => {
      const journal = createWriteJournal();
      const { watch } = create({ count: 0 }, { onWrite: journal.onWrite });
      const seen: Array<{ count: number; version: number; changes: number }> =
        [];
      const ref = watch(store => {
        seen.push({
          count: store.count.value,
          version: journal.version(),
          changes: journal.entries().length,
        });
      });

      ref.count.value = 1;
      expect(seen.at(-1)).toEqual({ count: 1, version: 1, changes: 1 });
      expect(journal.entries()[0].write.before).toBe(0);
      expect(journal.entries()[0].write.after).toBe(1);

      journal.runAs('source-refresh', () => {
        ref.count.value = 2;
      });
      expect(seen.at(-1)).toEqual({ count: 2, version: 2, changes: 1 });
      expect(journal.lastOrigin()).toBe('source-refresh');

      ref.count.value = 3;
      expect(journal.version()).toBe(3);
      expect(journal.lastOrigin()).toBe('user');
      expect(journal.entries()).toHaveLength(2);
      expect(journal.entries()[1].write.after).toBe(3);
      journal.clearEntries();
      expect(journal.entries()).toEqual([]);
      expect(journal.version()).toBe(3);
    });

    it('restores user origin after a failed internal operation', () => {
      const journal = createWriteJournal();
      const { watch } = create(0, { onWrite: journal.onWrite });
      const ref = watch();

      expect(() =>
        journal.runAs('rollback', () => {
          throw new Error('failed recovery');
        })
      ).toThrow('failed recovery');

      ref.value = 1;
      expect(journal.entries()).toHaveLength(1);
      expect(journal.version()).toBe(1);
    });

    it('restores the outer origin after a nested internal write', () => {
      const journal = createWriteJournal();
      const { watch } = create(0, { onWrite: journal.onWrite });
      const ref = watch();

      journal.runAs('source-refresh', () => {
        journal.runAs('accepted-server-result', () => {
          ref.value = 1;
        });
        ref.value = 2;
      });

      expect(journal.version()).toBe(2);
      expect(journal.lastOrigin()).toBe('source-refresh');
      expect(journal.entries()).toHaveLength(0);

      ref.value = 3;
      expect(journal.entries()).toHaveLength(1);
    });

    it('rejects observer reentry before either write can commit', () => {
      let ref: StateRefStore<{ count: number }>;
      const observer = guardWriteObserver(() => {
        ref.count.value = 2;
      });
      const { watch } = create({ count: 0 }, { onWrite: observer });
      ref = watch();

      expect(() => {
        ref.count.value = 1;
      }).toThrow('A write observer cannot write to its own store.');
      expect(ref.count.value).toBe(0);
    });
  });
}
