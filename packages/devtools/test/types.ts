import { createStore } from 'state-ref';
import { createDevtools, type DevtoolsSnapshot } from '@stateref/devtools';
import { devtools, stopDevtools } from '@stateref/devtools/auto';
import { mountPanel, type ButtonPosition } from '@stateref/devtools/panel';
import { createSyncClient } from '@stateref/sync';

type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;
const original = Object.assign(createStore({ count: 0 }), {
  extra: 1 as const,
});
const registered = devtools(original, {
  name: 'typed',
  redact: [['count']],
  enabled: true,
});
const exactWatch: Same<typeof original, typeof registered> = true;
const client = Object.assign(createSyncClient(), { extra: 2 as const });
const observedClient = devtools(client, { name: 'API', enabled: true });
const exactClient: Same<typeof client, typeof observedClient> = true;
const query = observedClient.query({
  queryKey: ['types'],
  queryFn: () => ({ name: 'Lee' }),
});
const name: string = query.ref.name.value;
// @ts-expect-error A state reference is not a root watch or Sync client.
devtools(original());
// @ts-expect-error Sync metadata does not support store value masks.
devtools(client, { redact: [['secret']] });
// @ts-expect-error A client is not a boolean enabled flag.
devtools(client, { enabled: client });
stopDevtools(registered);
stopDevtools(observedClient);
stopDevtools();
void exactWatch;
void exactClient;
void name;

const watch = createStore({ count: 0 });
const tools = createDevtools({ maxEvents: 10, maxHistoryBytes: 1024 });
const detach = tools.attachStore(watch, { redact: [['count']] });
const snapshot: DevtoolsSnapshot = tools.getSnapshot();
// @ts-expect-error Snapshots do not expose a mutable history buffer.
snapshot.history.push({});
// @ts-expect-error Source metadata is read-only.
snapshot.sources[0].name = 'changed';
const inspection = tools.inspectStore(snapshot.sources[0].id);
if (inspection.value.kind === 'object') {
  // @ts-expect-error Values remain immutable through the recorder boundary.
  inspection.value.entries[0].value = { kind: 'scalar', value: 1 };
}
// @ts-expect-error A reference is not a watch.
tools.attachStore(watch());
// @ts-expect-error Unknown options must be caught at the call site.
createDevtools({ maxEvent: 10 });
tools.pause();
tools.resume();
tools.clear();
detach();
tools.dispose();

const corner: ButtonPosition = 'top-left';
devtools(original, { panel: { buttonPosition: corner } });
mountPanel(createDevtools(), { buttonPosition: corner });
// @ts-expect-error Positions must name a supported corner.
devtools(original, { panel: { buttonPosition: 'center' } });
// @ts-expect-error The explicit panel entry has the same position contract.
mountPanel(createDevtools(), { buttonPosition: 'bottom' });
