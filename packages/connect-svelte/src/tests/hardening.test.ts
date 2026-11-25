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
import ValueBox from '@/tests/svelte/ValueBox.svelte';

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

  it('propagates Date, RegExp, Map, Set, symbol-key, and circular writes without looping (RQ-IMP-08)', () => {
    const setBox = (screen: ReturnType<typeof render>, v: unknown) =>
      (
        screen.component as unknown as { setVal: (next: unknown) => void }
      ).setVal(v);

    // Date
    const dateWrites: number[] = [];
    const dateStore = create<{ val: Date }>(
      { val: new Date(0) },
      { onWrite: w => dateWrites.push((w.after as Date).getTime()) }
    );
    const dateScreen = render(ValueBox, {
      props: { use: connectSvelte(dateStore.watch) },
    });
    expect(dateWrites).toEqual([]);
    setBox(dateScreen, new Date(1_000_000));
    expect(dateStore.watch().val.value.getTime()).toBe(1_000_000);
    expect(dateWrites).toEqual([1_000_000]);

    // Nested Date inside plain object
    const nestedDateStore = create<{ val: { at: Date } }>({
      val: { at: new Date(10) },
    });
    const nestedDateScreen = render(ValueBox, {
      props: { use: connectSvelte(nestedDateStore.watch) },
    });
    setBox(nestedDateScreen, { at: new Date(20) });
    expect(nestedDateStore.watch().val.value.at.getTime()).toBe(20);

    // Map (including object keys)
    const keyObj = { id: 1 };
    const mapStore = create<{ val: Map<unknown, number> }>({
      val: new Map([[keyObj, 1]]),
    });
    const mapScreen = render(ValueBox, {
      props: { use: connectSvelte(mapStore.watch) },
    });
    setBox(mapScreen, new Map([[keyObj, 2]]));
    expect([...mapStore.watch().val.value.values()]).toEqual([2]);

    // Set
    const setStore = create<{ val: Set<number> }>({ val: new Set([1]) });
    const setScreen = render(ValueBox, {
      props: { use: connectSvelte(setStore.watch) },
    });
    setBox(setScreen, new Set([1, 2]));
    expect([...setStore.watch().val.value]).toEqual([1, 2]);

    // RegExp
    const reStore = create<{ val: RegExp }>({ val: /abc/g });
    const reScreen = render(ValueBox, {
      props: { use: connectSvelte(reStore.watch) },
    });
    setBox(reScreen, /xyz/i);
    expect(reStore.watch().val.value.source).toBe('xyz');
    expect(reStore.watch().val.value.flags).toBe('i');

    // Symbol keys
    const sym = Symbol('tag');
    const symStore = create<{ val: Record<symbol, number> }>({
      val: { [sym]: 1 },
    });
    const symScreen = render(ValueBox, {
      props: { use: connectSvelte(symStore.watch) },
    });
    setBox(symScreen, { [sym]: 2 });
    expect(symStore.watch().val.value[sym]).toBe(2);

    // Circular references (no RangeError stack overflow)
    type Node = { name: string; self?: Node };
    const a: Node = { name: 'a' };
    a.self = a;
    const circStore = create<{ val: Node }>({ val: a });
    const circScreen = render(ValueBox, {
      props: { use: connectSvelte(circStore.watch) },
    });
    const b: Node = { name: 'b' };
    b.self = b;
    setBox(circScreen, b);
    expect(circStore.watch().val.value.name).toBe('b');
    expect(circStore.watch().val.value.self).toBe(circStore.watch().val.value);

    // Invalid Date (NaN === NaN via Object.is; no infinite loop, can replace with valid Date)
    const invalidDateWrites: number[] = [];
    const invalidDateStore = create<{ val: Date }>(
      { val: new Date(NaN) },
      { onWrite: w => invalidDateWrites.push((w.after as Date).getTime()) }
    );
    const invalidDateScreen = render(ValueBox, {
      props: { use: connectSvelte(invalidDateStore.watch) },
    });
    expect(invalidDateWrites).toEqual([]);
    setBox(invalidDateScreen, new Date(500));
    expect(invalidDateStore.watch().val.value.getTime()).toBe(500);
    expect(invalidDateWrites).toEqual([500]);
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
