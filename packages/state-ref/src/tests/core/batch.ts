import { batch } from 'state-ref/batch';
import { create, createStore, createStoreManualSync } from 'state-ref';

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('explicit synchronous batch', () => {
    it('uses the callback ref, returned ref and separate watch ref as one store', () => {
      const watch = createStore({ b: 0, c: 0 });
      const seen: number[][] = [];
      const returned = watch(state => {
        seen.push([state.b.value, state.c.value]);
      });
      const held = watch();

      expect(seen).toEqual([[0, 0]]);
      batch(() => {
        returned.b.value = 3;
        expect(held.b.value).toBe(3);
        held.c.value = 4;
        expect(seen).toEqual([[0, 0]]);
      });
      expect(seen).toEqual([
        [0, 0],
        [3, 4],
      ]);

      held.b.value = 5;
      expect(seen.at(-1)).toEqual([5, 4]);
    });

    it('runs the first callback once inside a batch and flushes nested batches once', () => {
      const watch = createStore({ b: 0, c: 0 });
      const seen: number[][] = [];
      const result = batch(() => {
        const ref = watch(state => {
          seen.push([state.b.value, state.c.value]);
        });
        expect(seen).toEqual([[0, 0]]);
        ref.b.value = 1;
        batch(() => {
          ref.c.value = 2;
          expect(seen).toEqual([[0, 0]]);
        });
        return ref.b.value + ref.c.value;
      });

      expect(result).toBe(3);
      expect(seen).toEqual([
        [0, 0],
        [1, 2],
      ]);
    });

    it('can batch writes from inside a watch callback', () => {
      const watch = createStore({ trigger: false, b: 0, c: 0 });
      const seen: number[][] = [];
      watch(state => {
        seen.push([state.b.value, state.c.value]);
      });
      watch(state => {
        if (state.trigger.value) {
          batch(() => {
            state.b.value = 3;
            state.c.value = 4;
          });
        }
      });

      watch().trigger.value = true;
      expect(seen).toEqual([
        [0, 0],
        [3, 4],
      ]);
    });

    it('can batch writes during the immediate first watch callback', () => {
      const watch = createStore({ trigger: true, b: 0, c: 0 });
      const seen: number[][] = [];
      watch(state => {
        seen.push([state.b.value, state.c.value]);
      });
      let firstRuns = 0;
      watch(state => {
        firstRuns += 1;
        if (state.trigger.value) {
          batch(() => {
            state.b.value = 3;
            state.c.value = 4;
          });
        }
      });

      expect(firstRuns).toBe(1);
      expect(seen).toEqual([
        [0, 0],
        [3, 4],
      ]);
    });

    it('records each write before notifying once and skips net-zero leaf changes', () => {
      const writes: number[][] = [];
      const store = create(
        { n: 0 },
        {
          onWrite: write =>
            writes.push([write.before as number, write.after as number]),
        }
      );
      const seen: number[] = [];
      store.watch(state => {
        seen.push(state.n.value);
      });

      batch(() => {
        store.updateRef.n.value = 1;
        store.updateRef.n.value = 0;
        expect(seen).toEqual([0]);
      });
      expect(writes).toEqual([
        [0, 1],
        [1, 0],
      ]);
      expect(seen).toEqual([0]);
    });

    it('flushes committed writes before rethrowing and rejects async callbacks', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const seen: number[] = [];
      watch(state => {
        seen.push(state.n.value);
      });
      const failure = new Error('failed');

      expect(() =>
        batch(() => {
          ref.n.value = 1;
          throw failure;
        })
      ).toThrow(failure);
      expect(seen).toEqual([0, 1]);
      batch(() => {
        ref.n.value = 2;
      });
      expect(seen).toEqual([0, 1, 2]);
      expect(() => batch(async () => {})).toThrow(
        'batch callback must be synchronous'
      );
    });

    it('leaves manual sync notifications explicit', () => {
      const { watch, updateRef, sync } = createStoreManualSync({ b: 0, c: 0 });
      const seen: number[][] = [];
      watch(state => {
        seen.push([state.b.value, state.c.value]);
      });

      batch(() => {
        updateRef.b.value = 3;
        updateRef.c.value = 4;
      });
      expect(seen).toEqual([[0, 0]]);
      sync();
      expect(seen).toEqual([
        [0, 0],
        [3, 4],
      ]);
    });

    it('rechecks affected array length and final dynamic dependencies', () => {
      const watch = createStore(
        { items: [1, 2], flag: false, a: 0, b: 0 },
        { trackDeps: true }
      );
      const ref = watch();
      const lengths: number[] = [];
      const selected: number[] = [];
      watch(state => {
        lengths.push(state.items.length.value);
      });
      watch(state => {
        selected.push(state.flag.value ? state.a.value : state.b.value);
      });

      batch(() => {
        ref.items[2].value = 3;
        ref.items[3].value = 4;
        ref.flag.value = true;
        ref.a.value = 5;
        ref.b.value = 6;
      });
      expect(lengths).toEqual([2, 4]);
      expect(selected).toEqual([0, 5]);

      ref.b.value = 7;
      expect(selected).toEqual([0, 5]);
      ref.a.value = 8;
      expect(selected).toEqual([0, 5, 8]);
    });

    it('does not resurrect a subscription aborted before the flush', () => {
      const watch = createStore({ n: 0 });
      const ref = watch();
      const controller = new AbortController();
      const seen: number[] = [];
      watch(state => {
        seen.push(state.n.value);
        return controller.signal;
      });

      batch(() => {
        ref.n.value = 1;
        controller.abort();
      });
      expect(seen).toEqual([0]);
    });
  });
}
