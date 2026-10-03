import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import type { QueryHandle } from './index';

/** Where a push source delivers its messages. */
export type StreamSink<M> = Readonly<{
  next: (message: M) => void;
  error: (reason: unknown) => void;
  complete: () => void;
}>;

/**
 * A server push source: an async iterable (an NDJSON body, an SSE reader) or a
 * subscribe function (a WebSocket). The subscribe form returns its teardown,
 * or listens to `signal`.
 */
export type StreamSource<M> =
  | AsyncIterable<M>
  | ((sink: StreamSink<M>, signal: AbortSignal) => void | (() => void));

/**
 * What `refetch({ mode })` does with the data the previous run left behind.
 * Within a run every message is folded and shown as it arrives; the mode only
 * decides how a restarted run treats what is already shown.
 *
 * - `reset`: start over from `initialValue` (shown at once) or, without one,
 *   from nothing on the first new message; chunks then stream in again.
 * - `append`: keep the current baseline and fold the new run onto it.
 * - `replace`: keep showing the current baseline while the new run is folded
 *   off-screen, then swap it in once when the run completes.
 */
export type StreamRefetchMode = 'reset' | 'append' | 'replace';

export type StreamRefetchOptions = Readonly<{
  /** Defaults to `reset`. */
  mode?: StreamRefetchMode;
}>;

export type QueryStreamOptions<T, M> = Readonly<{
  /** Open the source; called on start and again on every `refetch()`. */
  source: () => StreamSource<M>;
  /**
   * Fold one message into the server value and return the next full value.
   * `current` is the confirmed server baseline (never local edits), undefined
   * before the first load. Treat it as immutable and return a new value: the
   * baseline of editable data is frozen, but within one batch (a throttle
   * window, messages held for a WRITE) it is the previous call's result.
   */
  reduce: (current: T | undefined, message: M) => T;
  /**
   * The empty value a `reset` or `replace` refetch folds from. The first run
   * always folds onto the current baseline.
   */
  initialValue?: () => T;
  /**
   * Show at most one update per window: milliseconds, or `'frame'` for once
   * per animation frame (a 16ms timer where there is none). Every message is
   * still folded; only the publishes are coalesced. The first message of a
   * run shows at once, and completion, an error or `close()` publish what is
   * left without waiting. Defaults to 0: publish every message.
   */
  throttle?: number | 'frame';
  /** Called when a run fails (source error or a throwing reduce). */
  onError?: (reason: unknown) => void;
}>;

export type QueryStreamStatus = Readonly<{
  /** The current run: `open` until it completes or fails, or `close()`. */
  state: 'open' | 'complete' | 'error' | 'closed';
  /** Messages of the current run applied to the query baseline. */
  received: number;
  /** Messages held while a linked WRITE is pending on the query. */
  queued: number;
  /** Messages of a `replace` run folded off-screen, not yet shown. */
  buffered: number;
  error: unknown;
}>;

export type QueryStream = Readonly<{
  status: StateRefStore<QueryStreamStatus>;
  watchStatus: Watch<QueryStreamStatus>;
  /** Reopen the source as a new run; also revives a finished one. */
  refetch: (options?: StreamRefetchOptions) => void;
  /** Stop listening for good and tear the source down. */
  close: () => void;
}>;

/** The part of a query handle a stream needs. */
type StreamTarget<T> = Pick<
  QueryHandle<T, any>,
  'status' | 'watchStatus' | 'serverValue' | 'acceptServer'
>;

type Step<T, M> =
  | { kind: 'message'; message: M }
  | { kind: 'reset' }
  | { kind: 'set'; value: T; count: number };

/**
 * Feed server push messages into a query as accepted server values.
 *
 * Every message becomes a new baseline through `acceptServer`, so observers
 * see each intermediate state, local edits are rebased on top of it, and an
 * overlapping server change shows up in `status.conflicts`. While a linked
 * WRITE is pending the messages are held and folded in order once it settles,
 * on top of whatever baseline that WRITE accepted.
 */
