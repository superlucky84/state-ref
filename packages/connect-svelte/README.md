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

## Readonly query views

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
