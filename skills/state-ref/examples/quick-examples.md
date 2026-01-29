# Quick Examples

## Example 1: Basic Store and Subscription

```ts
import { createStore } from 'state-ref';

type State = { count: number; user: { name: string } };

const watch = createStore<State>({
  count: 0,
  user: { name: 'John' }
});

// Subscribe to changes
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
  console.log('Is first run:', isFirst);
});

// Modify state
const ref = watch();
ref.count.value = 10; // Triggers callback
ref.user.name.value = 'Jane'; // Doesn't trigger (not tracked)
```

## Example 2: React Integration

```ts
// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({
  todos: [] as string[],
  filter: 'all'
});

export const useTodoStore = connectReact(watch);

// TodoList.tsx
import { useTodoStore } from './store';

function TodoList() {
  const { todos, filter } = useTodoStore();

  const addTodo = (text: string) => {
    todos.value = [...todos.value, text];
  };

  return (
    <div>
      <ul>
        {todos.value.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
      <button onClick={() => addTodo('New Todo')}>Add</button>
    </div>
  );
}
```

## Example 3: Flux-like Pattern

```ts
// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type State = { count: number; loading: boolean };

const { watch, updateRef, sync } = createStoreManualSync<State>({
  count: 0,
  loading: false
});

export const useStore = connectReact(watch);

// Actions
export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

export const fetchData = async () => {
  updateRef.loading.value = true;
  sync();

  await fetch('/api/data');

  updateRef.loading.value = false;
  updateRef.count.value = 100;
  sync();
};
```

## Example 4: Combining Multiple Stores

```ts
import { createStore, combineWatch } from 'state-ref';

const userWatch = createStore({ name: 'John', age: 30 });
const settingsWatch = createStore({ theme: 'dark', lang: 'en' });

const combinedWatch = combineWatch([userWatch, settingsWatch] as const);

combinedWatch(([userRef, settingsRef]) => {
  console.log('User:', userRef.name.value);
  console.log('Theme:', settingsRef.theme.value);
});
```

## Example 5: Computed Values

```ts
import { createStore, createComputed } from 'state-ref';

const priceWatch = createStore<number>(100);
const quantityWatch = createStore<number>(5);

const totalWatch = createComputed(
  [priceWatch, quantityWatch],
  ([priceRef, qtyRef]) => priceRef.value * qtyRef.value
);

totalWatch((ref) => {
  console.log('Total:', ref.value); // 500
});

// Update price
const priceRef = priceWatch();
priceRef.value = 200; // Total becomes 1000
```

## Example 6: Cleanup with AbortController

```ts
import { createStore } from 'state-ref';

const watch = createStore({ data: null });
const controller = new AbortController();

watch((ref) => {
  console.log('Data changed:', ref.data.value);
  return controller.signal;
});

// Later, when component unmounts or cleanup needed:
controller.abort();
```
