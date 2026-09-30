The first release of `@stateref/sync`: an optional query cache, editable resource, and mutation package for `state-ref`.

**ESM only. Requires `state-ref ^3.1.0`.** It has no TanStack runtime dependency, and importing the core alone does not load sync.

## Query cache and editable resources

- `createSyncClient()` creates an isolated client for an app or an SSR request. Query handles with the same client and key share cached data and local edits.
- `client.query({ queryKey, queryFn })` exposes `load()`, an editable `ref`, and `isDirty()` / `changes()` against the accepted server baseline. Local edits are explicit ref writes; they do not automatically send a mutation.
- Fetching, prefetching, cache freshness, observer-specific selection and placeholders, reactive query keys, and dependent queries support different loading and display flows.
- Automatic refetch on focus, reconnect, and interval is available with a client environment, including `createBrowserSyncEnvironment()` for browsers.
- Pagination and infinite queries are supported. Infinite query pages are readonly; edit them with an explicit mutation followed by invalidation or refetch.
- `subscribeCache` / `inspectCache` and `subscribeMutations` / `inspectMutations` expose metadata for tools and integrations.

```ts
import { createSyncClient } from '@stateref/sync';

const client = createSyncClient(); // one per app or SSR request
const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }) => {
    const response = await fetch('/account/1', { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<{ address: { city: string } }>;
  },
});

await account.load();
account.ref.address.city.value = 'Busan';
account.isDirty(); // true; no server WRITE has been sent
account.changes(); // accepted server baseline -> current edit
account.dispose(); // release the handle when its owner is finished
```

## Mutations and reconciliation

- `query.capture()` freezes the value, changes, and version being submitted. A mutation's DTO can have a different shape from query data.
- `client.mutation(...).run(input, { links })` explicitly declares affected queries and how each result is accepted: `none`, `submitted`, `response`, or `refetch`. Edits made while a save is pending are preserved.
- An unlinked mutation runs independently and does not clear resource edits.
- Results distinguish `success`, `sync-error` (the WRITE succeeded but reconciliation failed), `rejected` (explicit server refusal via `MutationRejectedError`), and `unknown` (uncertain transport outcome). An unknown outcome is not automatically retried; explicit retry requires a server-supported `idempotencyKey`.

## SSR and persistence

- SSR hydration transfers settled, clean server baselines between separate clients.
- Separate persistence flows cover clean cache snapshots, local-edit recovery, and staged linked-mutation recovery. Restoring data does not silently resend a WRITE.
- Browser focus and connectivity behavior is supplied through an explicit environment adapter.

For an edit-then-apply UI, combine a resource ref with `createDraft` from `state-ref/draft`. Applying the draft is a local merge; capture and submit the resulting resource edits through a separate mutation.

## Install

```sh
pnpm add state-ref@3.1.0 @stateref/sync@0.1.0
```

[Server sync guide](https://superlucky84.github.io/state-ref/#/guide/sync) · [Mutation guide](https://superlucky84.github.io/state-ref/#/guide/sync-mutation) · [Persistence and SSR](https://superlucky84.github.io/state-ref/#/guide/sync-persistence) · [Package README](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/packages/sync/README.md) · [Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0)
