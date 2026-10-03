import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSyncClient,
  MutationRejectedError,
  ndjsonMessages,
  streamQuery,
  webSocketMessages,
} from '../index';
import type { StreamSink, WebSocketLike } from '../index';

type Doc = { title: string; lines: string[] };
type Chunk = { line: string };

const appendLine = (current: Doc | undefined, chunk: Chunk): Doc => ({
  title: current?.title ?? '',
  lines: [...(current?.lines ?? []), chunk.line],
});

function manualSource<M>() {
  let sink!: StreamSink<M>;
  let released = 0;
  const source = (target: StreamSink<M>) => {
    sink = target;
    return () => {
      released += 1;
    };
  };
  return {
    source,
    get sink() {
      return sink;
    },
    get released() {
      return released;
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => (resolve = accept));
  return { promise, resolve };
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function bodyOf(parts: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      parts.forEach(part => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });
}

describe('streamQuery', () => {
  it('publishes every message as an intermediate server baseline', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-doc'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const seen: string[][] = [];
    query.watch(ref => {
      seen.push([...ref.lines.value]);
    });
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });

    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    expect(seen).toEqual([[], ['a'], ['a', 'b']]);
    expect(query.serverValue()).toEqual({ title: 'T', lines: ['a', 'b'] });
    expect(query.isDirty()).toBe(false);
    expect(stream.status.value).toMatchObject({ state: 'open', received: 2 });

    manual.sink.complete();
    expect(stream.status.value.state).toBe('complete');
    expect(manual.released).toBe(1);
    query.dispose();
  });

  it('can load an empty query from the stream alone', () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-empty'],
      queryFn: () => ({ title: 'never', lines: [] }),
    });
    expect(query.serverValue()).toBeUndefined();
    const manual = manualSource<Chunk>();
    streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });
    manual.sink.next({ line: 'first' });
    expect(query.status.loaded.value).toBe(true);
    expect(query.ref.lines.value).toEqual(['first']);
    query.dispose();
  });

  it('rebases local edits and reports overlapping server changes', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-rebase'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    query.ref.title.value = 'Mine';
    const manual = manualSource<Partial<Doc>>();
    streamQuery(query, {
      source: () => manual.source,
      reduce: (current, patch) => ({ ...current!, ...patch }),
    });

    manual.sink.next({ lines: ['x'] });
    expect(query.ref.value).toEqual({ title: 'Mine', lines: ['x'] });
    expect(query.status.conflicts.value).toBe(0);

    manual.sink.next({ title: 'Theirs' });
    expect(query.ref.title.value).toBe('Mine');
    expect(query.status.conflicts.value).toBe(1);
    query.dispose();
  });

  it('holds messages while a linked WRITE is pending and folds them after', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: ['stream-write'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    query.ref.title.value = 'Saved';
    const write = deferred<Doc>();
    const save = client.mutation({ mutationFn: () => write.promise });
    const submission = query.capture();
    const running = save.run(undefined, {
      links: [
        {
          query,
          submission,
          accept: { kind: 'response', select: (data: Doc) => data },
        },
      ],
    });
    expect(query.status.pending.value).toBe(1);

    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    expect(stream.status.value).toMatchObject({ received: 0, queued: 2 });
    expect(query.serverValue()!.lines).toEqual([]);

    write.resolve({ title: 'Saved', lines: ['server'] });
    expect((await running).kind).toBe('success');
    await tick();
    expect(query.serverValue()).toEqual({
      title: 'Saved',
      lines: ['server', 'a', 'b'],
    });
    expect(query.isDirty()).toBe(false);
    expect(stream.status.value).toMatchObject({ received: 2, queued: 0 });
    query.dispose();
  });

  it('delivers held messages before completing', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: ['stream-complete-held'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    query.ref.title.value = 'x';
    const gate = deferred<void>();
    const save = client.mutation({
      mutationFn: async () => {
        await gate.promise;
        throw new MutationRejectedError('no', null);
      },
    });
    const running = save.run(undefined, {
      links: [{ query, submission: query.capture() }],
    });
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });
    manual.sink.next({ line: 'late' });
    manual.sink.complete();
    manual.sink.next({ line: 'ignored' });
    expect(stream.status.value.state).toBe('open');

    gate.resolve();
    expect((await running).kind).toBe('rejected');
    await tick();
    expect(query.serverValue()!.lines).toEqual(['late']);
    expect(stream.status.value).toMatchObject({
      state: 'complete',
      received: 1,
    });
    query.dispose();
  });

  it('fails the stream when reduce throws and stops listening', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-throw'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const manual = manualSource<Chunk>();
    const errors: unknown[] = [];
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: () => {
        throw new Error('bad chunk');
      },
      onError: error => errors.push(error),
    });
    manual.sink.next({ line: 'a' });
    expect(stream.status.value.state).toBe('error');
    expect((stream.status.value.error as Error).message).toBe('bad chunk');
    expect(errors).toHaveLength(1);
    expect(manual.released).toBe(1);
    manual.sink.next({ line: 'b' });
    expect(query.serverValue()!.lines).toEqual([]);
    query.dispose();
  });

  it('close() tears the source down and ignores later messages', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-close'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const manual = manualSource<Chunk>();
    const states: string[] = [];
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });
    stream.watchStatus(ref => {
      states.push(ref.state.value);
    });
    stream.close();
    stream.close();
    manual.sink.next({ line: 'a' });
    expect(states).toEqual(['open', 'closed']);
    expect(manual.released).toBe(1);
    expect(query.serverValue()!.lines).toEqual([]);
    query.dispose();
  });

  it('accepts async iterables', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-iterable'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    async function* chunks() {
      yield { line: '1' };
      yield { line: '2' };
    }
    const stream = streamQuery(query, {
      source: chunks,
      reduce: appendLine,
    });
    await tick();
    expect(query.serverValue()!.lines).toEqual(['1', '2']);
    expect(stream.status.value.state).toBe('complete');
    query.dispose();
  });

  it('rejects a source that is neither iterable nor a function', () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-bad'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    expect(() =>
      streamQuery(query, { source: () => ({} as never), reduce: appendLine })
    ).toThrow('async iterable or a subscribe function');
    query.dispose();
  });
});

