Writes now reach the store synchronously, subscriptions follow their Vue scope, and selected objects can no longer mutate the store without a tracked write.

**Requires Vue `^3.2.0` and `state-ref ^3.1.0`.** The connector major follows Vue, so the breaking behavior change below ships in a minor connector version.

## Breaking behavior change

**Selected objects and arrays are readonly.** A nested assignment such as `address.value.city = 'Busan'` or `list.value.push(item)` is refused, with Vue's readonly warning in development. The store is untouched.

Write through a selected leaf or replace the whole selected value:

```ts
// Select a leaf and assign its value:
use(state => state.address.city).value = 'Busan';

// Or replace the selected object:
address.value = { ...address.value, city: 'Busan' };
```

Previously, wrapping the store's own object in `reactive` let nested writes mutate it in place. Subscribers were not notified, and the delayed write had identical before/after values, hiding the change from draft and sync tracking.

## Fixed and changed

- **Writes are synchronous.** Assigning a selection's `.value` writes directly to state-ref; reads in the same handler see the new value.
- **Cleanup follows the scope.** `onScopeDispose` releases subscriptions from components, composables, and `effectScope` when the owning scope stops. This API is why the Vue peer minimum moves from `^3.0.0` to `^3.2.0`.
- Reads use a subscribed state-ref reference inside a `customRef`. The previous deep watch and echo guard are removed.
- **CommonJS and Node TypeScript resolution.** The package now uses a real `.cjs` entry, `.d.cts` declarations, and `.js` extensions in declaration imports for `node16` / `nodenext`.
- The `state-ref` peer range moves from `^3.0.0` to `^3.1.0`. Published packages exclude test sources.

## Upgrade

```sh
pnpm add state-ref@3.1.0 @stateref/connect-vue@3.4.0
```

Check code that mutates nested selected objects, and ensure Vue satisfies `^3.2.0`.

[Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/%40stateref/connect-vue%403.3.0...%40stateref/connect-vue%403.4.0
