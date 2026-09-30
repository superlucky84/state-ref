The setter now writes to state-ref directly and synchronously, and selected objects can no longer mutate the store without a tracked write.

**Requires Solid `^1.9.1` and `state-ref ^3.1.0`.** The Solid peer range is unchanged. The connector major follows Solid, so the breaking behavior change below ships in a minor connector version.

## Breaking behavior change

**An accessor returns a frozen copy of an object or array.** Mutating a nested value, or mutating `prev` inside a functional setter and returning it, now throws a `TypeError` instead of silently changing the store.

Use the setter with a new value:

```ts
// Replace the selected object through its setter:
setAddress(prev => ({ ...prev, city: 'Busan' }));
```

Previously, the accessor exposed the store's internal object, so these mutations changed it in place without recording a write or notifying subscribers. This release makes those edits visible to the normal state-ref write path and to draft/sync tracking.

## Fixed and changed

- **The setter writes directly and synchronously.** Store updates no longer wait for a `createEffect` to copy a signal back into state-ref.
- **SSR detection uses `isServer` from `solid-js/web`.**
- **CommonJS and Node TypeScript resolution.** The package now uses a real `.cjs` entry, `.d.cts` declarations, and `.js` extensions in declaration imports for `node16` / `nodenext`.
- The `state-ref` peer range moves from `^3.0.0` to `^3.1.0`. Published packages exclude test sources.

## Upgrade

```sh
pnpm add state-ref@3.1.0 @stateref/connect-solid@1.4.0
```

Check nested mutations and functional setters that modify and return `prev`; replace them with immutable updates.

[Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/%40stateref/connect-solid%401.3.0...%40stateref/connect-solid%401.4.0
