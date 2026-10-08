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
    const view = await setup<Array<{ id: number }>>({
      select: data => data.items.filter(i => i.kind === 'a'),
    });
    const before = view.display.ref.data.value;
    for (let index = 0; index < 3; index += 1) {
      view.set({ select: data => data.items.filter(i => i.kind === 'a') });
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
    expect(shareStructure([1], [1, 2])).toEqual([1, 2]);
    expect(shareStructure({ a: 1 }, { a: 1, b: undefined })).toEqual({
      a: 1,
      b: undefined,
    });
  });
});
