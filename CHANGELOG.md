# Changelog

## 3.0.2

### Fixed

- **A browser console shows a reference's path again** (`CI-28`). Logging a
  reference in devtools printed `Object {…}` with the path nowhere in sight.

  2.x displayed it for free because the proxy's *target* was the display
  object `{ _navi, _type, _value }` and there was no `ownKeys` trap, so a
  browser rendered those three properties. That is the same lie that made
  `Object.keys(ref)` return `['_navi', '_type', '_value']` and spread copy
  debug junk, which 3.0.0 fixed (`CI-02`, `CI-03`) - and fixing it left the
  browser's default rendering with only real state to show.

  `Symbol.toStringTag` now answers with the path, so the header line reads
  `root.john.age {…}`. Nothing is added to the object's shape: `Object.keys`,
  spread, `in` and `JSON.stringify` are untouched. Node console output already
  worked through its own inspect hook and is unchanged.

## 3.0.1

### Fixed

- **`createComputed` notified only the first subscriber** (`CI-27`). `result`
  and the proxy reading it lived in `createComputed`'s own closure, so every
  subscription to the same computed shared them. The first subscription to run
  wrote `result`; every later one then compared the same new value against it,
  found no change, and returned without notifying. A computed shared by nine
  components woke one of them.

  The shared closure is as old as the helper, but it was invisible until
  3.0.0 added the `equals` comparison that made a stale `result` mean "nothing
  changed" — so this is a 3.0.0 regression, not a 2.x defect. Each
  subscription now keeps its own `result` and its own proxy, which is what the
  comparison needs: what *that* subscriber last saw.

  Reported against 3.0.0 in application code where several components shared
  one computed.

## 3.0.0

The first release off the core improvement work. Twenty-six issues were filed
against the released 2.1.0 and its branch (`docs/core-improvement`); this
release closes them. Four changes can break code that worked on 2.x, which is
why this is a major (`DC-08`).

### Breaking

- **Debug handles are symbols.** `_value`, `_navi` and `_type` were string keys
  on every reference, so state that owned a property of one of those names was
  shadowed and the keys showed up in `ownKeys`. They are now registered symbols
  exported as `NAVI` and `TYPE` (`CI-02`, `DC-05`).
  *Migration:* `ref.a[NAVI]` instead of `ref.a._navi`.
- **`StateRefStore<T[]>` describes what the runtime actually provides.** The
  type used to promise array methods the proxy never had, so `ref.items.map()`
  type-checked and failed at runtime. Reads go through `.value` -
  `ref.items.value.map(...)` - which is what the documentation already taught,
  and `length` stays a reactive path (`CI-10`, `DC-04`).
  *Migration:* TypeScript will point at every site; the fix is `.value`.
- **A subscriber that throws no longer throws at the assignment.** The store is
  already updated by the time subscribers run, so raising there reported the
  failure at a place that had nothing to do with it and skipped every
  subscriber queued behind. Errors from a pass are now collected and reported
  together through `console.error` (`CI-05`, `CI-18`).
  *Migration:* if you relied on `ref.a.value = x` throwing, handle the error in
  the subscriber.
- **`watch(cb, { cache: false })` on a manual-sync store no longer allows
  direct writes.** Passing any option used to drop the store's mode, which
  silently made a manual-sync reference writable (`CI-01`).
  *Migration:* write through `updateRef`, or ask for `{ editable: true }`.

### Added

- **`createStore` and `createStoreManualSync` take a second argument,
  `{ trackDeps }`** (`CI-14`, `DC-02`). With it on, a subscriber's
  dependencies are re-collected on every run, so a path the callback has
  stopped reading stops waking it - a component with a conditional read stops
  re-rendering for the branch it did not take. 2.x had no such option and no
  way to get this behaviour; a subscription there only ever grew.

  **Off by default**, because the trade is narrow: re-collection costs about
  1.4x per notification delivered and saves whole notifications, so it only
  pays once it removes roughly 40% of them, and a subscriber with no
  conditional reads removes none. Through a framework connector it is
  narrower still - re-collection is driven by a store change, so a component
  branching on its own state never sheds a path. Turn it on where it pays:
  a subscriber whose branch condition lives in the store.

