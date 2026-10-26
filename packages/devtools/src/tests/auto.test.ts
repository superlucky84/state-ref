// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import * as recorder from '../index';
import type { Devtools } from '../index';
import { devtools, stopDevtools } from '../auto.development';
import {
  devtools as production,
  stopDevtools as stopProduction,
} from '../auto';
import type { DevtoolsHotContext } from '../auto-types';

const panel = vi.hoisted(() => ({ mount: vi.fn(), stop: vi.fn() }));
vi.mock('../panel', () => ({ mountPanel: panel.mount }));
const SLOT = Symbol.for('@stateref/devtools/auto/v1');
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const callbacks = () => {
  const tasks: (() => void)[] = [];
  const hot: DevtoolsHotContext = {
    dispose: task => {
      tasks.push(task);
    },
  };
  return { hot, tasks, dispose: () => tasks.forEach(task => task()) };
};
let sessions: Devtools[];
beforeEach(() => {
  stopDevtools();
  sessions = [];
  panel.mount.mockReset().mockImplementation(() => panel.stop);
  panel.stop.mockReset();
  const actual = recorder.createDevtools;
  vi.spyOn(recorder, 'createDevtools').mockImplementation(options => {
    const tools = actual(options);
    sessions.push(tools);
    return tools;
  });
});
afterEach(async () => {
  stopDevtools();
  await flush();
  vi.restoreAllMocks();
});

