# Sharing Across Bundles (state-ref 3.2)

`state-ref/shared` lets separately built bundles on one page use the same
value. It is a separate entry point with no runtime import from the core, and
it works when each bundle carries its own copy of state-ref, in any load order.

Use it only for **separately built bundles**. Inside one bundle, export the
watch and import it.

## Pick one of two ways

Ask: **is there one bundle whose job is to fill this value?**

| | No owner | One owner |
| --- | --- | --- |
| Function | `ensureShared` | `provideShared` + `sharedWatch` |
| Other bundles write | the same `ensureShared` line | `sharedWatch` and a guard |
| Guards | none | `isProvided` / `isReady` |
| Typical value | a `@stateref/sync` client; UI state with a fixed initial value | a `createStore` store one bundle fetches data into |

Use one way per name. Do not mix them on the same name.

## No owner: `ensureShared`

Every bundle calls it with the same arguments. The first call creates the
value; the rest receive that same value. Put the call in a module every bundle
imports.

```ts
import { createStore } from 'state-ref';
import { ensureShared } from 'state-ref/shared';
import { createSyncClient } from '@stateref/sync';

// A sync client: every bundle then uses the ordinary sync API on one cache.
export const client = ensureShared('sync', () => createSyncClient());

// A store with a fixed initial value: an ordinary watch, no guard.
export const modalWatch = ensureShared('ui.modal', () =>
  createStore({ open: false })
);
```

- The value always exists after the call: no callback, no `await`, no guard.
- Only the first `create` runs. Give every bundle the same one; options that
  differ between bundles are silently dropped.
- With a shared sync client every bundle sees one cache entry per
  `queryKey`. Loads that overlap share one read; a `load()` made after the
  first has finished reads again, as it does inside one bundle.

### Match the sync version in every bundle

A shared client runs the `@stateref/sync` code of the bundle that created it,
not the code of each caller. Every bundle on the page must use the same
`@stateref/sync` version (DC-QH-37). Load order decides which implementation
all bundles receive:

- If a 0.2.0 bundle creates it first, the connectors' 0.3 `./sync` hooks throw
  `This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.`
- If a 0.3 bundle creates it first, even code written for 0.2 follows the
  0.3 rules. For example, a ref inside a query key throws a `TypeError`;
  put its `.value` in the key instead.

Align the versions when deploying bundles; do not rely on their load order.

## One owner: `provideShared` + `sharedWatch`

The owner registers its watch and states when the data can be used.

```ts
// Owner bundle
import { createStore } from 'state-ref';
import { provideShared } from 'state-ref/shared';

const subsWatch = createStore({ loaded: false, mySubs: [] as string[] });
provideShared('subs', subsWatch, { ready: ref => ref.loaded.value });
```

Other bundles get a watch synchronously, whether or not the owner has loaded,
and **must run a guard before reading**.

```ts
// Any other bundle
import { sharedWatch, isProvided, isReady } from 'state-ref/shared';

const subsWatch = sharedWatch<{ loaded: boolean; mySubs: string[] }>('subs');

subsWatch(ref => {
  if (!isProvided(ref)) return; // the owner bundle has not loaded
  if (!isReady(ref)) return; // the store exists, its data is still loading
  render(ref.mySubs.value); // an ordinary ref from here on
});
```

| Stage | `isProvided` | `isReady` | Allowed |
| --- | --- | --- | --- |
| Not provided | false | false | nothing - reading a path throws |
| Provided, not ready | true | false | read and write the store, including its loading/error state |
| Ready | true | true | use the data |

- A subscriber runs once immediately, runs again when the store arrives, and
  again when anything it read changes - including the owner's `ready`
  condition, which `isReady` reads.
- Most code needs only `isReady`. Use `isProvided` to show loading or error
  state the store itself carries.
- Reading a path before a guard is a compile error in TypeScript and a thrown
  error in JavaScript. Never work around it with `as any`; add the guard.
- `sharedWatch<T, R>('name')`: `R` is the store's type once ready, and
  `isReady` narrows to it. It is an unchecked promise.
- Only the owner fetches and fills the store. A consumer that also fetches
  will race with it.

## Run once when ready

```ts
import { whenReady } from 'state-ref/shared';

whenReady('subs', ref => insertBanner(ref.mySubs.value)); // no guard needed
whenReady(subsWatch, start, { select: ref => ref.mySubs.value.length > 0 });
```

It runs the callback once and then unsubscribes. `{ signal }` cancels it.

## With a UI connector

Pass a shared watch to the connector's view form, at module level.

```tsx
import { connectPreactView } from '@stateref/connect-preact';

const useSubs = connectPreactView(sharedWatch('subs'));

function Badge() {
  const subs = useSubs();
  if (!isProvided(subs)) return null;
  if (!isReady(subs)) return <Spinner />;
  return <span>{subs.mySubs.value.length}</span>;
}
```

Covered by tests for Preact only. `connectPreact` types accept a plain watch,
so use `connectPreactView` for a shared watch.

## Other functions

- `getShared(name)` - what is registered right now, or `undefined`.
- `onShared(name, callback)` - runs once with the registered value, now or
  when it is provided. For values that are not watches.
- `pendingShared()` - names something waits for that no bundle has provided.

## Limits

- `batch` from `state-ref/batch` coalesces writes only for stores made by the
  same copy of state-ref. Another bundle's copy gets one notification per
  write; values are still correct.
- There is no unprovide. A shared value lives as long as the page.
- The registry lives on `globalThis`. Do not share per-request state on a
  server.
- Names are global to the page; prefix them by feature.
