# state-ref Solid Connector (connectSolid)

## Usage with Solid

Solid does not directly use `stateRef` but returns Solid's built-in reactive [Signal](https://www.solidjs.com/docs/latest/api#basic-reactivity) synchronized with the `stateRef` state value.

You can customize it by referring to the [connectSolid implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-solid/src/index.ts).


### profileStore.ts

```typescript
import { connectSolid } from "@stateref/connect-solid";
// ... same as React example
export const useProfileStore = connectSolid(watch);
```

### UserComponent.tsx

```tsx
import { useProfileStore } from 'profileStore';

function UserComponent() {
    const [age, setAge] = useProfileStore<number>(store => store.john.age);

    function increaseAge() {
      setAge(age => age + 1);
    }

    return (
      <button onClick={increaseAge}>
          john's age: {age()}
      </button>;
    );
}
```

If Signal needs to reference and modify an object from the store, the `copyable` function is available to assist with `copyOnWrite`.

```typescript
import { copyable } from "state-ref";
const [profileObj, setProfileObj] = useProfileStore(stateRef => stateRef);

function handleClick() {
   setProfileObj(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

## Supported versions

Solid 1.9 (`solid-js ^1.9.1`).

## Writing rules

- The setter writes the store directly and synchronously, including a functional update: `setUser(prev => ({ ...prev, name: 'Jane' }))`.
- **The accessor returns a frozen copy of an object or array.** `user().name = 'x'`, or a functional update that mutates `prev` and returns it, throws a TypeError and the store is untouched - neither passes through the connector.
- A server render is detected with `isServer` and subscribes to nothing.

## Sync queries

For server data in component code, use `createSyncQuery` from the ESM-only `@stateref/connect-solid/sync` entry (added in 1.5.0). It needs `@stateref/sync` 0.3 or later next to the connector:

```sh
npm install state-ref @stateref/sync @stateref/connect-solid
```

Call it in the component body. The component owns the query for its lifetime: it loads when first selected, follows the key in its props and releases when its owner is disposed.

```tsx
import { Show } from 'solid-js';
import { createSyncQuery } from '@stateref/connect-solid/sync';
import { client } from './client'; // createSyncClient(), one per browser app

type Account = { name: string; city: string };

function AccountCard(props: { id: number }) {
  const [account, q] = createSyncQuery(client, () => {
    const id = props.id;
    return {
      queryKey: ['account', id],
      queryFn: ({ signal }): Promise<Account> => api.readAccount(id, { signal }),
      staleTime: 30_000,
    };
  });
  const status = account(ref => ref.status.value); // Accessor<...>
  const name = account(ref => ref.data.name.value);

  const rename = (value: string) => {
    const handle = q.handle();
    if (handle?.status.value.loaded) handle.ref.name.value = value; // local edit
  };
  return (
    <Show when={status() !== 'pending'} fallback={<p>Loading…</p>}>
      <input
        value={name() ?? ''}
        onInput={event => rename(event.currentTarget.value)}
      />
      <button onClick={() => void q.refetch().catch(() => {})}>Refresh</button>
    </Show>
  );
}
```

`account(select)` returns a Solid accessor of what `select` reads from the display state (`status`, `fetchStatus`, `loaded`, `error`, `errorSource`, `data`, `dirty`, `queryKey`, `enabled`, ...); read leaves with `.value` inside `select`. The first selection attaches the query, and every selection shares that one handle. `q` is the same object for the component's life:

- `q.refetch()` forces a READ and returns a Promise. It rejects with `This query observer is not attached.` before the first selection, while disabled and on the server.
- `q.invalidate()` marks the key stale and, while attached and enabled, reads it again. `client.invalidate(key)` only marks it stale.
- `q.handle()` returns the query's own handle, or `null` before the first selection, while disabled and on the server. Edit through `handle.ref` once it has loaded, and pass the handle to mutation `links`. Never dispose it: the hook owns it.

How it behaves:

- **Pass an accessor to follow props or signals**; new options are confirmed synchronously, before computations that read the display run. A plain options object is fixed for the component's life.
- A new `queryKey` shows the new key at once (its cached data, or `pending`), never the previous key's data, and a late answer for the old key never shows. Inline `queryFn` and `select` literals are fine. A `select` option that returns a Map, Set, class instance or function republishes whenever the accessor reruns: memoize it or pass `equals`.
- The query opens on attach, loads if stale and shares a READ already in flight. Disposing the owner releases the handle one macrotask later, so a route swap neither cancels nor repeats a READ. In tests with fake timers, `await vi.advanceTimersByTimeAsync(0)` before asserting that the handle is gone.
- Use `status() === 'pending'` for loading UI; the first `fetchStatus` is the cache as it is (`'idle'` before the READ starts).
- Dependent query: `queryKey: ['user', id ?? null], enabled: id != null` in the accessor. A key holding `undefined` or a state-ref ref shows `status: 'error'` with `errorSource: 'source'` instead of throwing. `enabled: false` shows idle and owns nothing.
- Server rendering: create `createSyncClient({ ssr: true })` per request, `await client.prefetch(options)` before rendering, and send `client.dehydrate()`. In the browser, call `client.hydrate(snapshot)` before hydrating. On the server, selections read without subscribing, attaching or READing.

More on queries, mutations and SSR: the [sync README](https://github.com/superlucky84/state-ref/blob/main/packages/sync/README.md).

## Readonly query views

`createSyncQuery` is the default in components. When a store or service owns a query beyond one component (it calls `client.query`, `load()` and `dispose()` itself), show it with a view instead.

`connectSolidView(query.watchDisplay)(select)` returns a Solid accessor for the display of a `@stateref/sync` query. Dispose the owning root to end its subscription; whoever opened the query calls `query.dispose()`. Edit actual data through `query.ref` after it loads.

```tsx
const city = connectSolidView(account.watchDisplay)(display => display.data.value);
const label = () => city() ?? 'Loading';
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
