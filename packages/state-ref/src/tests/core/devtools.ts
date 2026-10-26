import { create, createStore, createStoreManualSync } from '@/core';
import { createComputed, combineWatch } from '@/helper';
import { sharedWatch } from '@/shared';
import { batch } from '@/batch';
import { observeStore } from '@/devtools';
import type { StoreEvent, Preview } from '@/devtools';

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));
const plain = (value: Preview): unknown => {
  if (value.kind === 'scalar') return value.value;
  if (value.kind === 'object' || value.kind === 'array')
    return Object.fromEntries(
      value.entries.map(entry => [
        entry.key.kind === 'key' ? entry.key.value : 'symbol',
        plain(entry.value),
      ])
    );
  return value;
};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  describe('development store observation', () => {
    it('coalesces dependency collection and error restoration into final snapshots', async () => {
      const watch = createStore(
        { choose: true, a: 1, b: 2 },
        { trackDeps: true }
      );
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      watch(ref => {
        if (ref.choose.value) void ref.a.value;
        else {
          void ref.b.value;
          throw Error('restore');
        }
      });
      await flush();
      expect(
        events.filter(event => event.type === 'subscription-changed')
      ).toHaveLength(1);
      events.length = 0;
      const report = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        watch().choose.value = false;
      } finally {
        report.mockRestore();
      }
      await flush();
      const changed = events.filter(
        event => event.type === 'subscription-changed'
      );
      expect(changed).toHaveLength(1);
      expect(changed[0].subscription.paths.map(path => path[0])).toEqual(
        ['choose', 'b', 'a'].map(value => ({ kind: 'key', value }))
      );
      observation.disconnect();
    });

    it('does not publish a queued dependency update after a subscription ends', async () => {
      const watch = createStore({ a: 0, b: 0 });
      const controller = new AbortController();
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      const ref = watch(value => {
        void value.a.value;
        return controller.signal;
      });
      void ref.b.value;
      controller.abort();
      void ref.b.value;
      await flush();
      expect(events.some(event => event.type === 'subscription-changed')).toBe(
        false
      );
      expect(events.some(event => event.type === 'subscription-ended')).toBe(
        true
      );
      expect(observation.subscriptions()).toEqual([]);
      observation.disconnect();
    });

    it('bounds pending dependency references and reports the missing updates', async () => {
      const watch = createStore(0);
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      for (let i = 0; i < 1500; i++)
        watch(ref => {
          void ref.value;
        });
      await flush();
      expect(events.length).toBeLessThanOrEqual(1001);
      expect(
        events.some(event => event.type === 'gap' && event.dropped >= 500)
      ).toBe(true);
      expect(observation.subscriptions()).toHaveLength(1500);
      observation.disconnect();
    });

    it('attaches after references exist without creating application subscriptions', async () => {
      const watch = createStore({ count: 0 });
      const ref = watch();
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      expect(observation.protocolVersion).toBe(1);
      expect(observation.subscriptions()).toEqual([]);
      const before = observation.snapshot();
      ref.count.value = 1;
      expect(events).toEqual([]);
      await flush();
      expect(events).toMatchObject([
        {
          type: 'write',
          path: [{ kind: 'key', value: 'count' }],
          before: { value: 0 },
          after: { value: 1 },
        },
      ]);
      expect(plain(before)).toEqual({ count: 0 });
      expect(plain(observation.snapshot())).toEqual({ count: 1 });
      expect(Object.isFrozen(before)).toBe(true);
      observation.disconnect();
    });

    it('records only committed writes and preserves onWrite rejection', async () => {
      const store = create(
        { count: 0, child: null as null | { name: string } },
        {
          onWrite: () => {
            throw Error('rejected');
          },
        }
      );
      const events: StoreEvent[] = [];
      const observation = observeStore(store.watch, event =>
        events.push(event)
      );
      store.watch().count.value = 0;
      expect(() => {
        store.watch().count.value = 1;
      }).toThrow('rejected');
      expect(() => {
        // @ts-expect-error Exercise a runtime path missing from the nullable tree.
        store.watch().child!.name.value = 'x';
      }).toThrow();
      expect(() => {
        store.watch(undefined, { editable: false }).count.value = 1;
      }).toThrow();
      await flush();
      expect(events).toEqual([]);
      expect(plain(observation.snapshot())).toEqual({ count: 0, child: null });
      observation.disconnect();
    });

    it('isolates listeners and captures before reentrant subscribers write', async () => {
      const watch = createStore({ count: 0, nested: { count: 0 } });
      const ref = watch();
      watch(value => {
        if (value.count.value === 1) ref.nested.count.value = 2;
      });
      const events: StoreEvent[] = [];
      const a = observeStore(watch, () => {
        throw Error('diagnostic');
      });
      const b = observeStore(watch, event => events.push(event));
      ref.count.value = 1;
      ref.nested.value = { count: 3 };
      ref.nested.count.value = 4;
      await flush();
      const writes = events.filter(event => event.type === 'write');
      expect(writes.map(event => event.id)).toEqual([1, 2, 3, 4]);
      expect(plain(writes[2].after)).toEqual({ count: 3 });
      expect(ref.nested.count.value).toBe(4);
      a.disconnect();
      b.disconnect();
    });

    it('keeps committed state and emits a gap for failed capture', async () => {
      const watch = createStore<{ item: unknown; n: number }>({
        item: null,
        n: 0,
      });
      const events: StoreEvent[] = [];
      let gapReads = 0;
      const observation = observeStore(watch, event => {
        events.push(event);
        if (event.type === 'gap' && ++gapReads < 3) observation.snapshot();
      });
      const opaque = new Proxy(
        {},
        {
          getPrototypeOf() {
            throw Error('reflection');
          },
        }
      );
      watch().item.value = opaque;
      watch(ref => {
        if (ref.n.value) throw Error('subscriber');
      });
      const report = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        watch().n.value = 1;
        expect(report).toHaveBeenCalledTimes(1);
      } finally {
        report.mockRestore();
      }
      await flush();
      expect(watch().item.value).toBe(opaque);
      expect(watch().n.value).toBe(1);
      expect(events).toContainEqual(
        expect.objectContaining({ type: 'gap', reason: 'capture-error' })
      );
      expect(events.filter(event => event.type === 'write')).toHaveLength(2);
      await flush();
      expect(gapReads).toBe(1);
      observation.disconnect();
    });

    it('keeps individual batch commits, including partial success before an error', async () => {
      const watch = createStore({ a: 0, b: 0 });
      const calls: number[] = [];
      watch(ref => {
        calls.push(ref.a.value + ref.b.value);
      });
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      expect(() =>
        batch(() => {
          watch().a.value = 1;
          batch(() => {
            watch().b.value = 2;
          });
          watch().a.value = 3;
          throw Error('partial');
        })
      ).toThrow('partial');
      await flush();
      expect(calls).toEqual([0, 5]);
      const writes = events.filter(event => event.type === 'write');
      expect(writes).toHaveLength(3);
      expect(writes[0].batchId).not.toBeNull();
      expect(new Set(writes.map(event => event.batchId)).size).toBe(1);
      expect(
        events.filter(event => event.type === 'subscription-run')
      ).toHaveLength(1);
      watch().a.value = 4;
      await flush();
      expect(events.at(-2)).toMatchObject({ type: 'write', batchId: null });
      observation.disconnect();
    });

    it('groups manual writes at sync and keeps incomplete attach causes unknown', async () => {
      const store = createStoreManualSync({ n: 0 });
      let calls = 0;
      store.watch(ref => {
        void ref.n.value;
        calls += 1;
      });
      store.updateRef.n.value = 1;
      const events: StoreEvent[] = [];
      const observation = observeStore(store.watch, event =>
        events.push(event)
      );
      store.sync();
      await flush();
      expect(events[0]).toMatchObject({
        type: 'subscription-run',
        cause: { kind: 'unknown' },
      });
      events.length = 0;
      store.updateRef.n.value = 2;
      store.updateRef.n.value = 3;
      await flush();
      expect(calls).toBe(2);
      expect(events.every(event => event.type === 'write')).toBe(true);
      store.sync();
      await flush();
      expect(calls).toBe(3);
      expect(events.at(-1)).toMatchObject({
        type: 'subscription-run',
        cause: { kind: 'flush-group', writes: [1, 2] },
      });
      store.updateRef.value.n = 4; // Direct raw mutations have no write record.
      store.sync();
      await flush();
      expect(events.at(-1)).toMatchObject({
        type: 'subscription-run',
        cause: { kind: 'unknown' },
      });
      observation.disconnect();
    });

    it('reports actual dependency paths and cannot resurrect an ended subscription', async () => {
      for (const trackDeps of [false, true]) {
        const watch = createStore({ pick: true, a: 1, b: 2 }, { trackDeps });
        const controller = new AbortController();
        const ref = watch(value => {
          if (value.pick.value) void value.a.value;
          else void value.b.value;
          return controller.signal;
        });
        const observation = observeStore(watch, () => {});
        ref.pick.value = false;
        const subscription = observation.subscriptions()[0];
        expect(subscription.observedRuns).toBe(1);
        expect(subscription.paths.map(path => path[0])).toEqual(
          (trackDeps ? ['pick', 'b'] : ['pick', 'a', 'b']).map(value => ({
            kind: 'key',
            value,
          }))
        );
        controller.abort();
        void ref.a.value;
        expect(observation.subscriptions()).toEqual([]);
        observation.disconnect();
      }
      await flush();
    });

    it('redacts before capture, independently for each connection', async () => {
      let reads = 0;
      const watch = createStore({
        token: 'first-secret',
        data: {
          get token() {
            reads++;
            return 'getter-secret';
          },
        },
      });
      const maskedEvents: StoreEvent[] = [];
      const publicEvents: StoreEvent[] = [];
      const masks = [['token'], ['data', 'token']];
      const a = observeStore(watch, event => maskedEvents.push(event), {
        redact: masks,
      });
      masks.length = 0;
      const b = observeStore(watch, event => publicEvents.push(event));
      expect(JSON.stringify(a.snapshot())).not.toContain('secret');
      expect(reads).toBe(0);
      watch().token.value = 'next-secret';
      await flush();
      expect(JSON.stringify(maskedEvents)).not.toContain('secret');
      expect(JSON.stringify(publicEvents)).toContain('next-secret');
      expect(reads).toBe(0);
      a.disconnect();
      b.disconnect();
    });

    it('bounds previews and distinguishes special values without running accessors', () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;
      const first = Symbol('same');
      const second = Symbol('same');
      const watch = createStore({
        [first]: 1,
        [second]: 2,
        circular,
        big: 3n,
        undef: undefined,
        nan: NaN,
        inf: Infinity,
        fn: () => 1,
        enormous: 'x'.repeat(100000),
        get accessor() {
          throw Error('do not invoke');
        },
      });
      const observation = observeStore(watch, () => {});
      const snapshot = observation.snapshot();
      const text = JSON.stringify(snapshot);
      expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(65536);
      for (const marker of [
        'circular',
        'bigint',
        'undefined',
        'nan',
        'infinity',
        'opaque',
        'truncated',
        'accessor',
      ])
        expect(text).toContain(marker);
      if (snapshot.kind === 'object') {
        const symbols = snapshot.entries.filter(
          entry => entry.key.kind === 'symbol'
        );
        expect(symbols[0].key).not.toEqual(symbols[1].key);
        expect(Object.isFrozen(snapshot.entries)).toBe(true);
      } else throw Error('expected object preview');
      observation.disconnect();
    });

    it('counts masked/accessor nodes and bounds escaped UTF-8 strings', () => {
      const wide = Object.fromEntries(
        Array.from({ length: 5000 }, (_, i) => [String(i), 0])
      );
      for (const key of Object.keys(wide))
        Object.defineProperty(wide, key, {
          get() {
            throw Error('not invoked');
          },
        });
      const observation = observeStore(createStore(wide), () => {});
      const snapshot = observation.snapshot();
      if (snapshot.kind !== 'object') throw Error('expected object');
      expect(snapshot.entries.length + 1).toBeLessThanOrEqual(1000);
      expect(snapshot.truncated).toBe(true);
      observation.disconnect();
      for (const value of [
        '한'.repeat(30000),
        '\\'.repeat(40000),
        1.7e308,
        false,
        null,
      ]) {
        const current = observeStore(createStore(value), () => {});
        expect(
          new TextEncoder().encode(JSON.stringify(current.snapshot())).length
        ).toBeLessThanOrEqual(65536);
        current.disconnect();
      }
    });

    it('bounds pending delivery, reports overflow, and lets the consumer resnapshot', async () => {
      const watch = createStore(0);
      const events: StoreEvent[] = [];
      const observation = observeStore(watch, event => events.push(event));
      const ref = watch();
      for (let n = 1; n <= 10000; n++) ref.value = n;
      await flush();
      expect(events).toHaveLength(1001); // 1000 retained records + one gap summary.
      expect(events[0]).toMatchObject({
        type: 'gap',
        reason: 'overflow',
        dropped: 9000,
      });
      expect(
        events.every(
          (event, i) => !i || event.sequence > events[i - 1].sequence
        )
      ).toBe(true);
      expect(plain(observation.snapshot())).toBe(10000);
      observation.disconnect();
    });

    it('disconnects idempotently, cancels queued delivery and revokes retained handles', async () => {
      const watch = createStore(0);
      const events: StoreEvent[] = [];
      for (let i = 0; i < 20; i++) {
        const observation = observeStore(watch, event => events.push(event));
        watch().value += 1;
        observation.disconnect();
        observation.disconnect();
        expect(() => observation.snapshot()).toThrow('disconnected');
        expect(() => observation.subscriptions()).toThrow('disconnected');
      }
      await flush();
      expect(events).toEqual([]);
      expect(watch().value).toBe(20);
    });

    it('rejects unsupported watches, protocols and malformed options at attach', () => {
      const watch = createStore(0);
      for (const wrapper of [
        createComputed([watch], ([ref]) => ref.value),
        combineWatch([watch]),
        sharedWatch('unprovided-devtools-test'),
      ])
        expect(() => observeStore(wrapper as never, () => {})).toThrow(
          'root watch'
        );
      const mismatch = Object.assign(() => {}, {
        [Symbol.for('state-ref.diagnostics')]: { version: 2, observe() {} },
      });
      expect(() => observeStore(mismatch as never, () => {})).toThrow(
        'protocol 1'
      );
      expect(() => observeStore(watch, null as never)).toThrow('listener');
      expect(() =>
        observeStore(watch, () => {}, { redact: [123] } as never)
      ).toThrow('redact');
    });
  });
}
