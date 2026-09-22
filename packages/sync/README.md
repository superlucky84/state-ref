# @stateref/sync

Optional query cache, editable resource, and mutation package for `state-ref`. Importing `state-ref` alone does not load this package. The package is an ESM entry point and has no draft or TanStack runtime dependency.

```ts
import { createSyncClient } from '@stateref/sync';

type Account = { address: { city: string } };
const client = createSyncClient(); // create one per app or SSR request
const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }): Promise<Account> => {
    const response = await fetch('/account/1', { signal });
    return response.json();
  },
});

await account.load();
account.ref.address.city.value = 'Busan';
account.isDirty(); // true
account.changes(); // server baseline -> current local edit
```

Tools can inspect cache metadata without reading query payloads:

```ts
const stopObserving = client.subscribeCache(event => {
  // event.type: 'added' | 'updated' | 'removed'
  console.log(event.type, event.entry.queryKey, event.entry.status);
});
const currentCache = client.inspectCache();
stopObserving();
```

`inspectCache()` returns the current client only. Events retain their metadata
from the change and arrive in order in a microtask, after the current synchronous
cache transition. The entry also includes `kind` and active handle count (`owners`).
Query data, local edits, mutation inputs, and the caller-owned `status.error`
object are omitted. Dispose the listener
with its returned function when the tool or plugin closes. Listener errors do
not change query outcomes. This is a read-only integration boundary, not a
TanStack devtools or plugin compatibility API.

WRITE operations are observable on a separate stream that shares the same
delivery order:

```ts
const stopWatching = client.subscribeMutations(event => {
  // event.type: 'started' | 'updated' | 'settled'
  console.log(event.entry.operationId, event.entry.phase, event.entry.linkedKeys);
});
const running = client.inspectMutations();
stopWatching();
```

`inspectMutations()` lists only operations that have not settled yet, in start
order. `phase` is diagnostic: `queued` means the operation is waiting on its
`scope`, and it differs from `MutationStatus.phase`. `updated` events report the
`queued` to `pending` transition and each retry `attempt`. A `settled` event
carries the final snapshot and the client then drops the operation, so keep your
own history if you need one. An operation that throws before it becomes pending
(a stale submission, for example) produces no event. The input, the response,
caller-owned error objects and the `idempotencyKey` value are omitted;
`idempotent` only reports whether a key was supplied. Observing a `success`
phase is a diagnostic signal, never a reason to resend an `unknown` or
`sync-error` operation.

Mutation input can have a different shape from query data. Capture the edits
you intend to submit immediately before `run`; the capture contains an immutable
value and change snapshot. A captured version becomes stale if the resource is
edited before `run` starts.

```ts
const submission = account.capture();
const save = client.mutation({
  mutationFn: (input: { city: string }, { signal, idempotencyKey }) =>
    api.saveCity(input, { signal, idempotencyKey }),
});
const result = await save.run(
  { city: submission.value.address.city },
  {
    links: [
      {
        query: account,
        submission,
        accept: { kind: 'refetch' },
        onReject: 'keep',
      },
    ],
  }
);
account.dispose();
```

`run` clones the input with `structuredClone` before calling `mutationFn`; inputs
must be cloneable. `start` additionally returns a request ID, readonly status
ref, result Promise, and abort/dispose methods. An unlinked mutation runs
independently and never clears resource edits. Linked mutation results are
`success`, `sync-error` (WRITE succeeded but acceptance or READ failed),
`rejected` (the server explicitly refused the WRITE with
`MutationRejectedError`), or `unknown` (transport outcome is uncertain).
An unknown result keeps edits and is never automatically retried. Explicit
retry requires a server-supported `idempotencyKey`. Callback failures are
reported as `callbackError` without changing the WRITE result.

Each link chooses its own acceptance: `refetch`, `response` with `select`,
`submitted` when the server contract guarantees the submitted values were
accepted, or `none`. `account.acceptServer(value)` performs a cache-only
acceptance of a known server value; it sends no WRITE and excludes an older
READ. A confirmed rejection can keep edits or remove only unchanged submitted
edits via `onReject: 'remove'`. Later input survives, including a return to the
old baseline while the WRITE is pending. The linked query's `status.pending`
tracks the operation separately from `dirty`.

For SSR, transfer only settled, clean server baselines between separate clients:

```ts
const server = createSyncClient({ ssr: true });
const source = server.query(options);
await source.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot); // before creating any query handles
const restored = browser.query(options);
```

