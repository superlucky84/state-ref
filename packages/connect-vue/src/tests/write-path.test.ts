/**
 * F-V4 regression and the DC-CN-04 contract (docs/connectors/DESIGN.md).
 *
 * The connector used to hand Vue a `reactive` wrapped around the store's own
 * object and copy it back with a deep `watch` on the next tick. So a nested
 * write (`addr.value.city = 'x'`) changed the store in place - no subscriber
 * heard it, and the write the store finally saw had `before` already equal to
 * `after`. A plain `.value` write reached the store only on the next tick.
 *
 * The contract now matches the core and the other connectors: a selected
 * value is readonly, writes go through `.value` of the selection (a leaf, or
 * a whole replacement), and they reach the store synchronously.
 */
import { render, cleanup } from '@testing-library/vue';
import { defineComponent, effectScope, h, nextTick } from 'vue';
import { create, createStore } from 'state-ref';
import { connectVue } from '@/index';

type Account = { address: { city: string; zip: string }; tags: string[] };
const initial = (): Account => ({
  address: { city: 'Seoul', zip: '100' },
  tags: ['a'],
});

function mount<T>(setup: () => T): T {
  let captured!: T;
  render(
    defineComponent({
      setup() {
        captured = setup();
        return () => h('div');
      },
    })
  );
  return captured;
}

describe('F-V4 write path', () => {
  afterEach(() => cleanup());

  it('writes a leaf to the store synchronously', () => {
    const watch = createStore<Account>(initial());
    const store = watch();
    const use = connectVue(watch);
    const city = mount(() => use(s => s.address.city));

    city.value = 'Busan';
    expect(store.address.city.value).toBe('Busan');
  });

  it('refuses a nested write and leaves the store untouched', () => {
    const writes: unknown[] = [];
    const { watch } = create<Account>(initial(), {
      onWrite: write => writes.push(write),
    });
    const store = watch();
    const use = connectVue(watch);
    const address = mount(() => use(s => s.address));
    const tags = mount(() => use(s => s.tags));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (address.value as { city: string }).city = 'Daegu';
    (tags.value as string[]).push('b');
    warn.mockRestore();

    expect(store.address.city.value).toBe('Seoul');
    expect(store.tags.value).toEqual(['a']);
    expect(writes).toEqual([]);
  });

  it('replaces a selected object through .value with a correct before', () => {
    const writes: Array<{ before: unknown; after: unknown }> = [];
    const { watch } = create<Account>(initial(), {
      onWrite: write =>
        writes.push({ before: write.before, after: write.after }),
    });
    const store = watch();
    const use = connectVue(watch);
    const address = mount(() => use(s => s.address));

    address.value = { ...address.value, city: 'Incheon' };
    expect(store.address.value).toEqual({ city: 'Incheon', zip: '100' });
    expect(writes).toEqual([
      {
        before: { city: 'Seoul', zip: '100' },
        after: { city: 'Incheon', zip: '100' },
      },
    ]);
  });

  it('shows a store write to the component', async () => {
    const watch = createStore<Account>(initial());
    const store = watch();
    const use = connectVue(watch);
    let city!: { value: string };
    const screen = render(
      defineComponent({
        setup() {
          city = use(s => s.address.city);
          return () => h('span', { 'data-testid': 'city' }, city.value);
        },
      })
    );

    store.address.city.value = 'Jeju';
    expect(city.value).toBe('Jeju');
    await nextTick();
    expect(screen.getByTestId('city').textContent).toBe('Jeju');
  });

  it('releases the subscription when an effectScope stops', () => {
    const watch = createStore<Account>(initial());
    const store = watch();
    let renews = 0;
    const counting = ((renew?: any, opt?: any) => {
      if (!renew) return (watch as any)(undefined, opt);
      return (watch as any)((ref: any, isFirst: boolean) => {
        if (!isFirst) renews += 1;
        return renew(ref, isFirst);
      }, opt);
    }) as typeof watch;
    const use = connectVue(counting);

    const scope = effectScope();
    const city = scope.run(() => use(s => s.address.city))!;
    void city.value;
    store.address.city.value = 'Busan';
    const whileAlive = renews;
    scope.stop();
    store.address.city.value = 'Daejeon';

    expect(whileAlive).toBe(1);
    expect(renews).toBe(1);
  });
});
