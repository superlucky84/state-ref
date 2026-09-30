/**
 * Phase 7 hardening (docs/connectors/IMPLEMENT.md): a second, independent
 * catch for each connector defect that only one test used to catch.
 */
import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import { tick } from 'svelte';
import { VERSION } from 'svelte/compiler';
import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectSvelte } from '@/index';
import TagPush from '@/tests/svelte/TagPush.svelte';

type Board = { tags: string[] };
const major = Number(VERSION.split('.')[0]);

const countingWatch = <T>(source: Watch<T>, onRenew: () => void): Watch<T> =>
  ((renew?: any, opt?: any) => {
    if (!renew) return (source as any)(undefined, opt);
    return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
      if (!isFirst) onRenew();
      return renew(store, isFirst);
    }, opt);
  }) as Watch<T>;

const recorded = () => {
  const writes: Array<{ before: unknown; after: unknown }> = [];
  const { watch } = create<Board>(
    { tags: ['a'] },
    {
      onWrite: write =>
        writes.push({ before: write.before, after: write.after }),
    }
  );
  return { watch, writes, reader: watch() };
};

describe('hardening: store API delivers copies', () => {
  afterEach(() => cleanup());

  it('turns the push-then-reassign idiom into one store write', () => {
    const { watch, writes, reader } = recorded();
    const internal = reader.tags.value;
    const screen = render(TagPush, { props: { use: connectSvelte(watch) } });
    (screen.component as unknown as { pushTag: (v: string) => void }).pushTag(
      'b'
    );

    expect(internal).toEqual(['a']);
    expect(reader.tags.value).toEqual(['a', 'b']);
    expect(writes).toEqual([{ before: ['a'], after: ['a', 'b'] }]);
  });
});

describe.skipIf(major < 5)('hardening: runes API', () => {
  afterEach(() => cleanup());

  it('refuses an array method on a selected array', async () => {
    const { connectSvelteRunes } = await import('@/runes');
    const { default: RunesTwin } = await import(
      '@/tests/svelte/RunesTwin.svelte'
    );
    const { watch, writes, reader } = recorded();
    const screen = render(RunesTwin as any, {
      props: { use: connectSvelteRunes(watch) },
    });
    const panel = screen.component as unknown as {
      pushTag: (v: string) => void;
    };

    expect(() => panel.pushTag('b')).toThrow(TypeError);
    expect(reader.tags.value).toEqual(['a']);
    expect(writes).toEqual([]);
  });

  it('keeps one subscription through unmount and remount', async () => {
    const { connectSvelteRunes } = await import('@/runes');
    const { default: RunesTwin } = await import(
      '@/tests/svelte/RunesTwin.svelte'
    );
    const { watch, reader } = recorded();
    let renews = 0;
    const use = connectSvelteRunes(countingWatch(watch, () => (renews += 1)));

    render(RunesTwin as any, { props: { use } }).unmount();
    render(RunesTwin as any, { props: { use } }).unmount();
    const screen = render(RunesTwin as any, { props: { use } });
    await tick();

    const before = renews;
    reader.tags.value = ['c'];
    await tick();
    expect(renews - before).toBe(1);
    expect(screen.getByTestId('tags').textContent).toBe('c');
  });
});
