/**
 * Phase 8 integration for Solid.
 *
 * The connector hands back a `Signal`, so the measurement that matters is
 * how often the signal changes - that is what a component's effects and JSX
 * would re-run on.
 */
import { createRoot, createEffect } from 'solid-js';
import { createStore } from 'state-ref';
import { connectSolid } from '@/index';

type Board = { title: string; items: number[]; meta: { tag: string } };

const initial = (): Board => ({
  title: 'board',
  items: [1, 2, 3],
  meta: { tag: 'a' },
});

/** Runs `body` inside a root so `onCleanup` has an owner, then disposes it. */
const inRoot = <R>(body: (dispose: () => void) => R): R =>
  createRoot(dispose => body(dispose));

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('Solid signal updates', () => {
    it('updates only the signal whose path moved', async () => {
      await inRoot(async () => {
        const watch = createStore<Board>(initial());
        const ref = watch();
        const useStore = connectSolid(watch);
        const [tag] = useStore(store => store.meta.tag);
        const [title] = useStore(store => store.title);
        const seen = { tag: 0, title: 0 };

        createEffect(() => {
          tag();
          seen.tag += 1;
        });
        createEffect(() => {
          title();
          seen.title += 1;
        });

        await Promise.resolve();
        seen.tag = 0;
        seen.title = 0;

        ref.meta.tag.value = 'b';
        await Promise.resolve();

        expect(tag()).toBe('b');
        expect(seen.title).toBe(0);
      });
    });

    it('updates a length signal when an index write grows the array (CI-21)', () => {
      inRoot(() => {
        const watch = createStore<Board>(initial());
        const ref = watch();
        const useStore = connectSolid(watch);
        const [length] = useStore(store => store.items.length);

        expect(length()).toBe(3);

        ref.items[3].value = 4;

        expect(length()).toBe(4);
      });
    });

    it('updates the array signal when the array is replaced (CI-10)', () => {
      inRoot(() => {
        const watch = createStore<Board>(initial());
        const ref = watch();
        const useStore = connectSolid(watch);
        const [items] = useStore(store => store.items);

        ref.items.value = [...ref.items.value, 4];

        expect(items()).toEqual([1, 2, 3, 4]);
      });
    });

    it('stops updating once its root is disposed', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const seen: string[] = [];

      inRoot(dispose => {
        const useStore = connectSolid(watch);
        const [title] = useStore(store => store.title);

        seen.push(title());
        dispose();
      });

      ref.title.value = 'after';

      expect(seen).toEqual(['board']);
      expect(ref.title.value).toBe('after');
    });
  });
}
