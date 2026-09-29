/**
 * F-S5 regression (docs/connectors/DESIGN.md).
 *
 * `$address.city = 'Daegu'` is Svelte's own store syntax: the compiler turns
 * it into `address.set(...)`, so the write passes through the connector. The
 * connector used to hand Svelte the store's internal object, so the
 * assignment mutated the store in place and the `set` that followed looked
 * like "same value" - no write, no subscriber notified. Measured before the
 * fix: store `Daegu`, notified 0, writes [].
 *
 * The connector now hands out copies, so the syntax becomes a real store write
 * with a correct `before`. The rule behind it (DC-CN-04): a write that passes
 * through the connector reaches the store; a change that does not is refused.
 */
import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { create } from 'state-ref';
import { connectSvelte } from '@/index';
import NestedWrite from '@/tests/svelte/NestedWrite.svelte';

type Account = { address: { city: string; zip: string }; tags: string[] };

const setup = () => {
  const writes: Array<{ before: unknown; after: unknown }> = [];
  const { watch } = create<Account>(
    { address: { city: 'Seoul', zip: '1' }, tags: ['a'] },
    {
      onWrite: write =>
        writes.push({ before: write.before, after: write.after }),
    }
  );
  const reader = watch();
  const internal = reader.address.value;
  let notified = 0;
  const abort = new AbortController();
  watch(state => {
    void state.address.city.value;
    notified += 1;
    return abort.signal;
  });
  notified = 0;
  const screen = render(NestedWrite, { props: { use: connectSvelte(watch) } });
  return {
    reader,
    internal,
    writes,
    screen,
    notified: () => notified,
    component: screen.component as unknown as {
      writeNested: () => void;
      pushTag: () => void;
    },
  };
};

describe('F-S5 nested store syntax', () => {
  afterEach(() => cleanup());

  it('writes nothing on mount', () => {
    const { writes } = setup();
    expect(writes).toEqual([]);
  });

  it('turns $store.field = value into a store write', () => {
    const { reader, internal, writes, component, notified } = setup();

    component.writeNested();

    expect(reader.address.city.value).toBe('Daegu');
    expect(internal.city).toBe('Seoul'); // the old object was never touched
    expect(notified()).toBe(1);
    expect(writes).toEqual([
      {
        before: { city: 'Seoul', zip: '1' },
        after: { city: 'Daegu', zip: '1' },
      },
    ]);
  });

  it('shows the write in the markup', async () => {
    const { screen, component } = setup();
    component.writeNested();
    component.pushTag();
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getByTestId('city').textContent).toBe('Daegu');
    expect(screen.getByTestId('tags').textContent).toBe('a,b');
  });
});
