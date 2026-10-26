import { describe, it, expect, vi } from 'vitest';
import { createStore, createStoreManualSync } from 'state-ref';
import type { Preview } from 'state-ref/devtools';
import { createDevtools } from '../index';
import type { Devtools } from '../index';

const flush = async () => {
  await new Promise<void>(resolve => queueMicrotask(resolve));
  await new Promise<void>(resolve => queueMicrotask(resolve));
};
const writes = (tools: Devtools) =>
  tools
    .getSnapshot()
    .history.flatMap(record =>
      record.kind === 'store-event' && record.event.type === 'write'
        ? [record.event]
        : []
    );
const plain = (preview: Preview): unknown => {
  if (preview.kind === 'scalar') return preview.value;
  if (preview.kind === 'object' || preview.kind === 'array')
    return Object.fromEntries(
      preview.entries.map(entry => [
        entry.key.kind === 'key' ? entry.key.value : 'symbol',
        plain(entry.value),
      ])
    );
  return preview;
};

describe('bounded debugging session', () => {
  it('preserves state and callback traces across seeded writes, manual sync and tool lifecycle changes', async () => {
    const execute = async (attached: boolean) => {
      const watch = createStore(
        { pick: true, a: 0, b: 0 },
        { trackDeps: true }
      );
      const manual = createStoreManualSync({ n: 0 });
      const trace: unknown[] = [];
      watch(ref => {
        trace.push(['auto', ref.pick.value ? ref.a.value : ref.b.value]);
      });
      manual.watch(ref => {
        trace.push(['manual', ref.n.value]);
      });
      const tools = attached ? createDevtools() : undefined;
      tools?.attachStore(watch);
      tools?.attachStore(manual.watch);
      let seed = 1729;
      for (let i = 0; i < 200; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        watch()[i % 2 ? 'a' : 'b'].value = seed % 23;
        if (i % 3 === 0) watch().pick.value = !watch().pick.value;
        manual.updateRef.n.value = seed % 31;
        if (i % 7 === 0) manual.sync();
        if (i % 17 === 0) tools?.pause();
        if (i % 17 === 3) tools?.resume();
        if (i % 19 === 0) tools?.clear();
      }
      manual.sync();
      await flush();
      tools?.dispose();
      return { auto: watch().value, manual: manual.updateRef.value, trace };
    };
    expect(await execute(true)).toEqual(await execute(false));
  });

  it('reads current values immediately without adding application subscriptions', async () => {
    const watch = createStore({ n: 0 });
    let calls = 0;
    watch(ref => {
      void ref.n.value;
      calls++;
    });
    const tools = createDevtools();
    tools.attachStore(watch, { name: 'counter' });
    const id = tools.getSnapshot().sources[0].id;
    expect(tools.inspectStore(id).subscriptionCount).toBe(1);
    expect(calls).toBe(1);
    const before = tools.inspectStore(id);
    watch().n.value = 1;
    expect(plain(tools.inspectStore(id).value)).toEqual({ n: 1 });
    expect(plain(before.value)).toEqual({ n: 0 });
    await flush();
    expect(writes(tools)).toHaveLength(1);
    expect(calls).toBe(2);
    expect(Object.isFrozen(tools.getSnapshot().history[0])).toBe(true);
    tools.dispose();
  });

  it('separates duplicate names and rejects duplicate objects only within a session', async () => {
    const a = createStore(0);
    const b = createStore(0);
    const first = createDevtools();
    const second = createDevtools();
    first.attachStore(a, { name: 'same' });
    first.attachStore(b, { name: 'same' });
    second.attachStore(a);
    expect(first.getSnapshot().sources.map(source => source.id)).toEqual([
      1, 2,
    ]);
    expect(() => first.attachStore(a)).toThrow('already attached');
    a().value = 1;
    b().value = 2;
    await flush();
    expect(writes(first)).toHaveLength(2);
    expect(writes(second)).toHaveLength(1);
    first.dispose();
    a().value = 3;
    await flush();
    expect(writes(second)).toHaveLength(2);
    second.dispose();
  });

  it('coalesces view notifications, isolates errors and supports independent unsubscribe', async () => {
    const watch = createStore(0);
    const tools = createDevtools();
    tools.attachStore(watch);
    await flush();
    const view = vi.fn();
    const stopA = tools.subscribe(view);
    const stopB = tools.subscribe(view);
    const stopError = tools.subscribe(() => {
      throw Error('view');
    });
    watch().value = 1;
    watch().value = 2;
    watch().value = 3;
    await flush();
    expect(view).toHaveBeenCalledTimes(2);
    expect(tools.getSnapshot()).toBe(tools.getSnapshot());
    stopA();
    stopA();
    view.mockClear();
    watch().value = 4;
    await flush();
    expect(view).toHaveBeenCalledTimes(1);
    stopB();
    stopError();
    tools.dispose();
  });

  it('bounds both event count and UTF-8 history bytes', async () => {
    const watch = createStore('');
    const tools = createDevtools({ maxEvents: 3, maxHistoryBytes: 1024 });
    tools.attachStore(watch);
    for (let i = 0; i < 30; i++) watch().value = '한'.repeat(70) + i;
    await flush();
    const snapshot = tools.getSnapshot();
    expect(snapshot.history.length).toBeLessThanOrEqual(3);
    expect(snapshot.historyBytes).toBeLessThanOrEqual(1024);
    expect(snapshot.historyBytes).toBe(
      snapshot.history.reduce(
        (bytes, record) =>
          bytes + new TextEncoder().encode(JSON.stringify(record)).length,
        0
      )
    );
    expect(snapshot.evicted).toBeGreaterThan(0);
    expect(plain(tools.inspectStore(1).value)).toBe('한'.repeat(70) + 29);
    tools.dispose();
  });

  it('reports oversized records while keeping current inspection usable', async () => {
    const watch = createStore('');
    const tools = createDevtools({ maxHistoryBytes: 256 });
    tools.attachStore(watch);
    watch().value = 'x'.repeat(1000);
    await flush();
    expect(tools.getSnapshot().oversized).toBe(1);
    expect(tools.getSnapshot().historyBytes).toBeLessThanOrEqual(256);
    expect(plain(tools.inspectStore(1).value)).toBe('x'.repeat(1000));
    tools.dispose();
  });

  it('recovers a source after producer overflow without pretending history is complete', async () => {
    const watch = createStore(0);
    const tools = createDevtools();
    tools.attachStore(watch);
    const ref = watch();
    for (let i = 1; i <= 10000; i++) ref.value = i;
    await flush();
    const snapshot = tools.getSnapshot();
    expect(snapshot.history).toHaveLength(200);
    expect(snapshot.evicted).toBeGreaterThan(800);
    expect(snapshot.sources[0]).toMatchObject({
      lastGap: 'overflow',
      resnapshots: 1,
    });
    expect(plain(tools.inspectStore(1).value)).toBe(10000);
    tools.dispose();
  });

  it('stops capture during pause, reads current state and resumes with a new generation', async () => {
    const watch = createStore(0);
    const tools = createDevtools();
    tools.attachStore(watch);
    const generation = tools.getSnapshot().sources[0].generation;
    watch().value = 1;
    tools.pause();
    tools.pause();
    watch().value = 2;
    await flush();
    expect(writes(tools)).toEqual([]);
    const paused = tools.inspectStore(1);
    expect(plain(paused.value)).toBe(2);
    expect(paused.generation).toBeNull();
    tools.resume();
    tools.resume();
    watch().value = 3;
    await flush();
    expect(writes(tools)).toHaveLength(1);
    expect(tools.getSnapshot().sources[0].generation).toBe(generation + 1);
    expect(
      tools
        .getSnapshot()
        .history.some(
          record =>
            record.kind === 'gap' &&
            record.reason === 'pause' &&
            record.dropped === null
        )
    ).toBe(true);
    tools.dispose();
  });

  it('attaches while paused and keeps copied redaction rules across resume', async () => {
    const watch = createStore({ token: 'secret-a' });
    const tools = createDevtools();
    tools.pause();
    const redact = [['token']];
    tools.attachStore(watch, { redact });
    redact.length = 0;
    expect(JSON.stringify(tools.inspectStore(1))).not.toContain('secret-a');
    tools.resume();
    watch().token.value = 'secret-b';
    await flush();
    expect(JSON.stringify(tools.getSnapshot())).not.toContain('secret-');
    tools.dispose();
  });

  it('clears received history while preserving pending delivery and source identity', async () => {
    const watch = createStore(0);
    const tools = createDevtools();
    tools.attachStore(watch);
    await flush();
    const source = tools.getSnapshot().sources[0];
    watch().value = 1;
    tools.clear();
    expect(tools.getSnapshot().history).toEqual([]);
    await flush();
    expect(writes(tools)).toHaveLength(1);
    expect(tools.getSnapshot().sources[0]).toEqual(source);
    tools.clear();
    await flush();
    expect(tools.getSnapshot().history).toEqual([]);
    expect(watch().value).toBe(1);
    tools.dispose();
  });

  it('bounds inspected subscription metadata and distinguishes omitted rows', () => {
    const watch = createStore(0);
    let calls = 0;
    for (let i = 0; i < 1200; i++)
      watch(ref => {
        void ref.value;
        calls++;
      });
    const tools = createDevtools();
    tools.attachStore(watch);
    const inspection = tools.inspectStore(1);
    expect(inspection.subscriptionCount).toBe(1200);
    expect(inspection.subscriptions.length).toBeLessThanOrEqual(1000);
    expect(inspection.subscriptionsTruncated).toBe(true);
    expect(
      new TextEncoder().encode(JSON.stringify(inspection.subscriptions)).length
    ).toBeLessThanOrEqual(65536);
    expect(calls).toBe(1200);
    tools.dispose();
  });

  it('records live dependency changes and teardown without an application subscriber', async () => {
    const watch = createStore({ a: 0, b: 0 });
    const tools = createDevtools();
    tools.attachStore(watch);
    const controller = new AbortController();
    const ref = watch(value => {
      void value.a.value;
      return controller.signal;
    });
    await flush();
    void ref.b.value;
    await flush();
    expect(
      tools
        .getSnapshot()
        .history.some(
          record =>
            record.kind === 'store-event' &&
            record.event.type === 'subscription-changed' &&
            record.event.subscription.paths.length === 2
        )
    ).toBe(true);
    controller.abort();
    await flush();
    expect(tools.inspectStore(1).subscriptions).toEqual([]);
    expect(
      tools
        .getSnapshot()
        .history.some(
          record =>
            record.kind === 'store-event' &&
            record.event.type === 'subscription-ended'
        )
    ).toBe(true);
    tools.dispose();
  });

  it('does not loop when capture-error recovery reads another capture-error marker', async () => {
    const watch = createStore<unknown>(null);
    const tools = createDevtools();
    tools.attachStore(watch);
    watch().value = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw Error('capture');
        },
      }
    );
    await flush();
    await flush();
    expect(tools.getSnapshot().sources[0].resnapshots).toBe(1);
    expect(tools.inspectStore(1).value).toEqual({
      kind: 'marker',
      reason: 'capture-error',
    });
    tools.dispose();
  });

  it('releases repeated registrations, cancels pending records and disposes all listeners', async () => {
    const watch = createStore(0);
    const tools = createDevtools();
    for (let i = 0; i < 20; i++) {
      const detach = tools.attachStore(watch);
      watch().value++;
      detach();
      detach();
    }
    await flush();
    expect(tools.getSnapshot().sources).toEqual([]);
    expect(writes(tools)).toEqual([]);
    const listener = vi.fn();
    tools.subscribe(listener);
    tools.dispose();
    tools.dispose();
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(tools.getSnapshot()).toMatchObject({
      disposed: true,
      history: [],
      sources: [],
      historyBytes: 0,
    });
    expect(() => tools.attachStore(watch)).toThrow('disposed');
    expect(() => tools.subscribe(() => {})).toThrow('disposed');
    expect(watch().value).toBe(20);
  });

  it('rejects invalid bounds and leaves no source after a failed registration', () => {
    for (const value of [0, -1, NaN, Infinity, 1.5, null])
      expect(() => createDevtools({ maxEvents: value as number })).toThrow(
        'maxEvents'
      );
    expect(() => createDevtools({ maxHistoryBytes: 255 })).toThrow(
      'maxHistoryBytes'
    );
    const tools = createDevtools({ maxSources: 1 });
    expect(() => tools.attachStore((() => {}) as never)).toThrow('root watch');
    expect(tools.getSnapshot().sources).toEqual([]);
    expect(() => tools.attachStore(createStore(0), { name: '' })).toThrow(
      'name'
    );
    const stop = tools.attachStore(createStore(0));
    expect(() => tools.attachStore(createStore(1))).toThrow('maxSources');
    stop();
    tools.attachStore(createStore(1));
    tools.dispose();
  });
});
