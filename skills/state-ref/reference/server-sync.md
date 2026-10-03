# Server Sync (`@stateref/sync` 0.2)

Optional package: query cache, editable server resources and mutations on top of
state-ref. Use it only when `@stateref/sync` is installed. ESM only; requires
`state-ref ^3.1.0`.

## Client and query

```ts
import { createSyncClient } from '@stateref/sync';

const client = createSyncClient(); // one per app; one per request on the server

const account = client.query({
  queryKey: ['account', 1], // JSON-compatible array
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,
});

await account.load(); // a fixed key does not load by itself
account.ref.address.city.value = 'Busan'; // local edit, NOT a network write
account.isDirty(); // true
account.changes(); // server baseline -> local edit, with ids
account.status.dirty.value; // reactive status (see QueryStatus below)
account.dispose(); // release this handle
```

- `ref` / `watch` throw before the first successful load; `status` is always
  available.
- `load()` uses fresh cache, `refetch()` forces a READ, `invalidate()` marks stale.
- A later READ rebases local edits; overlapping server changes become conflicts
  (`status.conflicts`).
- Readonly data (e.g. containing `Date`): `editable: false`.
- Reactive key / dependent query: `client.query({ source: input.watch, resolve })`
  where `resolve` returns options or `null`. Check `display.enabled` before
  touching `ref`; with no active key, `ref`/`status` throw
  `This query has no active key.`
- Per-observer view: `select` / `placeholderData` produce `query.display` /
  `query.watchDisplay` (readonly). Use them with `connect*View`.
- Lists that grow: `client.infiniteQuery({ queryKey, queryFn, initialPageParam,
  getNextPageParam })`, then `fetchNextPage()`. Pages are readonly.

## Saving: capture, then run

```ts
import { MutationRejectedError } from '@stateref/sync';

const save = client.mutation({
  mutationFn: async (input: { city: string }, { signal, idempotencyKey }) => {
    const res = await api.saveCity(input, { signal, idempotencyKey });
    if (res.status === 409) {
      throw new MutationRejectedError('City rejected', await res.json());
    }
    return res.json();
  },
});

const submission = account.capture(); // freezes what this save submits
const result = await save.run(
  { city: submission.value.address.city }, // DTO may differ from query shape
  {
    links: [{ query: account, submission, accept: { kind: 'refetch' } }],
  }
);
switch (result.kind) {
  case 'success': break;
  case 'rejected': break; // server refused (MutationRejectedError); edits kept
  case 'unknown': break; // transport uncertain; edits kept, never auto-retried
  case 'sync-error': break; // WRITE ok, but acceptance/READ failed
}
```

- `accept` per link: `{ kind: 'refetch' }`, `{ kind: 'submitted' }`,
  `{ kind: 'response', select: data => ... }`, `{ kind: 'none' }` (default:
  keeps edits dirty and marks the query `unconfirmed`).
- Edits typed while the save runs are kept; only the captured ones are settled.
- `onReject: 'remove'` drops unchanged submitted edits on a confirmed rejection.
- An unlinked `run(input)` never touches resource edits.

## Showing "saving..."

- Query side: `account.status.pending.value > 0` - a linked WRITE is running
  for this query (separate from `dirty`).
- Command side: `save.status.pending.value > 0` - operations of this mutation
  handle in flight. `save.status.phase` is the **latest event**
  (`'idle' | 'pending' | 'success' | ...`), not "is anything running".
- In a UI, pass `account.watchStatus` / `save.watchStatus` to a connector.

## Do not

- Do not pass a string to `accept` in `run()` (`accept: 'refetch'`). TypeScript
  rejects it, and at runtime it silently acts like `{ kind: 'none' }` (edits stay,
  query `unconfirmed`). Strings are only for
  `openPersistedLinkedMutation(...).stage`.
- Do not edit between `capture()` and `run()`: the submission becomes stale and
  `run` fails with "Submission is stale. Capture the current edits again."
  Capture immediately before running.
- Do not start a second linked save on the same query before the first settles
  (it throws "A linked operation is already pending for this query."); await the
  first result and capture again.
- Do not use `retry` without an `idempotencyKey` the server honours.
- Do not treat every thrown error as a rejection: only `MutationRejectedError`
  produces `rejected`; anything else (or an abort) is `unknown`.
- Do not resend after `unknown` or `sync-error`; reconcile with a READ
  (`refetch()`) or `acceptServer(value)`.
- Do not share one client across SSR requests. On the server use
  `createSyncClient({ ssr: true })`, `load()`, then `dehydrate()`; in the browser
  call `hydrate(snapshot)` before creating query handles.
- Do not call `resolve()` on a query handle; it does not exist. (`resolve` is a
  draft method, and the `resolve` option of a reactive query is a key resolver.)

## Streaming (WebSocket, NDJSON)

```ts
import { ndjsonMessages, streamQuery, webSocketMessages } from '@stateref/sync';

const stream = streamQuery(report, {
  source: () => ndjsonMessages<Row>(signal => fetch('/report', { signal })),
  // or: source: () => webSocketMessages<Row>(new WebSocket(url)),
  reduce: (current, row) => ({ rows: [...(current?.rows ?? []), row.row] }),
  initialValue: () => ({ rows: [] }),
});
stream.status.value; // { state, received, queued, buffered, error }
stream.refetch(); // reopen the source; mode defaults to 'reset'
stream.refetch({ mode: 'replace' }); // 'reset' | 'append' | 'replace'
stream.close();
```

- Every message becomes a server baseline via `acceptServer`, so each
  intermediate state renders; local edits are rebased, overlaps become
  conflicts. `reduce` gets the server baseline, never local edits. Treat
  `current` as immutable and return a new value (inside a throttled or held
  batch it can be your previous, unfrozen result).
- `source` is a factory, called on start and on each `refetch()`.
- Every message is folded; it renders as it arrives except in a `replace`
  run or under `throttle`. `close()` and a `reset`/`replace` restart discard
  messages still held for a pending WRITE. `refetch({ mode })` only
  decides what a restarted run does with the data already shown: `reset`
  starts from `initialValue`, `append` keeps adding, `replace` swaps in once
  on completion (`buffered` counts the hidden messages; a failed run is
  dropped). The first run folds onto the current baseline.
- Do not pass `refetchMode` to `streamQuery`; the mode is a `refetch()`
  argument.
- `throttle: 100` (ms) or `throttle: 'frame'` coalesces screen updates for
  a busy source. No message is dropped: every one is folded, the first shows
  at once, and completion, an error or `close()` flush the rest immediately.
- Messages arriving while a linked WRITE is pending are held (`queued`) and
  folded after it settles - even if the source errors or completes meanwhile;
  the run settles (`error`/`complete`) after they land. A throwing `reduce`
  keeps the messages folded before it.
- `query.refetch()` is a READ through `queryFn`; it does not restart a stream.

## QueryStatus fields

`status` `'pending' | 'success' | 'error'`, `fetchStatus`
`'idle' | 'fetching' | 'paused'`, `loaded`, `error`, `updatedAt`,
`invalidated`, `dirty`, `conflicts`, `version`, `pending` (linked WRITEs),
`unconfirmed` (a WRITE may have changed the server without a confirmed baseline).

## More

Refetch on focus/reconnect/interval (`createBrowserSyncEnvironment`),
`networkMode`, persistence (`saveSyncSnapshot`, `saveLocalSyncSnapshot`,
`openPersistedLinkedMutation`, `openPersistedMutationQueue`) and cache
inspection (`subscribeCache`, `subscribeMutations`) are in
`node_modules/@stateref/sync/README.md` and the docs site's Server Sync chapters.
