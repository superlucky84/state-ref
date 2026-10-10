# Framework Connectors

Each connector turns a `watch` into the framework's own reactive primitive.
React and Preact return the state-ref reference itself; Vue, Svelte and Solid
take a **selector** and return the framework's value for that selection.

## The write rule (all connectors)

**A write that passes through the connector reaches the store; a change that
does not is refused.** Assign `.value` of a selection (or call the setter), or
replace the whole object. Never mutate an object you read out of a selection.

| Framework | Works | Refused (store untouched) |
|---|---|---|
| React / Preact | `ref.user.name.value = 'x'` | mutating an object from `.value` (core rule) |
| Vue | `name.value = 'x'`, `user.value = { ...user.value, name: 'x' }` | `user.value.name = 'x'` (readonly warning in dev) |
| Svelte store | `$name = 'x'`, `$user.name = 'x'` (compiles to `set`) | - |
| Svelte runes | `name.value = 'x'`, `user.value = { ...user.value, name: 'x' }` | `user.value.name = 'x'` (frozen copy, throws) |
| Solid | `setName('x')`, `setUser(prev => ({ ...prev, name: 'x' }))` | `user().name = 'x'`, mutating `prev` (frozen copy, throws) |

## React / Preact

```tsx
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';
// import { connectPreact } from '@stateref/connect-preact';

const watch = createStore({ count: 0 });
export const useStore = connectReact(watch);

function Counter() {
  const { count } = useStore();
  return <button onClick={() => count.value++}>{count.value}</button>;
}
```

- Supports React 18 and 19 (`@stateref/connect-react` 19.x), Preact 10.
- Built on `useSyncExternalStore` (Preact: an effect after commit), so it is
  safe under `<StrictMode>` and Suspense.
- **A mount renders twice**: the first render paints correct values, the
  second collects which paths the component read. After that only a change to
  a path it read re-renders it. Tests that count renders must expect +1 on mount.

## Vue

```ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectVue(watch);

// <script setup>
const age = useStore(s => s.user.age); // { value } - reactive
age.value += 1; // writes the store synchronously
const user = useStore(s => s.user);
user.value = { ...user.value, name: 'Jane' }; // replace the whole object
```

- Vue `^3.2.0`. Returns `reactive({ value })`, so it also works with Vue's `watch`.
- Selected objects/arrays are Vue `readonly`.
- The subscription ends with the scope it was created in (component setup or
  `effectScope`).

## Svelte (store API, Svelte 4 and 5)

```svelte
<script lang="ts">
  import { useStore } from './store'; // connectSvelte(watch)
  const age = useStore(s => s.user.age);
  const user = useStore(s => s.user);
</script>

<input type="number" bind:value={$age} />
<button on:click={() => ($user.name = 'Jane')}>Rename</button>
```

- `connectSvelte(watch)(select)` returns a `Writable`. Call it during component
  initialization.
- Svelte receives a copy, so `$user.name = 'x'` becomes a real store write.

## Svelte 5 runes

```ts
import { connectSvelteRunes } from '@stateref/connect-svelte/runes'; // ESM only
export const useStore = connectSvelteRunes(watch);
// in a runes component:
const name = useStore(s => s.user.name);
// {name.value}   onclick={() => (name.value = 'Jane')}
```

- Subscribes while a template, `$effect` or `$derived` reads `.value`; releases
  when the last reader goes. Not tied to a component (module level works).
- Selected objects/arrays are frozen copies.

## Solid

```ts
import { connectSolid } from '@stateref/connect-solid';
export const useStore = connectSolid(watch);

const [user, setUser] = useStore(s => s.user);
setUser(prev => ({ ...prev, name: 'Jane' })); // return a new object
```

- Solid `^1.9.1`. Returns a `Signal` pair; the setter writes the store directly
  and synchronously. The accessor returns a frozen copy of objects/arrays.

## Sync queries in components (`<connector>/sync`)

