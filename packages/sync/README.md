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
display data enters the shared cache. Connector-specific lifecycle wiring is
still pending.

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
`acceptServer`, or an active `liveView` populates the cache. Automatic focus/reconnect/polling and
persistence are later work; a successful local edit does not save to a server.