describe('ndjsonMessages', () => {
  it('parses lines split across chunks, skipping blanks', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ndjson'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const stream = streamQuery(query, {
      source: () =>
        ndjsonMessages<Chunk>(
          new Response(
            bodyOf(['{"line":"a"}\n{"li', 'ne":"b"}\n\n', '{"line":"c"}'])
          )
        ),
      reduce: appendLine,
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(query.serverValue()!.lines).toEqual(['a', 'b', 'c']);
    expect(stream.status.value).toMatchObject({
      state: 'complete',
      received: 3,
    });
    query.dispose();
  });

  it('starts a lazy request with a signal that aborts on close', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ndjson-lazy'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    let signal: AbortSignal | null = null;
    let cancelled = false;
    const encoder = new TextEncoder();
    const stream = streamQuery(query, {
      source: () =>
        ndjsonMessages<Chunk>(received => {
          signal = received;
          return new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(encoder.encode('{"line":"a"}\n'));
            },
            cancel() {
              cancelled = true;
            },
          });
        }),
      reduce: appendLine,
    });
    await tick();
    expect(query.serverValue()!.lines).toEqual(['a']);
    stream.close();
    await tick();
    expect(signal!.aborted).toBe(true);
    expect(cancelled).toBe(true);
    query.dispose();
  });

  it('fails the stream on invalid JSON', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ndjson-bad'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const stream = streamQuery(query, {
      source: () => ndjsonMessages<Chunk>(bodyOf(['{"line":"a"}\nnot json\n'])),
      reduce: appendLine,
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(query.serverValue()!.lines).toEqual(['a']);
    expect(stream.status.value.state).toBe('error');
    query.dispose();
  });
});

