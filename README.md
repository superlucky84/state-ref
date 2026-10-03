# state-ref

> Universal state management library that can be easily integrated into UI libraries

![sref](https://github.com/user-attachments/assets/93e54d8f-1326-482c-b2f6-e9822386425b)

**📚 [Documentation](https://superlucky84.github.io/state-ref/#/)** · [Quick Start](https://superlucky84.github.io/state-ref/#/guide/quick-start) · [한국어](https://superlucky84.github.io/state-ref/#/ko)

`state-ref` combines JavaScript proxies with the functional lens pattern so you can read and write deeply nested state directly, while the data itself stays immutable.

## Why

- **Write to a path, not through a reducer.** `ref.user.address.city.value = 'Busan'` is the whole update. No action types, no selectors, no spread chains.
- **Immutable underneath.** Every write produces new objects along the path through a lens; nothing is mutated in place, so change detection by reference keeps working.
- **You are woken by what you read.** A subscription collects the paths its callback actually touched on its first run, and only those paths wake it again.
- **Any UI library, or none.** Official connectors for React, Preact, Vue, Svelte, Solid and Lithent, and a documented contract for writing your own.
- **Small, and you pay for what you import.** The core is under 4 kB gzipped. Batching, local drafts and server sync are separate entry points that never load unless you ask for them.

## Install

```bash
npm install state-ref
```

## A Quick Look

<!-- doc-example: skip - a minimal orientation snippet; the full example set lives in packages/state-ref/README.md -->

```typescript
import { createStore } from 'state-ref';

const watch = createStore({ count: 0, user: { name: 'Lee' } });

// Subscribe. The callback runs once to collect what it reads.
watch(state => {
  console.log('count is', state.count.value);
});

// An unbound reference: reads and writes, registers no tracking.
const ref = watch();

ref.count.value += 1;      // the subscriber above runs
ref.user.name.value = 'Min'; // it does not - nobody read that path
```

## Documentation

Everything below lives on the [documentation site](https://superlucky84.github.io/state-ref/#/).

### Getting Started

- [Introduction](https://superlucky84.github.io/state-ref/#/guide/introduction)
- [Quick Start](https://superlucky84.github.io/state-ref/#/guide/quick-start)
- [AI Agent Skills](https://superlucky84.github.io/state-ref/#/ai-agent-skills)
- [AI Agent Role Add-on](https://superlucky84.github.io/state-ref/#/ai-agent-addon)

### Core Concepts

- [createStore](https://superlucky84.github.io/state-ref/#/guide/create-store)
- [Watch Function](https://superlucky84.github.io/state-ref/#/guide/watch)
- [Understanding References](https://superlucky84.github.io/state-ref/#/guide/references)
- [StateRefStore](https://superlucky84.github.io/state-ref/#/guide/state-ref-store)
- [Subscription](https://superlucky84.github.io/state-ref/#/guide/subscription)
- [Primitive Types](https://superlucky84.github.io/state-ref/#/guide/primitives)

### Advanced Usage

- [createComputed](https://superlucky84.github.io/state-ref/#/guide/computed)
- [combineWatch](https://superlucky84.github.io/state-ref/#/guide/combine-watch)
- [Manual Sync (Flux)](https://superlucky84.github.io/state-ref/#/guide/manual-sync)
- [batch](https://superlucky84.github.io/state-ref/#/guide/batch) — group several writes into one notification pass

### Local Draft

An independent edit session over an existing ref, from `state-ref/draft`.

- [createDraft](https://superlucky84.github.io/state-ref/#/guide/draft)
- [apply, reset and discard](https://superlucky84.github.io/state-ref/#/guide/draft-apply)
- [Conflicts](https://superlucky84.github.io/state-ref/#/guide/draft-conflicts)
- [Lifetime](https://superlucky84.github.io/state-ref/#/guide/draft-lifetime)

### Server Sync

A shared query cache with an editable resource ref, from the separate `@stateref/sync` package.

- [createSyncClient](https://superlucky84.github.io/state-ref/#/guide/sync)
- [query and resource](https://superlucky84.github.io/state-ref/#/guide/sync-query)
- [mutation and link](https://superlucky84.github.io/state-ref/#/guide/sync-mutation)
- [display and reactive keys](https://superlucky84.github.io/state-ref/#/guide/sync-view)
- [Infinite Queries](https://superlucky84.github.io/state-ref/#/guide/sync-infinite)
- [Streaming](https://superlucky84.github.io/state-ref/#/guide/sync-stream)
- [Automatic Refetch](https://superlucky84.github.io/state-ref/#/guide/sync-refetch)
- [Persistence and SSR](https://superlucky84.github.io/state-ref/#/guide/sync-persistence)
- [Observation](https://superlucky84.github.io/state-ref/#/guide/sync-observation)

### Helper Functions

- [Lens Pattern](https://superlucky84.github.io/state-ref/#/guide/lens)
- [copyable](https://superlucky84.github.io/state-ref/#/guide/copyable)
- [cloneDeep](https://superlucky84.github.io/state-ref/#/guide/clone-deep)

### Framework Integration

- [React](https://superlucky84.github.io/state-ref/#/guide/react)
- [Preact](https://superlucky84.github.io/state-ref/#/guide/preact)
- [Vue](https://superlucky84.github.io/state-ref/#/guide/vue)
- [Svelte](https://superlucky84.github.io/state-ref/#/guide/svelte)
- [Solid](https://superlucky84.github.io/state-ref/#/guide/solid)
- [Lithent](https://superlucky84.github.io/state-ref/#/guide/lithent)
- [Custom Connector](https://superlucky84.github.io/state-ref/#/guide/custom-connector)

### API Reference

- [Core API](https://superlucky84.github.io/state-ref/#/api/core)
- [Helper API](https://superlucky84.github.io/state-ref/#/api/helpers)
- [TypeScript Types](https://superlucky84.github.io/state-ref/#/api/types)
- [Draft API](https://superlucky84.github.io/state-ref/#/api/draft)
- [Sync API](https://superlucky84.github.io/state-ref/#/api/sync)
- [Plugin API](https://superlucky84.github.io/state-ref/#/api/plugin)

## Packages

| Package | What it is |
| --- | --- |
| [`state-ref`](https://www.npmjs.com/package/state-ref) | The core. Also ships `state-ref/batch`, `state-ref/draft` and `state-ref/plugin` as separate entry points. |
| [`@stateref/sync`](https://www.npmjs.com/package/@stateref/sync) | Optional query cache, editable resource and mutations. |
| [`@stateref/connect-react`](https://www.npmjs.com/package/@stateref/connect-react) | React connector |
| [`@stateref/connect-preact`](https://www.npmjs.com/package/@stateref/connect-preact) | Preact connector |
| [`@stateref/connect-vue`](https://www.npmjs.com/package/@stateref/connect-vue) | Vue connector |
| [`@stateref/connect-svelte`](https://www.npmjs.com/package/@stateref/connect-svelte) | Svelte connector |
| [`@stateref/connect-solid`](https://www.npmjs.com/package/@stateref/connect-solid) | Solid connector |
| [`lithent`](https://www.npmjs.com/package/lithent) | Lithent, which `state-ref` integrates with directly |

The package README at [`packages/state-ref`](./packages/state-ref/README.md) carries the full set of runnable examples, and [`packages/sync`](./packages/sync/README.md) documents every rule of the sync package.

For a small app to try locally, see the [Preact and Vue shop examples](./examples/SHOP.md): product search and pagination, editable shipping information, an address draft, and a basket that compares regular writes with `batch`.

## Acknowledgements

I would like to extend my gratitude to the following people and projects:

- **[Juho Vepsäläinen](https://survivejs.com)**: Thank you for the [insightful interview](https://survivejs.com/blog/state-ref-interview/) and featuring me on your blog. Your work and contributions to the JavaScript community have been a great source of inspiration.