### Fixed

- **`combineWatch` and `createComputed` leaked subscriptions** - both dropped
  the `AbortSignal` the caller returned, so a component connected through
  either kept its subscription and its `setState` closure after unmount, on
  every framework (`CI-06`, `CI-07`).
- **`createComputed` fired when its derived value had not changed** and offered
  no way to unsubscribe (`CI-07`).
- **`cloneDeep` lost data**: symbol keys, `Date`, `Map`, `Set` and `RegExp` all
  came back as plain objects, and a circular reference overflowed the stack
  (`CI-08`, `DC-07`).
- **Writing through a missing intermediate path** threw
  `TypeError: Cannot set properties of undefined`. It now names the path and
  the segment that is not an object. Missing paths are still not created
  (`CI-04`, `DC-01`).
- **The proxy answers the rest of the protocol**: `JSON.stringify` no longer
  recurses forever, and `Object.keys`, `in`, spread and `delete` behave
  (`CI-02`, `CI-03`).
- **A subscriber that writes the path it reads** recursed until the stack
  broke, and the `RangeError` was swallowed by the error reporter - whose own
  `console.error` then overflowed too, leaving the store stopped mid-way with
  nothing to read. Propagation deeper than 100 levels now throws an error
  naming the path (`CI-23`, `DC-16`).
- **An `AbortSignal` that fired while a change was propagating was undone.**
  The subscription was removed and then re-registered by its own callback's
  reads, and could never be torn down again because the signal had already
  fired (`CI-24`, `DC-17`).
- **`cache: false` polluted the cache** it was asking to bypass, handing the
  next caller a reference belonging to one of the extra subscriptions
  (`CI-16`).

### Performance

- Reading a leaf 8 deep, 50,000 times: **325.6 ms → 12.1 ms** (`CI-11`,
  `CI-19`).
- Writing with 1,600 idle subscribers: **35.6 ms → 0.2 ms** (`CI-12`).
  Subscriptions are identified by path-tree node identity instead of a string
  built per access, and a write examines only the subscriptions it could have
  touched (`DC-10`, `DC-12`).
- **References are stable**: `ref.a === ref.a` (`CI-15`).
- **The path tree no longer grows without bound.** A node is created where a
  subscription reaches, not wherever a proxy lands, so a store over an open key
  space - array indices, uuids - stops accumulating: 10,000 write-only keys
  went from 10,003 nodes to 3, and a parent write after 64,000 of them from
  22.85 ms to 0.00 ms (`CI-22`, `DC-14`).
- Bundle: 1,945 B → 3,318 B minified+gzip. The budget was reset twice as the
  measurement was corrected and once to pay for `CI-23`/`CI-24` (`DC-09`).

### Not changed, on purpose

- **Writes are not batched.** One assignment notifies once, synchronously.
  Deferring propagation was measured and rejected: it buys less than it costs
  in predictability, and the re-entrancy guarantees depend on a pass finishing
  before the next begins (`CI-13`, `DC-03`, `INV-4`).
- **No `dispose()`.** Teardown stays the two paths that exist: return an
  `AbortSignal`, or return `false` (`CI-17`, `DC-06`).

---

## @stateref/connect-vue 3.3.0

- **A store change arriving in the same turn as a component's mount was
  dropped.** The connector's echo guard was armed by its own first run, which
  has nothing to echo - it only creates the reactive - and only cleared on a
  microtask (`CI-25`).
- **A value passing through `0`, `''`, `false` or `null` broke the component
  permanently.** Whether to update the reactive or create it was decided on the
  truthiness of its current value, so a falsy value replaced the object the
  template was bound to and left the component wired to an orphan (`CI-26`).

## @stateref/connect-react 18.3.0, @stateref/connect-preact 10.3.0, @stateref/connect-svelte 4.3.0, @stateref/connect-solid 1.3.0

- `peerDependencies` now accepts `state-ref@^3.0.0`.