export function streamQuery<T, M>(
  query: StreamTarget<T>,
  options: QueryStreamOptions<T, M>
): QueryStream {
  if (typeof options?.source !== 'function')
    throw new TypeError('streamQuery requires a source function.');
  if (typeof options.reduce !== 'function')
    throw new TypeError('streamQuery requires a reduce function.');
  const throttle = options.throttle ?? 0;
  if (
    throttle !== 'frame' &&
    !(typeof throttle === 'number' && throttle >= 0 && throttle < Infinity)
  )
    throw new TypeError("throttle must be a nonnegative number or 'frame'.");

  const store = create<QueryStreamStatus>(
    Object.freeze({
      state: 'open',
      received: 0,
      queued: 0,
      buffered: 0,
      error: null,
    }),
    { autoSync: false }
  );
  const statusAbort = new AbortController();
  const status = store.watch(() => statusAbort.signal, { editable: false });
  let current = status.value;
  const publish = (patch: Partial<QueryStreamStatus>) => {
    current = Object.freeze({ ...current, ...patch });
    store.updateRef.value = current;
    store.sync();
  };

  let closed = false;
  let run = 0;
  let runAbort: AbortController | null = null;
  let teardown: (() => void) | null = null;
  let writeWait: AbortController | null = null;
  /**
   * How the run ends once the queue is empty. The source is already detached:
   * held messages still land (after a pending WRITE) before the run settles.
   */
  let ending:
    | { state: 'complete' }
    | { state: 'error'; error: unknown }
    | null = null;
  const queue: Step<T, M>[] = [];
  const waiting = () =>
    queue.reduce(
      (total, step) =>
        total +
        (step.kind === 'message' ? 1 : step.kind === 'set' ? step.count : 0),
      0
    );
  /**
   * Observers run synchronously inside `acceptServer` and `publish`, and may
   * call `refetch()` or `close()`. After any such call, work for the old run
   * must stop.
   */
  const superseded = (id: number) => closed || id !== run;

  let cancelTimer: (() => void) | null = null;
  let lastFlush = -Infinity;
  const schedule = (callback: () => void, ms: number | 'frame') => {
    if (ms === 'frame' && typeof requestAnimationFrame === 'function') {
      const id = requestAnimationFrame(callback);
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(callback, ms === 'frame' ? 16 : ms);
    return () => clearTimeout(id);
  };
  const cancelFlush = () => {
    cancelTimer?.();
    cancelTimer = null;
  };
  const flushNow = () => {
    cancelFlush();
    lastFlush = Date.now();
    drain();
  };
  /** Publish now, or once the throttle window allows; nothing is dropped. */
  const requestFlush = () => {
    if (!throttle) return drain();
    if (cancelTimer) return;
    // The first message of a run never waits.
    if (lastFlush === -Infinity) return flushNow();
    const wait =
      throttle === 'frame' ? 'frame' : lastFlush + throttle - Date.now();
    if (wait !== 'frame' && wait <= 0) return flushNow();
    cancelTimer = schedule(() => {
      cancelTimer = null;
      flushNow();
    }, wait);
  };

  /** Stop listening to the source without ending the run's queued work. */
  const detachSource = () => {
    runAbort?.abort();
    runAbort = null;
    const release = teardown;
    teardown = null;
    release?.();
  };
  /** End the run: later deliveries from its source are ignored. */
  const endRun = () => {
    cancelFlush();
    lastFlush = -Infinity;
    run += 1;
    ending = null;
    detachSource();
  };
  const finish = (patch: Partial<QueryStreamStatus>) => {
    queue.length = 0;
    writeWait?.abort();
    writeWait = null;
    endRun();
    publish({ ...patch, queued: 0, buffered: 0 });
  };
  const fail = (reason: unknown) => {
    if (current.state !== 'open') return;
    finish({ state: 'error', error: reason });
    options.onError?.(reason);
  };
  /** Settle an ending run once nothing it received is left to apply. */
  const settle = () => {
    if (!ending || queue.length || current.state !== 'open') return;
    const end = ending;
    if (end.state === 'complete') finish({ state: 'complete' });
    else fail(end.error);
  };

  const waitForWrite = () => {
    if (writeWait) return;
    const wait = (writeWait = new AbortController());
    query.watchStatus((ref, first) => {
      if (wait.signal.aborted) return false;
      if (ref.pending.value > 0) return first ? wait.signal : undefined;
      writeWait = null;
      wait.abort();
      // Leave the status pass that reported the settled WRITE before writing.
      queueMicrotask(drain);
      return first ? wait.signal : false;
    });
  };

  function drain() {
    if (current.state !== 'open' || queue.length === 0) return settle();
    const id = run;
    let next: T | undefined;
    try {
      if (query.status.pending.value > 0) {
        publish({ queued: waiting() });
        if (!superseded(id)) waitForWrite();
        return;
      }
      next = query.serverValue();
    } catch (error) {
      fail(error);
      return;
    }
    const steps = queue.splice(0);
    let applied = 0;
    let changed = false;
    let failure: { reason: unknown } | null = null;
    for (const step of steps) {
      if (step.kind === 'reset') {
        // Always queued with the message after it; alone it shows nothing.
        next = undefined;
        changed = false;
      } else if (step.kind === 'set') {
        next = step.value;
        applied += step.count;
        changed = true;
      } else {
        try {
          next = options.reduce(next, step.message);
        } catch (reason) {
          // Keep what was folded before the bad message, as an unthrottled
          // stream would have shown it already.
          failure = { reason };
          break;
        }
        applied += 1;
        changed = true;
      }
    }
    if (changed) {
      try {
        query.acceptServer(next as T);
      } catch (reason) {
        failure ??= { reason };
        applied = 0;
      }
      if (superseded(id)) return;
      publish({
        received: current.received + applied,
        queued: 0,
        buffered: 0,
      });
      if (superseded(id)) return;
    }
    if (failure) fail(failure.reason);
    else settle();
  }

  /** `mode` is null for the first run, which folds onto the current baseline. */
  const start = (mode: StreamRefetchMode | null) => {
    const id = run;
    const replace = mode === 'replace';
    let fresh = mode === 'reset' && !options.initialValue;
    let shadow: T | undefined;
    let buffered = 0;

    /** The source is done; apply what it delivered, then end the run. */
    const end = (how: NonNullable<typeof ending>) => {
      if (id !== run || ending) return;
      ending = how;
      detachSource();
      if (how.state === 'complete' && replace && shadow !== undefined)
        queue.push({ kind: 'set', value: shadow, count: buffered });
      flushNow();
      if (!superseded(id)) settle();
    };

    const sink: StreamSink<M> = Object.freeze({
      next: (message: M) => {
        if (id !== run || ending) return;
        if (replace) {
          try {
            shadow = options.reduce(shadow, message);
          } catch (error) {
            fail(error);
            return;
          }
          buffered += 1;
          publish({ buffered });
          return;
        }
        if (fresh) {
          fresh = false;
          queue.push({ kind: 'reset' });
        }
        queue.push({ kind: 'message', message });
        requestFlush();
      },
      // Messages that arrived before the failure still count.
      error: (reason: unknown) => end({ state: 'error', error: reason }),
      complete: () => end({ state: 'complete' }),
    });

    const abort = (runAbort = new AbortController());
    try {
      if ((mode === 'reset' || replace) && options.initialValue) {
        const initial = options.initialValue();
        if (replace) shadow = initial;
        else queue.push({ kind: 'set', value: initial, count: 0 });
      }
      // Show the reset value and an appended run's leftovers now, before the
      // source can deliver: its own messages go through the throttle.
      drain();
      if (superseded(id)) return;
      const source = options.source();
      if (superseded(id)) return;
      if (typeof source === 'function') {
        const release = source(sink, abort.signal);
        if (typeof release === 'function') {
          if (id === run && !ending) teardown = release;
          else release();
        }
      } else if (source && typeof source[Symbol.asyncIterator] === 'function') {
        const iterator = source[Symbol.asyncIterator]();
        teardown = () =>
          void Promise.resolve(iterator.return?.()).catch(() => {});
        void (async () => {
          try {
            while (id === run && !ending) {
              const step = await iterator.next();
              if (step.done) break;
              sink.next(step.value);
            }
            sink.complete();
          } catch (error) {
            sink.error(error);
          }
        })();
      } else {
        throw new TypeError(
          'streamQuery source must return an async iterable or a subscribe function.'
        );
      }
    } catch (error) {
      // Like a source error: what it delivered before throwing still lands.
      end({ state: 'error', error });
      if (!mode) throw error;
    }
  };

  start(null);

  return Object.freeze({
    status,
    watchStatus: ((renew, userOption) =>
      store.watch(renew, {
        ...userOption,
        editable: false,
      })) as Watch<QueryStreamStatus>,
    refetch: (refetchOptions?: StreamRefetchOptions) => {
      if (closed) throw new Error('This stream is closed.');
      const mode = refetchOptions?.mode ?? 'reset';
      if (mode !== 'reset' && mode !== 'append' && mode !== 'replace')
        throw new TypeError(`Unknown refetch mode: ${String(mode)}.`);
      endRun();
      const id = run;
      // Held messages of the old run belong to the data being replaced.
      if (mode !== 'append') queue.length = 0;
      publish({
        state: 'open',
        received: 0,
        queued: waiting(),
        buffered: 0,
        error: null,
      });
      // A status observer may have closed or restarted the stream.
      if (superseded(id)) return;
      start(mode);
    },
    close: () => {
      if (closed) return;
      // A throttled window still holding messages is published first.
      if (current.state === 'open' && cancelTimer) {
        flushNow();
        // An observer of that publish may have closed the stream already.
        if (closed) return;
      }
      closed = true;
      finish({ state: 'closed' });
    },
  });
}

type NdjsonInput =
  | Response
  | ReadableStream<Uint8Array>
  | null
  | ((
      signal: AbortSignal
    ) =>
      | Response
      | ReadableStream<Uint8Array>
      | null
      | Promise<Response | ReadableStream<Uint8Array> | null>);

/**
 * Turn a newline-delimited JSON body into a stream source.
 *
 * Each complete line is delivered as soon as it arrives; a trailing line
 * without a newline is delivered at the end and blank lines are skipped. Pass
 * a function to start the request lazily: it receives a signal that aborts
 * when the stream is closed, e.g. `signal => fetch(url, { signal })`.
 */
export function ndjsonMessages<M = unknown>(
  input: NdjsonInput
): StreamSource<M> {
  return (sink, signal) => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    void (async () => {
      try {
        const opened =
          typeof input === 'function' ? await input(signal) : input;
        const body = opened instanceof Response ? opened.body : opened;
        if (!body)
          throw new TypeError('ndjsonMessages requires a response body.');
        if (signal.aborted) return void body.cancel().catch(() => {});
        reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const emit = (line: string) => {
          line = line.trim();
          if (line) sink.next(JSON.parse(line) as M);
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (signal.aborted) return;
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index = buffer.indexOf('\n');
          while (index >= 0 && !signal.aborted) {
            emit(buffer.slice(0, index));
            buffer = buffer.slice(index + 1);
            index = buffer.indexOf('\n');
          }
        }
        emit(buffer + decoder.decode());
        sink.complete();
      } catch (error) {
        if (!signal.aborted) sink.error(error);
      }
    })();
    // Cancelling settles a pending read, so a closed stream frees the body.
    return () => void reader?.cancel().catch(() => {});
  };
}

