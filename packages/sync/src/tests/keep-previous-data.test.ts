import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSyncClient, keepPreviousData } from '../index';
import type {
  ObserveOptions,
  PlaceholderDataFunction,
  QueryObserver,
} from '../index';

type Page = { page: number; items: { name: string }[] };
const page = (n: number): Page => ({ page: n, items: [{ name: `page ${n}` }] });
const stops: AbortController[] = [];
afterEach(() => {
  stops.splice(0).forEach(stop => stop.abort());
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function attach<T, S>(observer: QueryObserver<T, S>) {
  const stop = new AbortController();
  stops.push(stop);
  return observer.watch((ref, first) => {
    void ref.value;
    if (first) return stop.signal;
  });
}

const options = (n: number, read: () => Page | Promise<Page> = () => page(n)) =>
  ({
    queryKey: ['items', n],
    queryFn: read,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0,
    placeholderData: keepPreviousData,
  } satisfies ObserveOptions<Page>);

describe('keepPreviousData', () => {
  it('keeps separate previews for observers sharing the new key and one READ', async () => {
    const client = createSyncClient();
    const left = client.observe(options(1));
    const right = client.observe(options(9));
    const leftRef = attach(left);
    const rightRef = attach(right);
    await Promise.all([
      left.controls.handle()!.load(),
      right.controls.handle()!.load(),
    ]);
    const pending = deferred<Page>();
    const read = vi.fn(() => pending.promise);
    const next = options(2, read);
    left.setOptions(next);
    right.setOptions(next);
    expect(leftRef.data.page.value).toBe(1);
    expect(rightRef.data.page.value).toBe(9);
    expect(read).toHaveBeenCalledTimes(1);
    expect(
      client.inspectCache().find(entry => entry.queryKey[1] === 2)?.owners
    ).toBe(2);
    const loaded = left.controls.handle()!.load();
    pending.resolve(page(2));
    await loaded;
    expect(leftRef.data.page.value).toBe(2);
    expect(rightRef.data.page.value).toBe(2);
  });

  it('retains a detached snapshot after the old cache is collected and through subscription remount', async () => {
    const client = createSyncClient();
    const observer = client.observe({ ...options(1), gcTime: 0 });
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    observer.setOptions(options(2, () => new Promise(() => {})));
    await vi.waitFor(() =>
      expect(client.inspectCache().some(entry => entry.queryKey[1] === 1)).toBe(
        false
      )
    );
    expect(ref.data.page.value).toBe(1);
    stops[stops.length - 1].abort();
    const remounted = attach(observer);
    expect(remounted.value).toMatchObject({
      data: page(1),
      isPlaceholder: true,
      queryKey: ['items', 2],
    });
  });

  it('never records a synthetic placeholder as real history', () => {
    const client = createSyncClient();
    const observer = client.observe({
      ...options(1, () => new Promise(() => {})),
      placeholderData: page(99),
    });
    const ref = attach(observer);
    expect(ref.data.page.value).toBe(99);
    const callback = vi.fn<PlaceholderDataFunction<Page>>(
      (previous, context) => {
        expect(previous).toBeUndefined();
        expect(context.previousQueryKey).toBeUndefined();
        return previous;
      }
    );
    observer.setOptions({
      ...options(2, () => new Promise(() => {})),
      placeholderData: callback,
    });
    expect(ref.data.value).toBeUndefined();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('keeps data from the first transition render through attach, then replaces it', async () => {
    const client = createSyncClient();
    const observer = client.observe(options(1));
    expect(observer.watch().data.value).toBeUndefined();
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    const pending = deferred<Page>();
    const next = options(2, () => pending.promise);
    const size = client.size();
    const preview = observer.peek(next);
    expect(preview.value).toMatchObject({
      queryKey: ['items', 2],
      data: page(1),
      status: 'pending',
      loaded: false,
      isPlaceholder: true,
    });
    const root = preview.value;
    expect(observer.peek(next).value).toBe(root);
    expect(client.size()).toBe(size);
    observer.setOptions(next);
    expect(ref.value).toMatchObject({
      data: page(1),
      isPlaceholder: true,
      loaded: false,
      status: 'pending',
    });
    const handle = observer.controls.handle()!;
    expect(handle.queryKey).toEqual(['items', 2]);
    expect(handle.serverValue()).toBeUndefined();
    expect(() => handle.ref.value).toThrow();
    pending.resolve(page(2));
    await handle.load();
    expect(ref.value).toMatchObject({
      data: page(2),
      isPlaceholder: false,
      loaded: true,
      status: 'success',
    });
  });

  it('keeps the default and literal placeholder behavior unchanged', async () => {
    const client = createSyncClient();
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    observer.setOptions({
      ...options(2, () => new Promise(() => {})),
      placeholderData: undefined,
    });
    expect(ref.data.value).toBeUndefined();
    observer.setOptions({ ...options(2), placeholderData: page(99) });
    expect(ref.value).toMatchObject({ data: page(99), isPlaceholder: true });
  });

  it('passes the raw readonly snapshot and keys to the callback before applying the current select', async () => {
    const client = createSyncClient();
    const observer = client.observe({
      ...options(1),
      select: data => data.items[0].name,
    });
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    observer.controls.handle()!.ref.items[0].name.value = 'edited';
    let oldData!: Page;
    const callback = vi.fn<PlaceholderDataFunction<Page>>(
      (previous, context) => {
        expect(context).toEqual({
          previousQueryKey: ['items', 1],
          queryKey: ['items', 2],
        });
        expect(previous!.page).toBe(1);
        expect(() => {
          // @ts-expect-error Query keys are readonly at runtime as well.
          context.previousQueryKey![0] = 'changed';
        }).toThrow();
        oldData = previous!;
        return previous;
      }
    );
    observer.setOptions({
      ...options(2, () => new Promise(() => {})),
      select: data => `${data.items[0].name}!`,
      placeholderData: callback,
    });
    expect(ref.data.value).toBe('edited!');
    expect(() => {
      oldData.items[0].name = 'changed';
    }).toThrow();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('prefers cached and initial data without evaluating the callback', async () => {
    const client = createSyncClient();
    await client.prefetch(options(2));
    const callback = vi.fn(keepPreviousData<Page>);
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    const next = { ...options(2), placeholderData: callback };
    expect(observer.peek(next).data.page.value).toBe(2);
    observer.setOptions(next);
    expect(ref.isPlaceholder.value).toBe(false);
    observer.setOptions({
      ...options(3),
      initialData: page(3),
      placeholderData: callback,
    });
    expect(ref.data.page.value).toBe(3);
    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps the last real snapshot through rapid switches and ignores late old-key changes', async () => {
    const client = createSyncClient();
    const resident = client.query({
      ...options(1),
      placeholderData: undefined,
    });
    await resident.load();
    const observer = client.observe(options(1));
    const ref = attach(observer);
    const second = deferred<Page>();
    observer.setOptions(options(2, () => second.promise));
    resident.acceptServer(page(100));
    observer.setOptions(options(3, () => new Promise(() => {})));
    expect(ref.data.page.value).toBe(1);
    second.resolve(page(2));
    await Promise.resolve();
    await Promise.resolve();
    expect(ref.value).toMatchObject({
      queryKey: ['items', 3],
      data: page(1),
      isPlaceholder: true,
    });
    resident.dispose();
  });

  it('never records a cached speculative render as previous data', async () => {
    const client = createSyncClient();
    await client.prefetch(options(2));
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    expect(observer.peek(options(2)).data.page.value).toBe(2);
    const next = options(3, () => new Promise(() => {}));
    expect(observer.peek(next).data.page.value).toBe(1);
    observer.setOptions(next);
    expect(ref.data.page.value).toBe(1);
  });

  it('isolates callback errors, memoizes failures, and recovers when real data arrives', async () => {
    const client = createSyncClient();
    const pending = deferred<Page>();
    const callback = vi.fn((): Page => {
      throw new Error('preview failed');
    });
    const next = {
      ...options(1, () => pending.promise),
      placeholderData: callback,
    };
    const observer = client.observe(next);
    const preview = observer.watch();
    expect(preview.value).toMatchObject({
      status: 'error',
      errorSource: 'placeholder',
      data: undefined,
    });
    const root = preview.value;
    expect(preview.value).toBe(root);
    expect(callback).toHaveBeenCalledTimes(1);
    const ref = attach(observer);
    expect(ref.errorSource.value).toBe('placeholder');
    expect(observer.controls.handle()!.status.value.status).toBe('pending');
    pending.resolve(page(1));
    await observer.controls.handle()!.load();
    expect(ref.value).toMatchObject({
      status: 'success',
      errorSource: null,
      data: page(1),
    });
  });

  it('drops the placeholder on a first READ failure and can reproject a new callback', async () => {
    const client = createSyncClient();
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    const second = deferred<Page>();
    const next = options(2, () => second.promise);
    observer.setOptions(next);
    observer.setOptions({ ...next, placeholderData: () => page(99) });
    expect(ref.data.page.value).toBe(99);
    const read = observer.controls.handle()!.load();
    second.reject(new Error('read failed'));
    await expect(read).rejects.toThrow('read failed');
    expect(ref.value).toMatchObject({
      status: 'error',
      errorSource: 'query',
      data: undefined,
      isPlaceholder: false,
    });
    expect(observer.controls.handle()!.serverValue()).toBeUndefined();
  });

  it('does not republish equivalent inline callback failures on each commit', () => {
    const client = createSyncClient();
    const observer = client.observe(options(1, () => new Promise(() => {})));
    const seen: unknown[] = [];
    const stop = new AbortController();
    stops.push(stop);
    observer.watch((ref, first) => {
      seen.push(ref.value);
      if (first) return stop.signal;
    });
    const failing = () => ({
      ...options(1),
      placeholderData: (): Page => {
        throw new Error('same failure');
      },
    });
    observer.setOptions(failing());
    const count = seen.length;
    const failure = observer.watch().error.value;
    for (let n = 0; n < 5; n += 1) observer.setOptions(failing());
    expect(seen).toHaveLength(count);
    expect(observer.watch().error.value).toBe(failure);
    observer.setOptions({ ...options(1), placeholderData: () => page(7) });
    expect(observer.watch().data.page.value).toBe(7);
  });

  it('resets history on disabled and invalid options and does not share it with another observer or SSR', async () => {
    const client = createSyncClient();
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    const second = options(2, () => new Promise(() => {}));
    observer.setOptions({ ...second, enabled: false });
    expect(ref.data.value).toBeUndefined();
    observer.setOptions(second);
    expect(ref.isPlaceholder.value).toBe(false);
    observer.setOptions(options(1));
    observer.setOptions({
      ...second,
      queryKey: ['bad', undefined],
    } as unknown as ObserveOptions<Page>);
    expect(ref.errorSource.value).toBe('source');
    observer.setOptions(second);
    expect(ref.data.value).toBeUndefined();
    expect(client.observe(second).watch().data.value).toBeUndefined();
    const server = createSyncClient({ ssr: true });
    await server.prefetch(options(1));
    const serverObserver = server.observe(options(1));
    expect(serverObserver.watch().data.page.value).toBe(1);
    serverObserver.setOptions(second);
    expect(attach(serverObserver).data.value).toBeUndefined();
    expect(server.inspectCache()).toHaveLength(1);
  });

  it('lets context reject a different list and supports function-valued payloads via a factory', async () => {
    const client = createSyncClient();
    const observer = client.observe(options(1));
    const ref = attach(observer);
    await observer.controls.handle()!.load();
    const callback: PlaceholderDataFunction<Page> = (previous, context) =>
      context.previousQueryKey?.[0] === context.queryKey[0]
        ? previous
        : undefined;
    observer.setOptions({
      ...options(2, () => new Promise(() => {})),
      queryKey: ['different', 2],
      placeholderData: callback,
    });
    expect(ref.data.value).toBeUndefined();
    const fn = () => 'payload';
    const fixed = client.query({
      queryKey: ['function'],
      queryFn: () => fn,
      editable: false,
      placeholderData: fn,
    });
    expect(fixed.display.data.value).toBe(fn);
    const functions = client.observe({
      queryKey: ['function-observer'],
      queryFn: () => fn,
      editable: false,
      placeholderData: () => fn,
    });
    expect(functions.watch().data.value).toBe(fn);
    fixed.dispose();
  });
});
