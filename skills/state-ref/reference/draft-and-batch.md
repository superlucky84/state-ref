# Drafts and Batch (state-ref 3.1)

Two optional core entry points. Each is a separate import, so apps that do not
use them do not load them.

## `createDraft` - a local edit session (`state-ref/draft`)

Use it for a form or dialog that edits a copy and commits (or cancels) later.

```ts
import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();
const editor = createDraft(source.address); // any ref, including a child ref

editor.ref.city.value = 'Busan'; // local only; the source is unchanged
editor.isDirty(); // true
editor.changes(); // [{ path: ['city'], before, after, source, conflict, ... }]

const result = editor.apply(); // merge edited fields into the latest source
if (!result.ok) console.log(result.reason); // 'conflict' | 'readonly' | ...
editor.discard(); // close the session and release subscriptions
```

- `apply()` returns `{ ok: true, applied }` or `{ ok: false, reason }` with
  `reason` one of `'readonly' | 'missing-source' | 'invalid-source' | 'conflict'`.
  It never throws for these; check `ok`.
- A field the source changed underneath after you edited it is a **conflict**.
  Settle it with `editor.resolve(change, 'source' | 'draft')`, then apply.
- `reset()` drops local edits but keeps the session; `discard()` closes it.
- `editor.watch` / `editor.watchStatus` have the normal `Watch` shape, so they
  work with every UI connector. `editor.status` has `dirty`, `conflicts`,
  `version`.
- Supported data: plain acyclic objects and dense arrays. An array is one
  atomic field. Functions, `Date`, `Map` and mutating an object obtained through
  `.value` are rejected.
- `apply()` only updates the local source. It never talks to a server; for
  that, use `@stateref/sync` (see `server-sync.md`).

## `batch` - one notification pass for several writes (`state-ref/batch`)

```ts
import { batch } from 'state-ref/batch';

batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // a subscriber reading b and c runs once, with 3 and 4, before batch returns
```

- Values change immediately inside the callback; only notifications are
  grouped. Nested batches flush at the outermost one.
- It does **not** roll back on throw and cannot span an `await`.
- Manual-sync stores still need their `sync()`.

## Computed without a subscriber

Calling a `createComputed` watch without a callback creates no source
subscriptions. Reading `.value` recalculates only when a value the calculation
read has changed (memo). Pass a callback when you need change notifications.

## `state-ref/plugin`

The integration surface `@stateref/sync` and drafts are built on
(`connectRef`, `observeRef`, write journal). ESM only. Application code
normally never imports it.
