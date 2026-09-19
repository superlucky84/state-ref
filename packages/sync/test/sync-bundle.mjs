import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSyncClient } from '../dist/stateref-sync.mjs';

const bundle = await readFile(
  new URL('../dist/stateref-sync.mjs', import.meta.url),
  'utf8'
);
assert.match(bundle, /from ["']state-ref["']/);
assert.match(bundle, /from ["']state-ref\/plugin["']/);
assert.doesNotMatch(bundle, /state-ref\/draft|@tanstack|mutationFn/);

const query = createSyncClient({ ssr: true }).query({
  queryKey: ['bundle'],
  queryFn: () => ({ count: 1 }),
});
await query.load();
assert.equal(query.ref.count.value, 1);
query.ref.count.value = 2;
assert.equal(query.isDirty(), true);
query.dispose();
console.log('sync ESM bundle: independent import and editable resource PASS');