describe('webSocketMessages', () => {
  function fakeSocket() {
    const listeners = new Map<string, Set<(event: any) => void>>();
    const socket = {
      readyState: 1,
      closed: [] as number[],
      addEventListener(type: string, listener: (event: any) => void) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener(type: string, listener: (event: any) => void) {
        listeners.get(type)?.delete(listener);
      },
      close(code?: number) {
        socket.readyState = 3;
        socket.closed.push(code ?? 1005);
      },
      emit(type: string, event: unknown) {
        listeners.get(type)?.forEach(listener => listener(event));
      },
      count() {
        let total = 0;
        listeners.forEach(set => (total += set.size));
        return total;
      },
    };
    return socket;
  }

  it('streams parsed messages and closes the socket on close()', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ws'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const socket = fakeSocket();
    const stream = streamQuery(query, {
      source: () => webSocketMessages<Chunk>(socket as WebSocketLike),
      reduce: appendLine,
    });
    socket.emit('message', { data: '{"line":"hi"}' });
    expect(query.ref.lines.value).toEqual(['hi']);
    stream.close();
    expect(socket.closed).toEqual([1000]);
    expect(socket.count()).toBe(0);
    query.dispose();
  });

  it('completes on a clean close and fails on an abnormal one', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: ['ws-close'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    const clean = fakeSocket();
    const a = streamQuery(query, {
      source: () => webSocketMessages<Chunk>(clean as WebSocketLike),
      reduce: appendLine,
    });
    clean.readyState = 3;
    clean.emit('close', { code: 1000, reason: '', wasClean: true });
    expect(a.status.value.state).toBe('complete');
    expect(clean.closed).toEqual([]);

    const broken = fakeSocket();
    const b = streamQuery(query, {
      source: () => webSocketMessages<Chunk>(broken as WebSocketLike),
      reduce: appendLine,
    });
    broken.readyState = 3;
    broken.emit('close', { code: 1006, reason: '', wasClean: false });
    expect(b.status.value.state).toBe('error');
    expect((b.status.value.error as Error).message).toContain('1006');
    query.dispose();
  });
});

