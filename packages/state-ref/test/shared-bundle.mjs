import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { createStore } from 'state-ref';
import {
  getShared,
  isProvided,
  isReady,
  onShared,
  pendingShared,
  provideShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(packageRoot, 'dist', file), 'utf8');
const coreUmd = read('state-ref.umd.js');
const batchUmd = read('state-ref.batch.umd.js');
const sharedUmd = read('state-ref.shared.umd.js');
const plain = value => JSON.parse(JSON.stringify(value));

// T-SH-15: no window. This process is plain Node, and the entry still works.
assert.equal(typeof window, 'undefined');
{
  const opened = [];
  const stages = [];
  whenReady('node.ready', ref => opened.push(ref.value));
  sharedWatch('node.ready')(ref => {
    stages.push(!isProvided(ref) ? 'pending' : isReady(ref) ? 'ready' : 'wait');
  });
  assert.deepEqual(pendingShared(), ['node.ready']);
  const ref = provideShared('node.ready', createStore(0), {
    ready: store => store.value > 0,
  })();
  assert.equal(getShared('node.ready')().value, 0);
  ref.value = 7;
  ref.value = 8;
  assert.deepEqual(opened, [7]);
  assert.deepEqual(stages, ['pending', 'wait', 'ready', 'ready']);
  onShared('node.ready', watch => assert.equal(watch().value, 8));
}

// The entry carries no copy of the core and reaches for none.
for (const file of ['state-ref.shared.mjs', 'state-ref.shared.cjs']) {
  assert.equal(/\b(import|require)\b/.test(read(file)), false, file);
}
assert.equal(coreUmd.includes('state-ref.shared'), false);

/**
 * A page where two bundles each carry their own copy of state-ref and of the
 * shared entry: `A` is the provider's copy, `B` the consumer's. Evaluating a
 * UMD build twice is exactly that - two module instances, nothing in common
 * but `globalThis`.
 */
function page() {
  const browser = new JSDOM('', { runScripts: 'dangerously' });
  const { window } = browser;
  for (const copy of ['A', 'B']) {
    window.eval(coreUmd);
    window.eval(sharedUmd);
    // The batch UMD binds to the `stateRef` global present when it loads.
    window.eval(batchUmd);
    window.eval(`
      var core${copy} = stateRef, shared${copy} = stateRefShared, batch${copy} = stateRefBatch;
    `);
  }
  assert.equal(window.eval('coreA !== coreB && sharedA !== sharedB'), true);
  return browser;
}

const PROVIDE = `
  var watchA = coreA.createStore({ ready: false, count: 0 });
  sharedA.provideShared('subs', watchA, {
    ready: function (ref) { return ref.ready.value; }
  });
`;
// The consumer's guards come from the provider's copy on purpose: a ref made
// by one copy has to answer a guard from another.
const CONSUME = `
  var log = [];
  var subsWatch = sharedB.sharedWatch('subs');
  subsWatch(function (ref) {
    if (!sharedA.isProvided(ref)) return log.push('pending');
    log.push('count:' + ref.count.value);
  });
  sharedB.whenReady(subsWatch, function (ref) {
    log.push('ready:' + ref.count.value);
  });
`;

// T-SH-10: either load order ends up connected.
for (const [label, scripts] of [
  ['provider first', [PROVIDE, CONSUME]],
  ['consumer first', [CONSUME, PROVIDE]],
]) {
  const browser = page();
  const { window } = browser;
  scripts.forEach(script => window.eval(script));

  assert.deepEqual(
    plain(window.eval('log')),
    label === 'consumer first' ? ['pending', 'count:0'] : ['count:0'],
    label
  );
  assert.deepEqual(plain(window.eval('sharedA.pendingShared()')), [], label);
  assert.equal(window.eval('sharedA.isReady(subsWatch())'), false, label);
  assert.equal(window.eval("sharedB.getShared('subs') === watchA"), true);

  // The provider writes, the consumer's subscription hears it.
  window.eval('watchA().count.value = 1; watchA().ready.value = true;');
  assert.equal(window.eval('sharedA.isReady(subsWatch())'), true, label);
  // The consumer writes through the provider's store, and the gate stays shut.
  window.eval(`
    subsWatch().count.value = 2;
    watchA().ready.value = false;
    watchA().ready.value = true;
  `);
  assert.deepEqual(
    plain(window.eval('log')).slice(-4),
    ['count:0', 'count:1', 'ready:1', 'count:2'],
    label
  );
  assert.equal(window.eval('watchA().count.value'), 2, label);
  browser.window.close();
}

