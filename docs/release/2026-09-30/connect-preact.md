Subscriptions now start after commit, preventing leaks from renders that suspend before mounting.

**Supports Preact `^10.0.0`. Requires `state-ref ^3.1.0`.** The connector major follows Preact, so this release includes a mount-render behavior change in a minor version.

## Fixed

- **Suspended renders no longer leak subscriptions.** The connector previously subscribed during render and relied on effect cleanup to unsubscribe. A render that never committed had no cleanup, so a later store write could reach a dead component and throw a `TypeError`.
- **CommonJS and Node TypeScript resolution.** The package now uses a real `.cjs` entry, `.d.cts` declarations, and `.js` extensions in declaration imports for `node16` / `nodenext`.

## Changed

- Subscription setup happens in an effect after commit, using `preact/hooks` without a `preact/compat` dependency. Server rendering runs no effects and creates no subscriptions.
- **Mount performs an additional render** to collect the paths read through the committed subscription. Update tests that assert an exact mount render count.
- The `state-ref` peer range moves from `^3.0.0` to `^3.1.0`. The core's subscription fix keeps an ended subscription from being revived by later reads.
- Published packages exclude test sources.

## Upgrade

```sh
pnpm add state-ref@3.1.0 @stateref/connect-preact@10.4.0
```

[Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/%40stateref/connect-preact%4010.3.0...%40stateref/connect-preact%4010.4.0