describe('streamQuery refetch modes', () => {
  function runs() {
    const sinks: StreamSink<Chunk>[] = [];
    let released = 0;
    return {
      source: () => (sink: StreamSink<Chunk>) => {
        sinks.push(sink);
        return () => {
          released += 1;
        };
      },
      sink: (index: number) => sinks[index],
      get count() {
        return sinks.length;
      },
      get released() {
        return released;
      },
    };
  }

  async function loaded(key: string) {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: [key],
      queryFn: () => ({ title: 'T', lines: ['cached'] }),
    });
    await query.load();
    const seen: string[][] = [];
    query.watch(ref => {
      seen.push([...ref.lines.value]);
    });
    return { query, seen };
  }

  it('the first run folds onto the current baseline', async () => {
    const { query } = await loaded('mode-first');
    const source = runs();
    streamQuery(query, {
      source: source.source,
      reduce: appendLine,
      initialValue: () => ({ title: 'T', lines: [] }),
    });
    source.sink(0).next({ line: 'a' });
    expect(query.serverValue()!.lines).toEqual(['cached', 'a']);
    query.dispose();
  });

  it('reset shows initialValue at once and streams the new run from it', async () => {
    const { query, seen } = await loaded('mode-reset');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
      initialValue: () => ({ title: 'T', lines: [] }),
    });
    source.sink(0).next({ line: 'a' });
    stream.refetch();
    expect(source.released).toBe(1);
    expect(query.serverValue()!.lines).toEqual([]);
    source.sink(0).next({ line: 'stale' });
    source.sink(1).next({ line: 'x' });
    source.sink(1).next({ line: 'y' });
    expect(seen).toEqual([['cached'], ['cached', 'a'], [], ['x'], ['x', 'y']]);
    expect(stream.status.value).toMatchObject({ state: 'open', received: 2 });
    query.dispose();
  });

  it('reset without initialValue keeps the old data until the first message', async () => {
    const { query, seen } = await loaded('mode-reset-bare');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
    });
    stream.refetch();
    expect(query.serverValue()!.lines).toEqual(['cached']);
    source.sink(1).next({ line: 'x' });
    expect(query.serverValue()).toEqual({ title: '', lines: ['x'] });
    expect(seen).toEqual([['cached'], ['x']]);
    query.dispose();
  });

  it('append folds the new run onto what is shown', async () => {
    const { query } = await loaded('mode-append');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
    });
    source.sink(0).next({ line: 'a' });
    source.sink(0).complete();
    expect(stream.status.value.state).toBe('complete');
    stream.refetch({ mode: 'append' });
    expect(stream.status.value).toMatchObject({ state: 'open', received: 0 });
    source.sink(1).next({ line: 'b' });
    expect(query.serverValue()!.lines).toEqual(['cached', 'a', 'b']);
    query.dispose();
  });

  it('replace keeps the old data until the new run completes', async () => {
    const { query, seen } = await loaded('mode-replace');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
      initialValue: () => ({ title: 'T', lines: [] }),
    });
    stream.refetch({ mode: 'replace' });
    source.sink(1).next({ line: 'x' });
    source.sink(1).next({ line: 'y' });
    expect(query.serverValue()!.lines).toEqual(['cached']);
    expect(stream.status.value).toMatchObject({ buffered: 2, received: 0 });
    source.sink(1).complete();
    expect(seen).toEqual([['cached'], ['x', 'y']]);
    expect(stream.status.value).toMatchObject({
      state: 'complete',
      buffered: 0,
      received: 2,
    });
    query.dispose();
  });

  it('replace drops a failed run and keeps the old data', async () => {
    const { query } = await loaded('mode-replace-fail');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
    });
    stream.refetch({ mode: 'replace' });
    source.sink(1).next({ line: 'x' });
    source.sink(1).error(new Error('lost'));
    expect(query.serverValue()!.lines).toEqual(['cached']);
    expect(stream.status.value).toMatchObject({ state: 'error', buffered: 0 });
    stream.refetch();
    expect(source.count).toBe(3);
    expect(stream.status.value.state).toBe('open');
    query.dispose();
  });

  it('picks the mode per refetch call', async () => {
    const { query, seen } = await loaded('mode-per-call');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
      initialValue: () => ({ title: 'T', lines: [] }),
    });
    stream.refetch({ mode: 'append' });
    source.sink(1).next({ line: 'a' });
    stream.refetch({ mode: 'replace' });
    source.sink(2).next({ line: 'b' });
    expect(query.serverValue()!.lines).toEqual(['cached', 'a']);
    source.sink(2).complete();
    stream.refetch();
    source.sink(3).next({ line: 'c' });
    expect(seen).toEqual([['cached'], ['cached', 'a'], ['b'], [], ['c']]);
    query.dispose();
  });

  it('refetch after close throws and an unknown mode is rejected', async () => {
    const { query } = await loaded('mode-closed');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
    });
    expect(() => stream.refetch({ mode: 'merge' as never })).toThrow(
      'Unknown refetch mode'
    );
    expect(source.count).toBe(1);
    expect(stream.status.value.state).toBe('open');
    stream.close();
    expect(() => stream.refetch()).toThrow('This stream is closed.');
    query.dispose();
  });
});

