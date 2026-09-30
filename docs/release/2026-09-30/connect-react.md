The React connector now uses `useSyncExternalStore`, fixing missed updates and subscription teardown under StrictMode.

**Supports React 18 and 19. Requires `state-ref ^3.1.0`.** The connector major follows the newest supported React version; upgrading to React 19 is optional.

## Fixed

- **StrictMode components keep updating.** Previously, the connector subscribed during render and aborted during effect cleanup. StrictMode's simulated unmount ended that subscription, and the remount did not create a replacement. Subsequent store writes could be missed or stop updating the component entirely.
- **StrictMode unmounts release subscriptions.** A subscription could previously survive an unmount.
- **CommonJS and Node TypeScript resolution.** The package now uses a real `.cjs` entry, `.d.cts` declarations, and `.js` extensions in declaration imports for `node16` / `nodenext`.

## Changed

- `useSyncExternalStore` manages subscription setup after commit and teardown. SSR uses `getServerSnapshot`.
- **Mount performs an additional render.** The initial render displays the current value through an unbound ref. After commit, a second render collects the paths read through the subscribed ref. Update tests that assert an exact mount render count.
- The `state-ref` peer range moves from `^3.0.0` to `^3.1.0`. The core's subscription fix keeps an ended subscription from being revived by later reads.
- Published packages exclude test sources.

## Upgrade

```sh
pnpm add state-ref@3.1.0 @stateref/connect-react@19.0.0
```

Keep React and React DOM on matching supported versions (`^18.0.0 || ^19.0.0`).

[Coordinated release](https://github.com/superlucky84/state-ref/releases/tag/state-ref%403.1.0) · [Full changelog](https://github.com/superlucky84/state-ref/blob/e117a52a1e18d5b2e767c4993cd8143604328c4d/CHANGELOG.md)

**Full changes:** https://github.com/superlucky84/state-ref/compare/%40stateref/connect-react%4018.3.0...%40stateref/connect-react%4019.0.0
