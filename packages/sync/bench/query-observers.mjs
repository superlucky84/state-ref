/** T-QH-26: low-level observer cost baseline, against the built sync artifact. */
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createSyncClient } from '../dist/stateref-sync.mjs';

const count = 1000;
const repeats = 5;
const median = values =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function run(shared) {
  const client = createSyncClient();
  let reads = 0;
  const start = performance.now();
  const observers = Array.from({ length: count }, (_, index) =>
    client.observe({
      queryKey: ['observer-bench', shared ? 0 : index],
      queryFn: () => {
        reads += 1;
        return { name: 'loaded' };
      },
      initialData: { name: 'seeded' },
      staleTime: Infinity,
      gcTime: 0,
    })
  );
  const createMs = performance.now() - start;
  assert.equal(client.size(), 0, 'creating observers must not create entries');
  const controllers = observers.map(() => new AbortController());
  const mountStart = performance.now();
  observers.forEach((observer, index) =>
    observer.watch((ref, first) => {
      assert.equal(ref.data.name.value, 'seeded');
      if (first) return controllers[index].signal;
    })
  );
  const subscribeMs = performance.now() - mountStart;
  const mountedEntries = client.size();
  const mountedOwners = client
    .inspectCache()
    .reduce((sum, entry) => sum + entry.owners, 0);
  assert.equal(mountedEntries, shared ? 1 : count);
  assert.equal(mountedOwners, count);
  assert.equal(reads, 0);
  const stopStart = performance.now();
  controllers.forEach(controller => controller.abort());
  const unsubscribeMs = performance.now() - stopStart;
  observers.forEach(observer => assert.equal(observer.controls.handle(), null));
  const releaseStart = performance.now();
  const deadline = releaseStart + 5000;
  while (client.size() !== 0 && performance.now() < deadline)
    await new Promise(resolve => setTimeout(resolve, 0));
  const releaseAndGcMs = performance.now() - releaseStart;
  const remainingOwners = client
    .inspectCache()
    .reduce((sum, entry) => sum + entry.owners, 0);
  assert.equal(remainingOwners, 0, 'all owners must release');
  assert.equal(client.size(), 0, 'gcTime:0 must remove all entries');
  assert.equal(reads, 0);
  return {
    createMs,
    subscribeMs,
    unsubscribeMs,
    releaseAndGcMs,
    mountedEntries,
    mountedOwners,
    remainingEntries: client.size(),
    remainingOwners,
    reads,
  };
}

const results = [];
for (const shared of [true, false]) {
  await run(shared); // One discarded warmup per scenario.
  const samples = [];
  for (let index = 0; index < repeats; index += 1)
    samples.push(await run(shared));
  const milliseconds = {};
  for (const key of [
    'createMs',
    'subscribeMs',
    'unsubscribeMs',
    'releaseAndGcMs',
  ])
    milliseconds[key] = Number(
      median(samples.map(sample => sample[key])).toFixed(2)
    );
  results.push({
    scenario: shared ? 'one shared key' : '1000 distinct keys',
    count,
    repeats,
    medianMs: milliseconds,
    ...Object.fromEntries(
      Object.entries(samples[0]).filter(([key]) => !key.endsWith('Ms'))
    ),
    samples,
  });
}
console.log(JSON.stringify({ node: process.version, results }, null, 2));
