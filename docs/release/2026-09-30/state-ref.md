Local drafts and explicit batching join the core, `@stateref/sync` makes its first release, and all five framework connectors are updated for reliable subscriptions and tracked writes.

The core upgrade from 3.0.x is additive. Read the connector upgrade notes below: Vue and Solid change how selected objects can be edited, and React and Preact perform an additional render on mount.

## Added

- **Local edit sessions with `state-ref/draft`.** `createDraft(ref)` works over a whole ref or a child ref. Edit through `draft.ref`, inspect `isDirty()` and `changes()`, then `apply()`, `reset()`, or `discard()`. A draft starts from the source's current value with its own clean change history. Overlapping source changes become conflicts you can settle with `resolve()`. Applying a draft merges its changes into the source locally; it does not send a server request.
- **Explicit batching with `state-ref/batch`.** `batch(fn)` groups subscriber notifications within a synchronous scope. Values and write observers update at every setter; subscribers run once when the outer batch returns.
- **An ESM integration entry at `state-ref/plugin`.** `connectRef`, `observeRef`, `createWriteJournal`, and `guardWriteObserver` provide the integration surface used by draft and sync.
- **Memoization for unbound computed refs.** A computed ref with no subscriber reuses its result until a value read by the calculation changes, without subscribing to its sources.

Drafts, batching, and sync load only when their respective entry points or package are imported.

```ts
import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();
const editor = createDraft(source.address);

editor.ref.city.value = 'Busan';
editor.changes(); // city: Seoul -> Busan; source is still Seoul
editor.apply();   // merges the edit into source.address locally
editor.discard(); // closes the session; the applied source value stays
```

## Fixed

- **Ended subscriptions stay ended.** Reading an aborted ref no longer re-registers its subscription and wakes a callback the caller already stopped (`CI-30`).
- **`watch()` without a callback registers no subscription.** Its returned ref still reads and writes the live store.
- **CommonJS loading and Node TypeScript resolution work again.** `require('state-ref')` now loads a real `.cjs` entry with `.d.cts` declarations. Published declarations use `.js` extensions for `node16` and `nodenext` resolution. The UMD build remains available for script-tag use.

`state-ref/draft` and `state-ref/batch` also support CommonJS. `state-ref/plugin` is ESM only.

## Coordinated package releases

All six companion packages now require **`state-ref ^3.1.0`**. Upgrade the core together with the packages you use.

| Package | Version | Highlights |
| --- | --- | --- |
| [`@stateref/sync`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/sync%400.1.0) | **0.1.0** | First release: query cache, editable resources, linked mutations, SSR hydration, and persistence. ESM only; no TanStack runtime dependency. |
| [`@stateref/connect-react`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/connect-react%4019.0.0) | **19.0.0** | React 18 and 19; `useSyncExternalStore`; fixes StrictMode updates and teardown. |
| [`@stateref/connect-preact`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/connect-preact%4010.4.0) | **10.4.0** | Subscribes after commit; fixes subscription leaks from suspended renders. |
| [`@stateref/connect-vue`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/connect-vue%403.4.0) | **3.4.0** | Synchronous writes and scope cleanup. **Selected objects and arrays are readonly.** Requires Vue `^3.2.0`. |
| [`@stateref/connect-svelte`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/connect-svelte%405.0.0) | **5.0.0** | Svelte 4 and 5; new ESM-only `./runes` entry; tracked `$store.field` assignments. |
| [`@stateref/connect-solid`](https://github.com/superlucky84/state-ref/releases/tag/%40stateref/connect-solid%401.4.0) | **1.4.0** | Direct synchronous setters. **Selected objects and arrays are frozen copies.** |

Connector major versions follow their frameworks. In particular, the Vue and Solid behavior changes ship in minor connector versions. React 19.0.0 still supports React 18, and Svelte 5.0.0 still supports Svelte 4.

React and Preact now render once more on mount to collect the paths read through their committed subscription. Update tests that assert an exact mount render count.

All five connectors also ship the CommonJS and declaration-resolution fixes and exclude their test sources from npm packages. The Svelte `./runes` entry and `@stateref/sync` remain ESM only.

## Install

```sh
pnpm add state-ref@3.1.0
# Optional server sync:
pnpm add @stateref/sync@0.1.0
```

[Draft guide](https://superlucky84.github.io/state-ref/#/guide/draft) · [Batch guide](https://superlucky84.github.io/state-ref/#/guide/batch) · [Server sync guide](https://superlucky84.github.io/state-ref/#/guide/sync) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/state-ref%403.0.2...state-ref%403.1.0
