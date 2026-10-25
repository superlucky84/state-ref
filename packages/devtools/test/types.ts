import { createStore } from 'state-ref';
import { createDevtools, type DevtoolsSnapshot } from '@stateref/devtools';

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
