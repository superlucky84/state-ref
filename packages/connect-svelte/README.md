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

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
