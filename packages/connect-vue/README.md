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

## Readonly query views

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