describe('automatic browser registration', () => {
  it('preserves watch and client identity, deduplicates targets and mounts once', async () => {
    const watch = createStore({ count: 0 });
    const client = createSyncClient();
    expect(devtools(watch, { name: 'counter' })).toBe(watch);
    expect(devtools(client, { name: 'API' })).toBe(client);
    devtools(watch, { name: 'counter' });
    devtools(client);
    await flush();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].getSnapshot().sources).toHaveLength(2);
    expect(panel.mount).toHaveBeenCalledTimes(1);
    expect(client.size()).toBe(0);
    watch().count.value = 1;
    await flush();
    expect(
      sessions[0]
        .getSnapshot()
        .history.filter(
          record =>
            record.kind === 'store-event' && record.event.type === 'write'
        )
    ).toHaveLength(1);
  });

  it('keeps same-name stores and same-key clients separate without new owners or reads', async () => {
    const read = vi.fn(() => ({ count: 0 }));
    const a = createSyncClient();
    const b = createSyncClient();
    const query = {
      queryKey: ['shared'],
      queryFn: read,
      initialData: { count: 0 },
      staleTime: Infinity,
    };
    const first = a.query(query);
    const second = b.query(query);
    devtools(a, { name: 'API' });
    devtools(b, { name: 'API' });
    devtools(createStore(0), { name: 'same' });
    devtools(createStore(0), { name: 'same' });
    await flush();
    expect(sessions[0].getSnapshot().sources).toHaveLength(4);
    expect(a.inspectCache()[0].owners).toBe(1);
    expect(b.inspectCache()[0].owners).toBe(1);
    expect(read).not.toHaveBeenCalled();
    first.dispose();
    second.dispose();
  });

  it('does no target inspection or session work when disabled or using the default entry', () => {
    const hostile = new Proxy({} as ReturnType<typeof createSyncClient>, {
      get() {
        throw Error('read');
      },
    });
    const opts = {
      enabled: false,
      get name(): string {
        throw Error('options');
      },
    };
    expect(devtools(hostile, opts)).toBe(hostile);
    expect(production(hostile, { enabled: true })).toBe(hostile);
    stopProduction(hostile);
    expect(sessions).toHaveLength(0);
    expect(Reflect.has(document, SLOT)).toBe(false);
  });

  it('holds a lease per hot context and keeps a shared target until the last owner ends', async () => {
    const watch = createStore(0);
    const a = callbacks();
    const b = callbacks();
    devtools(watch, { hot: a.hot });
    devtools(watch, { hot: a.hot });
    devtools(watch, { hot: b.hot });
    expect(a.tasks).toHaveLength(1);
    await flush();
    a.dispose();
    expect(sessions[0].getSnapshot().sources).toHaveLength(1);
    b.dispose();
    expect(sessions[0].getSnapshot().disposed).toBe(true);
    expect(panel.stop).toHaveBeenCalledTimes(1);
    expect(Reflect.has(document, SLOT)).toBe(false);
  });

  it('preserves persistent registrations when a module lease ends', () => {
    const watch = createStore(0);
    const hot = callbacks();
    devtools(watch);
    devtools(watch, { hot: hot.hot });
    hot.dispose();
    expect(sessions[0].getSnapshot().sources).toHaveLength(1);
    stopDevtools(watch);
    expect(sessions[0].getSnapshot().disposed).toBe(true);
  });

  it('revokes old HMR callbacks so they cannot remove a replacement session', () => {
    const watch = createStore(0);
    const old = callbacks();
    devtools(watch, { hot: old.hot });
    stopDevtools(watch);
    devtools(watch);
    old.dispose();
    expect(sessions[1].getSnapshot().sources).toHaveLength(1);
  });

  it('cancels a panel import still pending when the last source is removed', async () => {
    const watch = createStore(0);
    devtools(watch);
    stopDevtools(watch);
    await flush();
    expect(panel.mount).not.toHaveBeenCalled();
    devtools(watch);
    await flush();
    expect(panel.mount).toHaveBeenCalledTimes(1);
  });

  it('copies masks, inherits omitted settings, and rejects conflicting explicit settings', () => {
    const watch = createStore({ secret: 'PRIVATE', count: 0 });
    const redact = [['secret']];
    devtools(watch, { name: 'counter', redact });
    redact[0][0] = 'count';
    devtools(watch);
    const view = JSON.stringify(sessions[0].inspectStore(1));
    expect(view).not.toContain('PRIVATE');
    expect(() => devtools(watch, { redact: [] })).toThrow(/different options/);
    expect(() => devtools(watch, { name: 'other' })).toThrow(
      /different options/
    );
    expect(sessions[0].getSnapshot().sources).toHaveLength(1);
  });

  it('uses the first panel configuration and rejects changes without replacing sources', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    devtools(createStore(0), { panel: { target, layout: 'inline' } });
    devtools(createSyncClient());
    expect(() =>
      devtools(createStore(1), { panel: { layout: 'floating' } })
    ).toThrow(/panel already configured/);
    await flush();
    expect(panel.mount).toHaveBeenCalledWith(sessions[0], {
      target,
      layout: 'inline',
    });
    expect(sessions[0].getSnapshot().sources).toHaveLength(2);
    target.remove();
  });

  it('cleans failed attachments and failed hot registration without retained targets', () => {
    expect(() =>
      devtools({} as ReturnType<typeof createStore<number>>, {
        redact: [['secret']],
      })
    ).toThrow(/redact applies/);
    expect(Reflect.has(document, SLOT)).toBe(false);
    expect(() =>
      devtools((() => ({ value: 0 })) as ReturnType<typeof createStore<number>>)
    ).toThrow(/root watch/);
    expect(Reflect.has(document, SLOT)).toBe(false);
    const watch = createStore(0);
    expect(() =>
      devtools(watch, {
        hot: {
          dispose() {
            throw Error('hot failed');
          },
        },
      })
    ).toThrow('hot failed');
    expect(Reflect.has(document, SLOT)).toBe(false);
    expect(sessions.every(tools => tools.getSnapshot().disposed)).toBe(true);
  });

  it('bounds the automatic registry and can register again after stopping', () => {
    for (let i = 0; i < 100; i++) devtools(createStore(i));
    expect(() => devtools(createStore(101))).toThrow(/maxSources/);
    expect(sessions[0].getSnapshot().sources).toHaveLength(100);
    stopDevtools();
    devtools(createStore(102));
    expect(sessions[1].getSnapshot().sources).toHaveLength(1);
  });

  it('waits for DOM readiness and removes the readiness listener on stop', async () => {
    const body = document.body;
    body.remove();
    try {
      devtools(createStore(0));
      stopDevtools();
      document.documentElement.append(body);
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await flush();
      expect(panel.mount).not.toHaveBeenCalled();
    } finally {
      if (!document.body) document.documentElement.append(body);
    }
  });

  it('isolates panel failures and keeps recording until explicitly stopped', async () => {
    panel.mount.mockImplementationOnce(() => {
      throw Error('PRIVATE ERROR');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const watch = createStore(0);
    devtools(watch);
    await flush();
    watch().value = 1;
    await flush();
    expect(warn).toHaveBeenCalledWith(
      '@stateref/devtools/auto: panel could not be mounted.'
    );
    expect(sessions[0].getSnapshot().sources).toHaveLength(1);
    devtools(watch);
    await flush();
    expect(panel.mount).toHaveBeenCalledTimes(2);
  });
});
