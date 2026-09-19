# @stateref/sync

Optional query cache and editable resource package for `state-ref`. Importing `state-ref` alone does not load this package. The package is currently an ESM entry point and has no draft or TanStack runtime dependency.

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
account.dispose();
```

`account.watch` and `account.watchStatus` use the `state-ref` Watch shape. `account.status` is available before the first load; accessing `ref` or `watch` before a successful load throws. A direct ref edit is local and never starts a network write. `load()` uses a fresh cached result when available, `refetch()` forces a read, and `invalidate()` makes the key stale and excludes an older in-flight response. `dispose()` releases that handle's subscriptions. A dirty cache entry remains until its edit is resolved; another handle with the same client and key sees the same edit.

Editable data defaults to a plain, acyclic tree with dense arrays. Arrays are tracked as one atomic field. Reserved proxy keys and direct mutation of an object returned by `.value` are rejected. Use `editable: false` for arbitrary readonly query data such as a `Date`; ref setters are then rejected. Readonly query objects should also be treated as immutable by the caller.

Defaults: `staleTime: 0`, inactive `gcTime: 5 minutes` (infinite for `createSyncClient({ ssr: true })`), three query retries in a client and zero in SSR. The client owns its cache; create a separate client for each SSR request. The `queryKey` must be an acyclic JSON-compatible array, with object key order ignored in its hash.

This phase requires an explicit `load()` call. Automatic focus/reconnect/polling, mutation, submitted-edit reconciliation, and persistence are later work; a successful local edit does not save to a server.