describe('streamQuery throttle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function throttled(
    key: string,
    throttle: number | 'frame',
    extra: { onError?: (reason: unknown) => void } = {}
  ) {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: [key],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    vi.useFakeTimers();
    const seen: string[][] = [];
    query.watch(ref => {
      seen.push([...ref.lines.value]);
    });
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
      throttle,
      ...extra,
    });
    return { query, seen, manual, stream };
  }

  it('shows the first message at once and coalesces the window after it', async () => {
    const { query, seen, manual, stream } = await throttled('throttle-ms', 100);
    manual.sink.next({ line: 'a' });
    expect(seen).toEqual([[], ['a']]);

    vi.advanceTimersByTime(10);
    manual.sink.next({ line: 'b' });
    manual.sink.next({ line: 'c' });
    expect(seen).toEqual([[], ['a']]);
    expect(stream.status.value.received).toBe(1);

    vi.advanceTimersByTime(89);
    expect(seen).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual([[], ['a'], ['a', 'b', 'c']]);
    expect(stream.status.value.received).toBe(3);

    // A message after a quiet window shows at once again.
    vi.advanceTimersByTime(500);
    manual.sink.next({ line: 'd' });
    expect(seen.at(-1)).toEqual(['a', 'b', 'c', 'd']);
    query.dispose();
  });

  it('publishes what is left on completion without waiting', async () => {
    const { query, seen, manual, stream } = await throttled(
      'throttle-done',
      100
    );
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    manual.sink.complete();
    expect(seen).toEqual([[], ['a'], ['a', 'b']]);
    expect(stream.status.value).toMatchObject({
      state: 'complete',
      received: 2,
    });
    vi.advanceTimersByTime(1000);
    expect(seen).toHaveLength(3);
    query.dispose();
  });

  it('publishes what is left before close() and before an error', async () => {
    const closing = await throttled('throttle-close', 100);
    closing.manual.sink.next({ line: 'a' });
    closing.manual.sink.next({ line: 'b' });
    closing.stream.close();
    expect(closing.query.serverValue()!.lines).toEqual(['a', 'b']);
    expect(closing.stream.status.value.state).toBe('closed');
    closing.query.dispose();
    vi.useRealTimers();

    const errors: unknown[] = [];
    const failing = await throttled('throttle-error', 100, {
      onError: error => errors.push(error),
    });
    failing.manual.sink.next({ line: 'a' });
    failing.manual.sink.next({ line: 'b' });
    failing.manual.sink.error(new Error('lost'));
    expect(failing.query.serverValue()!.lines).toEqual(['a', 'b']);
    expect(failing.stream.status.value.state).toBe('error');
    expect(errors).toHaveLength(1);
    failing.query.dispose();
  });

  it('a refetch drops the pending window of a reset and keeps it for append', async () => {
    const { query, manual, stream } = await throttled('throttle-refetch', 100);
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    stream.refetch({ mode: 'append' });
    expect(query.serverValue()!.lines).toEqual(['a', 'b']);
    manual.sink.next({ line: 'c' });
    manual.sink.next({ line: 'd' });
    stream.refetch();
    vi.advanceTimersByTime(1000);
    expect(query.serverValue()!.lines).toEqual(['a', 'b', 'c']);
    query.dispose();
  });

  it("'frame' uses requestAnimationFrame when there is one", async () => {
    const frames: (() => void)[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { query, seen, manual } = await throttled('throttle-frame', 'frame');
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    manual.sink.next({ line: 'c' });
    expect(seen).toEqual([[], ['a']]);
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(seen).toEqual([[], ['a'], ['a', 'b', 'c']]);
    query.dispose();
  });

  it("'frame' falls back to a 16ms timer", async () => {
    const { query, seen, manual } = await throttled(
      'throttle-frame-timer',
      'frame'
    );
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    vi.advanceTimersByTime(15);
    expect(seen).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(seen.at(-1)).toEqual(['a', 'b']);
    query.dispose();
  });

  it('rejects an invalid throttle', () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['throttle-bad'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    for (const throttle of [-1, Infinity, NaN, 'soon' as never]) {
      expect(() =>
        streamQuery(query, {
          source: () => manualSource<Chunk>().source,
          reduce: appendLine,
          throttle,
        })
      ).toThrow("throttle must be a nonnegative number or 'frame'");
    }
    query.dispose();
  });
});

