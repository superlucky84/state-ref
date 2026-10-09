import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/vue';
import {
  defineComponent,
  effectScope,
  h,
  isReadonly,
  isRef,
  nextTick,
  ref,
} from 'vue';
import { createSyncClient } from '@stateref/sync';
import type {
  ObserveOptions,
  QueryObserverControls,
  SyncClient,
} from '@stateref/sync';
import { useSyncQuery } from '@/sync';

type Account = { name: string; age: number };
const options = (id: number): ObserveOptions<Account> => ({
  queryKey: ['account', id],
  queryFn: () => ({ name: `name-${id}`, age: id }),
  staleTime: Infinity,
  gcTime: Infinity,
});
const owners = (client: SyncClient, id = 1) =>
  client
    .inspectCache()
    .find(
      entry =>
        JSON.stringify(entry.queryKey) === JSON.stringify(['account', id])
    )?.owners;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}
afterEach(cleanup);

describe('Vue useSyncQuery', () => {
  it('waits for a selection to attach, and several selections share one handle', async () => {
    const client = createSyncClient();
    const read = deferred<Account>();
    const queryFn = vi.fn(() => read.promise);
    let q!: QueryObserverControls<Account>;
    const Panel = defineComponent({
      setup() {
        const [account, controls] = useSyncQuery(client, {
          ...options(1),
          queryFn,
        });
        q = controls;
        expect(client.size()).toBe(0);
        expect(q.handle()).toBeNull();
        const name = account(display => display.data.name.value);
        const status = account(display => display.status.value);
        expect(isRef(name)).toBe(true);
        expect(isReadonly(name)).toBe(true);
        return () => h('p', `${status.value}:${name.value ?? 'waiting'}`);
      },
    });
    const screen = render(Panel);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(1);
    expect(screen.container.textContent).toBe('pending:waiting');
    read.resolve({ name: 'loaded', age: 3 });
    await waitFor(() =>
      expect(screen.container.textContent).toBe('success:loaded')
    );
    screen.unmount();
    expect(q.handle()).toBeNull();
    await waitFor(() => expect(owners(client)).toBe(0));
  });

  it('shares one pending READ between two component observers', async () => {
    const client = createSyncClient();
    const queryFn = vi.fn(() => new Promise<Account>(() => {}));
    const Panel = defineComponent({
      setup() {
        const [account] = useSyncQuery(client, { ...options(1), queryFn });
        const status = account(display => display.fetchStatus.value);
        return () => h('span', status.value);
      },
    });
    const screen = render(
      defineComponent({ setup: () => () => h('div', [h(Panel), h(Panel)]) })
    );
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(owners(client)).toBe(2);
    screen.unmount();
    await waitFor(() => expect(owners(client)).toBe(0));
  });

  it('confirms a props getter before render and tracks a field first read on the new key', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    await client.prefetch(options(2));
    const frames: {
      prop: number;
      key: unknown;
      label: string | number | undefined;
    }[] = [];
    let q!: QueryObserverControls<Account>;
    const Panel = defineComponent({
      props: { id: { type: Number, required: true } },
      setup(props) {
        const [account, controls] = useSyncQuery(client, () =>
          options(props.id)
        );
        q = controls;
        const key = account(display => display.queryKey.value?.[1]);
        const label = account(display =>
          display.queryKey.value?.[1] === 1
            ? display.data.name.value
            : display.data.age.value
        );
        return () => {
          frames.push({ prop: props.id, key: key.value, label: label.value });
          return h('p', String(label.value));
        };
      },
    });
    const screen = render(Panel, { props: { id: 1 } });
    const controls = q;
    const before = frames.length;
    await screen.rerender({ id: 2 });
    expect(frames.slice(before).length).toBeGreaterThan(0);
    expect(
      frames
        .slice(before)
        .every(
          frame => frame.prop === 2 && frame.key === 2 && frame.label === 2
        )
    ).toBe(true);
    expect(q).toBe(controls);
    expect(q.handle()?.queryKey).toEqual(['account', 2]);
    q.handle()!.ref.age.value = 99;
    await nextTick();
    expect(screen.container.textContent).toBe('99');
  });

  it('shows a missing new key without a frame of the previous data', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    const read = deferred<Account>();
    const queryFn = vi.fn(() => read.promise);
    const frames: string[] = [];
    const Panel = defineComponent({
      props: { id: { type: Number, required: true } },
      setup(props) {
        const [account] = useSyncQuery(client, () => ({
          ...options(props.id),
          queryFn,
        }));
        const text = account(
          display =>
            `${display.queryKey.value?.[1]}:${
              display.data.name.value ?? 'waiting'
            }`
        );
        return () => {
          frames.push(text.value);
          return h('p', text.value);
        };
      },
    });
    const screen = render(Panel, { props: { id: 1 } });
    const before = frames.length;
    await screen.rerender({ id: 2 });
    expect(frames.slice(before)).toEqual(['2:waiting']);
    expect(queryFn).toHaveBeenCalledTimes(1);
    read.resolve({ name: 'new', age: 2 });
    await waitFor(() => expect(screen.container.textContent).toBe('2:new'));
  });

  it('ends getter tracking and all selections with an effect scope', async () => {
    const client = createSyncClient();
    const id = ref(1);
    const scope = effectScope();
    let selections = 0;
    const q = scope.run(() => {
      const [account, controls] = useSyncQuery(client, () => options(id.value));
      account(display => {
        selections += 1;
        return display.data.name.value;
      });
      account(display => display.status.value);
      return controls;
    })!;
    await waitFor(() => expect(q.handle()?.status.value.loaded).toBe(true));
    id.value = 2;
    await nextTick();
    expect(q.handle()?.queryKey).toEqual(['account', 2]);
    await waitFor(() => expect(q.handle()?.status.value.loaded).toBe(true));
    scope.stop();
    expect(q.handle()).toBeNull();
    await waitFor(() => expect(owners(client, 2)).toBe(0));
    const before = selections;
    id.value = 3;
    await nextTick();
    expect(selections).toBe(before);
    expect(client.inspectCache().some(entry => entry.queryKey[1] === 3)).toBe(
      false
    );
  });

  it('owns a handle only while the getter enables it', async () => {
    const client = createSyncClient();
    const enabled = ref(false);
    const queryFn = vi.fn(options(1).queryFn);
    const scope = effectScope();
    const q = scope.run(() => {
      const [account, controls] = useSyncQuery(client, () => ({
        ...options(1),
        queryFn,
        enabled: enabled.value,
      }));
      account(display => display.enabled.value);
      return controls;
    })!;
    try {
      expect(client.size()).toBe(0);
      enabled.value = true;
      await nextTick();
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(owners(client)).toBe(1);
      enabled.value = false;
      await nextTick();
      expect(q.handle()).toBeNull();
      await waitFor(() => expect(owners(client)).toBe(0));
    } finally {
      scope.stop();
    }
  });

  it('reprojects getter options without reopening a fresh key', async () => {
    const client = createSyncClient();
    await client.prefetch(options(1));
    const prefix = ref('a:');
    let q!: QueryObserverControls<Account>;
    const Panel = defineComponent({
      setup() {
        const [account, controls] = useSyncQuery(client, () => {
          const current = prefix.value;
          const { queryKey, queryFn, staleTime, gcTime } = options(1);
          return {
            queryKey,
            queryFn,
            staleTime,
            gcTime,
            select: data => current + data.name,
          };
        });
        q = controls;
        const name = account(display => display.data.value);
        return () => h('p', name.value);
      },
    });
    const screen = render(Panel);
    const handle = q.handle();
    expect(screen.container.textContent).toBe('a:name-1');
    prefix.value = 'b:';
    await nextTick();
    expect(screen.container.textContent).toBe('b:name-1');
    expect(q.handle()).toBe(handle);
  });

  it('keeps a ref inside a fixed options object as an invalid key instead of unwrapping it', () => {
    const client = createSyncClient();
    const queryFn = vi.fn(options(1).queryFn);
    const Panel = defineComponent({
      setup() {
        const [account] = useSyncQuery(client, {
          ...options(1),
          queryKey: ['account', ref(1)] as never,
          queryFn,
        });
        const status = account(
          display => `${display.status.value}:${display.errorSource.value}`
        );
        return () => h('p', status.value);
      },
    });
    const screen = render(Panel);
    expect(screen.container.textContent).toBe('error:source');
    expect(queryFn).not.toHaveBeenCalled();
    expect(client.size()).toBe(0);
  });

  it('reports an old shared client explicitly', () => {
    const client = {
      ...createSyncClient(),
      observe: undefined,
    } as unknown as SyncClient;
    expect(() => useSyncQuery(client, options(1))).toThrow(
      'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
    );
  });
});

