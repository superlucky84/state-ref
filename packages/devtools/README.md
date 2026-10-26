# @stateref/devtools

Read-only debugging sessions for state-ref, with bounded history, Sync metadata, and an optional browser panel.

DevTools 0.1.0 requires state-ref **^3.3.0** (diagnostics protocol 1). State-ref 3.2.2 does not contain this API. Build the workspace to try it locally, or use the matching npm versions once available. Publication status and commands are in the [release guide](../../docs/RELEASING.md).

## Start with a store or Sync client

Use the framework-independent `@stateref/devtools/auto` entry. `devtools()` returns the **same reference and type**, so existing store and sync connector calls stay unchanged. In Vite development, it registers the target once and lazily opens one shared panel. No separate recorder, mount call or per-query setup is needed.

```ts
import { createStore } from 'state-ref';
import { devtools, stopDevtools } from '@stateref/devtools/auto';

export const watch = devtools(createStore({ count: 0, token: 'fixture' }), {
  name: 'Counter',
  enabled: import.meta.env.DEV,
  hot: import.meta.hot,
  redact: [['token']],
});

// Pass watch to your usual framework connector.
export const stopDebugging = () => stopDevtools(watch);
```

If you use Sync, wrap the existing application client once:

```ts
import { createSyncClient } from '@stateref/sync';
import { devtools } from '@stateref/devtools/auto';

export const client = devtools(createSyncClient(), {
  name: 'API',
  enabled: import.meta.env.DEV,
  hot: import.meta.hot,
});
// Pass the same client to @stateref/connect-*/sync as before.
```

- The default production export is an identity function **even with `enabled: true`**. It imports no recorder or panel. The active development entry also leaves the target untouched during SSR or with `enabled: false`. Vite and Node export conditions are verified; configure other bundlers to select `development` only for development builds.
- `hot: import.meta.hot` is optional and releases that module's registration on replacement. Separate modules can share a target; the last module release detaches it. Without a hot context, registration lasts until explicit cleanup or page reload. Call `stopDevtools(target)` when its application lifetime ends, or `stopDevtools()` to stop all automatic registrations and remove their panel. Headless sessions are independent.
- Repeated registration of one object is idempotent. Different objects with the same name stay distinct. The first registration copies its name and masks; omitted settings inherit them, and conflicting explicit settings are rejected. Root stores accept `redact`; Sync only collects metadata.
- The first registration may set `panel: { target: element, layout: 'inline' }`. Defaults are a floating panel on the document body. Later registrations must omit panel settings or match them. Stop all automatic tools before changing the shared layout.
- Sync is optional; no Sync runtime is imported by this entry. Existing query/mutation/connector calls and owners are unchanged. Continue using a separate client for each SSR request. For recording on the server, use the headless API below.

## Advanced: recorder without a panel

The recorder and panel entries are ESM and SSR-safe to import. Keep their setup behind your application's development build condition; unlike `auto`, these lower-level entries are not automatic production no-ops. Vite selects the development core automatically; Node scripts need `node --conditions=development script.mjs`.

```ts
import { createStore } from 'state-ref';
import { createDevtools } from '@stateref/devtools';

const watch = createStore({ count: 0, token: 'fixture' });
const tools = createDevtools({ maxEvents: 200, maxHistoryBytes: 1_048_576 });
const detach = tools.attachStore(watch, {
  name: 'counter',
  redact: [['token']],
});
const stopView = tools.subscribe(() => console.log(tools.getSnapshot()));

watch().count.value += 1;
const sourceId = tools.getSnapshot().sources[0].id;
console.log(tools.inspectStore(sourceId).value); // Latest tagged Preview, even before delivery.

export function disconnectDebugging() {
  stopView();
  detach();
  tools.dispose();
}
```

`getSnapshot()` returns immutable source metadata and received history. It does not read application values. `inspectStore(id)` reads the selected store and its subscriptions without creating an application subscriber. Subscriber notifications are coalesced into microtasks, and one failing listener does not stop others.

