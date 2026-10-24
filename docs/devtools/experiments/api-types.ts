// Compile-only consumer of the proposed boundary; NOT an executable example.
import {
  createStore,
  createStoreManualSync,
} from '../../../packages/state-ref/dist/index';
import { observeStore } from './api-draft';

const watch = createStore({ count: 0, token: 'fixture' });
const observation = observeStore(
  watch,
  event => {
    // @ts-expect-error Diagnostic events are read-only.
    event.sequence = 1;
    if (event.type === 'write') {
      // @ts-expect-error Paths cannot mutate the store or another listener's view.
      event.path.push({ kind: 'key', value: 'count' });
    }
  },
  { redact: [['token']] }
);

const preview = observation.snapshot();
if (preview.kind === 'object') {
  // @ts-expect-error Snapshot entries are recursively read-only.
  preview.entries[0].value = { kind: 'scalar', value: 1 };
}
observeStore(createStoreManualSync(0).watch, () => {}).disconnect();
observeStore(createStore(0), () => {}).disconnect();
// @ts-expect-error The input must be a watch function, not a store reference.
observeStore(watch(), () => {});
// @ts-expect-error No raw store value is exposed through an observation.
observation.updateRef.count.value = 2;
observation.disconnect();
