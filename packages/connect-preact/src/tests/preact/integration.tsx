/**
 * Phase 8 integration for Preact - the same questions asked of React.
 *
 * Preact's connector is the same shape (a hook returning the store, teardown
 * by aborting on unmount), so what is worth checking here is that the
 * framework's own scheduling does not change the answers: narrowing still
 * reaches only the component whose path moved, an index write still wakes a
 * `length` reader (`CI-21`), and an unmount still ends the subscription.
 */
import { render as trender, cleanup, act } from '@testing-library/preact';
import { h } from 'preact';
import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';
import { connectPreact } from '@/index';

type Board = { title: string; items: number[]; meta: { tag: string } };

const initial = (): Board => ({
  title: 'board',
  items: [1, 2, 3],
  meta: { tag: 'a' },
});

if (import.meta.vitest) {
  const { describe, it, expect, afterEach } = import.meta.vitest;

  afterEach(cleanup);

  describe('Preact render counts', () => {
    it('coalesces two store writes for a mounted component', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectPreact(watch);
      const seen: string[] = [];
      let renders = 0;
      watch(state => {
        seen.push(`${state.title.value}:${state.meta.tag.value}`);
      });

      function View() {
        const state = useStore();
        renders += 1;
        return <div>{`${state.title.value}:${state.meta.tag.value}`}</div>;
      }

      const { container } = trender(<View />);
      renders = 0;
      seen.length = 0;
      act(() =>
        batch(() => {
          ref.title.value = 'next';
          ref.meta.tag.value = 'b';
          expect(seen).toEqual([]);
        })
      );
      expect(seen).toEqual(['next:b']);
      expect(container.textContent).toBe('next:b');
      expect(renders).toBe(1);
    });

    it('renders only the component whose path moved', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectPreact(watch);
      const renders = { title: 0, tag: 0 };

      function Title() {
        const store = useStore();
        renders.title += 1;

        return <div>{store.title.value}</div>;
      }

      function Tag() {
        const store = useStore();
        renders.tag += 1;

        return <div>{store.meta.tag.value}</div>;
      }

      trender(
        <div>
          <Title />
          <Tag />
        </div>
      );

      renders.title = 0;
      renders.tag = 0;

      act(() => {
        ref.meta.tag.value = 'b';
      });

      expect(renders.tag).toBe(1);
      expect(renders.title).toBe(0);
    });

    it('renders a length reader when an index write grows the array (CI-21)', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectPreact(watch);
      const seen: number[] = [];

      function Count() {
        const store = useStore();
        seen.push(store.items.length.value);

        return <div>{store.items.length.value}</div>;
      }

      trender(<Count />);

      act(() => {
        ref.items[3].value = 4;
      });

      expect(seen).toEqual([3, 4]);
    });

    it('renders array items through .value and ignores unrelated writes (CI-10)', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectPreact(watch);
      let renders = 0;

      function List() {
        const store = useStore();
        renders += 1;

        return (
          <ul>
            {store.items.value.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
      }

      const { container } = trender(<List />);

      renders = 0;

      act(() => {
        ref.items.value = [...ref.items.value, 4];
      });

      expect(renders).toBe(1);
      expect(container.querySelectorAll('li')).toHaveLength(4);

      renders = 0;

      act(() => {
        ref.title.value = 'elsewhere';
      });

      expect(renders).toBe(0);
    });

    it('stops rendering after unmount', () => {
      const watch = createStore<Board>(initial());
      const ref = watch();
      const useStore = connectPreact(watch);
      let renders = 0;

      function View() {
        const store = useStore();
        renders += 1;

        return <div>{store.title.value}</div>;
      }

      trender(<View />);
      cleanup();
      renders = 0;

      act(() => {
        ref.title.value = 'after';
      });

      expect(renders).toBe(0);
    });
  });
}