History defaults to 200 records and 1 MiB, whichever is reached first. `historyBytes` is the sum of each record's UTF-8 JSON size, including metadata and previews, not heap usage. Old records are evicted; a record larger than the entire byte budget is omitted. The `evicted` and `oversized` counters distinguish these cases. Store inspection retains at most 1,000 subscription rows and 64 KiB of subscription JSON and reports truncation. Value previews retain the core's depth/node/64 KiB bounds.

The default source limit is 100. Options accept finite integers: `maxEvents` 1–10,000, `maxHistoryBytes` 256–16 MiB, and `maxSources` 1–1,000. Names can repeat; the same watch cannot be registered twice in one session. Different sessions are independent.

| Operation       | Behavior                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pause()`       | Disconnects producers and cancels pending delivery. Current inspection still works through a temporary observation.                  |
| `resume()`      | Reconnects with a new generation, resnapshots, and records a pause gap with an unknown missing count.                                |
| `clear()`       | Removes history already received and its storage counters. Pending core events can arrive afterward. Sources and generations remain. |
| detach function | Removes one registration; retained display history stays within its limits. The function is idempotent.                              |
| `dispose()`     | Removes sources/history, sends one final empty-state notification, then removes listeners. Further attach/subscribe calls fail.      |

Subscription IDs and observed run counts belong to one source generation, not a component or render count. A paused inspection has `generation: null`; its temporary IDs must not be linked to previous history. Core gaps trigger a bounded resnapshot; `resnapshots` counts these reads and `lastGap` preserves the reason even if the corresponding history record is later evicted. Capture-error markers can remain after a resnapshot.

This recorder neither edits application state nor replays history. Redaction rules are copied per connection and applied before state enters history. There is no automatic network transport or persistent storage.

## Advanced: explicit browser panel and Sync

Mount the panel from a development-only bootstrap. It uses a ShadowRoot and has State, Timeline, Subscriptions and Sync tabs. The default `layout: 'floating'` fixes the panel to the viewport; `layout: 'inline'` places it in the supplied target at the container's width. Folding the panel keeps recording; unmounting removes its DOM/listeners while the session continues. Session disposal also removes connected panels.

```ts
import { createStore } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import { createDevtools } from '@stateref/devtools';
import { mountPanel } from '@stateref/devtools/panel';

const tools = createDevtools();
tools.attachStore(createStore({ count: 0 }), { name: 'counter' });
tools.attachSync(createSyncClient(), { name: 'api' });
const unmount = mountPanel(tools, { target: document.body });
export function stopDebugging() {
  unmount();
  tools.dispose();
}
```

Sync is optional. The adapter uses only `inspectCache`, `subscribeCache`, `inspectMutations`, and `subscribeMutations`. It does not create queries or acquire owners. Query keys and scopes are bounded display labels; truncated keys are marked and are not used to merge rows. Query data, mutation inputs/responses and caller error objects are omitted. A settled mutation can remain in the recorder history after leaving the client's active list. Diagnostic phases do not authorize retries or prove server acceptance.

The six framework demos support `?devtools=1` on their development server, for example `pnpm --filter stateref-example-react dev` and `http://localhost:5181/?devtools=1`. Production builds remove that bootstrap. No browser extension is required.

For a first visit, run `pnpm dev:devtools` after building the workspace. It opens `http://localhost:5181/mission.html?devtools=1`: the Starlight Garage app with a six-step Korean walkthrough and an inline inspector. The mission demos for all six frameworks share this guide. See [local setup and reset instructions](../../docs/DEVELOPMENT.md#try-devtools-locally).

From the workspace root:

```sh
pnpm build:core
pnpm build:devtools
pnpm test:devtools
node packages/devtools/test/bundle.mjs
```

The canonical implementation plan and remaining work are in [docs/devtools](../../docs/devtools/IMPLEMENT.md).

The documentation site includes **Getting Started → DevTools** in English and Korean. The [English page source](../../stateRefDocs/src/pages/DevTools.tsx) and [한국어 페이지 원문](../../stateRefDocs/src/pages/DevTools_ko.tsx) cover the local walkthrough, application setup/cleanup, headless recording, Sync metadata and limits.
