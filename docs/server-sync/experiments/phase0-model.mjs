// Independent Phase 0 reference model. This is not a production helper API.
// Run after `pnpm build:core` with `node docs/server-sync/experiments/phase0-model.mjs`.
import assert from 'node:assert/strict';
import {
  createStore,
  NAVI,
} from '../../../packages/state-ref/dist/state-ref.mjs';

const watch = createStore({ address: { city: '서울', street: '중앙로' } });
const source = watch();
const observed = [];
watch(ref => {
  observed.push(ref.address.city.value);
});
const heldCity = source.address.city;
assert.equal(heldCity[NAVI], 'root.address.city');
heldCity.value = '부산';
assert.equal(heldCity.value, '부산');
assert.deepEqual(observed, ['서울', '부산']);

const readonly = watch(() => {}, { editable: false });
assert.throws(() => {
  readonly.address.city.value = '대전';
}, /direct modification is not allowed/);

// A draft's accepted source value is independent of a resource's server base.
const serverBase = { address: { city: '서울', street: '중앙로' } };
let resource = { address: { city: '부산', street: '중앙로' } };
const draftBase = structuredClone(resource.address);
let draft = structuredClone(draftBase);
assert.deepEqual(draft, { city: '부산', street: '중앙로' });
assert.deepEqual(changes(draftBase, draft), []);

draft.city = '대전';
assert.deepEqual(changes(draftBase, draft), [
  { key: 'city', before: '부산', after: '대전' },
]);
assert.equal(resource.address.city, '부산');

// Applying a changed field must preserve an unrelated source update.
resource.address.street = '새길';
resource = apply(resource, draftBase, draft);
assert.deepEqual(resource.address, { city: '대전', street: '새길' });
assert.equal(serverBase.address.city, '서울');
assert.deepEqual(changes(serverBase.address, resource.address), [
  { key: 'city', before: '서울', after: '대전' },
  { key: 'street', before: '중앙로', after: '새길' },
]);

// An overlapping source edit produces three values and changes nothing.
const conflictBase = { city: '부산', street: '중앙로' };
const sourceAfterOtherEdit = {
  address: { city: '광주', street: '중앙로' },
};
const mine = { city: '대전', street: '중앙로' };
assert.throws(
  () => apply(sourceAfterOtherEdit, conflictBase, mine),
  error => {
    assert.deepEqual(error.conflict, {
      key: 'city',
      before: '부산',
      mine: '대전',
      source: '광주',
    });
    return true;
  }
);
assert.equal(sourceAfterOtherEdit.address.city, '광주');

// A DTO is not a resource snapshot. Acceptance covers only submitted fields.
const submitted = Object.freeze({ city: resource.address.city });
resource.address.city = '인천';
resource.address.postcode = '12345';
const acceptedBase = {
  address: { ...serverBase.address, city: submitted.city },
};
assert.deepEqual(submitted, { city: '대전' });
assert.deepEqual(changes(acceptedBase.address, resource.address), [
  { key: 'city', before: '대전', after: '인천' },
  { key: 'street', before: '중앙로', after: '새길' },
  { key: 'postcode', before: undefined, after: '12345' },
]);

console.log('Phase 0 model: core ref, draft apply/conflict, DTO boundary PASS');

function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(key => !Object.is(before[key], after[key]))
    .map(key => ({ key, before: before[key], after: after[key] }));
}

function apply(current, before, mine) {
  const edits = changes(before, mine);
  const conflict = edits.find(
    ({ key, after }) =>
      !Object.is(current.address[key], before[key]) &&
      !Object.is(current.address[key], after)
  );

  if (conflict) {
    throw Object.assign(new Error('draft conflict'), {
      conflict: {
        key: conflict.key,
        before: conflict.before,
        mine: conflict.after,
        source: current.address[conflict.key],
      },
    });
  }

  return {
    ...current,
    address: {
      ...current.address,
      ...Object.fromEntries(edits.map(({ key, after }) => [key, after])),
    },
  };
}