// T-SH-23: a value nobody owns. Each copy asks with its own factory; the first
// one creates it and the other copy gets that same object, in either order.
for (const [first, second] of [
  ['A', 'B'],
  ['B', 'A'],
]) {
  const browser = page();
  const { window } = browser;
  const result = plain(
    window.eval(`
      var made = [];
      var make = function (copy) {
        return function () {
          made.push(copy);
          return window['core' + copy].createStore({ open: false });
        };
      };
      var one = shared${first}.ensureShared('ui.modal', make('${first}'));
      var two = shared${second}.ensureShared('ui.modal', make('${second}'));
      var seen = [];
      two(function (ref) { seen.push(ref.open.value); });
      one().open.value = true;
      ({ same: one === two, made: made, seen: seen });
    `)
  );
  assert.deepEqual(result, { same: true, made: [first], seen: [false, true] });
  browser.window.close();
}

// T-SH-09: the consumer's own helpers over the provider's watch.
{
  const browser = page();
  const { window } = browser;
  window.eval(PROVIDE);
  const result = plain(
    window.eval(`
      var watch = sharedB.getShared('subs');
      var doubled = [];
      coreB.createComputed([watch], function (refs) {
        return refs[0].count.value * 2;
      })(function (ref) { doubled.push(ref.value); });
      var pairs = [];
      var other = coreB.createStore(10);
      coreB.combineWatch([watch, other])(function (refs) {
        pairs.push([refs[0].count.value, refs[1].value]);
      });
      watchA().count.value = 3;
      other().value = 11;
      ({ doubled: doubled, pairs: pairs });
    `)
  );
  assert.deepEqual(result.doubled, [0, 6]);
  assert.deepEqual(result.pairs, [
    [0, 10],
    [3, 10],
    [3, 11],
  ]);
  browser.window.close();
}

// T-SH-12: what `batch` does across copies. Recorded, not promised.
{
  const browser = page();
  const { window } = browser;
  window.eval(PROVIDE);
  const runs = plain(
    window.eval(`
      var watch = sharedB.getShared('subs');
      var own = [];
      watch(function (ref) {
        ref.count.value;
        ref.ready.value;
        own.push(1);
      });
      batchA.batch(function () {
        watch().count.value = 1;
        watch().ready.value = true;
      });
      var afterOwn = own.length;
      batchB.batch(function () {
        watch().count.value = 2;
        watch().ready.value = false;
      });
      ({ providerBatch: afterOwn - 1, consumerBatch: own.length - afterOwn });
    `)
  );
  // The provider's batch coalesces its own store's two writes into one run.
  assert.equal(runs.providerBatch, 1);
  console.log(
    `batch across copies: provider batch -> ${runs.providerBatch} run, ` +
      `consumer batch -> ${runs.consumerBatch} runs for 2 writes`
  );
  assert.equal(runs.consumerBatch, 2);
  browser.window.close();
}

// T-SH-11: a copy that speaks another protocol stops instead of overwriting.
{
  const browser = page();
  const { window } = browser;
  window.eval(`
    var foreign = { v: 2, entries: new Map(), waiters: new Map() };
    globalThis[Symbol.for('state-ref.shared')] = foreign;
  `);
  assert.throws(() => window.eval("sharedA.getShared('subs')"), /protocol 2/);
  assert.equal(
    window.eval("globalThis[Symbol.for('state-ref.shared')] === foreign"),
    true
  );
  browser.window.close();
}

console.log('shared ESM (no window) and two-copy UMD browser smoke: PASS');