With `@stateref/sync` 0.3+ installed, every connector has an ESM-only `./sync`
entry (connect-react 19.1+, connect-preact 10.5+, connect-vue 3.5+,
connect-solid 1.5+, connect-svelte 5.1+, connect-lithent 0.1+).
**In component code this is the default way to read a query**: the
component owns it (loads on mount, follows the key, releases on unmount). There
is no `load()` / `dispose()` to call.

| Framework | Import | Options | Read |
|---|---|---|---|
| React | `import { useSyncQuery } from '@stateref/connect-react/sync'` | plain object, passed every render | `const [account, q] = useSyncQuery(client, options)`; `account.data.name.value` |
| Preact | `import { useSyncQuery } from '@stateref/connect-preact/sync'` | same as React | same as React |
| Vue | `import { useSyncQuery } from '@stateref/connect-vue/sync'` | getter `() => ({ ... })` to follow props/refs, or a fixed object | `account(r => r.data.name.value)` → `Readonly<Ref<V>>` |
| Solid | `import { createSyncQuery } from '@stateref/connect-solid/sync'` | accessor `() => ({ ... })`, or a fixed object | `account(r => r.data.name.value)` → `Accessor<V>` |
| Svelte (store API) | `import { createSyncQuery } from '@stateref/connect-svelte/sync'` | `Readable` options store (`writable`/`derived`), or a fixed object | `account(r => r.data.name.value)` → `Readable<V>` (`$name`) |
| Lithent | `import { createSyncQuery } from '@stateref/connect-lithent/sync'` | props getter, or a fixed object; create once in the mounter | `account().data.name.value` in render |

```tsx
// React / Preact
function AccountCard({ id }: { id: number }) {
  const [account, q] = useSyncQuery(client, {
    queryKey: ['account', id],
    queryFn: ({ signal }) => api.readAccount(id, { signal }),
    staleTime: 30_000,
  });
  if (account.status.value === 'pending') return <p>Loading…</p>;
  return <p>{account.data.name.value}</p>;
}

// Vue (in setup; Solid: createSyncQuery in the component body).
// Capture the id in each set of options.
const [account, q] = useSyncQuery(client, () => {
  const id = props.id;
  return { queryKey: ['account', id], queryFn: ({ signal }) => api.readAccount(id, { signal }) };
});
const name = account(r => r.data.name.value); // Vue: name.value, Solid: name()
```

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { createSyncQuery } from '@stateref/connect-svelte/sync';
  export let id: number;
  const options = writable(optionsFor(id)); // optionsFor builds the options object
  $: options.set(optionsFor(id));
  const [account, q] = createSyncQuery(client, options); // during init
  const name = account(r => r.data.name.value);
