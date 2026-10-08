import {
  isProvided,
  isReady,
  pendingShared,
  provideShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';
import { createStore, createStoreManualSync } from 'state-ref';

const KEY = Symbol.for('state-ref.shared');

type Subs = { loaded: boolean; mySubs: number[] | null };
type LoadedSubs = { loaded: true; mySubs: number[] };

const makeSubs = () => createStore<Subs>({ loaded: false, mySubs: null });
/** Reads the root, so the subscriber that calls it wakes on a write. */
const read = (ref: unknown) => isProvided(ref as any) && (ref as any).value;

const provideSubs = () =>
  provideShared('subs', makeSubs(), { ready: ref => ref.loaded.value });

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, afterEach, vi } = import.meta
    .vitest;

  describe('sharedWatch', () => {
    beforeEach(() => {
      delete (globalThis as any)[KEY];
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('is the store itself when the provider came first', () => {
      const watch = provideShared('n', createStore({ count: 1 }));
      const shared = sharedWatch<{ count: number }>('n');

      const seen: number[] = [];
      const ref = shared((store, isFirst) => {
        if (!isProvided(store)) throw new Error('pending');
        seen.push(store.count.value);
        expect(isFirst).toBe(seen.length === 1);
      });
      expect(isProvided(ref) && ref.count.value).toBe(1);

      watch().count.value = 2;
      expect(seen).toEqual([1, 2]);

      // Writes go through to the provider's store.
      if (isProvided(ref)) ref.count.value = 3;
      expect(watch().count.value).toBe(3);
      expect(seen).toEqual([1, 2, 3]);
    });

    it('runs a subscriber pending first, then again when the store arrives', () => {
      const shared = sharedWatch<{ count: number }>('n');
      const runs: Array<[string, boolean]> = [];
      const ref = shared((store, isFirst) => {
        runs.push([
          isProvided(store) ? `count:${store.count.value}` : 'pending',
          isFirst,
        ]);
      });
      expect(runs).toEqual([['pending', true]]);
      expect(isProvided(ref)).toBe(false);
      expect(pendingShared()).toEqual(['n']);

      const watch = provideShared('n', createStore({ count: 5 }));
      expect(runs).toEqual([
        ['pending', true],
        ['count:5', false],
      ]);
      // The same ref object, now forwarding to the store.
      expect(isProvided(ref) && ref.count.value).toBe(5);
      expect(pendingShared()).toEqual([]);

      watch().count.value = 6;
      expect(runs.at(-1)).toEqual(['count:6', false]);
    });

    it('wakes a subscriber only for the paths it read', () => {
      const shared = sharedWatch<{ a: number; b: number }>('n');
      const run = vi.fn((store: ReturnType<typeof shared>) => {
        if (isProvided(store)) void store.a.value;
      });
      shared(run);
      const ref = provideShared('n', createStore({ a: 0, b: 0 }))();
      expect(run).toHaveBeenCalledTimes(2);

      ref.b.value = 1;
      expect(run).toHaveBeenCalledTimes(2);
      ref.a.value = 1;
      expect(run).toHaveBeenCalledTimes(3);
    });

    it('throws on a path read or a write while pending, and names the guard', () => {
      const shared = sharedWatch<{ count: number }>('n');
      const ref = shared() as any;
      expect(() => ref.count).toThrow(/"n" is not provided yet.*isProvided/);
      expect(() => ref.value).toThrow(/not provided yet/);
      expect(() => ref.then).not.toThrow();
      expect(() => ref.thenable).toThrow(/not provided yet/);
      expect(() => {
        ref.value = { count: 1 };
      }).toThrow(/not provided yet/);
      expect('count' in ref).toBe(false);
    });

    it('stays quiet about what the runtime asks a pending ref', async () => {
      const ref = sharedWatch('n')();
      expect(await Promise.resolve(ref)).toBe(ref);
      expect(() => String(Object.prototype.toString.call(ref))).not.toThrow();
      expect((ref as any)[Symbol.iterator]).toBeUndefined();
    });

    it('hands out an unsubscribed ref that follows the store once provided', () => {
      const shared = sharedWatch<{ count: number }>('n');
      const ref = shared();
      expect(shared()).toBe(ref);
      expect(isProvided(ref)).toBe(false);

      const watch = provideShared('n', createStore({ count: 1 }));
      expect(isProvided(ref) && ref.count.value).toBe(1);
      watch().count.value = 2;
      expect(isProvided(ref) && ref.count.value).toBe(2);
      if (isProvided(ref)) ref.count.value = 3;
      expect(watch().count.value).toBe(3);
    });

    it('subscribes once for one callback, like a store watch', () => {
      const shared = sharedWatch<number>('n');
      const run = vi.fn((ref: unknown, _isFirst: boolean) => read(ref));
      expect(shared(run)).toBe(shared(run));
      expect(shared(run, { cache: false })).not.toBe(shared(run));
      provideShared('n', createStore(0))().value = 1;
      // Two subscriptions: the cached one and the uncached one.
      expect(run.mock.calls.filter(call => call[1] === false)).toHaveLength(4);
    });

    it('keeps two shared watches of one name on one store', () => {
      const a = sharedWatch<number>('n');
      const b = sharedWatch<number>('n');
      const seen: string[] = [];
      a(ref => {
        if (isProvided(ref)) seen.push(`a${ref.value}`);
      });
      const watch = provideShared('n', createStore(0));
      b(ref => {
        if (isProvided(ref)) seen.push(`b${ref.value}`);
      });
      watch().value = 1;
      expect(seen).toEqual(['a0', 'b0', 'a1', 'b1']);
    });

    describe('teardown', () => {
      it('honours a signal from the first run while still pending', () => {
        const shared = sharedWatch<number>('n');
        const controller = new AbortController();
        const run = vi.fn((ref: unknown) => {
          read(ref);
          return controller.signal;
        });
        shared(run);
        controller.abort();
        expect(pendingShared()).toEqual([]);

        provideShared('n', createStore(0))().value = 1;
        expect(run).toHaveBeenCalledTimes(1);
      });

      it('honours a signal from the first run after the store arrived', () => {
        const shared = sharedWatch<number>('n');
        const controller = new AbortController();
        const run = vi.fn((ref: unknown) => {
          read(ref);
          return controller.signal;
        });
        shared(run);
        const ref = provideShared('n', createStore(0))();
        ref.value = 1;
        expect(run).toHaveBeenCalledTimes(3);

        controller.abort();
        ref.value = 2;
        expect(run).toHaveBeenCalledTimes(3);
      });

      it('honours a signal that was aborted before the first run returned it', () => {
        const shared = sharedWatch<number>('n');
        const run = vi.fn((ref: unknown) => {
          read(ref);
          return AbortSignal.abort();
        });
        shared(run);
        expect(pendingShared()).toEqual([]);
        provideShared('n', createStore(0))().value = 1;
        expect(run).toHaveBeenCalledTimes(1);
      });

      it('honours false from the run the store arrives on', () => {
        const shared = sharedWatch<number>('n');
        const run = vi.fn((ref: unknown, isFirst: boolean) => {
          read(ref);
          return isFirst ? undefined : false;
        });
        shared(run);
        const ref = provideShared('n', createStore(0))();
        expect(run).toHaveBeenCalledTimes(2);
        ref.value = 1;
        expect(run).toHaveBeenCalledTimes(2);
      });

      it('honours false from a later run', () => {
        const shared = sharedWatch<number>('n');
        const run = vi.fn((ref: ReturnType<typeof shared>) =>
          isProvided(ref) && ref.value >= 1 ? false : undefined
        );
        shared(run);
        const ref = provideShared('n', createStore(0))();
        ref.value = 1;
        expect(run).toHaveBeenCalledTimes(3);
        ref.value = 2;
        expect(run).toHaveBeenCalledTimes(3);
      });

      it('honours a first-run signal when the provider came first', () => {
        const watch = provideShared('n', createStore(0));
        const controller = new AbortController();
        const run = vi.fn((ref: unknown) => {
          read(ref);
          return controller.signal;
        });
        sharedWatch<number>('n')(run);
        watch().value = 1;
        expect(run).toHaveBeenCalledTimes(2);
        controller.abort();
        watch().value = 2;
        expect(run).toHaveBeenCalledTimes(2);
      });
    });

    describe('isProvided and isReady', () => {
      it('tell a store that exists from one whose data is ready', () => {
        const shared = sharedWatch<Subs, LoadedSubs>('subs');
        const stages: string[] = [];
        shared(ref => {
          if (!isProvided(ref)) return void stages.push('pending');
          if (!isReady(ref)) return void stages.push('loading');
          stages.push(`ready:${ref.mySubs.value.length}`);
        });
        expect(stages).toEqual(['pending']);

        const subs = provideSubs()();
        expect(stages).toEqual(['pending', 'loading']);

        // The data lands first; the subscriber did not read it, so it sleeps.
        subs.mySubs.value = [1, 2];
        expect(stages).toEqual(['pending', 'loading']);

        // isReady read the provider's condition, so its change wakes it.
        subs.loaded.value = true;
        expect(stages).toEqual(['pending', 'loading', 'ready:2']);

        subs.loaded.value = false;
        expect(stages.at(-1)).toBe('loading');
      });

      it('count a store provided without a condition as ready at once', () => {
        const shared = sharedWatch<number>('n');
        const ref = shared();
        expect(isReady(ref)).toBe(false);
        provideShared('n', createStore(0));
        expect(isProvided(ref)).toBe(true);
        expect(isReady(ref)).toBe(true);
      });

      it('count a plain store ref as provided and ready', () => {
        const ref = createStore({ a: 1 })();
        expect(isProvided(ref)).toBe(true);
        expect(isReady(ref)).toBe(true);
      });
    });

    describe('whenReady over a shared watch', () => {
      it('waits for the provider and then for its ready condition', () => {
        const shared = sharedWatch<Subs, LoadedSubs>('subs');
        const lengths: number[] = [];
        whenReady(shared, ref => lengths.push(ref.mySubs.value.length));
        expect(pendingShared()).toEqual(['subs']);

        const subs = provideSubs()();
        expect(lengths).toEqual([]);
        subs.mySubs.value = [1, 2, 3];
        subs.loaded.value = true;
        expect(lengths).toEqual([3]);

        subs.loaded.value = false;
        subs.loaded.value = true;
        expect(lengths).toEqual([3]);
      });

      it('adds select on top of the ready condition', () => {
        const shared = sharedWatch<Subs, LoadedSubs>('subs');
        const callback = vi.fn();
        whenReady(shared, callback, {
          select: ref => ref.mySubs.value.length > 0,
        });
        const subs = provideSubs()();
        subs.mySubs.value = [];
        subs.loaded.value = true;
        expect(callback).not.toHaveBeenCalled();
        subs.mySubs.value = [1];
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('is cancelled by its signal before the provider arrives', () => {
        const controller = new AbortController();
        const callback = vi.fn();
        whenReady(sharedWatch<Subs>('subs'), callback, {
          signal: controller.signal,
        });
        controller.abort();
        expect(pendingShared()).toEqual([]);
        provideSubs()().loaded.value = true;
        expect(callback).not.toHaveBeenCalled();
      });
    });

    it('follows a manual-sync store on its own schedule', () => {
      const { watch, updateRef, sync } = createStoreManualSync(0);
      const seen: number[] = [];
      sharedWatch<number>('tick')(ref => {
        if (isProvided(ref)) seen.push(ref.value);
      });
      provideShared('tick', watch);
      updateRef.value = 1;
      expect(seen).toEqual([0]);
      sync();
      expect(seen).toEqual([0, 1]);
    });

    it('refuses to follow a shared value that is not a watch', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      provideShared('client', { query: () => 1 });
      expect(() => sharedWatch('client')(() => {})).toThrow(/not a watch/);

      // Arriving later it cannot throw at the provider, so it is reported.
      sharedWatch('late')(() => {});
      expect(() => provideShared('late', { query: () => 1 })).not.toThrow();
      expect(error).toHaveBeenCalledTimes(1);
    });
  });
}
