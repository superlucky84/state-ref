import {
  getShared,
  onShared,
  pendingShared,
  provideShared,
} from 'state-ref/shared';
import { createStore, createStoreManualSync } from 'state-ref';
import type { Watch } from 'state-ref';

const KEY = Symbol.for('state-ref.shared');
const reset = () => {
  delete (globalThis as any)[KEY];
};

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, afterEach, vi } = import.meta
    .vitest;

  describe('shared registry', () => {
    beforeEach(reset);
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // T-SH-01
    it('hands the provided watch back by name, still a working store', () => {
      const watch = createStore({ count: 0 });
      expect(provideShared('counter', watch)).toBe(watch);

      const found = getShared<{ count: number }>('counter')!;
      expect(found).toBe(watch);

      const seen: number[] = [];
      found(ref => {
        seen.push(ref.count.value);
      });
      found().count.value = 2;
      expect(watch().count.value).toBe(2);
      expect(seen).toEqual([0, 2]);
    });

    it('returns nothing for a name nobody provided', () => {
      expect(getShared('missing')).toBeUndefined();
    });

    it('shares any watch, not only an auto-sync store', () => {
      const { watch, updateRef, sync } = createStoreManualSync(0);
      provideShared('tick', watch);

      const seen: number[] = [];
      getShared<number>('tick')!(ref => {
        seen.push(ref.value);
      });
      updateRef.value = 1;
      expect(seen).toEqual([0]);
      sync();
      expect(seen).toEqual([0, 1]);
    });

    // T-SH-02
    it('runs callbacks that came first when the store is provided, in order', () => {
      const order: string[] = [];
      const received: Watch<boolean>[] = [];
      onShared<boolean>('ready', watch => {
        order.push('a');
        received.push(watch);
      });
      onShared<boolean>('ready', () => order.push('b'));
      expect(order).toEqual([]);

      const watch = createStore(false);
      provideShared('ready', watch);
      expect(order).toEqual(['a', 'b']);
      expect(received).toEqual([watch]);

      // Once each: a second provide does not replay them.
      provideShared('ready', watch);
      expect(order).toEqual(['a', 'b']);
    });

    it('runs a callback straight away when the store is already there', () => {
      const watch = provideShared('ready', createStore(true));
      const callback = vi.fn();
      onShared('ready', callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(watch);
    });

    it('lets a waiting callback see a write made right after provide', () => {
      const seen: number[] = [];
      onShared<number>('n', watch => {
        watch(ref => {
          seen.push(ref.value);
        });
      });
      const ref = provideShared('n', createStore(0))();
      ref.value = 1;
      expect(seen).toEqual([0, 1]);
    });

    // T-SH-03
    it('keeps the first registration and warns about a different one', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const first = createStore(1);
      const second = createStore(2);

      provideShared('n', first);
      expect(provideShared('n', second)).toBe(first);
      expect(getShared('n')).toBe(first);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('"n"');
    });

    it('is silent when the same watch is provided again', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const watch = createStore(1);
      provideShared('n', watch);
      expect(provideShared('n', watch)).toBe(watch);
      expect(warn).not.toHaveBeenCalled();
    });

    it('rejects a name that is not a non-empty string, and a non-function', () => {
      const watch = createStore(1);
      expect(() => provideShared('', watch)).toThrow(TypeError);
      expect(() => getShared(1 as any)).toThrow(TypeError);
      expect(() => onShared(undefined as any, () => {})).toThrow(TypeError);
      expect(() => provideShared('n', {} as any)).toThrow(TypeError);
      expect(getShared('n')).toBeUndefined();
    });

    // T-SH-08
    it('lists only the names still waiting for a provider', () => {
      expect(pendingShared()).toEqual([]);
      onShared('a', () => {});
      onShared('b', () => {});
      onShared('b', () => {});
      expect(pendingShared()).toEqual(['a', 'b']);

      provideShared('a', createStore(0));
      expect(pendingShared()).toEqual(['b']);

      onShared('a', () => {});
      expect(pendingShared()).toEqual(['b']);
    });

    // T-SH-07 (waiting half)
    it('drops a waiting callback when its signal aborts', () => {
      const controller = new AbortController();
      const cancelled = vi.fn();
      const kept = vi.fn();
      onShared('n', cancelled, { signal: controller.signal });
      onShared('n', kept);

      controller.abort();
      expect(pendingShared()).toEqual(['n']);
      provideShared('n', createStore(0));
      expect(cancelled).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });

    it('forgets a name whose only waiter was aborted', () => {
      const controller = new AbortController();
      onShared('n', () => {}, { signal: controller.signal });
      expect(pendingShared()).toEqual(['n']);
      controller.abort();
      expect(pendingShared()).toEqual([]);
    });

    it('never queues a callback whose signal is already aborted', () => {
      const callback = vi.fn();
      onShared('n', callback, { signal: AbortSignal.abort() });
      expect(pendingShared()).toEqual([]);
      provideShared('n', createStore(0));
      expect(callback).not.toHaveBeenCalled();
    });

    // T-SH-14
    it('keeps going when a waiting callback throws', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const after = vi.fn();
      onShared('n', () => {
        throw new Error('boom');
      });
      onShared('n', after);

      const watch = createStore(0);
      expect(provideShared('n', watch)).toBe(watch);
      expect(after).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(getShared('n')).toBe(watch);
    });

    it('survives a waiting callback that provides and waits again', () => {
      const order: string[] = [];
      onShared('a', () => {
        order.push('a1');
        // Same name: already there, so this runs now rather than queueing.
        onShared('a', () => order.push('a-nested'));
        provideShared('b', createStore(0));
      });
      onShared('a', () => order.push('a2'));
      onShared('b', () => order.push('b'));

      provideShared('a', createStore(0));
      expect(order).toEqual(['a1', 'a-nested', 'b', 'a2']);
      expect(pendingShared()).toEqual([]);
    });

    // T-SH-11
    it('refuses a registry at a protocol it does not know, and leaves it alone', () => {
      const foreign = { v: 2, stores: new Map(), waiters: new Map() };
      (globalThis as any)[KEY] = foreign;

      expect(() => provideShared('n', createStore(0))).toThrow(/protocol 2/);
      expect(() => getShared('n')).toThrow(/protocol 2/);
      expect((globalThis as any)[KEY]).toBe(foreign);
      expect(foreign.stores.size).toBe(0);
    });

    it('does not show the registry when the global object is enumerated', () => {
      provideShared('n', createStore(0));
      expect(Object.getOwnPropertyDescriptor(globalThis, KEY)!.enumerable).toBe(
        false
      );
    });
  });
}