</script>
<p>{$name ?? ''}</p>
```

`q` is the same object for the component's life:

- `q.refetch(): Promise<T>` forces a READ. It rejects with
  `This query observer is not attached.` before attach, while disabled and on
  the server, so catch it.
- `q.invalidate()` invalidates the key and, while attached and enabled, reads
  it again. `client.invalidate(key)` only marks it stale.
- `q.handle()` is the query's own handle, or `null` before attach, while
  disabled and on the server. Local edit:
  `const h = q.handle(); if (h?.status.value.loaded) h.ref.name.value = 'x';`.
  Mutation link: `{ query: h, submission: h.capture(), accept: ... }`.
  **Never dispose it**; the hook owns it.

Must-know rules:

- Rendering creates nothing. The first subscription attaches (React/Preact:
  commit; Vue/Solid/Svelte: the first `account(select)` call; Lithent: mount):
  it opens the query, loads it if stale and shares a READ in flight. All
  selections share one handle. The last subscription ending releases it one
  macrotask later (Preact: after the next paint), so StrictMode and same-commit
  route swaps never cancel or repeat a READ.
- Tests: assert release only after that schedule. With fake timers,
  `await vi.advanceTimersByTimeAsync(0)` first (Preact releases after the next
  frame or a 200 ms fallback timer: advance past 200 ms, or `waitFor`).
- A new key shows from the first render (cached data or `pending`), never the
  previous key's data. React/Preact render once more after the change commits.
- Loading UI: `status === 'pending'`. The first render's `fetchStatus` is the
  cache as it is (`'idle'` before the READ starts).
- Dependent query: `queryKey: ['user', id ?? null], enabled: id != null`.
  `undefined` or a state-ref ref in a key, or a non-boolean `enabled`, does not
  throw in render: it shows `status: 'error'`, `errorSource: 'source'`. Read refs
  with `.value`. `enabled: false` shows idle and owns nothing.
- Vue does **not** unwrap refs inside a plain options object; read `.value` in a
  getter. Svelte does **not** track a plain getter; use a `Readable` options
  store. There is no runes sync entry.
- Inline `queryFn` / `select` literals are fine. Changing `staleTime`,
  `refetchInterval`, etc. reopens the same key without cancelling its READ. A
  `select` returning a Map, Set, class instance or function republishes on
  every option change: memoize it or pass `equals`.
- `initialData` shows in the first render (`status: 'success'`) and is seeded
  on attach.
- The client is fixed for the component's lifetime. React/Preact throw
  `This query observer is bound to another client.`; the others keep the first.
- React `<Activity mode="hidden">` releases while hidden. Vue `<KeepAlive>`
  keeps a deactivated component attached until it is evicted.
- SSR: `createSyncClient({ ssr: true })` per request; the hooks never attach or
  READ there. `await client.prefetch(options)` before rendering, send
  `client.dehydrate()`, and `client.hydrate(snapshot)` in the browser before
  rendering. Svelte's store API subscribes during SSR, so it needs `ssr: true`
  most.
- Bundles sharing one client through `state-ref/shared` must ship the same
  `@stateref/sync` (0.3+), or the entry throws
  `This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.`
- `client.observe(options, settings?)` is the low-level observer for writing a
  hook for another framework. App code uses the entries above. A callback
  subscription to `observer.watch(renew)` must end (abort the `AbortSignal` its
  first run returned, or return `false`); one that never ends keeps the
  observer attached.

## Readonly views of a `@stateref/sync` query

Use these for a query that a store or service owns beyond one component (it
calls `client.query`, `load()` and `dispose()` itself). In components prefer the
`./sync` entries above.

Each connector has a `*View` variant for `query.watchDisplay` (the observer's
`select` / `placeholderData` result). It is readonly; edit data through
`query.ref`. Unmounting ends the UI subscription; whoever opened the query calls
`query.dispose()`.

```ts
import { connectReactView } from '@stateref/connect-react';
const useCity = connectReactView(account.watchDisplay);
// const display = useCity(); display.data.value

import { connectVueView } from '@stateref/connect-vue';
const city = connectVueView(account.watchDisplay)(d => d.data.value);
// connectSvelteView(...)(select) -> Readable, connectSolidView(...)(select) -> accessor
```

## Lithent

Call `connectLithent(watch)` once in the mounter for ordinary editable state. It returns an accessor: read and write `counter().count.value`. `connectLithentView(watch)` preserves the input ref type, including a readonly sync display; it also accepts editable watches. Both share mount-time subscription and immediate abort on unmount. Direct `watch(renew)` remains available but waits for a later watched-path notification to end an unmounted subscription.

Sync queries use `createSyncQuery` from `@stateref/connect-lithent/sync` (see the table above). Bare `observer.watch(renew)` can retain its owner until the next notification. The `@stateref/connect-lithent` README has the complete example, SSR and the concurrent core alias.

```tsx
import { mount } from 'lithent';
import { connectLithent } from '@stateref/connect-lithent';
import { watch } from './store';

const Counter = mount(() => {
  const counter = connectLithent(watch);
  return () => <button onClick={() => counter().count.value++}>{counter().count.value}</button>;
});
```

## Custom connectors

Subscribe after the framework commits, return a fresh `AbortSignal` from the
callback on every subscribe, and abort it on teardown. Read through the
reference the subscription returned so state-ref collects the paths. Reference
implementations: `@stateref/connect-react` (`useSyncExternalStore`) and
`@stateref/connect-preact` (`useEffect`).
