# Store Creation

## createStore (Auto-Sync Mode)

Default mode where changes immediately trigger subscribers.

```ts
import { createStore } from 'state-ref';

// Object state
const watch = createStore<{ count: number; name: string }>({
  count: 0,
  name: 'John'
});

// Primitive state
const watchNumber = createStore<number>(42);
const watchString = createStore<string>('hello');
```

### Usage

```ts
// Subscribe
watch((ref) => {
  console.log(ref.count.value, ref.name.value);
});

// Modify (auto-syncs to subscribers)
const ref = watch();
ref.count.value = 10;
```

## createStoreManualSync (Manual-Sync Mode)

Flux-like pattern where you control when updates propagate.

```ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync<{
  count: number;
}>({ count: 0 });
```

### Returns

- `watch`: Subscribe to state (read-only refs)
- `updateRef`: Writable reference for modifications
- `sync`: Function to notify all subscribers

### Usage

```ts
// Subscribe (refs are read-only)
watch((ref) => {
  console.log(ref.count.value);
});

// Modify via updateRef, then sync
updateRef.count.value = 10;
sync(); // Triggers subscribers

// Direct modification via watch() throws error
const ref = watch();
ref.count.value = 5; // Error!
```

## combineWatch

Combine multiple watches into one.

```ts
import { createStore, combineWatch } from 'state-ref';

const countWatch = createStore<number>(0);
const textWatch = createStore<string>('hello');

const combined = combineWatch([countWatch, textWatch] as const);

combined(([countRef, textRef]) => {
  console.log(countRef.value, textRef.value);
});
```

## createComputed

Derive computed values from multiple watches.

```ts
import { createStore, createComputed } from 'state-ref';

const aWatch = createStore<number>(10);
const bWatch = createStore<number>(20);

const sumWatch = createComputed(
  [aWatch, bWatch],
  ([aRef, bRef]) => aRef.value + bRef.value
);

sumWatch((ref) => {
  console.log('Sum:', ref.value); // 30
});
```

Computed values are read-only.
