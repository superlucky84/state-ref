import { provideShared, pendingShared, whenReady } from 'state-ref/shared';
import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';

const KEY = Symbol.for('state-ref.shared');

/**
 * A subscription is only observable by being run. This wraps a watch so every
 * run of a subscriber made through it is counted: a write that leaves the
 * count alone found nobody listening.
 */
function probed<T>(watch: Watch<T>) {
  const probe = { runs: 0, watch: watch as Watch<T> };
  probe.watch = (renew, option) =>
    watch(
      renew &&
        ((ref, isFirst) => {
          probe.runs += 1;
          return renew(ref, isFirst);
        }),
      option
    );
  return probe;
}

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, afterEach, vi } = import.meta
    .vitest;

  describe('whenReady', () => {
    beforeEach(() => {
      delete (globalThis as any)[KEY];
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // T-SH-04
    it('runs once when the value turns truthy, and never again', () => {
      const watch = createStore(false);
      const ref = watch();
      const callback = vi.fn();
      whenReady(watch, callback);
      expect(callback).not.toHaveBeenCalled();

      ref.value = true;
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].value).toBe(true);

      ref.value = false;
      ref.value = true;
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // T-SH-05
    it('takes its condition from select and watches only what select reads', () => {
      const watch = createStore({ status: 'loading', noise: 0 });
      const ref = watch();
      const select = vi.fn(
        (store: ReturnType<typeof watch>) => store.status.value === 'done'
      );
      const callback = vi.fn();
      whenReady(watch, callback, { select });
      expect(select).toHaveBeenCalledTimes(1);

      ref.noise.value = 1;
      ref.noise.value = 2;
      expect(select).toHaveBeenCalledTimes(1);

      ref.status.value = 'failed';
      expect(select).toHaveBeenCalledTimes(2);
      expect(callback).not.toHaveBeenCalled();

      ref.status.value = 'done';
      expect(callback).toHaveBeenCalledTimes(1);

      ref.status.value = 'loading';
      ref.status.value = 'done';
      expect(select).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // T-SH-06
    it('runs straight away for a store that is ready, and leaves no subscription', () => {
      const watch = createStore(true);
      const probe = probed(watch);
      const callback = vi.fn();
      whenReady(probe.watch, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(probe.runs).toBe(1);

      watch().value = false;
      watch().value = true;
      expect(probe.runs).toBe(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('leaves no subscription after opening on a later write', () => {
      const watch = createStore(0);
      const probe = probed(watch);
      const callback = vi.fn();
      whenReady(probe.watch, callback);

      watch().value = 1;
      expect(callback).toHaveBeenCalledTimes(1);
      expect(probe.runs).toBe(2);

      watch().value = 2;
      watch().value = 3;
      expect(probe.runs).toBe(2);
    });

    it('keeps separate gates on one store apart', () => {
      const watch = createStore(false);
      const first = vi.fn();
      const second = vi.fn();
      whenReady(watch, first);
      whenReady(watch, second);
      watch().value = true;
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('waits for a named store to be provided, then for it to be ready', () => {
      const callback = vi.fn();
      whenReady('subs.ready', callback);
      expect(pendingShared()).toEqual(['subs.ready']);

      const ref = provideShared('subs.ready', createStore(false), {
        ready: store => store.value,
      })();
      expect(pendingShared()).toEqual([]);
      expect(callback).not.toHaveBeenCalled();
      ref.value = true;
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].value).toBe(true);

      ref.value = false;
      ref.value = true;
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('opens at once for a named store that is provided and ready', () => {
      provideShared('subs.ready', createStore(true), {
        ready: store => store.value,
      });
      const callback = vi.fn();
      whenReady('subs.ready', callback);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('treats a named store with no ready condition as ready once provided', () => {
      const callback = vi.fn();
      whenReady('n', callback);
      provideShared('n', createStore(0));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // T-SH-07
    it('is cancelled by its signal while waiting for the provider', () => {
      const controller = new AbortController();
      const callback = vi.fn();
      whenReady('n', callback, { signal: controller.signal });
      controller.abort();
      expect(pendingShared()).toEqual([]);

      provideShared('n', createStore(true));
      expect(callback).not.toHaveBeenCalled();
    });

    it('is cancelled by its signal while subscribed, and unsubscribes', () => {
      const watch = createStore(0);
      const probe = probed(watch);
      const controller = new AbortController();
      const callback = vi.fn();
      whenReady(probe.watch, callback, { signal: controller.signal });
      expect(probe.runs).toBe(1);

      controller.abort();
      watch().value = 1;
      expect(probe.runs).toBe(1);
      expect(callback).not.toHaveBeenCalled();
    });

    it('does nothing with a signal that is already aborted', () => {
      const probe = probed(createStore(true));
      const callback = vi.fn();
      whenReady(probe.watch, callback, { signal: AbortSignal.abort() });
      whenReady('n', callback, { signal: AbortSignal.abort() });
      expect(callback).not.toHaveBeenCalled();
      expect(probe.runs).toBe(0);
      expect(pendingShared()).toEqual([]);
    });

    it('ignores its signal once it has run', () => {
      const controller = new AbortController();
      const callback = vi.fn();
      whenReady(createStore(true), callback, { signal: controller.signal });
      expect(() => controller.abort()).not.toThrow();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('still ends its subscription when the callback throws', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const watch = createStore(0);
      const probe = probed(watch);
      whenReady(probe.watch, () => {
        throw new Error('boom');
      });
      expect(() => {
        watch().value = 1;
      }).not.toThrow();
      expect(error).toHaveBeenCalledTimes(1);
      expect(probe.runs).toBe(2);

      watch().value = 2;
      expect(probe.runs).toBe(2);
    });
  });
}
