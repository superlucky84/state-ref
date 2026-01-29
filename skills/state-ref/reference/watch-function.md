# Watch Function

The `watch` function returned by `createStore()` is the core abstraction for reactivity.

## Two Usage Modes

### 1. With Callback (Subscribe)

```ts
const watch = createStore({ count: 0 });

// Subscribe to changes
const outerRef = watch((innerRef, isFirst) => {
  console.log('Count:', innerRef.count.value);
  // isFirst is true on initial run, false on subsequent updates
});
```

- Callback runs immediately once to collect dependencies
- Callback re-runs when any tracked `.value` changes
- `innerRef` and `outerRef` are the same reference, both bound to subscription

### 2. Without Callback (Get Reference)

```ts
const ref = watch();
// ref is NOT bound to any subscription
// Useful for reading/writing from outside callbacks
```

## Callback Signature

```ts
type Renew<T> = (
  stateRef: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;
```

- `stateRef`: Proxied reference to state
- `isFirst`: `true` on first run, `false` on updates
- Return `AbortSignal` to enable unsubscription

## Unsubscription

```ts
const controller = new AbortController();

watch((ref) => {
  console.log(ref.value);
  return controller.signal;
});

// Later...
controller.abort(); // Stop receiving updates
```

## Dependency Tracking

Only `.value` reads inside the callback are tracked:

```ts
watch((ref) => {
  // These are tracked:
  const a = ref.user.name.value;
  const b = ref.settings.theme.value;

  // This proxy access without .value is NOT tracked:
  const proxy = ref.user.age; // Just returns proxy
});
```
