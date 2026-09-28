import { afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'state-ref';
import { createSyncClient } from '../index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

afterEach(() => vi.useRealTimers());

describe('query display views', () => {
  it('keeps two placeholders outside one shared query baseline', async () => {
    const client = createSyncClient({ ssr: true });
    const read = deferred<{ city: string; count: number }>();
    const queryFn = vi.fn(() => read.promise);
    const options = { queryKey: ['account'], queryFn };
    const city = client.query({
      ...options,
      select: data => data.city,
      placeholderData: { city: '기다리는 중', count: 0 },
    });
    const count = client.query({
      ...options,
      select: data => data.count,
      placeholderData: { city: '다른 표시', count: -1 },
    });
    expect(city.display.isPlaceholder.value).toBe(true);
    expect(city.display.data.value).toBe('기다리는 중');
    expect(count.display.data.value).toBe(-1);
    expect(city.status.loaded.value).toBe(false);
    expect(() => city.ref).toThrow('not loaded');
    expect(client.dehydrate().queries).toEqual([]);

    const phases: string[] = [];
    city.watchDisplay(ref => {
      phases.push(
        `${ref.isPlaceholder.value ? 'placeholder' : ref.status.value}:${
          ref.fetchStatus.value
        }`
      );
    });
    const first = city.load();
    const second = count.load();
    expect(first).toBe(second);
    expect(phases).toContain('placeholder:fetching');
    read.resolve({ city: '서울', count: 2 });
    await first;
    expect(city.display.status.value).toBe('success');
    expect(city.display.isPlaceholder.value).toBe(false);
    expect(city.display.data.value).toBe('서울');
    expect(count.display.data.value).toBe(2);
    expect(client.dehydrate().queries[0].data).toEqual({
      city: '서울',
      count: 2,
    });
    city.dispose();
    count.dispose();
  });

  it('selects each local edit without notifying an unchanged projection', async () => {
    const client = createSyncClient({ ssr: true });
    const options = {
      queryKey: ['editable'],
      queryFn: () => ({ city: '서울', count: 1 }),
    };
    const city = client.query({ ...options, select: data => data.city });
    const count = client.query({ ...options, select: data => data.count });
    await city.load();
    const cityValues: string[] = [];
    const counts: number[] = [];
    city.watchDisplay(ref => {
      cityValues.push(ref.data.value!);
    });
    count.watchDisplay(ref => {
      counts.push(ref.data.value!);
    });
    city.ref.city.value = '부산';
    expect(cityValues).toEqual(['서울', '부산']);
    expect(counts).toEqual([1]);
    expect(count.ref.city.value).toBe('부산');
    expect(city.status.dirty.value).toBe(true);
    city.dispose();
    expect(() => city.display.data.value).toThrow('disposed');
    expect(count.display.data.value).toBe(1);
    count.dispose();
  });

  it('memoizes select across status changes and supports a view-local equality rule', async () => {
    const client = createSyncClient({ ssr: true });
    const select = vi.fn((data: { city: string; count: number }) => ({
      city: data.city,
    }));
    const view = client.query({
      queryKey: ['memoized'],
      queryFn: () => ({ city: '서울', count: 1 }),
      initialData: { city: '서울', count: 1 },
      select,
      equals: (next, previous) => next.city === previous.city,
    });
    // Nothing has selected anything yet: the display is built on first
    // access (DC9-03), and creating the handle does not touch it.
    expect(select).not.toHaveBeenCalled();
    const cities: string[] = [];
    view.watchDisplay(ref => {
      cities.push(ref.data.value!.city);
    });
    view.ref.count.value = 2;
    expect(select).toHaveBeenCalledTimes(2);
    expect(cities).toEqual(['서울']);
    view.ref.city.value = '부산';
    expect(select).toHaveBeenCalledTimes(3);
    expect(cities).toEqual(['서울', '부산']);
    expect(() => {
      Reflect.set(view.display.data, 'value', { city: '광주' });
    }).toThrow();
    view.dispose();
  });

  it('keeps selection errors in one view and preserves data on a refetch error', async () => {
    const client = createSyncClient({ ssr: true });
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockResolvedValueOnce({ n: 2 })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ n: 3 });
    const selected = client.query<{ n: number }, number>({
      queryKey: ['projection-error'],
      queryFn,
      select: data => {
        if (data.n === 2) throw new Error('bad projection');
        return data.n;
      },
    });
    const raw = client.query({ queryKey: ['projection-error'], queryFn });
    expect(selected.display.status.value).toBe('pending');
    expect(selected.display.data.value).toBeUndefined();
    await selected.load();
    expect(selected.display.data.value).toBe(1);
    await selected.refetch();
    expect(selected.status.status.value).toBe('success');
    expect(selected.display.status.value).toBe('error');
    expect(selected.display.errorSource.value).toBe('select');
    expect(raw.display.data.value).toEqual({ n: 2 });
    await expect(raw.refetch()).rejects.toThrow('offline');
    expect(raw.display.status.value).toBe('error');
    expect(raw.display.errorSource.value).toBe('query');
    expect(raw.display.data.value).toEqual({ n: 2 });
    await selected.refetch();
    expect(selected.display.status.value).toBe('success');
    expect(selected.display.data.value).toBe(3);
    selected.dispose();
    raw.dispose();
  });

  it('removes a placeholder after a first READ error and reads hydrated data directly', async () => {
    const client = createSyncClient({ ssr: true });
    const failed = client.query({
      queryKey: ['failed-view'],
      queryFn: () => Promise.reject(new Error('offline')),
      placeholderData: { n: 0 },
    });
    expect(failed.display.isPlaceholder.value).toBe(true);
    await expect(failed.load()).rejects.toThrow('offline');
    expect(failed.display.status.value).toBe('error');
    expect(failed.display.data.value).toBeUndefined();
    expect(failed.display.errorSource.value).toBe('query');
    failed.dispose();

    const restoredClient = createSyncClient({ ssr: true });
    restoredClient.hydrate({
      schemaVersion: 1,
      capturedAt: 10,
      queries: [
        {
          queryKey: ['hydrated-view'],
          data: { n: 4 },
          updatedAt: 10,
          invalidated: false,
          editable: true,
        },
      ],
    });
    const restored = restoredClient.query({
      queryKey: ['hydrated-view'],
      queryFn: () => ({ n: 9 }),
      select: data => data.n,
      placeholderData: { n: 0 },
    });
    expect(restored.display.status.value).toBe('success');
    expect(restored.display.data.value).toBe(4);
    expect(restoredClient.dehydrate().queries[0].data).toEqual({ n: 4 });
    restored.dispose();
  });

  it('contains a comparison error until the selected input changes again', () => {
    const client = createSyncClient({ ssr: true });
    const view = client.query({
      queryKey: ['comparison-error'],
      queryFn: () => ({ n: 1 }),
      initialData: { n: 1 },
      select: data => data.n,
      equals: () => {
        throw new Error('comparison failed');
      },
    });
    expect(view.display.status.value).toBe('success');
    expect(() => {
      view.ref.n.value = 2;
    }).not.toThrow();
    expect(view.display.status.value).toBe('error');
    expect(view.display.errorSource.value).toBe('select');
    view.invalidate();
    expect(view.display.status.value).toBe('error');
    view.ref.n.value = 3;
    expect(view.display.status.value).toBe('success');
    expect(view.display.data.value).toBe(3);
    view.dispose();
  });

  it('releases query ownership and subscriptions when disposed', async () => {
    vi.useFakeTimers();
    const client = createSyncClient();
    const options = {
      queryKey: ['view-gc'],
      queryFn: () => ({ n: 1 }),
      gcTime: 10,
    };
    const first = client.query(options);
    const second = client.query(options);
    await first.load();
    let calls = 0;
    first.watchDisplay(ref => {
      void ref.data.value;
      calls += 1;
    });
    first.dispose();
    second.ref.n.value = 2;
    expect(calls).toBe(1);
    expect(() => first.watchDisplay()).toThrow('disposed');
    second.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(1); // dirty edits remain owned by the cache
    const recovery = client.query(options);
    recovery.ref.n.value = 1;
    recovery.dispose();
    await vi.advanceTimersByTimeAsync(10);
    expect(client.size()).toBe(0);
  });

  it('starts a dependent READ from a parent view without caching its placeholder', async () => {
    const client = createSyncClient({ ssr: true });
    const parent = client.query({
      queryKey: ['person'],
      queryFn: () => ({ id: 7 }),
      select: data => data.id,
      placeholderData: { id: 0 },
    });
    let child: ReturnType<typeof client.query<{ task: string }>> | null = null;
    parent.watchDisplay(ref => {
      if (ref.isPlaceholder.value || ref.data.value === undefined) return;
      const id = ref.data.value;
      child = client.query({
        queryKey: ['tasks', id],
        queryFn: () => ({ task: `task-${id}` }),
      });
    });
    expect(child).toBeNull();
    await parent.load();
    expect(child).not.toBeNull();
    await child!.load();
    expect(child!.display.data.value).toEqual({ task: 'task-7' });
    expect(client.dehydrate().queries).toHaveLength(2);
    child!.dispose();
    parent.dispose();
  });

  it('starts independent view READs in parallel and keeps their cache keys separate', async () => {
    const client = createSyncClient({ ssr: true });
    const firstRead = deferred<{ n: number }>();
    const secondRead = deferred<{ n: number }>();
    const firstFn = vi.fn(() => firstRead.promise);
    const secondFn = vi.fn(() => secondRead.promise);
    const first = client.query({ queryKey: ['parallel', 1], queryFn: firstFn });
    const second = client.query({
      queryKey: ['parallel', 2],
      queryFn: secondFn,
    });
    const a = first.load();
    const b = second.load();
    expect(firstFn).toHaveBeenCalledOnce();
    expect(secondFn).toHaveBeenCalledOnce();
    expect(first.display.fetchStatus.value).toBe('fetching');
    expect(second.display.fetchStatus.value).toBe('fetching');
    secondRead.resolve({ n: 2 });
    await b;
    expect(second.display.data.value).toEqual({ n: 2 });
    expect(first.display.status.value).toBe('pending');
    firstRead.resolve({ n: 1 });
    await a;
    expect(first.display.data.value).toEqual({ n: 1 });
    expect(client.size()).toBe(2);
    first.dispose();
    second.dispose();
  });
});

