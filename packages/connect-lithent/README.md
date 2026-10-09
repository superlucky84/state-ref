# @stateref/connect-lithent

Lithent query views and component-owned sync queries. Use `lithent@^1.24.0`, `state-ref@^3.1.0`, and `@stateref/sync@^0.3.0` for the optional ESM `./sync` entry. This package is prepared on the sync-query branch and has not been published yet.

Both the base and `./sync` entries use ESM imports.

```sh
pnpm add lithent state-ref @stateref/sync @stateref/connect-lithent
```

Call `createSyncQuery` once inside a `mount` or `lmount` mounter. It returns a readonly `[account, q]` tuple. `account()` gives the current readonly display; read leaf values with `.value`. Pass a getter to follow live props, capturing the current id in each set of options. A fixed options object works for a fixed key. Keep the client fixed for the component's lifetime.

<!-- lithent-example: lithentQueryExample -->
```ts
import { h, mount } from 'lithent';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

type Account = { name: string; age: number };
const client = createSyncClient(); // one client per browser app

export const AccountDetail = mount<{ id?: number }>((_renew, props) => {
  const [account, q] = createSyncQuery(client, () => {
    const id = props.id ?? null;
    return {
      queryKey: ['account', id],
      enabled: id !== null,
      staleTime: 30_000,
      queryFn: async ({ signal }): Promise<Account> => {
        const response = await fetch('/api/accounts/' + id, { signal });
        if (!response.ok) throw new Error('Could not read account');
        return response.json();
      },
    };
  });

  const editName = (event: Event) => {
    const handle = q.handle();
    if (handle?.status.value.loaded)
      handle.ref.name.value = (event.target as HTMLInputElement).value;
  };

  return () => h('section', {},
    h('p', {}, account().data.name.value ?? account().status.value),
    h('input', {
      value: account().data.name.value ?? '',
      disabled: !account().loaded.value,
      onInput: editName,
    }),
    h('button', { onClick: () => void q.refetch().catch(() => {}) }, 'Refresh'),
    h('button', { onClick: () => q.invalidate() }, 'Invalidate'),
  );
});
```

The observer subscribes and loads after mount: fresh cached data needs no READ, and a pending READ is shared. Before subscription the cache's actual `fetchStatus` is `idle`. Unmount aborts the subscription immediately and releases its handle on the observer's schedule. Other owners keep their data and request. A props key change shows the new key's cached data or pending state before confirming it after commit; the previous key's late answer cannot replace it.

Editing through `q.handle().ref` is local. `q.handle()` is null before attachment, while disabled and after unmount, and its `ref` requires a successful load. The helper owns this borrowed handle: do not dispose it. `q.refetch()` forces a READ and returns a Promise; handle rejection (the example already displays the query error). `q.invalidate()` marks the key stale and starts a READ when attached and enabled. Refetch keeps local edits.

For a server WRITE, capture the current handle and pass it to mutation links. This example assumes the server returns the full accepted Account. Inspect the mutation result (`success`, `rejected`, `unknown`, `sync-error`) before reporting success; an uncertain WRITE must not be automatically resent.

<!-- lithent-example: lithentSaveExample -->
```ts
import type { QueryObserverControls, SyncClient } from '@stateref/sync';

type Account = { name: string; age: number };

// Call once in the mounter: const save = accountSave(client, q).
export function accountSave(client: SyncClient, q: QueryObserverControls<Account>) {
  const mutation = client.mutation({
    mutationFn: async (input: { id: unknown; name: string }, { signal }): Promise<Account> => {
      const response = await fetch('/api/accounts/' + input.id, {
        method: 'PUT', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.name }),
      });
      if (!response.ok) throw new Error('Could not save account');
      return response.json();
    },
  });
  return async () => {
    const handle = q.handle();
    if (!handle?.status.value.loaded) return;
    const submission = handle.capture();
    return mutation.run(
      { id: handle.queryKey[1], name: submission.value.name },
      { links: [{ query: handle, submission,
        accept: { kind: 'response', select: response => response },
        onReject: 'keep',
      }] },
    );
  };
}
```

Create a request-scoped `ssr: true` client, populate it before rendering, and hydrate the browser client before mounting components. The component's server accessor does not subscribe, create owners or start another READ.

<!-- lithent-example: lithentSsrExample -->
```ts
import { h, mount } from 'lithent';
import { renderToString } from 'lithent/ssr';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@stateref/connect-lithent/sync';

type Account = { name: string; age: number };

// data was loaded by the server's request handler.
export async function renderAccount(id: number, data: Account) {
  const client = createSyncClient({ ssr: true }); // one per request
  const options = {
    queryKey: ['account', id], queryFn: () => data, staleTime: 30_000,
  };
  await client.prefetch(options);
  const Detail = mount(() => {
    const [account] = createSyncQuery(client, options);
    return () => h('p', {}, account().data.name.value ?? '');
  });
  return { html: renderToString(h(Detail, {})), snapshot: client.dehydrate() };
}
// Browser: hydrate snapshot before creating/mounting AccountDetail.
```

For an existing explicit query, call `connectLithentView(query.watchDisplay)` inside the mounter and read `view().data.name.value`. It manages the UI subscription; the owner who called `client.query()` still loads and disposes that handle.

Ordinary `state-ref` still works with `watch(renew)` directly. For a sync observer use this helper: bare `observer.watch(renew)` only notices an unmount on a later notification, so a pending request, polling and ownership can remain alive.

To use `lithent-concurrent@0.1.3`, install it alongside Lithent and alias only the exact core import in the application bundler:

```js
resolve: {
  alias: [{ find: /^lithent$/, replacement: 'lithent-concurrent' }],
}
```

Keep `lithent/helper`, `lithent/ssr` and JSX subpaths unchanged; apply the same core alias on server and client. The connector forwards display changes to the concurrent renderer's version signal while rendering only watched paths. This inherits Lithent's own retry limits: builds with mounts or update effects and exhausted retries can still commit mixed values. A query options getter uses an update callback, so do not describe this integration as React's concurrent snapshot guarantee.

Run `node scripts/connector-matrix.mjs lithent` from the repository root for the base and concurrent cells. The existing five framework guides remain available from the [sync README](../sync/README.md).
