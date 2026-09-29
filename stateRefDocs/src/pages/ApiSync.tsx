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
handle.capture(ids?)        // an immutable value + change snapshot for a mutation
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE`}
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

      <h2>Environment</h2>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment } from '@stateref/sync';

const environment = createBrowserSyncEnvironment(); // browser globals only`}
      />

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
