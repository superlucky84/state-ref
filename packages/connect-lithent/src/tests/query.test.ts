import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lithent from 'lithent';
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { QueryObserverControls, SyncClient } from '@stateref/sync';
import { connectLithentView } from '@/index';
import { createSyncQuery } from '@/sync';

type Account = { name: string; age: number };
const { h, mount, render, nextTick } = lithent;
const notify = (lithent as typeof lithent & { notifyStoreWrite?: () => void })
  .notifyStoreWrite;
const stops: (() => void)[] = [];
const draw = (node: Parameters<typeof render>[0]) => {
  const host = document.createElement('div');
  const stop = render(node, host);
  stops.push(stop);
  return { host, stop };
};
const tick = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};
const owners = (client: SyncClient, id = 1) =>
  client.inspectCache().find(entry => entry.queryKey[1] === id)?.owners ?? 0;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => (resolve = accept));
  return { promise, resolve };
}
afterEach(async () => {
  for (const stop of stops.splice(0)) stop();
  await tick();
});

describe('Lithent sync query lifetime (T-QH-50)', () => {
  it('peeks before mount, then loads, edits, refetches and releases', async () => {
    const client = createSyncClient();
    const queryFn = vi.fn(() => ({ name: 'loaded', age: 1 }));
    let q!: QueryObserverControls<Account>;
    let read!: ReturnType<typeof createSyncQuery<Account>>[0];
    const Panel = mount(() => {
      [read, q] = createSyncQuery(client, {
        queryKey: ['account', 1],
        queryFn,
        gcTime: Infinity,
      });
      return () => h('p', {}, read().data.name.value ?? read().status.value);
    });
    const node = h(Panel, {});
    expect(client.size()).toBe(0);
    expect(q.handle()).toBeNull();
    expect(queryFn).not.toHaveBeenCalled();
    expect(read().fetchStatus.value).toBe('idle');
    const { host, stop } = draw(node);
    await vi.waitFor(() => expect(host.textContent).toBe('loaded'));
    expect(owners(client)).toBe(1);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(() => {
      // @ts-expect-error displays are readonly at both type and runtime boundaries
      read().data.name.value = 'forbidden';
    }).toThrow();
    q.handle()!.ref.name.value = 'edited';
    await tick();
    expect(host.textContent).toBe('edited');
    await q.refetch();
    await tick();
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(host.textContent).toBe('edited');
    stop();
    expect(q.handle()).toBeNull();
    await vi.waitFor(() => expect(owners(client)).toBe(0));
  });

  it('shares pending READs and aborts without waiting for another notification', async () => {
    const client = createSyncClient();
    let signal!: AbortSignal;
    const queryFn = vi.fn((context: { signal: AbortSignal }) => {
      signal = context.signal;
      return new Promise<Account>(() => {});
    });
    const Panel = mount(() => {
      const [account] = createSyncQuery(client, {
        queryKey: ['account', 1],
        queryFn,
        gcTime: 0,
      });
      return () => h('p', {}, account().status.value);
    });
    const one = draw(h(Panel, {}));
    const two = draw(h(Panel, {}));
    await tick();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(2);
    one.stop();
    await vi.waitFor(() => expect(owners(client)).toBe(1));
    expect(signal.aborted).toBe(false);
    two.stop();
    await vi.waitFor(() => expect(client.size()).toBe(0));
    expect(signal.aborted).toBe(true);
  });

  it('leaves an explicit handle alive when the component ends', async () => {
    const client = createSyncClient();
    const answer = deferred<Account>();
    let signal!: AbortSignal;
    const options = {
      queryKey: ['account', 1],
      gcTime: Infinity,
      queryFn: ({ signal: next }: { signal: AbortSignal }) => {
        signal = next;
        return answer.promise;
      },
    };
    const explicit = client.query(options);
    const loading = explicit.load();
    const Panel = mount(() => {
      const [account] = createSyncQuery(client, options);
      return () => h('p', {}, account().status.value);
    });
    const { stop } = draw(h(Panel, {}));
    expect(owners(client)).toBe(2);
    stop();
    await vi.waitFor(() => expect(owners(client)).toBe(1));
    expect(signal.aborted).toBe(false);
    answer.resolve({ name: 'kept', age: 1 });
    await loading;
    expect(explicit.ref.name.value).toBe('kept');
    explicit.dispose();
    expect(owners(client)).toBe(0);
  });

  it('aborts a first subscription that throws after attachment', async () => {
    const client = createSyncClient();
    const observer = client.observe({
      queryKey: ['account', 1],
      gcTime: 0,
      queryFn: () => new Promise<Account>(() => {}),
    });
    const Panel = mount(() => {
      const account = connectLithentView(
        (callback?: Parameters<typeof observer.watch>[0]) => {
          const ref = observer.watch(callback);
          if (callback) throw new Error('mount failed');
          return ref;
        }
      );
      return () => h('p', {}, account().status.value);
    });
    expect(() => draw(h(Panel, {}))).toThrow('mount failed');
    expect(observer.controls.handle()).toBeNull();
    await vi.waitFor(() => expect(client.size()).toBe(0));
  });
});

