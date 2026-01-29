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
- reference/ (watch, store creation, framework connectors)
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
- Framework connectors: `connectReact`, `connectPreact`, `connectVue`, `connectSvelte`, `connectSolid`.
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
- React: `import { connectReact } from '@stateref/connect-react'`
- Preact: `import { connectPreact } from '@stateref/connect-preact'`
- Vue: `import { connectVue } from '@stateref/connect-vue'`
- Svelte: `import { connectSvelte } from '@stateref/connect-svelte'`
- Solid: `import { connectSolid } from '@stateref/connect-solid'`

---

## Summary

Use `createStore` for reactive state, access via `.value`, subscribe with `watch(callback)`. Dependencies are tracked automatically inside callbacks. Use framework connectors for UI integration. For Flux patterns, use `createStoreManualSync`. Combine watches with `combineWatch` or derive computed values with `createComputed`.
