Svelte 5 runes integration joins the existing store API, which continues to support Svelte 4 and 5. Nested `$store` assignments now produce tracked state-ref writes.

**Supports Svelte `^4.0.0 || ^5.0.0`. Requires `state-ref ^3.1.0`.** The connector major follows the newest supported Svelte version; Svelte 4 remains supported through the main entry.

## Added

**`@stateref/connect-svelte/runes`** provides `connectSvelteRunes(watch)(select)` for Svelte 5 runes components. It returns `{ value }` and uses `createSubscriber` to subscribe while a template, `$effect`, or `$derived` reads `.value`, then releases the subscription when the last reader leaves.

Assigning `.value` writes the store synchronously. Selected objects and arrays are frozen copies; replace the value rather than mutating a nested field.

The runes entry is **ESM only and requires Svelte 5**, because `svelte/reactivity` is unavailable in Svelte 4.

## Fixed

- **`$store.field = value` performs a real state-ref write.** Previously, Svelte received the store's internal object and its nested assignment syntax mutated that object in place. The connector now supplies a copy, so Svelte's compiled `set` call records the write with the correct previous value and notifies subscribers.
- **CommonJS and Node TypeScript resolution for the main entry.** The package now uses a real `.cjs` entry, `.d.cts` declarations, and `.js` extensions in declaration imports for `node16` / `nodenext`.

## Changed

- The main store API retains its shape and works on both Svelte 4 and 5. On Svelte 5, `$store` components use legacy mode.
- Write-back compares values instead of relying on an echo flag, including when Svelte queues a `set` during notification.
- The `state-ref` peer range moves from `^3.0.0` to `^3.1.0`. Published packages exclude test sources.

## Upgrade

```sh
pnpm add state-ref@3.1.0 @stateref/connect-svelte@5.0.0
```

Use the main entry for Svelte 4 or store-style components. Import `@stateref/connect-svelte/runes` explicitly for Svelte 5 runes components.

[Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/%40stateref/connect-svelte%404.3.0...%40stateref/connect-svelte%405.0.0
