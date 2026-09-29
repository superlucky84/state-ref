/**
 * The Svelte 5 runes API (`@stateref/connect-svelte/runes`, DC-CN-05).
 *
 * It lives in its own entry because `svelte/reactivity` does not exist in
 * Svelte 4, which the store API still supports. These tests skip themselves
 * on Svelte 4 so the connector matrix can run the same folder on both.
 *
 * Rule (DC-CN-04): a write that passes through the connector - assigning
 * `.value` - reaches the store synchronously; a nested mutation of the value
 * does not pass through it and is refused.
 */
import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { tick } from 'svelte';
import { VERSION } from 'svelte/compiler';
import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

type Account = { address: { city: string; zip: string }; other: number };
const major = Number(VERSION.split('.')[0]);

const countingWatch = <T>(source: Watch<T>, onRenew: () => void): Watch<T> =>
  ((renew?: any, opt?: any) => {
    if (!renew) return (source as any)(undefined, opt);
    return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) onRenew();
      return renew(store, isFirst);
    }, opt);
  }) as Watch<T>;

async function mount() {
  const { connectSvelteRunes } = await import('@/runes');
  const { default: RunesPanel } = await import(
    '@/tests/svelte/RunesPanel.svelte'
  );
  const writes: Array<{ before: unknown; after: unknown }> = [];
  const { watch } = create<Account>(
    { address: { city: 'Seoul', zip: '1' }, other: 0 },
    {
      onWrite: write =>
        writes.push({ before: write.before, after: write.after }),
    }
  );
  let renews = 0;
  const use = connectSvelteRunes(countingWatch(watch, () => (renews += 1)));
  const screen = render(RunesPanel as any, { props: { use } });
  return {
    reader: watch(),
    writes,
    screen,
    renews: () => renews,
    panel: screen.component as unknown as {
      writeCity: (value: string) => void;
      writeNested: (value: string) => void;
      replaceAddress: (value: string) => void;
    },
  };
}

describe.skipIf(major < 5)('Svelte 5 runes API', () => {
  afterEach(() => cleanup());

  it('shows a store write', async () => {
    const { reader, screen } = await mount();
    expect(screen.getByTestId('city').textContent).toBe('Seoul');
    reader.address.city.value = 'Jeju';
    await tick();
    expect(screen.getByTestId('city').textContent).toBe('Jeju');
  });

  it('writes .value to the store synchronously', async () => {
    const { reader, panel, screen, writes } = await mount();
    panel.writeCity('Busan');
    expect(reader.address.city.value).toBe('Busan');
    expect(writes).toEqual([{ before: 'Seoul', after: 'Busan' }]);
    await tick();
    expect(screen.getByTestId('city').textContent).toBe('Busan');
  });

  it('replaces a selected object through .value', async () => {
    const { reader, panel } = await mount();
    panel.replaceAddress('Incheon');
    expect(reader.address.value).toEqual({ city: 'Incheon', zip: '1' });
  });

  it('refuses a nested mutation and leaves the store untouched', async () => {
    const { reader, panel, writes } = await mount();
    expect(() => panel.writeNested('Daegu')).toThrow(TypeError);
    expect(reader.address.city.value).toBe('Seoul');
    expect(writes).toEqual([]);
  });

  it('ignores writes to fields the component never read', async () => {
    const { reader, renews } = await mount();
    const before = renews();
    reader.other.value = 1;
    await tick();
    expect(renews() - before).toBe(0);
  });

  it('releases its subscription on unmount', async () => {
    const { reader, screen, renews } = await mount();
    screen.unmount();
    const before = renews();
    reader.address.city.value = 'Daejeon';
    await tick();
    expect(renews() - before).toBe(0);
  });
});