// R-QH-05, DC-QH-11: Vue unmounts the old route and sets up the new one in
// the same patch, so the default schedule is enough for the new handle to
// attach before the old one lets go.
describe('Vue useSyncQuery route replacement', () => {
  it.each(['another component', 'the same component under a new key'])(
    'keeps the in-flight READ when one patch swaps in %s',
    async swap => {
      const client = createSyncClient();
      const signals: AbortSignal[] = [];
      const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
        signals.push(signal);
        return new Promise<Account>(() => {});
      });
      const trail: number[] = [];
      const stopEvents = client.subscribeCache(event => {
        if (event.type === 'updated') trail.push(event.entry.owners);
      });
      const panel = (label: string) =>
        defineComponent({
          setup() {
            const [account] = useSyncQuery(client, { ...options(1), queryFn });
            const fetching = account(display => display.fetchStatus.value);
            return () => h('p', `${label}:${fetching.value}`);
          },
        });
      const First = panel('first');
      const Second = panel('second');
      const another = swap === 'another component';
      const onFirst = ref(true);
      const Route = defineComponent({
        setup: () => () =>
          another
            ? h(onFirst.value ? First : Second)
            : h(First, { key: onFirst.value ? 'first' : 'second' }),
      });
      try {
        const screen = render(Route);
        expect(queryFn).toHaveBeenCalledTimes(1);
        onFirst.value = false;
        await nextTick();
        // Let the old handle's release run.
        await new Promise<void>(resolve => setTimeout(resolve, 20));
        expect(screen.container.textContent).toBe(
          `${another ? 'second' : 'first'}:fetching`
        );
        expect(queryFn).toHaveBeenCalledTimes(1);
        expect(signals.every(signal => !signal.aborted)).toBe(true);
        expect(owners(client)).toBe(1);
        expect(trail).not.toContain(0);
        // The new route attached its own observer before the old one let go.
        expect(trail).toContain(2);
        screen.unmount();
        await waitFor(() => expect(owners(client)).toBe(0));
        expect(signals[0].aborted).toBe(true);
      } finally {
        stopEvents();
      }
    }
  );
});