/** The WebSocket surface `webSocketMessages` uses; a browser WebSocket fits. */
export type WebSocketLike = {
  readonly readyState: number;
  addEventListener(
    type: 'message',
    listener: (event: { data: unknown }) => void
  ): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
  addEventListener(
    type: 'close',
    listener: (event: {
      code: number;
      reason: string;
      wasClean: boolean;
    }) => void
  ): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
};

/**
 * Turn a WebSocket into a stream source. Messages are JSON-parsed unless
 * `parse` is given. A clean close completes the stream, anything else fails
 * it; closing the stream closes the socket.
 */
export function webSocketMessages<M = unknown>(
  socket: WebSocketLike,
  parse: (data: unknown) => M = data => JSON.parse(String(data)) as M
): StreamSource<M> {
  return sink => {
    const onMessage = (event: { data: unknown }) => {
      let message: M;
      try {
        message = parse(event.data);
      } catch (error) {
        sink.error(error);
        return;
      }
      sink.next(message);
    };
    const onError = (event: unknown) => sink.error(event);
    const onClose = (event: {
      code: number;
      reason: string;
      wasClean: boolean;
    }) => {
      if (event.wasClean) sink.complete();
      else
        sink.error(
          new Error(
            `WebSocket closed (${event.code}${
              event.reason ? `: ${event.reason}` : ''
            }).`
          )
        );
    };
    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
    return () => {
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
      // CLOSING (2) and CLOSED (3) need nothing more.
      if (socket.readyState < 2) socket.close(1000);
    };
  };
}
