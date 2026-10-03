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
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale`}
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

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}
      />

      <p>A fixed key does not start a READ. An active reactive key does.</p>

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
    query: QueryHandle<any>;
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