The snapshot preserves query keys, server data, freshness times, invalidation,
and editability. Data must be JSON-compatible. `dehydrate()` rejects local edits,
in-flight READ/linked WRITE operations, and unconfirmed WRITE outcomes rather
than silently dropping them. `status.unconfirmed` remains true after an unknown
WRITE outcome or failed post-WRITE reconciliation until a successful READ or
known server value is accepted. Such entries are retained through GC. This is
SSR cache transfer, not local-edit persistence or offline mutation recovery.

Known server data may seed an empty cache entry before the first READ. Use
`initialData` only for a complete, confirmed server value; it becomes the
editable baseline and can be included in an SSR snapshot. `initialUpdatedAt`
defaults to the installation time and controls freshness with `staleTime`.

```ts
const options = {
  queryKey: ['account', 1],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    api.readAccount(1, { signal }),
  staleTime: 30_000,
};
await client.prefetch(options); // cache success; ignore load rejection
const fresh = await client.fetch(options); // fresh cache or READ; throws errors
const cached = await client.ensure(options); // confirmed cache, even if stale
const seeded = client.query({ ...options, initialData: knownAccount });
```

These calls share the client's cache and in-flight READ by key. Temporary
`fetch/prefetch/ensure` options do not replace an existing query handle's
options. `ensure` returns the confirmed server baseline, even if a local edit
exists; an unconfirmed WRITE requires a new READ. Invalid key, time, or initial
data setup still rejects from `prefetch`. Editable results returned by
`load/fetch/ensure` are frozen copies; edit through the query ref.

Placeholder data and observer-specific selection live in a separate view
instead of the shared cache:

```ts
const view = client.view(
  {
    queryKey: ['account', 1],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api.readAccount(1, { signal }),
  },
  {
    placeholderData: previewAccount,
    select: account => account.address.city,
  }
);
view.ref.data.value; // this view's placeholder or selected current value
await view.query.load(); // explicit READ, as with client.query(...)
view.query.ref.address.city.value = 'Busan'; // edit the shared resource
view.dispose(); // releases the view and its owned query handle
```

`view.ref` and `view.watch` are readonly display state with `phase`,
`fetchStatus`, `isPlaceholder`, `error`, and `errorSource`. A placeholder is
observer-local and never enters `dehydrate()` or the editable resource. After a
first READ error it disappears; a refetch error retains previously loaded data.
`select` sees current local edits, but its result never replaces the cached
query shape. An optional `equals` compares selected values (default:
`Object.is`); select/comparison errors affect that view, not the shared query.
The fixed-key `view` does not start a READ automatically. For a reactive key or
dependent query, bind a `state-ref` source to `liveView`:

```ts
import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });
const live = client.liveView(
  input.watch,
  ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  { select: account => account.address.city }
);
input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // starts a READ automatically
live.ref.data.value; // selected current key only
live.ref.queryKey.value; // ['account', 1]
// After the baseline loads: live.query?.ref.address.city.value = 'Busan';
live.dispose();
```

`null` or `enabled: false` clears the display and releases the current query.
The stable, readonly `live.ref` exposes `enabled` and `queryKey`; `live.query`
is the current handle or `null`. Each source update reconnects with its new
options, including when the key is unchanged. The old handle is disposed. An
unowned in-flight READ is aborted and cannot install a late result; another
owner of the same key keeps its shared READ. Neither placeholder nor selected
display data enters the shared cache. One-way lifecycle wiring is available
through `connectReactView`, `connectPreactView`, `connectVueView`,
`connectSvelteView`, and `connectSolidView`. Each connector ends its UI
subscription on unmount; the owner of `live` calls `live.dispose()` when the
view itself is no longer needed. Edit actual data through `live.query?.ref`
after it loads.

For numbered pagination, include the page in the key supplied to `liveView`.
Each page then has its own cache entry. A `placeholderData` value is only a
display preview for the new key; it never becomes that page's server baseline.
Use `client.prefetch`, `fetch`, or `ensure` with the same page key to prepare it.

For an accumulating list, use one infinite query key:

```ts
const feed = client.infiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam, signal }) => api.readFeed(pageParam, { signal }),
  initialPageParam: 0,
  getNextPageParam: lastPage => lastPage.nextCursor,
  getPreviousPageParam: firstPage => firstPage.previousCursor,
  maxPages: 3,
});
await feed.load();
if (feed.hasNextPage()) await feed.fetchNextPage();
feed.ref.value.pages; // retained pages
feed.ref.value.pageParams; // matching cursors
feed.dispose();
```

