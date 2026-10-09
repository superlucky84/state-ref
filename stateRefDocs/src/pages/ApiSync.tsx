import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiSync = mount(() => {
  return () => (
    <div>
      <h1>Sync API</h1>

      <p>
        The surface of <code>@stateref/sync</code>. See{' '}
        <a href="#/guide/sync">createSyncClient</a> for the guides, and the
        package README for the full prose on every rule.
      </p>

      <h2>createSyncClient</h2>

      <CodeBlock
        language="typescript"
        code={`function createSyncClient(options?: {
  ssr?: boolean;
  environment?: SyncEnvironment;
}): SyncClient`}
      />

      <p>
        One client per app, or one per SSR request. An SSR client uses an
        infinite <code>gcTime</code>, zero query retries, and creates no
        environment subscriptions or polling timers.
      </p>

      <h2>SyncClient</h2>

      <h3>Queries</h3>

      <CodeBlock
        language="typescript"
        code={`client.query<T, S>(options): QueryHandle<T, S>          // fixed key
client.query<I, T, S>({ source, resolve, ...display }): QueryHandle<T, S>  // reactive key

client.fetch<T>(options): Promise<T>     // fresh cache or a READ; throws
client.prefetch<T>(options): Promise<void> // caches success, swallows rejection
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale

client.observe<T, S>(options, settings?): QueryObserver<T, S> // for hook authors`}
      />

      <h3>Infinite queries</h3>

      <CodeBlock
        language="typescript"
        code={`client.infiniteQuery<Page, Param, S>(options): InfiniteQueryHandle<Page, Param, S>

client.fetchInfinite(options)
client.prefetchInfinite(options)
client.ensureInfinite(options)`}
      />

      <p>
        Infinite pages are readonly, and <code>infiniteQuery</code> takes a
        fixed key only - a reactive key has no infinite equivalent.
      </p>

      <p>
        Guide: <a href="#/guide/sync-infinite">Infinite Queries</a>.
      </p>

      <CodeBlock
        language="typescript"
        code={`// InfiniteQueryOptions<Page, Param> — QueryOptions without queryFn / editable / initialData, plus:
{
  queryFn: (context: { signal: AbortSignal; pageParam: Param }) => Page | Promise<Page>;
  initialPageParam: Param;   // JSON-compatible
  getNextPageParam: (lastPage, pages, lastPageParam, pageParams) => Param | null | undefined;
  getPreviousPageParam?: (firstPage, pages, firstPageParam, pageParams) => Param | null | undefined;
  maxPages?: number;
  initialData?: { pages: Page[]; pageParams: Param[] };
}

// InfiniteQueryHandle — data is { pages, pageParams }
handle.ref / handle.watch          // readonly
handle.status / handle.watchStatus
handle.display / handle.watchDisplay
handle.load()                      // the first page only
handle.refetch()                   // re-reads held pages from the first
handle.fetchNextPage() / handle.fetchPreviousPage()
handle.hasNextPage() / handle.hasPreviousPage()
handle.invalidate()
handle.dispose()
// no changes(), no capture()`}
      />

      <h3>Mutations</h3>

      <CodeBlock
        language="typescript"
        code={`client.mutation<I, T>(options): MutationHandle<I, T>`}
      />

      <h3>Cache</h3>

      <CodeBlock
        language="typescript"
        code={`client.invalidate(key: QueryKey): void
client.remove(key: QueryKey): boolean   // refused while anything holds the entry
client.size(): number

client.dehydrate()
client.hydrate(snapshot)
client.dehydrateLocal(options?: { inFlight?: 'reject' | 'unconfirmed' })
client.hydrateLocal(snapshot)   // into an empty client; starts no READ or WRITE`}
      />

      <h3>Observation</h3>

      <CodeBlock
        language="typescript"
        code={`client.inspectCache(): readonly SyncCacheEntry[]
client.subscribeCache(listener): () => void

client.inspectMutations(): readonly SyncMutationEntry[]
client.subscribeMutations(listener): () => void`}
      />

      <p>
        A read-only metadata boundary. Query data, local edits, mutation inputs
        and caller-owned error objects are omitted. See{' '}
        <a href="#/guide/sync-observation">Observation</a>.
      </p>

      <h2>QueryOptions</h2>

      <CodeBlock
        language="typescript"
        code={`{
  queryKey: QueryKey;        // acyclic, JSON-compatible array
  queryFn: (context: { signal: AbortSignal }) => T | Promise<T>;

  editable?: boolean;        // default true
  initialData?: T;
  initialUpdatedAt?: number;
  staleTime?: number;        // default 0
  gcTime?: number;           // default 5 minutes; infinite in SSR
  retry?: number;
  retryDelay?: (attempt: number) => number;

  networkMode?: 'online' | 'always' | 'offlineFirst';  // default 'online'
  refetchOnFocus?: boolean | 'always';                 // default true
  refetchOnReconnect?: boolean | 'always';             // default true
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;               // default false
}`}
      />

      <h2>QueryHandle</h2>

      <CodeBlock
        language="typescript"
        code={`handle.queryKey     // the key this handle was opened with
handle.ref          // editable resource ref; throws before a first load
handle.watch        // the Watch shape; throws before a first load
handle.status       // readable from the start
handle.watchStatus

handle.load()       // uses a fresh cached result when there is one
handle.refetch()    // forces a READ
handle.invalidate() // marks stale, excludes an older in-flight response
handle.dispose()    // releases this handle's subscriptions

handle.isDirty()
handle.changes()
handle.version()
handle.capture(ids?)        // ResourceSubmission: frozen value + rows + version
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE
handle.serverValue()        // the server baseline without local edits; undefined before a load`}
      />

      <h3>QueryStatus</h3>

      <CodeBlock
        language="typescript"
        code={`{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching' | 'paused';
  loaded: boolean;
  error: unknown | null;
  updatedAt: number | null;
  invalidated: boolean;

  // the editing axis, kept separate
  dirty: boolean;
  conflicts: number;
  version: number;
  pending: number;
  unconfirmed: boolean;
}`}
      />

      <h3>ResourceChange and ResourceSubmission</h3>

      <p>
        What <code>changes()</code> and <code>capture()</code> return. See{' '}
        <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> for how they are
        used.
      </p>

      <CodeBlock
        language="typescript"
        code={`type ResourceValue = Readonly<{ exists: boolean; value: unknown }>;

type ResourceChange = Readonly<{
  owner: object;           // the resource it belongs to
  id: number;              // what capture(ids) takes
  version: number;         // resource version when read
  path: readonly (string | number)[];
  before: ResourceValue;   // the baseline
  after: ResourceValue;    // the local value
  conflict: boolean;       // a READ brought a different value here
}>;

type ResourceSubmission<T> = Readonly<{
  owner: object;
  version: number;         // stale once the resource version moves
  value: T;                // the whole current value, frozen
  changes: readonly ResourceChange[]; // all rows, or the ids passed
}>;`}
      />

      <h2>Display</h2>

      <CodeBlock
        language="typescript"
        code={`// display options, on the query itself
{ placeholderData?: T; select?: (data: T) => S; equals?: (a: S, b: S) => boolean }

// query.display / query.watchDisplay - readonly, built on first access
QueryStatus & { data, isPlaceholder, errorSource, queryKey, enabled }

// no phase: derive it
const phase = q.display.isPlaceholder.value ? 'placeholder' : q.display.status.value;

// a path under a missing value reads undefined:
// display.data.name.value is string | undefined

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}
      />

      <p>A fixed key does not start a READ. An active reactive key does.</p>

      <h2>Query observers</h2>

      <p>
        The low-level API behind each connector&apos;s <code>/sync</code> entry,
        for writing a hook for another framework. App code uses those entries
        instead (<a href="#/guide/sync-query">query and resource</a>).
      </p>

      <CodeBlock
        language="typescript"
        code={`client.observe<T, S = T>(
  options: ObserveOptions<T, S>,
  settings?: ObserverSettings
): QueryObserver<T, S>

type ObserveOptions<T, S = T> = QueryOptions<T> &
  QueryDisplayOptions<T, S> & { enabled?: boolean };

type ObserverSettings = {
  scheduleRelease?: (release: () => void) => void; // default: one macrotask
};

type QueryObserver<T, S = T> = Readonly<{
  watch: QueryDisplayWatch<QueryDisplayState<S>>; // no callback: the confirmed options' state; a callback: subscribe
  peek: (options: ObserveOptions<T, S>) => QueryDisplayRef<QueryDisplayState<S>>; // options a render has not confirmed
  matches: (options: ObserveOptions<T, S>) => boolean;    // same key and enabled as the confirmed options
  setOptions: (options: ObserveOptions<T, S>) => boolean; // confirm; true when the key or enabled changed
  controls: QueryObserverControls<T>;
}>;

type QueryObserverControls<T> = Readonly<{
  refetch: () => Promise<T>;  // rejects 'This query observer is not attached.' while not attached
  invalidate: () => void;     // invalidates the key; reads again while attached and enabled
  handle: () => QueryHandleCore<T> | null; // the query's own handle; null while not attached
}>;

// a QueryHandle without the members that show or release it
type QueryHandleCore<T> = Omit<QueryHandle<T>, 'dispose' | 'display' | 'watchDisplay'>;`}
      />

      <ul>
        <li>
          Making an observer and reading it (<code>watch()</code> without a
          callback, <code>peek</code>, <code>matches</code>) leave the cache as
          it was.
        </li>
        <li>
          The first callback subscription attaches: it opens the query, loads it
          if stale and shares a READ in flight. A subscription ends when the{' '}
          <code>AbortSignal</code> its first run returned aborts, or when a
          later run returns <code>false</code>; one with neither keeps the
          observer attached. When the last one ends, the handle is released on{' '}
          <code>scheduleRelease</code>.
        </li>
        <li>
          Call <code>setOptions</code> outside render: after commit, or in a
          reaction before render. While <code>matches(options)</code> is false
          for a render&apos;s options, show <code>peek(options)</code> instead
          of the subscribed state.
        </li>
        <li>
          On an <code>ssr: true</code> client it never attaches; a subscription
          gets the confirmed options&apos; state.
        </li>
        <li>
          <code>controls.handle()</code> lends the query&apos;s own handle.
          Never dispose it: the observer releases it.
        </li>
      </ul>

      <h2>Streaming</h2>

      <CodeBlock
        language="typescript"
        code={`streamQuery<T, M>(query, options: QueryStreamOptions<T, M>): QueryStream

// QueryStreamOptions<T, M>
{
  source: () => StreamSource<M>;  // called on start and on every refetch()
  reduce: (current: T | undefined, message: M) => T; // current = server value; treat as immutable (a batched intermediate may not be frozen)
  initialValue?: () => T;         // used by 'reset' / 'replace' restarts, never by the first run; a throw fails the run
  throttle?: number | 'frame';    // coalesce publishes; default 0
  onError?: (reason: unknown) => void; // once per failed run; a first-run sync source throw is also rethrown
}

// StreamSource<M>
AsyncIterable<M> | ((sink: StreamSink<M>, signal: AbortSignal) => void | (() => void))
// StreamSink<M> = { next(message), error(reason), complete() }

// QueryStream
stream.status       // readonly; QueryStreamStatus
stream.watchStatus
stream.refetch(options?: StreamRefetchOptions) // throws after close() or for an unknown mode
stream.close()

type StreamRefetchMode = 'reset' | 'append' | 'replace';
type StreamRefetchOptions = { mode?: StreamRefetchMode }; // default 'reset'

// QueryStreamStatus
{
  state: 'open' | 'complete' | 'error' | 'closed';
  received: number;  // messages of this run applied
  queued: number;    // held while a linked WRITE is pending
  buffered: number;  // folded off screen by a 'replace' run
  error: unknown;
}

ndjsonMessages<M>(input: Response | ReadableStream<Uint8Array> | (signal => Response | ReadableStream | Promise<...>)): StreamSource<M>
webSocketMessages<M>(socket: WebSocketLike, parse?: (data: unknown) => M): StreamSource<M>

// WebSocketLike — a browser WebSocket fits
{
  readonly readyState: number; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
  addEventListener(type: 'close', listener: (event: { code: number; reason: string; wasClean: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
}`}
      />

      <p>
        Guide: <a href="#/guide/sync-stream">Streaming</a>.
      </p>

      <h2>Mutations</h2>

      <CodeBlock
        language="typescript"
        code={`client.mutation({
  mutationFn: (input, context: {
    signal: AbortSignal;
    operationId: number;
    attempt: number;          // 0 on the first try
    idempotencyKey?: string;
  }) => T | Promise<T>;
  onSuccess?: (data, input, operationId) => void | Promise<void>;
  onError?: (error, input, operationId) => void | Promise<void>;
  onSettled?: (result, input) => void | Promise<void>;
})

mutation.run(input, options?): Promise<MutationResult>
mutation.start(input, options?): MutationOperation
mutation.status / mutation.watchStatus   // the latest operation
mutation.dispose()

// options
{
  scope?: string;          // same scope runs in start order
  signal?: AbortSignal;    // aborting settles as 'unknown'
  retry?: number;          // opt-in; requires idempotencyKey
  retryDelay?: (attempt: number) => number;
  idempotencyKey?: string;
  links?: Array<{
    query: QueryHandleCore<any>;        // a handle you own, or q.handle()
    submission?: ResourceSubmission<any>;
    accept?:                          // default { kind: 'none' }
      | { kind: 'none' | 'refetch' | 'submitted' }
      | { kind: 'response'; select: (response: T) => any };
    onReject?: 'keep' | 'remove';     // 'remove' requires a submission
  }>;
}

// result.kind
'success' | 'sync-error' | 'rejected' | 'unknown'`}
      />

      <p>
        A link&apos;s <code>query</code> is a{' '}
        <code>QueryHandleCore&lt;any&gt;</code>, a query handle without{' '}
        <code>dispose</code>, <code>display</code> and <code>watchDisplay</code>
        : a handle you own and the one a component hook lends through{' '}
        <code>q.handle()</code> both fit. The <code>stage</code> links and{' '}
        <code>send(client, queries, mutation)</code> of{' '}
        <code>openPersistedLinkedMutation</code> take the same type.
      </p>

      <p>
        <code>unknown</code> keeps the edits and is never retried automatically.{' '}
        <code>sync-error</code> is reconciled with a new READ or a known server
        value, not by resending.
      </p>

      <h3>MutationOperation, MutationStatus, MutationResult</h3>

      <CodeBlock
        language="typescript"
        code={`type MutationOperation<T> = Readonly<{
  id: number;
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  result: Promise<MutationResult<T>>;
  abort: () => void;       // settles as 'unknown'
  dispose: () => void;
}>;

type MutationStatus = Readonly<{
  phase: 'idle' | 'pending' | 'success' | 'sync-error' | 'rejected' | 'unknown';
  pending: number;
  operationId: number | null;
  error: unknown | null;
}>;

type MutationResult<T> =
  | { kind: 'success'; operationId: number; data: T; callbackError?: unknown }
  | { kind: 'sync-error'; operationId: number; data: T; error: unknown; callbackError?: unknown }
  | {
      kind: 'rejected' | 'unknown';
      operationId: number;
      error: unknown;          // a MutationRejectedError for 'rejected'
      recoveryError?: unknown; // onReject: 'remove' failed to revert
      callbackError?: unknown;
    };

class MutationRejectedError extends Error {
  constructor(message: string, reason?: unknown);
  readonly reason?: unknown;
}`}
      />

      <h2>Environment</h2>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment } from '@stateref/sync';

createBrowserSyncEnvironment(host?: BrowserSyncHost): SyncEnvironment
// without host: reads window / document / navigator; throws
// 'Browser sync environment requires a browser host.' where they do not exist

type BrowserSyncHost = Readonly<{
  window: { addEventListener; removeEventListener };   // 'focus', 'online'
  document: { addEventListener; removeEventListener; visibilityState: string }; // 'visibilitychange'
  navigator: { onLine: boolean };
}>;`}
      />

      <CodeBlock
        language="typescript"
        code={`type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: 'focus' | 'reconnect') => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;`}
      />

      <p>
        Implement this yourself when the host knows better than browser globals
        - a native shell, a test, or a custom connectivity probe. The browser
        adapter&apos;s rules and an example are in{' '}
        <a href="#/guide/sync-refetch">Automatic Refetch</a>.
      </p>

      <h2>Persistence</h2>

      <CodeBlock
        language="typescript"
        code={`saveSyncSnapshot(client, storage, options)
restoreSyncSnapshot(client, storage, options)   // a new, empty client

saveLocalSyncSnapshot(client, storage, options)
restoreLocalSyncSnapshot(client, storage, options)

openPersistedLinkedMutation({ storage, key, buster, isOnline?, checkpoint? })
openPersistedMutationQueue({ storage, key, buster, maxAge?, commands, isOnline? })`}
      />

      <p>
        Each wants its own storage key with exactly one writer. See{' '}
        <a href="#/guide/sync-persistence">Persistence and SSR</a>.
      </p>

      <CodeBlock
        language="typescript"
        code={`type SyncStorage = Readonly<{
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}>;

// options for save/restore(Local)SyncSnapshot
{ key: string; buster: string; maxAge?: number /* default Infinity */ }`}
      />

      <p>
        <code>localStorage</code> fits as is; the async signatures let an
        IndexedDB or native store fit too.
      </p>

      <h2>Scope</h2>

      <p>
        The project tracks its comparison scope row by row and declares no
        equivalence with any other library. Four rows are recorded as partial -
        infinite key switching, framework SSR boundaries, the observation
        boundary, and per-connector differences in reactive options.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync">createSyncClient</a> - the guide
        </li>
        <li>
          <a href="#/api/draft">Draft API</a>
        </li>
        <li>
          <a href="#/api/plugin">Plugin API</a>
        </li>
      </ul>
    </div>
  );
});
