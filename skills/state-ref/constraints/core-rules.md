# Core Rules

- Create stores with `createStore<T>(initialValue)` for auto-sync mode.
- Access values via `.value` property on `StateRefStore` proxies.
- Subscribe with `watch(callback)` where callback receives `(stateRef, isFirst)`.
- Subscription callbacks run once initially to collect dependencies.
- Only `.value` reads inside the callback parameter (`innerRef`) are tracked.
- Reading `.value` from external refs (created by `watch()` without callback) won't track.
- Use `AbortController.signal` returned from callback to unsubscribe.
- Use `createStoreManualSync()` for Flux-like patterns.
- In manual-sync mode, modify via `updateRef`, then call `sync()` to notify subscribers.
- Framework connectors transform `watch` into framework-specific hooks/stores. Vue, Svelte and Solid take a selector (`connectVue(watch)(s => s.user)`).
- Only a write that passes through the connector reaches the store: assign `.value` of a selection (or call the Solid setter), or replace the whole object. A selected object is readonly (Vue) or a frozen copy (Solid, Svelte runes).
- React/Preact connectors render a component twice on mount (the second render collects dependencies).
- `createDraft(ref)` (`state-ref/draft`) edits a local copy; `apply()` returns `{ ok, ... }` and reports conflicts instead of overwriting.
- `batch(fn)` (`state-ref/batch`) groups notifications of synchronous writes; it does not roll back and cannot span `await`.
- With `@stateref/sync`: edits to `query.ref` are local; saving is `capture()` then `mutation.run(dto, { links })`.
- Use `combineWatch([watch1, watch2] as const)` to observe multiple stores together.
- Use `createComputed([watches], callback)` to derive read-only computed values.
- Use `copyable(obj)` for manual copy-on-write when needed.
- Use `lens<T>()` for functional lens-style immutable updates.
- Avoid mutating state directly; always assign via `.value`.
- Primitive types (number, string) can be stored directly: `createStore<number>(3)`.
- When unsure, check `node_modules/state-ref/dist/index.d.ts` for type signatures.

Note: For simple state needs, native framework state (useState, ref, etc.) may suffice.
Use state-ref when you need shared state across components or fine-grained reactivity.
