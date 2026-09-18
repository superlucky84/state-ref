/**
 * Phase 7 stress: depth and width taken past anything a test has used.
 *
 * The core's cost model is stated in terms of depth (a read walks the path,
 * a write copies along it) and of width (a write narrows to the subtree it
 * replaced). The rest of the suite exercises both at depth 3 and width 3,
 * where a mistake in either has room to hide. These take them to 64 and to
 * 10,000, and ask only for correctness - the timing gates live in the bench,
 * which measures the built artifact rather than the dev compile.
 */
import { createStore } from '@/index';
import { create } from '@/core';
import { cloneDeep } from '@/helper';
import { lens } from '@/lens';
import type { PathNode } from '@/path';

const noop = (_?: unknown) => {};
const DEPTH = 64;
const WIDTH = 10_000;

type Deep = { next?: Deep; leaf?: number };

/** A chain of `depth` objects ending in `{ leaf }`. */
const chain = (depth: number): Deep => {
  let node: Deep = { leaf: 0 };

  for (let i = 0; i < depth; i += 1) {
    node = { next: node };
  }

  return node;
};

/** Walks a reference down `depth` `next` hops. */
const descend = (ref: any, depth: number) => {
  let current = ref;

  for (let i = 0; i < depth; i += 1) {
    current = current.next;
  }

  return current;
};

const countNodes = (node: PathNode): number => {
  let total = 1;

  node.children?.forEach(child => {
    total += countNodes(child);
  });

  return total;
};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe(`a path ${DEPTH} deep`, () => {
    it('notifies a leaf subscriber when the leaf is written', () => {
      const watch = createStore<Deep>(chain(DEPTH));
      const ref = watch();
      const seen: (number | undefined)[] = [];

      watch(s => {
        seen.push(descend(s, DEPTH).leaf.value);
      });

      descend(ref, DEPTH).leaf.value = 1;

      expect(seen).toEqual([0, 1]);
    });

    it('notifies a leaf subscriber when an ancestor is replaced', () => {
      const watch = createStore<Deep>(chain(DEPTH));
      const ref = watch();
      const seen: (number | undefined)[] = [];

      watch(s => {
        seen.push(descend(s, DEPTH).leaf.value);
      });

      /**
       * Halfway up, so the write is neither the subscribed node nor its
       * parent: the leaf is reached through the subtree the write replaced.
       */
      descend(ref, DEPTH / 2).value = chain(DEPTH / 2);

      /**
       * Replacing that subtree with an equivalent one moves every reference
       * along the way and still does not wake the leaf: what decides a
       * notification is the subscribed *value*, not the references above it.
       * That is why `runner` re-reads the path instead of trusting
       * copy-on-write to have meant something.
       */
      expect(seen).toEqual([0]);

      const replacement = chain(DEPTH / 2);

      descend(replacement, DEPTH / 2).leaf = 5;
      descend(ref, DEPTH / 2).value = replacement;

      expect(seen).toEqual([0, 5]);
    });

    it('leaves the untouched side of the chain by reference', () => {
      const watch = createStore<{ a: Deep; b: Deep }>({
        a: chain(DEPTH),
        b: chain(DEPTH),
      });
      const ref = watch();
      const before = ref.b.value;

      descend(ref.a, DEPTH).leaf.value = 1;

      expect(ref.b.value).toBe(before);
    });

    it('costs one node per subscribed segment and no more', () => {
      const { pathRoot, watch } = create<Deep>(chain(DEPTH), {
        autoSync: true,
      });

      watch(s => {
        noop(descend(s, DEPTH).leaf.value);
      });

      /** root + `DEPTH` hops + the leaf. */
      expect(countNodes(pathRoot)).toBe(DEPTH + 3);
    });

    it('names the missing segment when the path breaks', () => {
      const watch = createStore<Deep>(chain(4));
      const ref = watch();

      expect(() => {
        descend(ref, 40).leaf.value = 1;
      }).toThrow(/next/);
    });

    it('clones and lenses a chain that deep without stack trouble', () => {
      const value = chain(DEPTH);
      const copy = cloneDeep(value);

      expect(copy).toEqual(value);
      expect(copy).not.toBe(value);

      let path = lens<Deep>();

      for (let i = 0; i < DEPTH; i += 1) {
        path = path.chain('next') as any;
      }

      expect((path.chain('leaf') as any).get(value)).toBe(0);

      const written = (path.chain('leaf') as any).set(7)(value);

      expect((path.chain('leaf') as any).get(written)).toBe(7);
      expect((path.chain('leaf') as any).get(value)).toBe(0);
    });
  });

  describe(`an array ${WIDTH.toLocaleString('en-US')} long`, () => {
    const build = () => Array.from({ length: WIDTH }, (_, i) => i);

    it('wakes only the subscribers whose index moved', () => {
      const watch = createStore<{ items: number[] }>({ items: build() });
      const ref = watch();
      const first = vi.fn();
      const middle = vi.fn();
      const last = vi.fn();

      watch(s => {
        noop(s.items[0].value);
        first();
      });
      watch(s => {
        noop(s.items[WIDTH / 2].value);
        middle();
      });
      watch(s => {
        noop(s.items[WIDTH - 1].value);
        last();
      });

      first.mockClear();
      middle.mockClear();
      last.mockClear();

      ref.items[WIDTH / 2].value = -1;

      expect(middle).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
      expect(last).not.toHaveBeenCalled();
      expect(ref.items.value[WIDTH / 2]).toBe(-1);
    });

    it('wakes a length subscriber when the array grows', () => {
      const watch = createStore<{ items: number[] }>({ items: build() });
      const ref = watch();
      const lengths: number[] = [];

      watch(s => {
        lengths.push(s.items.length.value);
      });

      ref.items[WIDTH].value = WIDTH;

      expect(lengths).toEqual([WIDTH, WIDTH + 1]);
    });

    it('iterates the whole array through the proxy', () => {
      const watch = createStore<{ items: number[] }>({ items: build() });
      const ref = watch();
      let total = 0;

      for (const item of ref.items) {
        total += item.value;
      }

      expect(total).toBe((WIDTH * (WIDTH - 1)) / 2);
    });

    it('costs no node for the indices nobody subscribed to', () => {
      const { pathRoot, watch } = create<{ items: number[] }>(
        { items: build() },
        { autoSync: true }
      );
      const ref = watch(() => {}, { editable: true });

      watch(s => {
        noop(s.items.length.value);
      });

      for (let i = 0; i < WIDTH; i += 1) {
        ref.items[i].value = i + 1;
      }

      /** root + store root + `items` + `length`. */
      expect(countNodes(pathRoot)).toBe(4);
    });
  });
}