`null` or `undefined` from a cursor callback means that direction has ended.
`fetchPreviousPage()` prepends a page. `maxPages` trims the opposite end when
adding a page, and a refetch reloads retained pages sequentially, recomputing
following cursors. Concurrent additions to the same key run in order; a forced
refetch can cancel a pending page READ, and its late response cannot enter the
cache. Different page keys can load in parallel. Infinite pages are readonly:
send edits with an explicit mutation and invalidate or refetch the list. The
page parameters must be JSON-compatible. The aggregate can be dehydrated when
its page data is JSON-compatible and no READ is pending; hydration restores its
infinite query kind. Handles sharing a key must use the same initial page
parameter and `maxPages` policy.

For the same aggregate, `fetchInfinite`, `prefetchInfinite`, and
`ensureInfinite` prepare the cache without retaining a query handle.
`prefetchInfinite` swallows READ failures, while `ensureInfinite` can return a
confirmed stale baseline. An unconfirmed baseline is checked by a READ.
These calls do not replace an active infinite query's reader or automatic
refetch policy. Use `infiniteView` for observer-local display state:

```ts
const feedOptions = {
  queryKey: ['feed'],
  queryFn: ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) =>
    api.readFeed(pageParam, { signal }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: { nextCursor: number | null }) =>
    lastPage.nextCursor,
};
await client.prefetchInfinite(feedOptions);
const cachedFeed = await client.ensureInfinite(feedOptions);
const feedView = client.infiniteView(feedOptions, {
  select: data => data.pages.length,
});
await feedView.query.load();
if (feedView.query.hasNextPage()) await feedView.query.fetchNextPage();
feedView.dispose();
```

The fixed-key infinite view uses the same readonly display state as `view`.
Its placeholder, selection, and comparison belong to that observer and do not
enter the shared cache. `view.query` exposes the infinite page methods. It
does not start a READ until `load()` or another page method is called.

Focus, reconnect, and polling policies become active after a handle's first
`load()` or `refetch()`. An active `liveView` performs that first load
automatically. Provide a client-scoped environment when the host has focus and
connectivity events. Call the browser adapter only where browser globals exist:

```ts
import { createBrowserSyncEnvironment } from '@stateref/sync';

const environment = createBrowserSyncEnvironment();
const client = createSyncClient({ environment });
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,
  refetchOnFocus: true, // default; stale data only
  refetchOnReconnect: 'always', // include fresh data
  refetchInterval: 60_000,
  refetchIntervalInBackground: false, // default
});
await account.load();
```

`false` disables a focus or reconnect policy. Events run only while the
environment is focused; online modes also require connectivity. Polling is
opt-in and pauses in the background unless explicitly enabled. Same-key observers and
already running READs share one request. Automatic results use the normal
resource rebase rules, so local edits remain and overlapping server changes
become conflicts. Linked WRITEs block automatic READs. Disposing the last
started observer removes the environment subscription, and disposing each
handle clears its polling timer. SSR clients create neither event subscriptions
nor polling timers. Without an environment there are no focus/reconnect events;
polling treats the host as focused and online.

Each query can choose `networkMode: 'online' | 'always' | 'offlineFirst'`.
`online` is the default: an offline READ stays pending with
`status.fetchStatus.value === 'paused'`, then resumes on reconnect. `always`
runs and retries offline; its default reconnect refetch policy is `false`,
though an explicit `refetchOnReconnect` can enable it. `offlineFirst` tries
the query function once while offline, allowing a local cache hit, and pauses
a failed retry until reconnect. `always` queries can also refetch on focus or
poll while offline. A paused request keeps its previous data and local edits;
invalidation or disposal cancels the wait. SSR treats the environment as
online. `navigator.onLine` is only a browser connectivity hint, so hosts can
inject their own `SyncEnvironment` and queries that do not need network access
can use `always`. Mutations retain their explicit retry and unknown-result
rules. Offline standalone commands can use the explicit queue below.

Clean server baselines can be stored with an app-owned string storage. Save
and restore are explicit operations, and restore requires a new, empty client:

```ts
import {
  createSyncClient,
  saveSyncSnapshot,
  restoreSyncSnapshot,
} from '@stateref/sync';

const options = { key: 'account-baseline', buster: 'api-v1', maxAge: 60_000 };
await saveSyncSnapshot(client, localStorage, options);
const restored = createSyncClient();
await restoreSyncSnapshot(restored, localStorage, options);
```

