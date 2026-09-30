// Independent contract experiment, not the sync engine implementation.
import assert from 'node:assert/strict';

assert.equal(
  keyHash(['account', { page: 2, status: 'open' }]),
  keyHash(['account', { status: 'open', page: 2 }])
);
assert.notEqual(keyHash(['account', 2]), keyHash([2, 'account']));
assert.throws(() => keyHash(['account', () => 1]), /JSON-compatible/);

const firstClient = createClient();
const secondClient = createClient();
const pending = deferred();
let firstCalls = 0;
const fetchAccount = () => {
  firstCalls += 1;
  return pending.promise;
};
const one = firstClient.load(['account', 1], fetchAccount);
const shared = firstClient.load(['account', 1], fetchAccount);
assert.strictEqual(one, shared);
assert.equal(firstCalls, 1);

const other = secondClient.load(['account', 1], () =>
  Promise.resolve({ city: '다른 요청' })
);
assert.notStrictEqual(one, other);
pending.resolve({ city: '서울' });
assert.deepEqual(await one, { city: '서울' });
assert.deepEqual(await other, { city: '다른 요청' });
assert.deepEqual(firstClient.value(['account', 1]), { city: '서울' });

const late = deferred();
const replacement = deferred();
let oldSignal;
const oldRead = firstClient.load(['account', 2], ({ signal }) => {
  oldSignal = signal;
  return late.promise;
});
firstClient.invalidate(['account', 2]);
assert.equal(oldSignal.aborted, true);
const newRead = firstClient.load(['account', 2], () => replacement.promise);
replacement.resolve({ city: '대전' });
assert.deepEqual(await newRead, { city: '대전' });
late.resolve({ city: '부산' }); // The remote function ignored cancellation.
assert.deepEqual(await oldRead, { city: '부산' });
assert.deepEqual(firstClient.value(['account', 2]), { city: '대전' });

// A key transition changes the selected entry, not the ownership of old data.
let selectedKey = ['account', 1];
selectedKey = ['account', 2];
assert.deepEqual(firstClient.value(selectedKey), { city: '대전' });
assert.deepEqual(firstClient.value(['account', 1]), { city: '서울' });

assert.equal(isStale(100, 100, 0), true);
assert.equal(isStale(100, 100, 1), false);
assert.equal(isStale(101, 100, 1), true);
assert.deepEqual([0, 1, 2, 8].map(retryDelay), [1000, 2000, 4000, 30000]);
console.log('Phase 0 query model: key, sharing, epoch, timing PASS');

function keyHash(key) {
  assert.ok(Array.isArray(key), 'query key must be an array');
  const seen = new Set();
  return JSON.stringify(normalize(key));

  function normalize(value) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (!value || typeof value !== 'object' || seen.has(value)) {
      throw new TypeError('query key must be an acyclic JSON-compatible tree');
    }
    const plain =
      Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
    if (!plain) {
      throw new TypeError('query key must be an acyclic JSON-compatible tree');
    }
    seen.add(value);
    const result = Array.isArray(value)
      ? value.map(normalize)
      : Object.fromEntries(
          Object.keys(value)
            .sort()
            .map(key => [key, normalize(value[key])])
        );
    seen.delete(value);
    return result;
  }
}

function createClient() {
  const entries = new Map();
  const entryFor = key => {
    const hash = keyHash(key);
    if (!entries.has(hash)) {
      entries.set(hash, {
        epoch: 0,
        value: undefined,
        pending: null,
        controller: null,
      });
    }
    return entries.get(hash);
  };
  return {
    load(key, read) {
      const entry = entryFor(key);
      if (entry.pending) return entry.pending;
      const epoch = entry.epoch;
      const controller = new AbortController();
      entry.controller = controller;
      const result = Promise.resolve(read({ signal: controller.signal })).then(
        value => {
          if (entry.epoch === epoch) entry.value = value;
          return value;
        }
      );
      entry.pending = result;
      const clear = () => {
        if (entry.pending === result) {
          entry.pending = null;
          entry.controller = null;
        }
      };
      result.then(clear, clear);
      return result;
    },
    invalidate(key) {
      const entry = entryFor(key);
      entry.controller?.abort();
      entry.epoch += 1;
      entry.pending = null;
      entry.controller = null;
    },
    value(key) {
      return entryFor(key).value;
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

function isStale(now, updatedAt, staleTime) {
  return now >= updatedAt + staleTime;
}

function retryDelay(attempt) {
  return Math.min(1000 * 2 ** attempt, 30000);
}
