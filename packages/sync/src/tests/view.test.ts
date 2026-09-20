import { afterEach, describe, expect, it, vi } from 'vitest';
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
    const city = client.view(options, {
      select: data => data.city,
      placeholderData: { city: '기다리는 중', count: 0 },
    });
    const count = client.view(options, {
      select: data => data.count,
      placeholderData: { city: '다른 표시', count: -1 },
    });
    expect(city.ref.phase.value).toBe('placeholder');
    expect(city.ref.data.value).toBe('기다리는 중');
    expect(count.ref.data.value).toBe(-1);
    expect(city.query.status.loaded.value).toBe(false);
    expect(() => city.query.ref).toThrow('not loaded');
    expect(client.dehydrate().queries).toEqual([]);

    const phases: string[] = [];
    city.watch(ref => {
      phases.push(`${ref.phase.value}:${ref.fetchStatus.value}`);
    });
    const first = city.query.load();
    const second = count.query.load();
    expect(first).toBe(second);
    expect(phases).toContain('placeholder:fetching');
    read.resolve({ city: '서울', count: 2 });
    await first;
    expect(city.ref.phase.value).toBe('success');
    expect(city.ref.isPlaceholder.value).toBe(false);
    expect(city.ref.data.value).toBe('서울');
    expect(count.ref.data.value).toBe(2);
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
    const city = client.view(options, { select: data => data.city });
    const count = client.view(options, { select: data => data.count });
    await city.query.load();
    const cityValues: string[] = [];
    const counts: number[] = [];
    city.watch(ref => {
      cityValues.push(ref.data.value!);
    });
    count.watch(ref => {
      counts.push(ref.data.value!);
    });
    city.query.ref.city.value = '부산';
    expect(cityValues).toEqual(['서울', '부산']);
    expect(counts).toEqual([1]);
    expect(count.query.ref.city.value).toBe('부산');
    expect(city.query.status.dirty.value).toBe(true);
    city.dispose();
    expect(() => city.ref.data.value).toThrow('disposed');
    expect(count.ref.data.value).toBe(1);
    count.dispose();
  });

  it('memoizes select across status changes and supports a view-local equality rule', async () => {
    const client = createSyncClient({ ssr: true });
    const select = vi.fn((data: { city: string; count: number }) => ({
      city: data.city,
    }));
    const view = client.view(
      {
        queryKey: ['memoized'],
        queryFn: () => ({ city: '서울', count: 1 }),
        initialData: { city: '서울', count: 1 },
      },
      {
        select,
        equals: (next, previous) => next.city === previous.city,
      }
    );
    expect(select).toHaveBeenCalledOnce();
    const cities: string[] = [];
    view.watch(ref => {
      cities.push(ref.data.value!.city);
    });
    view.query.ref.count.value = 2;
    expect(select).toHaveBeenCalledTimes(2);
    expect(cities).toEqual(['서울']);
    view.query.ref.city.value = '부산';
    expect(select).toHaveBeenCalledTimes(3);
    expect(cities).toEqual(['서울', '부산']);
    expect(() => {
      Reflect.set(view.ref.data, 'value', { city: '광주' });
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
    const selected = client.view<{ n: number }, number>(
      { queryKey: ['projection-error'], queryFn },
      {
        select: data => {
          if (data.n === 2) throw new Error('bad projection');
          return data.n;
        },
      }
    );
    const raw = client.view({ queryKey: ['projection-error'], queryFn });
    expect(selected.ref.phase.value).toBe('pending');
    expect(selected.ref.data.value).toBeUndefined();
    await selected.query.load();
    expect(selected.ref.data.value).toBe(1);
    await selected.query.refetch();
    expect(selected.query.status.status.value).toBe('success');
    expect(selected.ref.phase.value).toBe('error');
    expect(selected.ref.errorSource.value).toBe('select');
    expect(raw.ref.data.value).toEqual({ n: 2 });
    await expect(raw.query.refetch()).rejects.toThrow('offline');
    expect(raw.ref.phase.value).toBe('error');
    expect(raw.ref.errorSource.value).toBe('query');
    expect(raw.ref.data.value).toEqual({ n: 2 });
    await selected.query.refetch();
    expect(selected.ref.phase.value).toBe('success');
    expect(selected.ref.data.value).toBe(3);
    selected.dispose();
    raw.dispose();
  });

  it('removes a placeholder after a first READ error and reads hydrated data directly', async () => {
    const client = createSyncClient({ ssr: true });
    const failed = client.view(
      {
        queryKey: ['failed-view'],
        queryFn: () => Promise.reject(new Error('offline')),
      },
      { placeholderData: { n: 0 } }
    );
    expect(failed.ref.phase.value).toBe('placeholder');
    await expect(failed.query.load()).rejects.toThrow('offline');
    expect(failed.ref.phase.value).toBe('error');
    expect(failed.ref.data.value).toBeUndefined();
    expect(failed.ref.errorSource.value).toBe('query');
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
    const restored = restoredClient.view(
      { queryKey: ['hydrated-view'], queryFn: () => ({ n: 9 }) },
      { select: data => data.n, placeholderData: { n: 0 } }
    );
    expect(restored.ref.phase.value).toBe('success');
    expect(restored.ref.data.value).toBe(4);
    expect(restoredClient.dehydrate().queries[0].data).toEqual({ n: 4 });
    restored.dispose();
  });

  it('contains a comparison error until the selected input changes again', () => {
    const client = createSyncClient({ ssr: true });
    const view = client.view(
      {
        queryKey: ['comparison-error'],
        queryFn: () => ({ n: 1 }),
        initialData: { n: 1 },
      },
      {
        select: data => data.n,
        equals: () => {
          throw new Error('comparison failed');
        },
      }
    );
    expect(() => {
      view.query.ref.n.value = 2;
    }).not.toThrow();
    expect(view.ref.phase.value).toBe('error');
    expect(view.ref.errorSource.value).toBe('select');
    view.query.invalidate();
    expect(view.ref.phase.value).toBe('error');
    view.query.ref.n.value = 3;
    expect(view.ref.phase.value).toBe('success');
    expect(view.ref.data.value).toBe(3);
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
    const first = client.view(options);
    const second = client.view(options);
    await first.query.load();
    let calls = 0;
    first.watch(ref => {
      void ref.data.value;
      calls += 1;
    });
    first.dispose();
    second.query.ref.n.value = 2;
    expect(calls).toBe(1);
    expect(() => first.watch()).toThrow('disposed');
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
    const parent = client.view(
      { queryKey: ['person'], queryFn: () => ({ id: 7 }) },
      { select: data => data.id, placeholderData: { id: 0 } }
    );
    let child: ReturnType<typeof client.view<{ task: string }>> | null = null;
    parent.watch(ref => {
      if (ref.isPlaceholder.value || ref.data.value === undefined) return;
      const id = ref.data.value;
      child = client.view({
        queryKey: ['tasks', id],
        queryFn: () => ({ task: `task-${id}` }),
      });
    });
    expect(child).toBeNull();
    await parent.query.load();
    expect(child).not.toBeNull();
    await child!.query.load();
    expect(child!.ref.data.value).toEqual({ task: 'task-7' });
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
    const first = client.view({ queryKey: ['parallel', 1], queryFn: firstFn });
    const second = client.view({
      queryKey: ['parallel', 2],
      queryFn: secondFn,
    });
    const a = first.query.load();
    const b = second.query.load();
    expect(firstFn).toHaveBeenCalledOnce();
    expect(secondFn).toHaveBeenCalledOnce();
    expect(first.ref.fetchStatus.value).toBe('fetching');
    expect(second.ref.fetchStatus.value).toBe('fetching');
    secondRead.resolve({ n: 2 });
    await b;
    expect(second.ref.data.value).toEqual({ n: 2 });
    expect(first.ref.phase.value).toBe('pending');
    firstRead.resolve({ n: 1 });
    await a;
    expect(first.ref.data.value).toEqual({ n: 1 });
    expect(client.size()).toBe(2);
    first.dispose();
    second.dispose();
  });
});
