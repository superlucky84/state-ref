/**
 * A display whose options change after it is made (docs/sync-query-hooks
 * DC-QH-26 item 2, IMPLEMENT 단계 1). The observer of 단계 2 passes its latest
 * options and calls `reproject()` when `select` or `placeholderData` changes.
 * An inline `select` is a new function on every React render, so the
 * reprojection must not publish a result that only looks new.
 */
import { describe, expect, it } from 'vitest';
import { createSyncClient } from '../index';
import { createQueryDisplay, shareStructure } from '../display';
import type { QueryDisplayOptions } from '../display';

type Feed = {
  items: Array<{ id: number; kind: string }>;
  at: string;
  tags: string[];
};

const feed: Feed = {
  items: [
    { id: 1, kind: 'a' },
    { id: 2, kind: 'b' },
    { id: 3, kind: 'a' },
  ],
  at: '2026-10-08T00:00:00.000Z',
  tags: ['x'],
};

async function setup<S>(initial: QueryDisplayOptions<Feed, S>) {
  const client = createSyncClient();
  const query = client.query<Feed>({
    queryKey: ['feed'],
    queryFn: () => feed,
  });
  await query.load();
  let options = initial;
  const display = createQueryDisplay<Feed, S>(query, () => options);
  let notified = 0;
  display.watch((ref, first) => {
    void ref.value;
    if (!first) notified += 1;
  });
  return {
    query,
    display,
    set: (next: QueryDisplayOptions<Feed, S>) => {
      options = next;
      display.reproject();
    },
    notified: () => notified,
  };
}

describe('display reprojection (DC-QH-26)', () => {
  it('applies a select that really changed', async () => {
    const view = await setup<number[]>({
      select: data => data.items.filter(i => i.kind === 'a').map(i => i.id),
    });
    expect(view.display.ref.data.value).toEqual([1, 3]);
    view.set({
      select: data => data.items.filter(i => i.kind === 'b').map(i => i.id),
    });
    expect(view.display.ref.data.value).toEqual([2]);
    expect(view.notified()).toBe(1);
    view.query.dispose();
  });

  it('does not publish an inline select that gives the same result', async () => {
    // Fresh objects each time, as `items.map(i => ({ ... }))` in a render.
    const view = await setup<Array<{ id: number }>>({
      select: data =>
        data.items.filter(i => i.kind === 'a').map(i => ({ id: i.id })),
    });
    const before = view.display.ref.data.value;
    for (let index = 0; index < 3; index += 1) {
      view.set({
        select: data =>
          data.items.filter(i => i.kind === 'a').map(i => ({ id: i.id })),
      });
    }
    expect(view.notified()).toBe(0);
    expect(view.display.ref.data.value).toBe(before);
    // The kept object survives the next ordinary recalculation too.
    view.query.invalidate();
    expect(view.notified()).toBe(1);
    expect(view.display.ref.data.value).toBe(before);
    view.query.dispose();
  });

  it('does not publish a select that keeps failing the same way', async () => {
    const view = await setup<string>({
      select: () => {
        throw new RangeError('bad');
      },
    });
    const error = view.display.ref.error.value;
    expect(view.display.ref.errorSource.value).toBe('select');
    for (let index = 0; index < 3; index += 1) {
      view.set({
        select: () => {
          throw new RangeError('bad');
        },
      });
    }
    expect(view.notified()).toBe(0);
    expect(view.display.ref.error.value).toBe(error);
    view.set({
      select: () => {
        throw new RangeError('worse');
      },
    });
    expect(view.notified()).toBe(1);
    view.query.dispose();
  });

  it('keeps a Date with the same time', async () => {
    const view = await setup<Date>({ select: data => new Date(data.at) });
    const before = view.display.ref.data.value;
    view.set({ select: data => new Date(data.at) });
    expect(view.notified()).toBe(0);
    expect(view.display.ref.data.value).toBe(before);
    view.query.dispose();
  });

  it('publishes values it cannot share, unless equals says otherwise', async () => {
    const view = await setup<Map<string, number>>({
      select: data => new Map([['count', data.items.length]]),
    });
    view.set({ select: data => new Map([['count', data.items.length]]) });
    expect(view.notified()).toBe(1);
    const same = (next: Map<string, number>, previous: Map<string, number>) =>
      next.get('count') === previous.get('count');
    view.set({
      select: data => new Map([['count', data.items.length]]),
      equals: same,
    });
    expect(view.notified()).toBe(1);
    view.query.dispose();
  });

  it('applies a new placeholder before the first load', async () => {
    const client = createSyncClient();
    const query = client.query<Feed>({
      queryKey: ['feed'],
      queryFn: () => new Promise<Feed>(() => {}),
    });
    let options: QueryDisplayOptions<Feed> = {
      placeholderData: { items: [], at: '', tags: ['one'] },
    };
    const display = createQueryDisplay<Feed>(query, () => options);
    expect(display.ref.data.tags.value).toEqual(['one']);
    options = { placeholderData: { items: [], at: '', tags: ['two'] } };
    display.reproject();
    expect(display.ref.data.tags.value).toEqual(['two']);
    expect(display.ref.isPlaceholder.value).toBe(true);
    query.dispose();
  });
});

