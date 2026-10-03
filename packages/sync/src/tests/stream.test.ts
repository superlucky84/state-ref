import { describe, expect, it } from 'vitest';
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

describe('streamQuery refetchMode', () => {
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
      refetchMode: 'reset',
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
      refetchMode: 'append',
    });
    source.sink(0).next({ line: 'a' });
    source.sink(0).complete();
    expect(stream.status.value.state).toBe('complete');
    stream.refetch();
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
      refetchMode: 'replace',
      initialValue: () => ({ title: 'T', lines: [] }),
    });
    stream.refetch();
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
      refetchMode: 'replace',
    });
    stream.refetch();
    source.sink(1).next({ line: 'x' });
    source.sink(1).error(new Error('lost'));
    expect(query.serverValue()!.lines).toEqual(['cached']);
    expect(stream.status.value).toMatchObject({ state: 'error', buffered: 0 });
    stream.refetch();
    expect(source.count).toBe(3);
    expect(stream.status.value.state).toBe('open');
    query.dispose();
  });

  it('refetch after close throws and an unknown mode is rejected', async () => {
    const { query } = await loaded('mode-closed');
    const source = runs();
    const stream = streamQuery(query, {
      source: source.source,
      reduce: appendLine,
    });
    stream.close();
    expect(() => stream.refetch()).toThrow('This stream is closed.');
    expect(() =>
      streamQuery(query, {
        source: source.source,
        reduce: appendLine,
        refetchMode: 'merge' as never,
      })
    ).toThrow('Unknown refetchMode');
    query.dispose();
  });
});