describe('streamQuery review regressions', () => {
  afterEach(() => vi.useRealTimers());

  async function loadedDoc(key: string) {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: [key],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    return { client, query };
  }

  it('a source error during a pending WRITE still delivers the held messages', async () => {
    const { client, query } = await loadedDoc('review-error-held');
    query.ref.title.value = 'Saved';
    const write = deferred<Doc>();
    const save = client.mutation({ mutationFn: () => write.promise });
    const running = save.run(undefined, {
      links: [
        {
          query,
          submission: query.capture(),
          accept: { kind: 'response', select: (data: Doc) => data },
        },
      ],
    });
    const errors: unknown[] = [];
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
      onError: error => errors.push(error),
    });
    manual.sink.next({ line: 'held' });
    expect(stream.status.value.queued).toBe(1);
    manual.sink.error(new Error('socket lost'));
    expect(manual.released).toBe(1);
    expect(errors).toHaveLength(0);

    write.resolve({ title: 'Saved', lines: ['server'] });
    expect((await running).kind).toBe('success');
    await tick();
    expect(query.serverValue()!.lines).toEqual(['server', 'held']);
    expect(stream.status.value).toMatchObject({
      state: 'error',
      received: 1,
      queued: 0,
    });
    expect(errors).toHaveLength(1);
    query.dispose();
  });

  it('a refetch from a query observer during an error flush keeps the new run', async () => {
    const { query } = await loadedDoc('review-observer-refetch');
    const sinks: StreamSink<Chunk>[] = [];
    const stream = streamQuery(query, {
      source: () => (sink: StreamSink<Chunk>) => void sinks.push(sink),
      reduce: appendLine,
      throttle: 100,
    });
    let restarted = false;
    query.watch(ref => {
      if (ref.lines.value.includes('b') && !restarted) {
        restarted = true;
        stream.refetch({ mode: 'append' });
      }
    });
    sinks[0].next({ line: 'a' });
    sinks[0].next({ line: 'b' });
    sinks[0].error(new Error('old run'));
    expect(restarted).toBe(true);
    expect(stream.status.value).toMatchObject({ state: 'open', error: null });
    sinks[1].next({ line: 'c' });
    expect(query.serverValue()!.lines).toEqual(['a', 'b', 'c']);
    query.dispose();
  });

  it('a completion observed by a query observer does not end the restarted run', async () => {
    const { query } = await loadedDoc('review-observer-complete');
    const sinks: StreamSink<Chunk>[] = [];
    const stream = streamQuery(query, {
      source: () => (sink: StreamSink<Chunk>) => void sinks.push(sink),
      reduce: appendLine,
      throttle: 100,
    });
    query.watch(ref => {
      if (ref.lines.value.length === 2 && sinks.length === 1)
        stream.refetch({ mode: 'append' });
    });
    sinks[0].next({ line: 'a' });
    sinks[0].next({ line: 'b' });
    sinks[0].complete();
    expect(sinks).toHaveLength(2);
    expect(stream.status.value.state).toBe('open');
    query.dispose();
  });

  it('close() from a status observer during refetch does not open a source', async () => {
    const { query } = await loadedDoc('review-close-in-refetch');
    let opened = 0;
    const stream = streamQuery(query, {
      source: () => (sink: StreamSink<Chunk>) => {
        opened += 1;
        // The first run finishes at once, so the refetch revives it.
        if (opened === 1) sink.complete();
      },
      reduce: appendLine,
    });
    expect(stream.status.value.state).toBe('complete');
    let armed = false;
    stream.watchStatus(ref => {
      // Read first: a ref subscribes only to the values it reads.
      const state = ref.state.value;
      if (armed && state === 'open') stream.close();
    });
    expect(opened).toBe(1);
    armed = true;
    stream.refetch();
    expect(opened).toBe(1);
    expect(stream.status.value.state).toBe('closed');
    query.dispose();
  });

  it('a throwing reduce keeps the messages folded before it, throttled or not', async () => {
    for (const throttle of [0, 100]) {
      const { query } = await loadedDoc(`review-reduce-${throttle}`);
      vi.useFakeTimers();
      const manual = manualSource<Chunk>();
      const stream = streamQuery(query, {
        source: () => manual.source,
        reduce: (current, chunk) => {
          if (chunk.line === 'bad') throw new Error('bad chunk');
          return appendLine(current, chunk);
        },
        throttle,
      });
      manual.sink.next({ line: 'a' });
      manual.sink.next({ line: 'b' });
      manual.sink.next({ line: 'bad' });
      vi.advanceTimersByTime(1000);
      expect(query.serverValue()!.lines).toEqual(['a', 'b']);
      expect(stream.status.value).toMatchObject({
        state: 'error',
        received: 2,
      });
      vi.useRealTimers();
      query.dispose();
    }
  });

  it('a throwing initialValue fails the refetch instead of leaving it open', async () => {
    const { query } = await loadedDoc('review-initial-throws');
    const manual = manualSource<Chunk>();
    let calls = 0;
    const errors: unknown[] = [];
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
      initialValue: () => {
        calls += 1;
        throw new Error('no initial');
      },
      onError: error => errors.push(error),
    });
    expect(() => stream.refetch()).not.toThrow();
    expect(calls).toBe(1);
    expect(stream.status.value.state).toBe('error');
    expect((stream.status.value.error as Error).message).toBe('no initial');
    expect(errors).toHaveLength(1);
    expect(manual.released).toBe(1);
    query.dispose();
  });
});

