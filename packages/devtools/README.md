# @stateref/devtools

Unreleased, read-only debugging sessions for state-ref, with bounded history, Sync metadata, and an optional browser panel.

This branch prepares state-ref 3.3.0 (diagnostics protocol 1) and DevTools 0.1.0. Build the workspace to try them; they have not been published. Published state-ref 3.2.2 does not contain this API.

Use a development-only bootstrap. Vite's development server selects the development core automatically; Node needs `--conditions=development`. For production applications, dynamically import this package inside the application's development build condition. Importing the package is SSR-safe and does not create a session or touch the DOM.

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

## Browser panel and Sync

Mount the panel from a development-only bootstrap. It uses a ShadowRoot and has State, Timeline, Subscriptions and Sync tabs. Folding the panel keeps recording; unmounting removes its DOM/listeners while the session continues. Session disposal also removes connected panels.

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

From the workspace root:

```sh
pnpm build:core
pnpm build:devtools
pnpm test:devtools
node packages/devtools/test/bundle.mjs
```

The canonical implementation plan and remaining work are in [docs/devtools](../../docs/devtools/IMPLEMENT.md).