`saveSyncSnapshot` rejects dirty resources, pending READs, linked WRITEs and
unconfirmed baselines. Expired or differently busted snapshots are ignored
without deleting stored data. Malformed snapshots throw before changing the
client. `localStorage` is an example; `SyncStorage` also accepts asynchronous
methods. Storage keys must have one owner and should be scoped to the app's
current user and data partition.

To preserve local edits and an unconfirmed baseline, use the separate schema 2
recovery snapshot. It includes the server baseline, displayed value, change
IDs and conflict origins. Restore it into an empty client before opening
query handles:

```ts
import {
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';

const localOptions = { key: 'account-local', buster: 'api-v1', maxAge: 60_000 };
await saveLocalSyncSnapshot(client, localStorage, localOptions);
const recovered = createSyncClient();
await restoreLocalSyncSnapshot(recovered, localStorage, localOptions);
```

The local snapshot accepts only JSON-compatible, loaded data and rejects an
active READ, linked WRITE, or unloaded unconfirmed WRITE. Restore starts no
READ or WRITE. Recreate the query handle with its query function; a later READ
rebases the restored edit through the normal conflict rules. An unconfirmed
WRITE remains unconfirmed until a successful READ or explicit known server
value. Keep this storage key separate from the clean baseline and command
queue. A saved local snapshot does not contain an active mutation's DTO or
submission record and cannot resume a linked WRITE.

For one linked submission, keep its DTO and local recovery snapshot together
under another storage key. A submission may link several queries; stage the
exact selected changes per link, then explicitly send after the host is
online:

```ts
import { openPersistedLinkedMutation } from '@stateref/sync';

const linked = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
  isOnline: () => navigator.onLine,
});
await linked.stage(client, {
  id: 'city-42',
  input: { city: account.ref.address.city.value },
  idempotencyKey: 'city-42',
  links: [
    {
      query: account,
      ids: account
        .changes()
        .filter(change => change.path.join('.') === 'address.city')
        .map(change => change.id),
      accept: 'submitted',
    },
    { query: preferences, accept: 'refetch', onReject: 'remove' },
  ],
});
// null while offline; the handles must match the staged keys, in any order
const outcome = await linked.send(client, [account, preferences], save);

// On a new client, before opening query handles:
const restarted = createSyncClient();
const saved = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
});
saved.restore(restarted); // restores local data; does not send a WRITE
const restoredAccount = restarted.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});
```

`send` checks the staged query baseline and edits, writes an `inFlight`
marker and an unconfirmed recovery snapshot before calling `mutationFn`, and
records the result afterward. The stored format is schema 2; an earlier
single-link record is refused as an unsupported version, so change `buster`
when upgrading. A failed marker write prevents the WRITE. On
restart, `inFlight` becomes `unknown`; inspect and reconcile it with the
server before calling `discard()`. It is never replayed automatically. A
successful linked record stays available until discarded. Each link carries the
serializable `none`, `submitted`, or `refetch` acceptance policy and its own
rejection policy; `response.select` needs a function, so it still requires
direct `mutation.run`. `send` rechecks every link first and starts no WRITE if
any one of them changed, and the pre-WRITE recovery snapshot marks every linked
query unconfirmed. The result is recorded per job: if only some links fail to
reconcile, the job is `sync-error` and the links that already applied are not
rolled back. A pre-send edit or baseline change on any link requires discarding
and staging again. If the
result record cannot be saved, the WRITE may already have occurred and the
next startup treats its `inFlight` marker as unknown. Follow-up edits during
an active WRITE are captured after it settles when local dehydration succeeds.
Open the record with `checkpoint: true` to also keep those edits durable while
the WRITE is still running: the stored snapshot is refreshed on every local
change, bursts collapse into one trailing write, and a failed checkpoint leaves
the previous snapshot without cancelling the WRITE or the recorded result. A
checkpoint keeps every linked query marked unconfirmed, so a crash still
recovers into a state that is never replayed automatically. Checkpointing costs
one storage write per change, so it is off by default.

`client.dehydrateLocal()` refuses a query with an active READ or linked WRITE.
Pass `{ inFlight: 'unconfirmed' }` to store it conservatively instead — a linked
WRITE marks the query unconfirmed and invalidated, an active READ only
invalidated. That is the mode a checkpoint uses; the default stays `'reject'`. Save any remaining local edits to a separate local
snapshot before discarding a completed linked record. Use one writer per storage key and separate keys for
linked submissions, clean baselines, local snapshots, and standalone commands.