describe('live query views', () => {
  it('waits for enabled input and starts a dependent READ automatically', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ id: null as number | null, enabled: false });
    const read = deferred<{ task: string }>();
    const queryFn = vi.fn(() => read.promise);
    const live = client.query({
      source: source.watch,
      resolve: input =>
        input.id === null
          ? null
          : {
              queryKey: ['tasks', input.id],
              queryFn,
              enabled: input.enabled,
            },
      placeholderData: { task: '기다리는 중' },
    });
    expect(() => live.status).toThrow('This query has no active key.');
    expect(live.display.enabled.value).toBe(false);
    source.updateRef.id.value = 7;
    expect(live.display.queryKey.value).toEqual(['tasks', 7]);
    expect(live.display.data.value).toBeUndefined();
    expect(queryFn).not.toHaveBeenCalled();
    source.updateRef.enabled.value = true;
    expect(live.display.enabled.value).toBe(true);
    expect(live.display.isPlaceholder.value).toBe(true);
    expect(live.display.data.value).toEqual({ task: '기다리는 중' });
    expect(queryFn).toHaveBeenCalledOnce();
    read.resolve({ task: 'task-7' });
    await live.load();
    expect(live.display.data.value).toEqual({ task: 'task-7' });
    expect(client.dehydrate().queries[0].data).toEqual({ task: 'task-7' });
    live.dispose();
  });

  it('aborts an unowned old key and ignores its late result', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ id: 1 });
    const oldRead = deferred<{ n: number }>();
    const newRead = deferred<{ n: number }>();
    let oldSignal!: AbortSignal;
    const live = client.query({
      source: source.watch,
      resolve: input => ({
        queryKey: ['switch', input.id],
        queryFn: ({ signal }) => {
          if (input.id === 1) {
            oldSignal = signal;
            return oldRead.promise;
          }
          return newRead.promise;
        },
        retry: 0,
      }),
      select: data => data.n,
      placeholderData: { n: -1 },
    });
    const firstStatus = live.status;
    const seen: Array<[number | undefined, number | undefined]> = [];
    live.watchDisplay(ref => {
      seen.push([ref.queryKey.value?.[1] as number, ref.data.value]);
    });
    expect(live.display.data.value).toBe(-1);
    source.updateRef.id.value = 2;
    expect(oldSignal.aborted).toBe(true);
    expect(() => firstStatus.value).toThrow('disposed');
    expect(live.display.queryKey.value).toEqual(['switch', 2]);
    expect(live.display.data.value).toBe(-1);
    oldRead.resolve({ n: 1 });
    await Promise.resolve();
    newRead.resolve({ n: 2 });
    await live.load();
    expect(live.display.data.value).toBe(2);
    expect(seen.every(([key, value]) => key !== 2 || value !== 1)).toBe(true);
    expect(client.dehydrate().queries).toEqual([
      expect.objectContaining({ queryKey: ['switch', 2], data: { n: 2 } }),
    ]);
    live.dispose();
  });

  it('preserves a shared old READ for another owner and stops on disable', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ id: 1, enabled: true });
    const oldRead = deferred<{ n: number }>();
    const nextRead = deferred<{ n: number }>();
    let oldSignal!: AbortSignal;
    const resolve = (input: { id: number; enabled: boolean }) => ({
      queryKey: ['shared-switch', input.id],
      enabled: input.enabled,
      queryFn: ({ signal }: { signal: AbortSignal }) => {
        if (input.id === 1) {
          oldSignal = signal;
          return oldRead.promise;
        }
        return nextRead.promise;
      },
    });
    const live = client.query({ source: source.watch, resolve: resolve });
    const shared = client.query(resolve({ id: 1, enabled: true }));
    source.updateRef.id.value = 2;
    expect(oldSignal.aborted).toBe(false);
    oldRead.resolve({ n: 1 });
    await shared.load();
    expect(shared.display.data.value).toEqual({ n: 1 });
    expect(live.display.queryKey.value).toEqual(['shared-switch', 2]);
    expect(live.display.data.value).toBeUndefined();
    source.updateRef.enabled.value = false;
    expect(() => live.status).toThrow('This query has no active key.');
    expect(live.display.enabled.value).toBe(false);
    expect(live.display.fetchStatus.value).toBe('idle');
    expect(live.display.data.value).toBeUndefined();
    nextRead.resolve({ n: 2 });
    await Promise.resolve();
    expect(live.display.data.value).toBeUndefined();
    shared.dispose();
    live.dispose();
  });

  it('reconnects on same-key input and removes source subscriptions on dispose', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ revision: 1 });
    const queryFn = vi.fn(() => ({ n: 1 }));
    const live = client.query({
      source: source.watch,
      resolve: input => ({
        queryKey: ['same-key'],
        queryFn,
        staleTime: input.revision === 1 ? Infinity : 0,
      }),
    });
    await live.load();
    expect(queryFn).toHaveBeenCalledOnce();
    const previousStatus = live.status;
    source.updateRef.revision.value = 2;
    expect(() => previousStatus.value).toThrow('disposed');
    await live.load();
    expect(queryFn).toHaveBeenCalledTimes(2);
    live.dispose();
    expect(() => live.display.data.value).toThrow('disposed');
    source.updateRef.revision.value = 3;
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('clears a loaded old value immediately and restores only the matching cache key', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ id: 1 });
    const second = deferred<{ n: number }>();
    const live = client.query({
      source: source.watch,
      resolve: input => ({
        queryKey: ['loaded-switch', input.id],
        queryFn: () => (input.id === 1 ? { n: 1 } : second.promise),
        staleTime: Infinity,
      }),
    });
    await live.load();
    expect(live.display.data.value).toEqual({ n: 1 });
    source.updateRef.id.value = 2;
    expect(live.display.queryKey.value).toEqual(['loaded-switch', 2]);
    expect(live.display.data.value).toBeUndefined();
    expect(live.display.status.value).toBe('pending');
    source.updateRef.id.value = 1;
    expect(live.display.data.value).toEqual({ n: 1 });
    second.resolve({ n: 2 });
    await Promise.resolve();
    expect(live.display.data.value).toEqual({ n: 1 });
    live.dispose();
  });

  it('clears the prior view and reports an invalid source key locally', async () => {
    const client = createSyncClient({ ssr: true });
    const source = create({ id: 1 });
    const live = client.query({
      source: source.watch,
      resolve: input => ({
        queryKey: ['valid', input.id === 2 ? undefined : input.id],
        queryFn: () => ({ n: input.id }),
      }),
    });
    await live.load();
    const priorStatus = live.status;
    source.updateRef.id.value = 2;
    expect(() => live.status).toThrow('This query has no active key.');
    expect(() => priorStatus.value).toThrow('disposed');
    expect(live.display.queryKey.value).toBeNull();
    expect(live.display.data.value).toBeUndefined();
    expect(live.display.status.value).toBe('error');
    expect(live.display.errorSource.value).toBe('source');
    expect(live.display.error.value).toBeInstanceOf(TypeError);
    source.updateRef.id.value = 3;
    await live.load();
    expect(live.display.data.value).toEqual({ n: 3 });
    live.dispose();
  });
});
