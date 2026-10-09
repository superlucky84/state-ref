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

## Readonly views of a `@stateref/sync` query

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

Ordinary Lithent state uses `watch` directly. Sync queries use the optional `@stateref/connect-lithent/sync` entry (prepared on this branch, not yet published): create once in the mounter, read `account().data.name.value` in render, and use `q.handle()` for local edits and mutation links. An options getter follows live props. The helper subscribes after mount and aborts on unmount; bare `observer.watch(renew)` can retain its owner until the next notification. See `packages/connect-lithent/README.md` for the complete example, SSR and concurrent core alias.

```tsx
import { mount } from 'lithent';
import { watch } from './store';

const Counter = mount(renew => {
  const { count } = watch(renew);
  return () => <button onClick={() => count.value++}>{count.value}</button>;
});
```

## Custom connectors

Subscribe after the framework commits, return a fresh `AbortSignal` from the
callback on every subscribe, and abort it on teardown. Read through the
reference the subscription returned so state-ref collects the paths. Reference
implementations: `@stateref/connect-react` (`useSyncExternalStore`) and
`@stateref/connect-preact` (`useEffect`).