For an independent command, register a mutation handle and queue a JSON DTO
with a server-supported idempotency key. Call `resume()` after confirming the
host is online:

```ts
import { openPersistedMutationQueue } from '@stateref/sync';

const send = client.mutation({
  mutationFn: (input: { note: string }, { idempotencyKey }) =>
    api.sendNote(input, { idempotencyKey }),
});
const queue = await openPersistedMutationQueue({
  storage: localStorage,
  key: 'pending-notes',
  buster: 'api-v1',
  maxAge: 24 * 60 * 60 * 1000,
  commands: { send },
  isOnline: () => navigator.onLine,
});
await queue.enqueue({
  id: 'note-42',
  command: 'send',
  input: { note: 'Hello' },
  idempotencyKey: 'note-42',
});
await queue.resume();

// Or let a reconnect call resume() for you:
const stopAutoResume = queue.autoResume(environment, {
  onSettled: results => console.log(results.map(item => item.result.kind)),
  onError: error => report(error),
});
```

`autoResume(environment, handlers?)` automates only *when* `resume()` runs, never
which jobs may run: every rule below still applies. It reacts to `reconnect`,
not `focus`, checks `environment.isOnline()` first, and runs once immediately
when it attaches while already online. Runs never overlap and events arriving
during a run collapse into one trailing run. Results go to `onSettled`, a
failure of `resume()` itself to `onError`, and a throwing handler does not stop
later resumes. The returned disposer stops future runs, including one already
queued behind a running resume. An automatic resume never calls
`retryUnknown`, so an `unknown` job keeps blocking the queue until you decide.
A linked submission is deliberately excluded: sending one needs live query
handles and a local state only the app knows is still current, so it stays
explicit.

The queue writes an `inFlight` marker before every WRITE. On restart, an
`inFlight` job becomes `unknown`; it and later queued jobs are held. An unknown
job can be staged again only with `retryUnknown(id)`, which reuses its key.
Use that method only when the server guarantees idempotency for the key, or
after reconciling the result with the server. `discard(id)` is explicit.
Confirmed rejections remain available for inspection; successful jobs are
removed. Use a separate storage key for the clean baseline and command queue.
Commands older than `maxAge` remain queued and block later jobs until the
caller reviews or discards them. `discard(id)` cannot cancel an in-flight
server WRITE.
The queue does not serialize resource submissions, local edits, mutation
callbacks, or query handles. Recreate the command registry for each new client
and invalidate or refetch affected queries after a successful command.

Independent mutations run concurrently by default. Pass the same `scope`
string to `run` to execute those operations in start order, including their
callbacks; a failure does not block the next operation. A query permits one
linked operation at a time; callers sequence operations on that query by
awaiting the prior result and capturing its current edits again. A multi-query
link does not promise atomicity across servers or queries. The caller must map the
actual DTO to the captured changes honestly; the library cannot infer which
fields a free-form DTO saved. A result of `sync-error` must be reconciled with
a new READ or known server value, not by resending the successful WRITE.

`account.watch` and `account.watchStatus` use the `state-ref` Watch shape. `account.status` is available before the first load; accessing `ref` or `watch` before a successful load throws. A direct ref edit is local and never starts a network write. `load()` uses a fresh cached result when available, `refetch()` forces a read, and `invalidate()` makes the key stale and excludes an older in-flight response. `dispose()` releases that handle's subscriptions. A dirty cache entry remains until its edit is resolved; another handle with the same client and key sees the same edit.

Editable data defaults to a plain, acyclic tree with dense arrays. Arrays are tracked as one atomic field. Reserved proxy keys and direct mutation of an object returned by `.value` are rejected. Use `editable: false` for arbitrary readonly query data such as a `Date`; ref setters are then rejected. Readonly query objects should also be treated as immutable by the caller.

Defaults: `staleTime: 0`, inactive `gcTime: 5 minutes` (infinite for `createSyncClient({ ssr: true })`), three query retries in a client and zero in SSR. The client owns its cache; create a separate client for each SSR request. The `queryKey` must be an acyclic JSON-compatible array, with object key order ignored in its hash.

Fixed-key queries require an explicit `load()` call unless a mutation response,
`acceptServer`, or an active `liveView` populates the cache. A successful local
edit does not save to a server.
