# Common Mistakes and Fixes

## Always access values via `.value`

```ts
// BAD - returns proxy, not the actual value
const age = stateRef.john.age;

// GOOD - returns the actual value
const age = stateRef.john.age.value;
```

## Track dependencies inside subscription callback

```ts
// BAD - externalRef is not bound to any subscription
const externalRef = watch();
watch((ref) => {
  console.log(externalRef.count.value); // NOT tracked!
});

// GOOD - use the callback's ref parameter (innerRef)
watch((ref) => {
  console.log(ref.count.value); // Tracked
});
```

## Both innerRef and outerRef are the same reference

```ts
// innerRef (callback arg) and outerRef (return value) are identical
const outerRef = watch((innerRef) => {
  console.log(innerRef.count.value); // Tracked
});

// outerRef is also bound to the subscription
outerRef.count.value = 10; // This change triggers the callback
```

## Use AbortController for cleanup

```ts
const controller = new AbortController();
watch((ref) => {
  console.log(ref.value);
  return controller.signal; // Return signal for cleanup
});

controller.abort(); // Unsubscribe when needed
```

## Don't modify state directly in manual-sync mode

```ts
// BAD - watch refs are read-only in manual-sync mode
const { watch } = createStoreManualSync({ count: 0 });
const ref = watch();
ref.count.value = 10; // Error!

// GOOD - use updateRef and sync
const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });
updateRef.count.value = 10;
sync();
```

## Primitive stores access value directly

```ts
const watch = createStore<number>(3);

watch((ref) => {
  // BAD - ref itself is not the value
  console.log(ref);

  // GOOD - access .value directly
  console.log(ref.value);
});
```
