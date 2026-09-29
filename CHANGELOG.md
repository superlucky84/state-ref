# Changelog

## @stateref/connect-svelte 5.0.0 (unreleased)

The major follows the newest Svelte it supports; it still supports Svelte 4
(`peerDependencies`: `svelte ^4.0.0 || ^5.0.0`). Measured on 4.2.19 and 5.57.1.

### Added

- **`@stateref/connect-svelte/runes`** - `connectSvelteRunes(watch)(select)`
  returns `{ value }` for Svelte 5 runes components (DC-CN-05). It subscribes
  through `createSubscriber` while a template, `$effect` or `$derived` reads
  `.value`, and releases when the last reader goes. Assigning `.value` writes
  the store synchronously; a selected object or array is a frozen copy, so a
  nested mutation throws instead of changing the store behind its back. A
  separate, ESM-only entry: `svelte/reactivity` does not exist in Svelte 4.

### Fixed

- **`$store.field = value` is a real store write** (F-S5). The connector
  handed Svelte the store's internal object, so Svelte's own nested
  assignment syntax mutated the store in place - no write, no subscriber
  notified. Svelte now gets a copy, and the `set` Svelte compiles the
  assignment into writes the store with a correct `before`.

### Changed

- The store API is unchanged in shape and works on Svelte 4 and 5 (on 5,
  components written with `$store` compile in legacy mode).
- The write-back compares by value instead of an echo flag: Svelte queues a
  `set` made while it is notifying, so the flag was already down when the
  connector's own delivery came back.

## @stateref/connect-vue 3.4.0 (unreleased)

The major follows Vue, so the breaking change below lands in a minor here.
Peer range is now `vue ^3.2.0` (was `^3.0.0`): the connector uses
`onScopeDispose`, which arrived in 3.2. Measured on 3.2.47, 3.5.10 and 3.5.43.

### Breaking

- **A selected object or array is readonly** (DC-CN-04). `addr.value.city = 'x'`
  or `list.value.push(x)` is refused with Vue's readonly warning in
  development and the store is untouched - the rule the core and the other
  connectors already had. Write through `.value` of a selection instead: pick
  the leaf (`use(s => s.address.city).value = 'x'`) or replace the whole value
  (`addr.value = { ...addr.value, city: 'x' }`).

### Fixed

- **A nested write no longer changes the store behind its back** (F-V4). The
  connector wrapped the store's own object in `reactive`, so a nested write
  mutated the store in place with no subscriber notified, and the write the
  store saw a tick later had `before` equal to `after` - invisible to draft
  and sync change tracking.
- **Writes reach the store synchronously.** `city.value = 'x'` used to land on
  the next tick through a deep `watch`; reading the store in the same handler
  saw the old value.
- **Teardown follows the scope** (F-V2). `onScopeDispose` replaces
  `onUnmounted`, so a connector used inside an `effectScope` or a composable
  releases its subscription when that scope stops.

### Changed

- **No copy, no deep watch, no echo guard.** Reads go through the subscribed
  state-ref reference inside a `customRef`; writes go straight to the store.
  The guard that produced `CI-25`, `CI-26` and `CI-29` is gone; their
  regression tests still pass.

## @stateref/connect-preact 10.4.0 (unreleased)

The major follows Preact, so a behavior change that would otherwise be a
major lands in a minor here - read the Changed entry before upgrading.

### Fixed

- **A render that suspends no longer leaks its subscription** (F-P3,
  docs/connectors/DESIGN.md). The connector subscribed during render and
  released in an effect cleanup; a suspended render never commits, so nothing
  released it, and the next store write after unmount reached a dead setState
  and threw `TypeError: Cannot read properties of undefined (reading '__c')`.

### Changed

- **The subscription is made in an effect, after commit** - the same design
  as `@stateref/connect-react` 19.0.0, written with `preact/hooks` (no
  `preact/compat` dependency). A server render runs no effects and subscribes
  to nothing, without a `typeof window` check.
- **A mount renders twice**, for the same reason as the React connector: the
  second render collects the paths the component reads. Tests that counted
  renders exactly now count one more on mount.

## @stateref/connect-react 19.0.0 (unreleased)

The major follows the newest React it supports; it still supports React 18
(`peerDependencies`: `react ^18.0.0 || ^19.0.0`).

### Fixed

- **Components update under `<StrictMode>` again** (F-R1,
  docs/connectors/DESIGN.md). The connector subscribed during render and
  aborted in an effect cleanup. StrictMode's simulated unmount ended that
  subscription and the remount never made a new one: React 18.3 dropped the
  first write, React 19.3 never updated at all. A subscription also survived
  a StrictMode unmount.

### Changed

- **Built on `useSyncExternalStore`**, React's contract for external stores.
  The subscription is made after commit and ended by React, and the server
  render uses `getServerSnapshot` instead of a `typeof window` check.
- **A mount renders twice.** state-ref collects what a component reads while
  it renders through a subscribed reference, and there is none before the
  first commit - so the first render paints through a reference that
  subscribes to nothing, and the connector renders once more through the
  subscribed one. What is shown is correct from the first render; the second
  only collects paths (DC-CN-03). Tests that counted renders exactly now count
  one more on mount.

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

  The fix is a `Symbol.toStringTag` **on the proxy's target**, so Chrome names
  the reference after its path: `Proxy(root.john.age)`. Neither runtime renders
  a proxy through its traps - Node swaps a proxy for its target, Chrome names
  it after the target and previews the target's properties - so a display
  affordance has to live there or it does not exist.

  Nothing is added to the object's shape. With the `ownKeys` and
  `getOwnPropertyDescriptor` traps in place, the target is invisible to every
  shape question, which is what 2.x could not manage: `Object.keys`, spread,
  `in` and `JSON.stringify` are unchanged, verified in both runtimes. Node
  console output already worked through its own inspect hook and is unchanged.

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
