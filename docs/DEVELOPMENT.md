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

## Try DevTools locally

From the root of a checkout containing state-ref 3.3.0 and DevTools 0.1.0 (the release branch before merging, or main after merging):

```sh
git pull --ff-only
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm dev:devtools
```

The last command starts the React demo and opens **http://localhost:5181/mission.html?devtools=1**. The six-story guide explains what to try in the application and what to inspect beside it. Guide navigation does not run the application for you or certify a test result. On narrow screens, expand “관측창” when needed. Extra failure experiments stay folded away.

Vite also runs the local, memory-only mission API; no separate server, account, Upstash configuration or environment file is needed. `--strictPort` reports an occupied port instead of silently changing the address. Stop the server with **Ctrl+C**. Page reload clears the screen and debugging history; restarting the server also resets saved ship names.

After the initial build, later sessions normally need only `nvm use` and `pnpm dev:devtools`. Rebuild after pulling library changes. Open `/mission.html` without the query parameter to see the normal app without guidance or the inspector. The default `/` page is the detailed server-sync test fixture, so begin with the mission address above.

## Development pins and consumer requirements

The development version does not force every consumer of `state-ref` or its connectors to use Node 24. Runtime compatibility depends on the package and the entry point used.

For **Svelte 5 through CommonJS** (`require('@stateref/connect-svelte')`), the consumer's Node must support loading ESM through `require()`. Changing only the contributor's Node version does not add that capability to an older consumer runtime. This repository validates that path on **Node 24.19.0**. Other Node versions with `require(ESM)` support need their own validation before being claimed as supported.

ESM consumers can use `import { connectSvelte } from '@stateref/connect-svelte'`. ESM-based SSR does not require a CommonJS entry point. The Svelte runtime stays external to the connector so component lifecycle state is shared with the application.

## Publishing

See [RELEASING](./RELEASING.md) for the exact target versions, core → DevTools publication order, tarball checks, npm verification and documentation deployment. Contributor setup does not publish packages.