describe('streamQuery source edge cases', () => {
  afterEach(() => vi.useRealTimers());

  async function loadedDoc(key: string) {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: [key],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    return { client, query };
  }

  const throwingSource =
    () =>
    (sink: StreamSink<Chunk>): never => {
      sink.next({ line: 'a' });
      sink.next({ line: 'b' });
      throw new Error('source threw');
    };

  it('a source that throws keeps the messages it delivered, throttled or not', async () => {
    for (const throttle of [0, 100]) {
      const { query } = await loadedDoc(`edge-throw-${throttle}`);
      vi.useFakeTimers();
      const errors: unknown[] = [];
      // The first run idles; the refetch opens the throwing source, so the
      // throw is reported through the stream rather than rethrown.
      let first = true;
      const restarted = streamQuery(query, {
        source: () => (first ? () => undefined : throwingSource()),
        reduce: appendLine,
        throttle,
        onError: error => errors.push(error),
      });
      first = false;
      restarted.refetch({ mode: 'append' });
      vi.advanceTimersByTime(1000);
      expect(query.serverValue()!.lines).toEqual(['a', 'b']);
      expect(restarted.status.value).toMatchObject({
        state: 'error',
        received: 2,
      });
      expect(errors).toHaveLength(1);
      vi.useRealTimers();
      query.dispose();
    }
  });

  it('a source that throws on the first run applies its messages, then rethrows', async () => {
    const { query } = await loadedDoc('edge-throw-first');
    expect(() =>
      streamQuery(query, {
        source: throwingSource,
        reduce: appendLine,
        throttle: 100,
      })
    ).toThrow('source threw');
    expect(query.serverValue()!.lines).toEqual(['a', 'b']);
    query.dispose();
  });

  it('a source that throws during a pending WRITE keeps the held messages', async () => {
    const { client, query } = await loadedDoc('edge-throw-write');
    query.ref.title.value = 'Saved';
    const write = deferred<Doc>();
    const save = client.mutation({ mutationFn: () => write.promise });
    const running = save.run(undefined, {
      links: [
        {
          query,
          submission: query.capture(),
          accept: { kind: 'response', select: (data: Doc) => data },
        },
      ],
    });
    const errors: unknown[] = [];
    let first = true;
    const stream = streamQuery(query, {
      source: () => (first ? () => undefined : throwingSource()),
      reduce: appendLine,
      onError: error => errors.push(error),
    });
    first = false;
    stream.refetch({ mode: 'append' });
    expect(stream.status.value).toMatchObject({ state: 'open', queued: 2 });

    write.resolve({ title: 'Saved', lines: ['server'] });
    expect((await running).kind).toBe('success');
    await tick();
    expect(query.serverValue()!.lines).toEqual(['server', 'a', 'b']);
    expect(stream.status.value.state).toBe('error');
    expect(errors).toHaveLength(1);
    query.dispose();
  });

  it('a source that sends synchronously while subscribing is still throttled', async () => {
    const { query } = await loadedDoc('edge-sync-throttle');
    vi.useFakeTimers();
    const seen: string[][] = [];
    query.watch(ref => {
      seen.push([...ref.lines.value]);
    });
    streamQuery(query, {
      source: () => (sink: StreamSink<Chunk>) => {
        sink.next({ line: 'a' });
        sink.next({ line: 'b' });
        sink.next({ line: 'c' });
      },
      reduce: appendLine,
      throttle: 100,
    });
    expect(seen).toEqual([[], ['a']]);
    vi.advanceTimersByTime(100);
    expect(seen).toEqual([[], ['a'], ['a', 'b', 'c']]);
    query.dispose();
  });

  it('a reset refetch still shows initialValue at once under throttle', async () => {
    const { query } = await loadedDoc('edge-reset-throttle');
    vi.useFakeTimers();
    const sinks: StreamSink<Chunk>[] = [];
    const stream = streamQuery(query, {
      source: () => (sink: StreamSink<Chunk>) => void sinks.push(sink),
      reduce: appendLine,
      initialValue: () => ({ title: 'T', lines: ['empty'] }),
      throttle: 100,
    });
    sinks[0].next({ line: 'a' });
    stream.refetch();
    expect(query.serverValue()!.lines).toEqual(['empty']);
    sinks[1].next({ line: 'x' });
    expect(query.serverValue()!.lines).toEqual(['empty', 'x']);
    query.dispose();
  });
});

