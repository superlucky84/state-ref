# Server Sync (`@stateref/sync` 0.1)

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
