# state-ref Svelte Connector (connectSvelte)

## Usage with Svelte

While React and Preact's `useProfile` function directly returns `stateRef`, SvelteConnect returns Svelte's built-in reactive [Writable](https://svelte.dev/docs/svelte-store#writable) synchronized with the `stateRef` state value.

Below is a usage example.

### profileStore.ts

```typescript
import { connectSvelte } from "@stateref/connect-svelte";
// ... same as React example
export const useProfileStore = connectSvelte(watch);
```

### UserComponent.svelte

```svelte
<script lang="ts">
import { useProfileStore } from 'profileStore';
const age = useProfileStore<number>(stateRef => stateRef.john.age);

function handleClick() {
  age.update(n => n + 1);
}
</script>

<button on:click={handleClick}>
    john's age is {$age}
</button>
```

If Writable needs to reference and modify an object from the store, the `copyable` function is available to assist with `copyOnWrite`.

```typescript
import { copyable } from "state-ref";
const profileObj = useProfileRef(stateRef => stateRef);

function handleClick() {
   profileObj.update(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

You can customize it by referring to the [connectSvelte implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-svelte/src/index.ts).

## Supported versions

Svelte 4 and 5 (`svelte ^4.0.0 || ^5.0.0`). The package major follows the newest Svelte it supports, so 5.x still works with Svelte 4. The store API works in both.

## Writing rules

- `$user.name = 'Jane'` is a real store write: Svelte compiles it into `user.set(...)`, which passes through the connector, and the connector hands Svelte a copy, so the store changes only when that `set` arrives.
- When the component is destroyed, the store stops writing back.

## Svelte 5 runes

`@stateref/connect-svelte/runes` is a separate, ESM-only entry for Svelte 5 (`svelte/reactivity` does not exist in Svelte 4).

```ts
import { createStore } from 'state-ref';
import { connectSvelteRunes } from '@stateref/connect-svelte/runes';

const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectSvelteRunes(watch);
```

```svelte
<script lang="ts">
  import { useStore } from './store';
  const name = useStore(s => s.user.name);
</script>

<p>{name.value}</p>
<button onclick={() => (name.value = 'Jane')}>Rename</button>
```

- It subscribes while a template, `$effect` or `$derived` reads `.value`, and releases when the last reader goes away.
- Assigning `.value` writes the store synchronously. A selected object or array is a frozen copy, so a nested mutation throws.
- It is not tied to a component: a module-level selection works, and a write through it always reaches the store.

## Sync queries

For server data in component code, use `createSyncQuery` from the ESM-only `@stateref/connect-svelte/sync` entry (added in 5.1.0). It needs `@stateref/sync` 0.3 or later next to the connector:

```sh
npm install state-ref @stateref/sync @stateref/connect-svelte
```

It uses the store API (Svelte 4 and 5); there is no runes entry for sync queries. Call `createSyncQuery` and its selections during component initialization. The component owns the query for its lifetime: it loads when first selected, follows the key in its options store and releases on destroy.

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';
  import { client } from './client'; // createSyncClient(), one per browser app

  type Account = { name: string; city: string };
  export let id: number;

  const optionsFor = (id: number) => ({
    queryKey: ['account', id],
    queryFn: ({ signal }: { signal: AbortSignal }): Promise<Account> =>
      api.readAccount(id, { signal }),
    staleTime: 30_000,
  });
  const options = writable(optionsFor(id));
  $: options.set(optionsFor(id));

  const [account, q] = createSyncQuery(client, options);
  const status = account(ref => ref.status.value); // Readable<...>
  const name = account(ref => ref.data.name.value);

  function rename(event: Event) {
    const handle = q.handle();
    if (handle?.status.value.loaded)
      handle.ref.name.value = (event.target as HTMLInputElement).value; // local edit
  }
</script>

{#if $status === 'pending'}
  <p>Loading…</p>
{:else}
  <input value={$name ?? ''} on:input={rename} />
  <button on:click={() => q.refetch().catch(() => {})}>Refresh</button>
{/if}
```

`account(select)` returns a Svelte `Readable` of what `select` reads from the display state (`status`, `fetchStatus`, `loaded`, `error`, `errorSource`, `data`, `dirty`, `queryKey`, `enabled`, ...); read leaves with `.value` inside `select`. Each selection subscribes when it is created, so the first one attaches the query, and every selection shares that one handle. `q` is the same object for the component's life:

- `q.refetch()` forces a READ and returns a Promise. It rejects with `This query observer is not attached.` before the first selection, while disabled and on the server.
- `q.invalidate()` marks the key stale and, while attached and enabled, reads it again. `client.invalidate(key)` only marks it stale.
- `q.handle()` returns the query's own handle, or `null` before the first selection, while disabled and on the server. Edit through `handle.ref` once it has loaded, and pass the handle to mutation `links`. Never dispose it: the hook owns it.

How it behaves:

- **Options are a plain object (fixed for the component's life) or a `Readable` options store** (`writable`, `derived`). A plain getter is not tracked. With a `writable`, `$: options.set(...)` follows props as above.
- A new `queryKey` shows the new key at once (its cached data, or `pending`), never the previous key's data, and a late answer for the old key never shows. A `select` option that returns a Map, Set, class instance or function republishes whenever the store emits new options: memoize it or pass `equals`.
- The query opens on attach, loads if stale and shares a READ already in flight. Destroying the component releases the handle one macrotask later, so a route swap neither cancels nor repeats a READ. In tests with fake timers, `await vi.advanceTimersByTimeAsync(0)` before asserting that the handle is gone.
- Use `$status === 'pending'` for loading UI; the first `fetchStatus` is the cache as it is (`'idle'` before the READ starts).
- Dependent query: `queryKey: ['user', id ?? null], enabled: id != null`. A key holding `undefined` or a state-ref ref shows `status: 'error'` with `errorSource: 'source'` instead of throwing. `enabled: false` shows idle and owns nothing.
- **Server rendering needs `createSyncClient({ ssr: true })`, one per request.** The store API subscribes during a server render too, so with a plain client the render would open the query and start a READ. An `ssr: true` client never attaches or READs: fill it before rendering (`await client.prefetch(options)`), send `client.dehydrate()`, and call `client.hydrate(snapshot)` on the browser client before hydrating.

More on queries, mutations and SSR: the [sync README](https://github.com/superlucky84/state-ref/blob/main/packages/sync/README.md).

## Readonly query views

`createSyncQuery` is the default in components. When a store or service owns a query beyond one component (it calls `client.query`, `load()` and `dispose()` itself), show it with a view instead.

`connectSvelteView(query.watchDisplay)(select)` returns a Svelte `Readable` for the display of a `@stateref/sync` query. Call it during component initialization. Destroying the component ends its subscription; whoever opened the query calls `query.dispose()`. Edit actual data through `query.ref` after it loads.

```svelte
<script lang="ts">
  const city = connectSvelteView(account.watchDisplay)(display => display.data.value);
</script>
<span>{$city ?? 'Loading'}</span>
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
