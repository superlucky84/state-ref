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

## Mutating a selected object through a connector

```ts
// BAD - does not pass through the connector; refused, store untouched
const user = useStore(s => s.user); // Vue
user.value.name = 'Jane'; // readonly warning, nothing changes

// GOOD - write through .value
useStore(s => s.user.name).value = 'Jane';
user.value = { ...user.value, name: 'Jane' };
```

Solid: `setUser(prev => ({ ...prev, name: 'Jane' }))`, never mutate `prev`.
Svelte store: `$user.name = 'Jane'` is fine (it compiles to `set`).

## Forgetting the selector (Vue, Svelte, Solid)

```ts
// BAD
const store = connectVue(watch)();
// GOOD
const age = connectVue(watch)(s => s.user.age);
```

## Checking a draft apply as if it throws

```ts
// BAD - a conflict does not throw
try { editor.apply(); } catch { /* never reached for a conflict */ }

// GOOD
const result = editor.apply();
if (!result.ok && result.reason === 'conflict') {
  // editor.resolve(change, 'source' | 'draft'), then apply again
}
```

## Expecting a query edit to save (`@stateref/sync`)

```ts
account.ref.address.city.value = 'Busan'; // local edit only
// Save explicitly, capturing right before run:
const submission = account.capture();
await save.run(dto, { links: [{ query: account, submission, accept: { kind: 'refetch' } }] });
```

`accept` in `run()` is an object (`{ kind: 'refetch' }`), not a string.
"Saving?" is `status.pending.value > 0`, not `phase === 'pending'`.

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
