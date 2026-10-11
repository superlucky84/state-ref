import { afterEach, expect, it, vi } from 'vitest';
import { h, mount, render, nextTick } from 'lithent';
import { createSyncClient, hashQueryKey } from '@stateref/sync';
import type { QueryObserverControls } from '@stateref/sync';
import { createSyncQuery } from '@/sync';

type Account = { name: string; age: number; items: { label: string }[] };
const stops: (() => void)[] = [];
const tick = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};
const draw = (node: Parameters<typeof render>[0]) => {
  const host = document.createElement('div');
  const stop = render(node, host);
  stops.push(stop);
  return { host, stop };
};
afterEach(async () => {
  for (const stop of stops.splice(0)) stop();
  await tick();
});

it('saved array paths and iterators follow the key while an old READ completes', async () => {
  const client = createSyncClient();
  const replies = new Map<number, (value: Account) => void>();
  const options = (id: number) => ({
    queryKey: ['account', id],
    gcTime: Infinity,
    queryFn: () =>
      new Promise<Account>(resolve => {
        replies.set(id, resolve);
      }),
  });
  // Keep the old READ alive so its late result really enters the old cache.
  const previous = client.query(options(1));
  const loading = previous.load();
  let id = 1;
  let bump!: () => boolean;
  let q!: QueryObserverControls<Account>;
  let account!: ReturnType<typeof createSyncQuery<Account>>[0];
  let labels!: () => unknown[];
  let json!: () => unknown;
  const Panel = mount(renew => {
    bump = renew;
    [account, q] = createSyncQuery(client, () => options(id));
    const items = account.data.items;
    const label = items[0].label;
    const iterator = items[Symbol.iterator];
    labels = () =>
      Array.from({ [Symbol.iterator]: iterator }, item => item.label.value);
    json = (account.data as unknown as { toJSON: () => unknown }).toJSON;
    return () => {
      expect(account.data.items).toBe(items);
      expect(account.data.items[0].label).toBe(label);
      return h('p', {}, label.value ?? 'waiting');
    };
  });
  const { host } = draw(h(Panel, {}));
  await tick();
  expect(host.textContent).toBe('waiting');
  expect(labels()).toEqual([]);
  id = 2;
  bump();
  await vi.waitFor(() => expect(replies.has(2)).toBe(true));
  replies.get(2)!({ name: 'two', age: 2, items: [{ label: 'new' }] });
  await vi.waitFor(() => expect(host.textContent).toBe('new'));
  expect(labels()).toEqual(['new']);
  expect(json()).toEqual({ name: 'two', age: 2, items: [{ label: 'new' }] });
  expect([...account.data.items][0]).toBe(account.data.items[0]);

  replies.get(1)!({ name: 'one', age: 1, items: [{ label: 'old' }] });
  await loading;
  await tick();
  expect(previous.ref.items[0].label.value).toBe('old');
  expect(host.textContent).toBe('new');
  expect(account.queryKey.value).toEqual(['account', 2]);
  q.handle()!.ref.items[0].label.value = 'edited';
  await vi.waitFor(() => expect(host.textContent).toBe('edited'));
  previous.dispose();
});

it('tracks saved leaf reads without subscribing to unused fields', async () => {
  const client = createSyncClient();
  let q!: QueryObserverControls<Account>;
  let renders = 0;
  const Panel = mount(() => {
    const [account, controls] = createSyncQuery<Account>(client, {
      queryKey: ['account'],
      queryFn: () => ({ name: 'one', age: 1, items: [] }),
    });
    q = controls;
    const name = account.data.name;
    return () => {
      renders++;
      return h('p', {}, name.value ?? 'waiting');
    };
  });
  const { host } = draw(h(Panel, {}));
  await vi.waitFor(() => expect(host.textContent).toBe('one'));
  await tick();
  const before = renders;
  q.handle()!.ref.age.value = 2;
  await tick();
  expect(renders).toBe(before);
  q.handle()!.ref.name.value = 'two';
  await vi.waitFor(() => expect(host.textContent).toBe('two'));
});

it('preserves readonly snapshots, shape inspection and ref-key rejection', async () => {
  const client = createSyncClient();
  let account!: ReturnType<typeof createSyncQuery<Account>>[0];
  const Panel = mount(() => {
    [account] = createSyncQuery(client, {
      queryKey: ['account'],
      queryFn: () => ({ name: 'one', age: 1, items: [{ label: 'first' }] }),
    });
    return () => h('p', {}, account.data.name.value ?? 'waiting');
  });
  const node = h(Panel, {});
  expect(typeof account).toBe('object');
  expect(() => hashQueryKey(['bad', account])).toThrow('.value');
  expect(() => hashQueryKey(['bad', account.data.name])).toThrow('.value');
  expect(client.size()).toBe(0);
  const { host } = draw(node);
  await vi.waitFor(() => expect(host.textContent).toBe('one'));
  expect(Object.keys(account.data)).toEqual(['name', 'age', 'items']);
  expect('name' in account.data).toBe(true);
  expect('missing' in account.data).toBe(false);
  expect({ ...account.data }.name).toBe(account.data.name);
  expect(Object.getOwnPropertyDescriptor(account.data, 'name')?.value).toBe(
    account.data.name
  );
  expect(JSON.parse(JSON.stringify(account.data))).toEqual(account.data.value);
  expect(account.data.items.length.value).toBe(1);
  expect(() => {
    // @ts-expect-error the display's leaf is readonly
    account.data.name.value = 'changed';
  }).toThrow('readonly');
  expect(() => {
    account.data.value!.items[0].label = 'changed';
  }).toThrow();
  expect(() => Reflect.deleteProperty(account.data, 'name')).toThrow(
    'readonly'
  );
  expect(() => Object.defineProperty(account.data, 'name', {})).toThrow(
    'readonly'
  );
  expect(() => Object.setPrototypeOf(account.data, null)).toThrow('readonly');
  expect(() => Object.freeze(account.data)).toThrow('readonly');
});
