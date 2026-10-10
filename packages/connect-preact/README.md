# state-ref Preact Connector (connectPreact)

## Usage with Preact

It can be easily integrated with other UI libraries, and below is an example using Preact.

### profileStore.ts

> Create the store and pass the `watch` to `connectPreact` to create a state that can be used in components.

```typescript
import { connectPreact } from "@stateref/connect-preact";
import { createStore } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

const watch = createStore<People>({
    john: {
        age: 20,
        house: [
            { color: "red", floor: 5 },
            { color: "red", floor: 5 },
        ],
    },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
    sara: { age: 26, house: [{ color: "red", floor: 5 }] },
});

export const useProfileStore = connectPreact(watch);
```

### UserComponent.tsx

```tsx
import { useProfileStore } from 'profileStore';

function UserComponent() {
  const {
    john: { age: ageRef },
  } = useProfileStore();

  const increaseAge = () => {
    ageRef.value += 1;
  };

  return (
    <button onClick={increaseAge}>
        john's age: {ageRef.value}
    </button>;
  );
}
```

In the example above, `useProfileStore` directly returns `stateRef`, allowing easy access to values and modification through `copyOnWrite`.

You can create your own custom connection pattern by referring to the [connectPreact implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-preact/src/index.ts).

## Supported versions

Preact 10 (`preact ^10.0.0`). Only `preact/hooks` is used - no `preact/compat`.

## How the hook subscribes

- The subscription is made in an effect, after commit, and released by its cleanup; a render that suspends leaves nothing behind.
- **A mount renders twice**, as with the React connector: the first render paints with the correct values, the second collects the paths the component reads.
- A server render runs no effects and subscribes to nothing.

## Sync queries

For server data in component code, use `useSyncQuery` from the ESM-only `@stateref/connect-preact/sync` entry (added in 10.5.0). It needs `@stateref/sync` 0.3 or later next to the connector:

```sh
npm install state-ref @stateref/sync @stateref/connect-preact
```

The component owns the query for its lifetime: it loads on mount, follows the key in its props and releases on unmount.

```tsx
import { createSyncClient } from '@stateref/sync';
import { useSyncQuery } from '@stateref/connect-preact/sync';

type Account = { name: string; city: string };
const client = createSyncClient(); // one per browser app

function AccountCard({ id }: { id: number }) {
  const [account, q] = useSyncQuery(client, {
    queryKey: ['account', id],
    queryFn: ({ signal }): Promise<Account> => api.readAccount(id, { signal }),
    staleTime: 30_000,
  });

  if (account.status.value === 'pending') return <p>Loading…</p>;
  if (!account.loaded.value) return <p role="alert">Could not load the account.</p>;

  const rename = (name: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = name; // local edit
  };
  return (
    <section>
      <input
        value={account.data.name.value ?? ''}
        onInput={event => rename(event.currentTarget.value)}
      />
      <button onClick={() => void q.refetch().catch(() => {})}>Refresh</button>
    </section>
  );
}
```

`account` is the readonly display state (`status`, `fetchStatus`, `loaded`, `error`, `errorSource`, `data`, `dirty`, `queryKey`, `enabled`, ...). Read leaves with `.value`; only the paths a render reads re-render the component. `q` is the same object for the component's life:

- `q.refetch()` forces a READ and returns a Promise. It rejects with `This query observer is not attached.` before mount, while disabled and on the server.
- `q.invalidate()` marks the key stale and, while attached and enabled, reads it again. `client.invalidate(key)` only marks it stale.
- `q.handle()` returns the query's own handle, or `null` before mount, while disabled and on the server. Edit through `handle.ref` once it has loaded, and pass the handle to mutation `links`. Never dispose it: the hook owns it.

How it behaves:

- Pass the options object on every render. Inline `queryFn` and `select` literals are fine; changing `staleTime` or `refetchInterval` reopens the same key without cancelling its READ. A `select` that returns a Map, Set, class instance or function republishes on every commit: memoize it or pass `equals`.
- A new `queryKey` shows the new key from the first render (its cached data, or `pending`), never the previous key's data, and a late answer for the old key never shows. One more render after the change commits collects the new key's paths.
- Rendering creates nothing. The mount effect attaches: it opens the query, loads it if stale and shares a READ already in flight. Because Preact runs effects after paint, the last unmount releases the handle after the next paint (a 200 ms timer stands in when no frame comes), so a route swap that replaces one observer of a key with another neither cancels nor repeats its READ. Tests must wait for that release before asserting that the handle is gone (`waitFor`, or with fake timers advance them past 200 ms).
- Use `status.value === 'pending'` for loading UI. The first render's `fetchStatus` is the cache as it is (`'idle'` before the READ starts), so the server and the first client render match.
- Dependent query: `queryKey: ['user', id ?? null], enabled: id != null`. A key holding `undefined` or a state-ref ref does not throw in render; it shows `status: 'error'` with `errorSource: 'source'`. `enabled: false` shows idle and owns nothing.
- The client is fixed for the component's lifetime. Passing another one throws `This query observer is bound to another client.`; to switch clients, remount the component (for example with a new `key` prop).
- Server rendering: create `createSyncClient({ ssr: true })` per request, `await client.prefetch(options)`, render, and send `client.dehydrate()`. In the browser, call `client.hydrate(snapshot)` before hydrating. The hook never attaches or READs on the server.

More on queries, mutations and SSR: the [sync README](https://github.com/superlucky84/state-ref/blob/main/packages/sync/README.md).

## Readonly query views

`useSyncQuery` is the default in components. When a store or service owns a query beyond one component (it calls `client.query`, `load()` and `dispose()` itself), show it with a view instead.

Use `connectPreactView(query.watchDisplay)` for the display of a `@stateref/sync` query. The returned hook exposes readonly display state; edit actual data through `query.ref` after it loads. Unmounting ends this component's subscription; whoever opened the query calls `query.dispose()`.

```tsx
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  select: account => account.address.city,
});
const useCity = connectPreactView(account.watchDisplay);

function AccountCity() {
  const display = useCity();
  return <span>{display.data.value ?? 'Loading'}</span>;
}
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
