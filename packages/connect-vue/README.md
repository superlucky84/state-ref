# state-ref Vue Connector (connectVue)

## Usage with Vue

In Vue, the store is connected and returns Vue's built-in reactive [Reactive](https://ko.vuejs.org/api/reactivity-core#reactive) synchronized with the `stateRef` state value.

You can customize it by referring to the [connectVue implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-vue/src/index.ts).

### profileStore.ts

```typescript
import { connectVue } from "@stateref/connect-vue";
// ... same as React example
export const useProfileStore = connectVue(watch);
```

### UserComponent.vue

```vue
<script setup lang="ts">
import { useProfileStore } from 'profileStore';

const age = useProfileStore<number>(store => store.john.age);

const incrementFromProfile = () => {
  // This looks the same as stateRef, but it's a Reactive value in Vue.
  age.value += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    john's age is: {{ age.value }}
  </button>
</template>
```

## Supported versions

Vue 3.2 and later (`vue ^3.2.0`); teardown uses `onScopeDispose`, which arrived in 3.2.

## Writing rules

- Assigning `.value` writes the store synchronously.
- **A selected object or array is readonly.** `user.value.name = 'x'` is refused with Vue's readonly warning in development and the store is untouched. Select the leaf (`useStore(s => s.user.name).value = 'x'`) or replace the whole value (`user.value = { ...user.value, name }`). The rule: a write that passes through the connector reaches the store; a change that does not is refused.
- The subscription follows the scope the connector was called in - a component's setup, or an `effectScope` a composable runs in - and a write after that scope stops goes nowhere.

## Sync queries

For server data in component code, use `useSyncQuery` from the ESM-only `@stateref/connect-vue/sync` entry (added in 3.5.0). It needs `@stateref/sync` 0.3 or later next to the connector:

```sh
npm install state-ref @stateref/sync @stateref/connect-vue
```

Call it in `setup`. The component owns the query for its lifetime: it loads when first selected, follows the key in its props and releases when the scope ends.

```vue
<script setup lang="ts">
import { useSyncQuery } from '@stateref/connect-vue/sync';
import { client } from './client'; // createSyncClient(), one per browser app

type Account = { name: string; city: string };
const props = defineProps<{ id: number }>();

const [account, q] = useSyncQuery(client, () => {
  const id = props.id;
  return {
    queryKey: ['account', id],
    queryFn: ({ signal }): Promise<Account> => api.readAccount(id, { signal }),
    staleTime: 30_000,
  };
});
const status = account(ref => ref.status.value); // Readonly<Ref<...>>
const name = account(ref => ref.data.name.value);

const rename = (event: Event) => {
  const handle = q.handle();
  if (handle?.status.value.loaded)
    handle.ref.name.value = (event.target as HTMLInputElement).value; // local edit
};
</script>

<template>
  <p v-if="status === 'pending'">Loading…</p>
  <section v-else>
    <input :value="name ?? ''" @input="rename" />
    <button @click="q.refetch().catch(() => {})">Refresh</button>
  </section>
</template>
```

`account(select)` returns a readonly Vue ref of what `select` reads from the display state (`status`, `fetchStatus`, `loaded`, `error`, `errorSource`, `data`, `dirty`, `queryKey`, `enabled`, ...); read leaves with `.value` inside `select`. The first selection attaches the query, and every selection shares that one handle. `q` is the same object for the component's life:

- `q.refetch()` forces a READ and returns a Promise. It rejects with `This query observer is not attached.` before the first selection, while disabled and on the server.
- `q.invalidate()` marks the key stale and, while attached and enabled, reads it again. `client.invalidate(key)` only marks it stale.
- `q.handle()` returns the query's own handle, or `null` before the first selection, while disabled and on the server. Edit through `handle.ref` once it has loaded, and pass the handle to mutation `links`. Never dispose it: the hook owns it.

How it behaves:

- **Pass a getter to follow props or refs**; Vue tracks it and confirms new options before the next render. A plain options object is fixed for the component's life. Refs inside a plain object are not unwrapped (unlike TanStack Vue Query): read `.value` inside a getter. A ref left in a key shows `status: 'error'` with `errorSource: 'source'`, as does `undefined`.
- A new `queryKey` shows the new key at once (its cached data, or `pending`), never the previous key's data, and a late answer for the old key never shows. Inline `queryFn` and `select` literals are fine. A `select` option that returns a Map, Set, class instance or function republishes whenever the getter reruns: memoize it or pass `equals`.
- The query opens on attach, loads if stale and shares a READ already in flight. When the scope ends, the handle is released one macrotask later, so a route swap in one patch neither cancels nor repeats a READ. In tests with fake timers, `await vi.advanceTimersByTimeAsync(0)` before asserting that the handle is gone.
- A component deactivated by `<KeepAlive>` stays attached, keeping its owner and any READ, until it is evicted or unmounted.
- Use `status === 'pending'` for loading UI; the first `fetchStatus` is the cache as it is (`'idle'` before the READ starts).
- Dependent query: `queryKey: ['user', id ?? null], enabled: id != null` in the getter. `enabled: false` shows idle and owns nothing.
- Server rendering: create `createSyncClient({ ssr: true })` per request and fill it before rendering (`await client.prefetch(options)`, or `onServerPrefetch(() => client.prefetch(options))` in `setup`), then send `client.dehydrate()`. In the browser, call `client.hydrate(snapshot)` before mounting. On the server, selections read without subscribing, attaching or READing.

More on queries, mutations and SSR: the [sync README](https://github.com/superlucky84/state-ref/blob/main/packages/sync/README.md).

## Readonly query views

`useSyncQuery` is the default in components. When a store or service owns a query beyond one component (it calls `client.query`, `load()` and `dispose()` itself), show it with a view instead.

`connectVueView(query.watchDisplay)(select)` returns a readonly Vue ref for the display of a `@stateref/sync` query. It stops its subscription when its scope ends; whoever opened the query calls `query.dispose()`. Edit actual data through `query.ref` after it loads.

```ts
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  select: account => account.address.city,
});
const city = connectVueView(account.watchDisplay)(display => display.data.value);
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
