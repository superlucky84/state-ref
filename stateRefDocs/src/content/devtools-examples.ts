export const devtoolsDemoCommand = `git fetch origin
git switch feat/state-ref-devtools
git pull --ff-only
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm dev:devtools`;

export const devtoolsBootstrapExample = `import { createStore } from 'state-ref';

export const watch = createStore({ count: 0, token: 'fixture' });
export let stopDebugging = () => {};

if (import.meta.env.DEV && typeof document !== 'undefined') {
  const [{ createDevtools }, { mountPanel }] = await Promise.all([
    import('@stateref/devtools'),
    import('@stateref/devtools/panel'),
  ]);
  const tools = createDevtools();
  tools.attachStore(watch, {
    name: 'Counter',
    redact: [['token']],
  });
  const unmount = mountPanel(tools, { target: document.body });

  stopDebugging = () => {
    unmount();
    tools.dispose();
  };
  import.meta.hot?.dispose(stopDebugging);
}
// Also call stopDebugging() when the application root is disposed.`;

export const devtoolsHeadlessExample = `import { createStore } from 'state-ref';
import { createDevtools } from '@stateref/devtools';

const watch = createStore({ count: 0 });
const tools = createDevtools({
  maxEvents: 200,
  maxHistoryBytes: 1_048_576,
});
const detach = tools.attachStore(watch, { name: 'Counter' });
const stopView = tools.subscribe(() => {
  console.log(tools.getSnapshot().history);
});

watch().count.value += 1;
const sourceId = tools.getSnapshot().sources[0].id;
console.log(tools.inspectStore(sourceId).value);

await new Promise<void>(resolve => queueMicrotask(resolve));

stopView();
detach();
tools.dispose();`;

export const devtoolsSyncExample = `import { createSyncClient } from '@stateref/sync';
import { createDevtools } from '@stateref/devtools';

const client = createSyncClient(); // Use your existing app client.
const tools = createDevtools();
const detach = tools.attachSync(client, { name: 'API' });
const sourceId = tools.getSnapshot().sources[0].id;
console.log(tools.inspectSync(sourceId));

detach();
tools.dispose();`;
