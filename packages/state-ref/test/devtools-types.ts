import { createStore, createStoreManualSync } from 'state-ref';
import { observeStore, type StoreEvent } from 'state-ref/devtools';

const watch = createStore({ count: 0 });
const observation = observeStore(watch, (event: StoreEvent) => {
  // @ts-expect-error Events cannot be mutated by consumers.
  event.sequence = 0;
  if (event.type === 'write') {
    // @ts-expect-error Paths are immutable DTOs.
    event.path.push({ kind: 'key', value: 'count' });
  }
});
const snapshot = observation.snapshot();
if (snapshot.kind === 'object') {
  // @ts-expect-error Nested snapshot entries are immutable too.
  snapshot.entries[0].value = { kind: 'scalar', value: 1 };
}
observeStore(createStoreManualSync(0).watch, () => {}).disconnect();
// The observation returns Preview, never T; union-valued stores remain valid.
observeStore(
  createStore<string | number | boolean | null>(null),
  () => {}
).disconnect();
// @ts-expect-error Observations have no write channel.
observation.updateRef.count.value = 1;
// @ts-expect-error Pass a watch, not a state reference.
observeStore(watch(), () => {});
observation.disconnect();