describe('options and keys (T-QH-51/52)', () => {
  it.each([false, true])(
    'shows only the next key and gathers its new paths (cached=%s)',
    async cached => {
      const client = createSyncClient();
      const calls: number[] = [];
      const options = (id: number) => ({
        queryKey: ['account', id],
        staleTime: Infinity,
        gcTime: Infinity,
        queryFn: () => {
          calls.push(id);
          return { name: `name-${id}`, age: id };
        },
      });
      if (cached) await client.prefetch(options(2));
      calls.length = 0;
      let id = 1;
      let bump!: () => boolean;
      let q!: QueryObserverControls<Account>;
      const frames: { id: number; key: unknown; text: unknown }[] = [];
      const Panel = mount<{ id?: number }>((_renew, props) => {
        const [account, controls] = createSyncQuery(client, () =>
          options(props.id ?? 1)
        );
        q = controls;
        return () => {
          const view = account();
          const text =
            props.id === 1 ? view.data.name.value : view.data.age.value;
          frames.push({
            id: props.id ?? 1,
            key: view.queryKey.value?.[1],
            text,
          });
          return h('p', {}, String(text ?? 'waiting'));
        };
      });
      const Root = mount(renew => {
        bump = renew;
        return () => h(Panel, { id });
      });
      const { host, stop } = draw(h(Root, {}));
      await vi.waitFor(() => expect(host.textContent).toBe('name-1'));
      const controls = q;
      id = 2;
      bump();
      await vi.waitFor(() => expect(host.textContent).toBe('2'));
      expect(frames.every(frame => frame.key === frame.id)).toBe(true);
      expect(
        frames
          .filter(frame => frame.id === 2)
          .every(frame => frame.text === 2 || frame.text === undefined)
      ).toBe(true);
      expect(q).toBe(controls);
      expect(calls).toEqual(cached ? [1] : [1, 2]);
      q.handle()!.ref.age.value = 9;
      await vi.waitFor(() => expect(host.textContent).toBe('9'));
      stop();
      await vi.waitFor(() => expect(owners(client, 2)).toBe(0));
    }
  );

  it('confirms options changed before mount without registering a boolean cleanup', async () => {
    const client = createSyncClient();
    let id = 1;
    const calls: number[] = [];
    const Panel = mount(() => {
      const [account] = createSyncQuery(client, () => ({
        queryKey: ['account', id],
        queryFn: () => {
          calls.push(id);
          return { name: String(id), age: id };
        },
      }));
      return () => h('p', {}, account().data.name.value ?? 'waiting');
    });
    const node = h(Panel, {});
    id = 2;
    const { host, stop } = draw(node);
    await vi.waitFor(() => expect(host.textContent).toBe('2'));
    expect(calls).toEqual([2]);
    expect(() => stop()).not.toThrow();
    await vi.waitFor(() => expect(owners(client, 2)).toBe(0));
  });

  it('follows enabled, display projection and source error recovery', async () => {
    const client = createSyncClient();
    let enabled = false;
    let id: number | undefined = 1;
    let suffix = 'a';
    let bump!: () => boolean;
    let q!: QueryObserverControls<Account>;
    const queryFn = vi.fn(() => ({ name: 'loaded', age: 1 }));
    const Panel = mount(renew => {
      bump = renew;
      const [account, controls] = createSyncQuery(client, () => ({
        queryKey: ['account', id],
        enabled,
        queryFn,
        select: value => value.name + suffix,
      }));
      q = controls;
      return () =>
        h(
          'p',
          {},
          `${account().status.value}:${account().errorSource.value}:${
            account().data.value ?? ''
          }`
        );
    });
    const { host } = draw(h(Panel, {}));
    await tick();
    expect(queryFn).not.toHaveBeenCalled();
    expect(client.size()).toBe(0);
    enabled = true;
    bump();
    await vi.waitFor(() =>
      expect(host.textContent).toBe('success:null:loadeda')
    );
    suffix = 'b';
    bump();
    await vi.waitFor(() =>
      expect(host.textContent).toBe('success:null:loadedb')
    );
    id = undefined;
    bump();
    await vi.waitFor(() => expect(host.textContent).toBe('error:source:'));
    expect(q.handle()).toBeNull();
    id = 1;
    bump();
    await vi.waitFor(() =>
      expect(host.textContent).toBe('success:null:loadedb')
    );
    expect(q.handle()).not.toBeNull();
  });

  it('shows automatic load errors and recovers through refetch', async () => {
    const client = createSyncClient();
    let fail = true;
    let q!: QueryObserverControls<Account>;
    const Panel = mount(() => {
      const [account, controls] = createSyncQuery(client, {
        queryKey: ['account', 1],
        retry: 0,
        queryFn: async () => {
          if (fail) throw new Error('offline');
          return { name: 'recovered', age: 1 };
        },
      });
      q = controls;
      return () =>
        h('p', {}, account().data.name.value ?? account().status.value);
    });
    const { host } = draw(h(Panel, {}));
    await vi.waitFor(() => expect(host.textContent).toBe('error'));
    fail = false;
    await q.refetch();
    await vi.waitFor(() => expect(host.textContent).toBe('recovered'));
  });

  it.each([false, true])(
    'shares a READ across same-patch route replacement (keyed=%s)',
    async keyed => {
      const client = createSyncClient();
      let signal!: AbortSignal;
      const queryFn = vi.fn(({ signal: next }: { signal: AbortSignal }) => {
        signal = next;
        return new Promise<Account>(() => {});
      });
      const options = { queryKey: ['account', 1], queryFn, gcTime: Infinity };
      let version = 1;
      let bump!: () => boolean;
      const make = () =>
        mount(() => {
          const [account] = createSyncQuery(client, options);
          return () => h('p', {}, account().status.value);
        });
      const One = make();
      const Two = make();
      const trail: number[] = [];
      const end = client.subscribeCache(event => {
        if (event.type === 'updated') trail.push(event.entry.owners);
      });
      const Root = mount(renew => {
        bump = renew;
        return () =>
          keyed
            ? h('section', {}, [h(One, { key: version })])
            : h(version === 1 ? One : Two, {});
      });
      const { stop } = draw(h(Root, {}));
      await tick();
      version = 2;
      bump();
      await tick();
      await vi.waitFor(() => expect(owners(client)).toBe(1));
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(signal.aborted).toBe(false);
      expect(trail).toContain(2);
      expect(trail).not.toContain(0);
      stop();
      await vi.waitFor(() => expect(owners(client)).toBe(0));
      expect(signal.aborted).toBe(true);
      end();
    }
  );

  it('rejects an old shared client before opening subscriptions', () => {
    const client = {
      ...createSyncClient(),
      observe: undefined,
    } as unknown as SyncClient;
    const Panel = mount(() => {
      createSyncQuery(client, { queryKey: ['x'], queryFn: () => 1 });
      return () => h('p', {}, 'unused');
    });
    expect(() => h(Panel, {})).toThrow('This sync client has no observe()');
    expect(client.size()).toBe(0);
  });

  it.each([false, true])(
    'shares or restarts a committed key round trip across release (released=%s)',
    async released => {
      const client = createSyncClient();
      const releases: (() => void)[] = [];
      const observed: SyncClient = {
        ...client,
        observe: options =>
          client.observe(options, {
            scheduleRelease: release => releases.push(release),
          }),
      };
      let id = 1;
      let bump!: () => boolean;
      let q!: QueryObserverControls<Account>;
      const reads: number[] = [];
      const signals = new Map<number, AbortSignal[]>();
      const Panel = mount(renew => {
        bump = renew;
        const [account, controls] = createSyncQuery(observed, () => {
          const key = id;
          return {
            queryKey: ['account', key],
            gcTime: Infinity,
            queryFn: ({ signal }) => {
              reads.push(key);
              signals.set(key, [...(signals.get(key) ?? []), signal]);
              return new Promise<Account>(() => {});
            },
          };
        });
        q = controls;
        return () => h('p', {}, String(account().queryKey.value?.[1]));
      });
      const { host, stop } = draw(h(Panel, {}));
      const controls = q;
      try {
        await tick();
        id = 2;
        bump();
        await tick();
        expect(host.textContent).toBe('2');
        expect(q.handle()?.queryKey).toEqual(['account', 2]);
        expect(releases).toHaveLength(1);
        if (released) releases.shift()!();
        expect(signals.get(1)![0].aborted).toBe(released);
        id = 1;
        bump();
        await tick();
        expect(host.textContent).toBe('1');
        expect(q).toBe(controls);
        expect(q.handle()?.queryKey).toEqual(['account', 1]);
        expect(reads).toEqual(released ? [1, 2, 1] : [1, 2]);
        for (const release of releases.splice(0)) release();
        expect(owners(client, 1)).toBe(1);
        expect(owners(client, 2)).toBe(0);
        expect(signals.get(1)!.at(-1)!.aborted).toBe(false);
        expect(signals.get(2)![0].aborted).toBe(true);
      } finally {
        stop();
        for (const release of releases.splice(0)) release();
      }
      expect(owners(client, 1)).toBe(0);
    }
  );

  it('invalidates and saves an edit through a borrowed mutation link', async () => {
    const client = createSyncClient();
    let q!: QueryObserverControls<Account>;
    const queryFn = vi.fn(() => ({ name: 'loaded', age: 1 }));
    const Panel = mount(() => {
      const [account, controls] = createSyncQuery(client, {
        queryKey: ['account', 1],
        queryFn,
        staleTime: Infinity,
      });
      q = controls;
      return () => h('p', {}, account().data.name.value ?? 'waiting');
    });
    const { host } = draw(h(Panel, {}));
    await vi.waitFor(() => expect(host.textContent).toBe('loaded'));
    q.invalidate();
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    const handle = q.handle()!;
    handle.ref.name.value = 'edited';
    await tick();
    expect(host.textContent).toBe('edited');
    const mutationFn = vi.fn((input: { id: unknown; name: string }) => ({
      name: input.name.toUpperCase(),
      age: 2,
    }));
    const mutation = client.mutation({ mutationFn });
    const submission = handle.capture();
    await mutation.run(
      { id: handle.queryKey[1], name: submission.value.name },
      {
        links: [
          {
            query: handle,
            submission,
            accept: { kind: 'response', select: response => response },
            onReject: 'keep',
          },
        ],
      }
    );
    await tick();
    expect(mutationFn.mock.calls[0][0]).toEqual({ id: 1, name: 'edited' });
    expect(host.textContent).toBe('EDITED');
    expect(handle.ref.age.value).toBe(2);
    expect(handle.isDirty()).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});

describe('concurrent view consistency (T-QH-54)', () => {
  it('renders only paths read through the accessor', async () => {
    const watch = createStore({ name: 'one', age: 1 });
    let renders = 0;
    const Panel = mount(() => {
      const value = connectLithentView(watch);
      return () => {
        renders++;
        return h('p', {}, value().name.value);
      };
    });
    const { host } = draw(h(Panel, {}));
    await tick();
    const before = renders;
    watch().age.value = 2;
    await tick();
    expect(renders).toBe(before);
    watch().name.value = 'two';
    await tick();
    expect(host.textContent).toBe('two');
  });

  it.skipIf(!notify)(
    'restarts a retryable build when an unread path changed mid-build',
    async () => {
      const watch = createStore({ name: 'one', age: 1 });
      let armed = false;
      let bump!: () => boolean;
      let builds = 0;
      const Child = mount(() => () => {
        if (armed) {
          armed = false;
          watch().age.value = 2;
        }
        return h('i', {}, String(watch().age.value));
      });
      const Parent = mount(renew => {
        bump = renew;
        const value = connectLithentView(watch);
        return () => {
          builds++;
          return h(
            'div',
            {},
            h('b', {}, `${value().name.value}:${watch().age.value}`),
            h(Child, {})
          );
        };
      });
      const { host } = draw(h(Parent, {}));
      await tick();
      expect(host.innerHTML).toBe('<div><b>one:1</b><i>1</i></div>');
      builds = 0;
      armed = true;
      bump();
      await tick();
      expect(host.innerHTML).toBe('<div><b>one:2</b><i>2</i></div>');
      expect(builds).toBe(2);
    }
  );
});
