---
name: state-ref
description: Use when working in projects that use state-ref; follow proxy-based reactivity and lens pattern guidelines.
metadata:
  short-description: state-ref workflow
  version: {{version}}
---

# state-ref AI Agent Skills

Document Version: {{version}}

Additional materials (optional):
- constraints/ (rules, mistakes, troubleshooting)
- reference/ (watch, store creation, framework connectors and their `./sync` query hooks)
- reference/draft-and-batch.md - local edit sessions and batched writes
- reference/shared-across-bundles.md - one store or sync client for separately built bundles
- reference/server-sync.md - `@stateref/sync` queries and saves (only if installed)
- examples/ (quick examples)

## Activation Condition (Read First)

These guidelines apply **only when `state-ref` is installed** in the current project.

Before following this document:
- Check `package.json` for `state-ref` in dependencies/devDependencies
- Check `node_modules/state-ref` exists
- Check existing code imports from `state-ref`

If `state-ref` is **not** installed, use the project's existing conventions. Do **not** suggest adding state-ref unless the user asks.

---

## Core Rules (Keep In Memory)

- Create stores with `createStore<T>(initialValue)` for auto-sync mode.
- Access values via `.value` property on `StateRefStore` proxies.
- Subscribe with `watch(callback)` - callback receives `(stateRef, isFirst)`.
- Subscription callbacks run once initially to collect dependencies.
- Only tracked `.value` reads inside callbacks trigger re-runs on change.
- Use `AbortController.signal` returned from callback to unsubscribe.
- Use `createStoreManualSync()` for Flux-like patterns with `updateRef` and `sync()`.
- Framework connectors: `connectReact`, `connectPreact`, `connectVue`, `connectSvelte`, `connectSolid`. Vue, Svelte and Solid take a selector: `connectVue(watch)(s => s.user)`.
- Write rule: only a write that passes through the connector reaches the store. Assign `.value` of a selection or replace the whole object; never mutate an object read from a selection.
- Local edit session (form, dialog): `createDraft(ref)` from `state-ref/draft`, then `apply()` / `discard()`.
- Several writes, one notification: `batch(() => { ... })` from `state-ref/batch`.
- Separately built bundles on one page: `state-ref/shared`. A value no bundle owns (a sync client): `ensureShared(name, create)` in every bundle. A store one bundle fills: that bundle calls `provideShared`, the others use `sharedWatch` and check `isReady(ref)` before reading - see reference/shared-across-bundles.md.
- Server data: if `@stateref/sync` is installed, components read queries with their connector's `./sync` hook (`useSyncQuery` for React, Preact, Vue; `createSyncQuery` for Solid, Svelte, Lithent), which loads on mount and releases on unmount. Stores and services that own a query use `client.query`. Save with `capture()` / `client.mutation().run` - see reference/server-sync.md and reference/framework-connectors.md.
- Combine watches with `combineWatch([watch1, watch2] as const)`.
- Derive values with `createComputed([watches], callback)`.
- Use `copyable()` for manual copy-on-write updates.
- Avoid mutating state directly; always assign via `.value`.
- When unsure, check `node_modules/state-ref/dist/index.d.ts`.

---

## Common Mistakes & Fixes

### Always access values via `.value`

```ts
// BAD
const age = stateRef.john.age;

// GOOD
const age = stateRef.john.age.value;
```

### Track dependencies inside subscription callback

```ts
// BAD - accessing .value outside callback won't track
const externalRef = watch();
watch((ref) => {
  console.log(externalRef.count.value); // NOT tracked
});

// GOOD - use the callback's ref parameter
watch((ref) => {
  console.log(ref.count.value); // Tracked
});
```

### Use AbortController for cleanup

```ts
const controller = new AbortController();
watch((ref) => {
  console.log(ref.value);
  return controller.signal;
});
controller.abort(); // Unsubscribe
```

---

## Quick Examples

### Example 1: Basic Store and Subscription

```ts
import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'John' });

watch((ref, isFirst) => {
  console.log('Count changed:', ref.count.value);
});

const ref = watch();
ref.count.value = 10; // Triggers subscription
```

3.0.0 adds a second argument to `createStore`, `{ trackDeps }`, off by default.
With `{ trackDeps: true }` a subscriber's dependencies are re-collected on every
run, so a path the callback has stopped reading stops waking it. Suggest it only
for subscribers whose branch condition lives in the store; otherwise it costs
about 1.4x per notification and saves nothing.

To unsubscribe, return an `AbortSignal` from the callback and abort it, or return
`false` to stop after that run.

### Example 2: React Integration

```ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ age: 20 });
export const useStore = connectReact(watch);

// In component
function Component() {
  const { age } = useStore();
  return <button onClick={() => age.value++}>{age.value}</button>;
}
```

### Example 3: Manual Sync (Flux-like)

```ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const increment = () => {
  updateRef.count.value += 1;
  sync(); // Notify subscribers
};
```

---

## Import Paths

- Core: `import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'`
- Helpers: `import { lens, copyable, cloneDeep } from 'state-ref'`
- Drafts: `import { createDraft } from 'state-ref/draft'`
- Batch: `import { batch } from 'state-ref/batch'`
- Shared across bundles: `import { ensureShared, provideShared, sharedWatch, isProvided, isReady, whenReady } from 'state-ref/shared'`
- React: `import { connectReact, connectReactView } from '@stateref/connect-react'`
- Preact: `import { connectPreact, connectPreactView } from '@stateref/connect-preact'`
- Vue: `import { connectVue, connectVueView } from '@stateref/connect-vue'`
- Svelte: `import { connectSvelte, connectSvelteView } from '@stateref/connect-svelte'`
- Svelte 5 runes: `import { connectSvelteRunes } from '@stateref/connect-svelte/runes'`
- Solid: `import { connectSolid, connectSolidView } from '@stateref/connect-solid'`
- Lithent: `import { connectLithent, connectLithentView } from '@stateref/connect-lithent'`
- Sync queries in components (ESM only, needs `@stateref/sync` 0.3+): `import { useSyncQuery } from '@stateref/connect-react/sync'` (also `connect-preact/sync`, `connect-vue/sync`); `import { createSyncQuery } from '@stateref/connect-solid/sync'` (also `connect-svelte/sync`, `connect-lithent/sync`)
- Server sync (separate package): `import { createSyncClient, MutationRejectedError } from '@stateref/sync'`
- `state-ref/plugin` is the integration surface for sync/draft; application code does not import it.

---

## Summary

Use `createStore` for reactive state, access via `.value`, subscribe with `watch(callback)`. Dependencies are tracked automatically inside callbacks. Use framework connectors for UI integration and write only through them. For Flux patterns, use `createStoreManualSync`. Combine watches with `combineWatch` or derive computed values with `createComputed`. For edit-then-commit UIs use `createDraft`; for server data use `@stateref/sync` when it is installed.
