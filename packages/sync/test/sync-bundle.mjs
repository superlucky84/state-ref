import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSyncClient } from '../dist/stateref-sync.mjs';
import { create } from 'state-ref';

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
const server = createSyncClient({ ssr: true });
const hydratedSource = server.query({
  queryKey: ['hydrated'],
  queryFn: () => ({ count: 7 }),
});
await hydratedSource.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));
const browser = createSyncClient({ ssr: true });
browser.hydrate(snapshot);
const hydrated = browser.query({
  queryKey: ['hydrated'],
  queryFn: () => ({ count: 8 }),
});
assert.equal(hydrated.ref.count.value, 7);
assert.equal(hydrated.status.unconfirmed.value, false);
hydratedSource.dispose();
hydrated.dispose();
const preparedClient = createSyncClient({ ssr: true });
const prepared = {
  queryKey: ['prepared'],
  queryFn: () => ({ count: 3 }),
  initialData: { count: 2 },
  staleTime: Infinity,
};
await preparedClient.prefetch(prepared);
assert.deepEqual(await preparedClient.ensure(prepared), { count: 2 });
assert.deepEqual(await preparedClient.fetch(prepared), { count: 2 });
const display = preparedClient.view(
  { queryKey: ['display'], queryFn: () => ({ city: 'Seoul' }) },
  {
    select: data => data.city,
    placeholderData: { city: 'Waiting' },
  }
);
assert.equal(display.ref.phase.value, 'placeholder');
await display.query.load();
assert.equal(display.ref.data.value, 'Seoul');
display.dispose();
const input = create({ id: null, enabled: false });
const live = preparedClient.liveView(
  input.watch,
  ({ id, enabled }) =>
    id === null
      ? null
      : {
          queryKey: ['live', id],
          queryFn: () => ({ city: `City ${id}` }),
          enabled,
        },
  { select: data => data.city }
);
assert.equal(live.query, null);
input.updateRef.id.value = 1;
input.updateRef.enabled.value = true;
await live.query.load();
assert.equal(live.ref.data.value, 'City 1');
input.updateRef.id.value = 2;
await live.query.load();
assert.equal(live.ref.data.value, 'City 2');
live.dispose();
const automaticListeners = new Set();
const automaticClient = createSyncClient({
  environment: {
    subscribe(listener) {
      automaticListeners.add(listener);
      return () => automaticListeners.delete(listener);
    },
    isFocused: () => true,
    isOnline: () => true,
  },
});
let automaticReads = 0;
const automatic = automaticClient.query({
  queryKey: ['automatic'],
  queryFn: () => ({ count: ++automaticReads }),
  refetchOnFocus: 'always',
});
await automatic.load();
automaticListeners.forEach(listener => listener('focus'));
await Promise.resolve();
await Promise.resolve();
await Promise.resolve();
assert.equal(automatic.ref.count.value, 2);
automatic.dispose();
assert.equal(automaticListeners.size, 0);
assert.equal(automaticClient.remove(['automatic']), true);
assert.equal(submitted.changes.length, 1);
query.dispose();
console.log(
  'sync ESM bundle: query, mutation, hydration, cache, views and automatic refetch PASS'
);