describe('fixed options', () => {
  it('keeps the select and equals a display was made with', async () => {
    const client = createSyncClient();
    const options: {
      queryKey: string[];
      queryFn: () => { n: number; m: number };
      select: (data: { n: number; m: number }) => number;
      equals?: (a: number, b: number) => boolean;
    } = {
      queryKey: ['numbers'],
      queryFn: () => ({ n: 1, m: 100 }),
      select: data => data.n,
    };
    const query = client.query(options);
    const seen: Array<number | undefined> = [];
    query.watchDisplay(ref => {
      seen.push(ref.data.value);
    });
    await query.load();
    // Changing the object afterwards does not reach a display already made.
    options.select = data => data.m;
    query.ref.n.value = 2;
    options.equals = () => true;
    query.ref.n.value = 3;
    expect(seen).toEqual([undefined, 1, 2, 3]);
    query.dispose();
  });
});

describe('shareStructure', () => {
  it('keeps every deeply equal part and replaces the rest', () => {
    const previous = { a: [1, 2], b: { c: 'x' }, d: new Date(5) };
    const same = shareStructure(previous, {
      a: [1, 2],
      b: { c: 'x' },
      d: new Date(5),
    });
    expect(same).toBe(previous);
    const changed = shareStructure(previous, {
      a: [1, 2],
      b: { c: 'y' },
      d: new Date(5),
    }) as typeof previous;
    expect(changed).not.toBe(previous);
    expect(changed.a).toBe(previous.a);
    expect(changed.d).toBe(previous.d);
    expect(changed.b).toEqual({ c: 'y' });
    expect(shareStructure([1], [1, 2])).toStrictEqual([1, 2]);
    const plain = { a: 1 };
    const widened = shareStructure(plain, { a: 1, b: undefined });
    expect(widened).not.toBe(plain);
    expect(widened).toStrictEqual({ a: 1, b: undefined });
    // A shorter array or a dropped key is a change, not a match.
    const three = [1, 2, 3];
    expect(shareStructure(three, [1, 2])).not.toBe(three);
    expect(shareStructure(three, [1, 2])).toStrictEqual([1, 2]);
    const pair = { a: 1, b: 2 };
    expect(shareStructure(pair, { a: 1 })).not.toBe(pair);
    expect(shareStructure(pair, { a: 1 })).toStrictEqual({ a: 1 });
    // Fresh plain objects inside an array are shared one by one.
    const rows = [{ id: 1 }];
    expect(shareStructure(rows, [{ id: 1 }])).toBe(rows);
  });

  it('takes a cyclic value as it is instead of walking it forever', () => {
    const make = (tag: string) => {
      const node: { tag: string; self?: unknown } = { tag };
      node.self = node;
      return node;
    };
    const previous = make('a');
    const next = make('b');
    expect(() => shareStructure(previous, next)).not.toThrow();
    expect((shareStructure(previous, next) as { tag: string }).tag).toBe('b');
  });
});
