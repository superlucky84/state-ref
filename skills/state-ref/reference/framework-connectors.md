# Framework Connectors

Each connector transforms `watch` into framework-specific reactive primitives.

## React / Preact

```ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';
// import { connectPreact } from '@stateref/connect-preact';

const watch = createStore({ count: 0 });
export const useStore = connectReact(watch);

// In component
function Counter() {
  const { count } = useStore();
  return (
    <button onClick={() => count.value++}>
      {count.value}
    </button>
  );
}
```

Returns `StateRefStore` directly via hook.

## Vue

```ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const watch = createStore({ count: 0 });
export const useStore = connectVue(watch);

// In component
const store = useStore();
// store is Vue Reactive object
```

Returns Vue `Reactive` objects.

## Svelte

```ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const watch = createStore({ count: 0 });
export const store = connectSvelte(watch);

// In Svelte component
// $store.count.value
```

Returns Svelte `Writable` stores.

## Solid

```ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const watch = createStore({ count: 0 });
export const useStore = connectSolid(watch);

// In component
const [store, setStore] = useStore();
```

Returns Solid `Signal` pairs.

## Lithent

Lithent uses `watch` directly without connector.

```tsx
import { mount } from 'lithent';
import { watch } from './store';

const Counter = mount((renew) => {
  const { count } = watch(renew);

  return () => (
    <button onClick={() => count.value++}>
      {count.value}
    </button>
  );
});
```

## Custom Connectors

Create your own by following the pattern:

```ts
export const connectCustom = <T>(watch: Watch<T>) => {
  return () => {
    // 1. Create framework-specific state
    // 2. Subscribe to watch with framework's update mechanism
    // 3. Return framework-appropriate value
  };
};
```

Reference implementations:
- `packages/connect-react/src/index.ts`
- `packages/connect-preact/src/index.ts`
