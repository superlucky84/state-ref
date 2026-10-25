# Development environment

Use **Node 24.19.0 LTS** and **pnpm 9.12.3** for this repository. `.nvmrc` and the existing Volta pins select the same Node version. The private root package requires the Node 24 major; public library packages do not inherit this development-only engine field.

```sh
nvm install
nvm use
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm gate
```

Use the pnpm version from the root `packageManager` field. Corepack or pnpm's version manager can select it; upgrading Node does not require upgrading the lockfile or pnpm. `pnpm gate` rejects a different Node major before building. For byte/performance comparisons, use the exact pinned patch version and record `node --version` with the result. Existing byte caps remain unchanged. Measurements recorded under Node 20 are historical and are not directly comparable with Node 24's V8/zlib results.

The documentation deployment workflow already reads `.nvmrc`, so local and CI builds use the same Node version.

## Development pins and consumer requirements

The development version does not force every consumer of `state-ref` or its connectors to use Node 24. Runtime compatibility depends on the package and the entry point used.

For **Svelte 5 through CommonJS** (`require('@stateref/connect-svelte')`), the consumer's Node must support loading ESM through `require()`. Changing only the contributor's Node version does not add that capability to an older consumer runtime. This repository validates that path on **Node 24.19.0**. Other Node versions with `require(ESM)` support need their own validation before being claimed as supported.

ESM consumers can use `import { connectSvelte } from '@stateref/connect-svelte'`. ESM-based SSR does not require a CommonJS entry point. The Svelte runtime stays external to the connector so component lifecycle state is shared with the application.