describe('streamQuery with display', () => {
  it('a display observes a query that only the stream loads', () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['stream-display'],
      queryFn: () => ({ title: 'never', lines: [] }),
    });
    const seen: (string[] | undefined)[] = [];
    query.watchDisplay(ref => {
      seen.push(ref.data.value?.lines);
    });
    const manual = manualSource<Chunk>();
    streamQuery(query, { source: () => manual.source, reduce: appendLine });
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    expect(seen).toEqual([undefined, ['a'], ['a', 'b']]);
    query.dispose();
  });
});

describe('streamQuery documented endings', () => {
  async function savingDoc(key: string) {
    const client = createSyncClient({ ssr: true });
    const query = client.query<Doc>({
      queryKey: [key],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    query.ref.title.value = 'Saved';
    const write = deferred<Doc>();
    const save = client.mutation({ mutationFn: () => write.promise });
    const running = save.run(undefined, {
      links: [
        {
          query,
          submission: query.capture(),
          accept: { kind: 'response', select: (data: Doc) => data },
        },
      ],
    });
    const finish = async () => {
      write.resolve({ title: 'Saved', lines: ['server'] });
      await running;
      await tick();
    };
    return { query, finish };
  }

  it('close() during a pending WRITE discards the held messages', async () => {
    const { query, finish } = await savingDoc('ending-close');
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
    });
    manual.sink.next({ line: 'held' });
    stream.close();
    await finish();
    expect(query.serverValue()!.lines).toEqual(['server']);
    expect(stream.status.value).toMatchObject({ state: 'closed', queued: 0 });
    query.dispose();
  });

  it('a reset restart discards held messages and an append restart keeps them', async () => {
    for (const mode of ['reset', 'append'] as const) {
      const { query, finish } = await savingDoc(`ending-${mode}`);
      const sinks: StreamSink<Chunk>[] = [];
      const stream = streamQuery(query, {
        source: () => (sink: StreamSink<Chunk>) => void sinks.push(sink),
        reduce: appendLine,
      });
      sinks[0].next({ line: 'held' });
      stream.refetch({ mode });
      await finish();
      expect(query.serverValue()!.lines).toEqual(
        mode === 'reset' ? ['server'] : ['server', 'held']
      );
      query.dispose();
    }
  });

  it('initialValue is not called on the first run', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ending-initial'],
      queryFn: () => ({ title: 'T', lines: ['cached'] }),
    });
    await query.load();
    let calls = 0;
    const manual = manualSource<Chunk>();
    const stream = streamQuery(query, {
      source: () => manual.source,
      reduce: appendLine,
      initialValue: () => {
        calls += 1;
        return { title: 'T', lines: [] };
      },
    });
    manual.sink.next({ line: 'a' });
    expect(calls).toBe(0);
    expect(query.serverValue()!.lines).toEqual(['cached', 'a']);
    stream.refetch();
    expect(calls).toBe(1);
    query.dispose();
  });

  it('a first-run synchronous throw calls onError and is rethrown', () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ending-first-throw'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    const errors: unknown[] = [];
    expect(() =>
      streamQuery(query, {
        source: () => () => {
          throw new Error('cannot open');
        },
        reduce: appendLine,
        onError: error => errors.push(error),
      })
    ).toThrow('cannot open');
    expect(errors).toHaveLength(1);
    query.dispose();
  });

  it('within one batch, current is the previous unfrozen result', async () => {
    const query = createSyncClient({ ssr: true }).query<Doc>({
      queryKey: ['ending-frozen'],
      queryFn: () => ({ title: 'T', lines: [] }),
    });
    await query.load();
    vi.useFakeTimers();
    const frozen: boolean[] = [];
    const manual = manualSource<Chunk>();
    streamQuery(query, {
      source: () => manual.source,
      reduce: (current, chunk) => {
        frozen.push(Object.isFrozen(current));
        return appendLine(current, chunk);
      },
      throttle: 100,
    });
    manual.sink.next({ line: 'a' });
    manual.sink.next({ line: 'b' });
    manual.sink.next({ line: 'c' });
    vi.advanceTimersByTime(100);
    vi.useRealTimers();
    expect(frozen).toEqual([true, true, false]);
    query.dispose();
  });
});
