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

## Readonly query views

`connectVueView(live.watch)(select)` returns a readonly Vue ref for a `@stateref/sync` view. It follows key changes and stops its subscription on component unmount. The owner of `live` calls `live.dispose()` when the view is no longer needed. Edit actual data through `live.query?.ref` after it loads.

```ts
const city = connectVueView(live.watch)(view => view.data.value);
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
