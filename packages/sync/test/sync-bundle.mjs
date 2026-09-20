import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSyncClient } from '../dist/stateref-sync.mjs';

const bundle = await readFile(
  new URL('../dist/stateref-sync.mjs', import.meta.url),
  'utf8'
);
assert.match(bundle, /from ["']state-ref["']/);
assert.match(bundle, /from ["']state-ref\/plugin["']/);
assert.doesNotMatch(bundle, /state-ref\/draft|@tanstack/);

const query = createSyncClient({ ssr: true }).query({
  queryKey: ['bundle'],
  queryFn: () => ({ count: 1 }),
});
await query.load();
assert.equal(query.ref.count.value, 1);
query.ref.count.value = 2;
assert.equal(query.isDirty(), true);
const submitted = query.capture();
const mutation = createSyncClient({ ssr: true }).mutation({
  mutationFn: () => ({ count: 2 }),
});
assert.equal((await mutation.run('write')).kind, 'success');
const sameClient = createSyncClient({ ssr: true });
const linked = sameClient.query({
  queryKey: ['linked'],
  queryFn: () => ({ count: 1 }),
});
await linked.load();
linked.ref.count.value = 2;
const result = await sameClient
  .mutation({ mutationFn: () => ({ count: 2 }) })
  .run(
    { count: 2 },
    {
      links: [
        {
          query: linked,
          submission: linked.capture(),
          accept: { kind: 'submitted' },
        },
      ],
    }
  );
assert.equal(result.kind, 'success');
assert.equal(linked.isDirty(), false);
linked.dispose();
assert.equal(submitted.changes.length, 1);
query.dispose();
console.log('sync ESM bundle: independent query, resource and mutation PASS');
