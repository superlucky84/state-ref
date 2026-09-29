/**
 * Phase 7 hardening (docs/connectors/IMPLEMENT.md): a second, independent
 * catch for each connector defect that only one test used to catch.
 */
import { render, cleanup } from '@testing-library/vue';
import { defineComponent, h } from 'vue';
import { create, createStore } from 'state-ref';
import { connectVue } from '@/index';

type Place = {
  address: { city: string; geo: { lat: number } };
  tags: string[];
};
const initial = (): Place => ({
  address: { city: 'Seoul', geo: { lat: 37 } },
  tags: ['a'],
});

function mountWith<T>(setup: () => T) {
  let captured!: T;
  const screen = render(
    defineComponent({
      setup() {
        captured = setup();
        return () => h('div');
      },
    })
  );
  return { value: captured, screen };
}

describe('hardening: writes after teardown', () => {
  afterEach(() => cleanup());

  it('a selection kept past its component writes nowhere', () => {
    const watch = createStore<Place>(initial());
    const store = watch();
    const use = connectVue(watch);
    const { value: city, screen } = mountWith(() => use(s => s.address.city));
    screen.unmount();

    city.value = 'Busan';
    expect(store.address.city.value).toBe('Seoul');
  });
});

describe('hardening: selections are readonly', () => {
  afterEach(() => cleanup());

  it('refuses a deep nested write and records no write', () => {
    const writes: unknown[] = [];
    const { watch } = create<Place>(initial(), {
      onWrite: write => writes.push(write),
    });
    const store = watch();
    const use = connectVue(watch);
    const { value: address } = mountWith(() => use(s => s.address));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (address.value as Place['address']).geo.lat = 0;
    warn.mockRestore();

    expect(store.address.geo.lat.value).toBe(37);
    expect(writes).toEqual([]);
  });

  it('warns in development when a nested write is refused', () => {
    const watch = createStore<Place>(initial());
    const use = connectVue(watch);
    const { value: tags } = mountWith(() => use(s => s.tags));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (tags.value as string[])[0] = 'z';
    const warned = warn.mock.calls.length;
    warn.mockRestore();

    expect(warned).toBeGreaterThan(0);
    expect(watch().tags.value).toEqual(['a']);
  });
});
