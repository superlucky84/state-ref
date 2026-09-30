import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreUmd = readFileSync(
  resolve(packageRoot, 'dist/state-ref.umd.js'),
  'utf8'
);
const batchUmd = readFileSync(
  resolve(packageRoot, 'dist/state-ref.batch.umd.js'),
  'utf8'
);

const watch = createStore({ b: 0, c: 0 });
const seen = [];
const ref = watch(state => {
  seen.push([state.b.value, state.c.value]);
});
batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
  assert.deepEqual(seen, [[0, 0]]);
});
assert.deepEqual(seen, [[0, 0], [3, 4]]);

const browser = new JSDOM('', { runScripts: 'dangerously' });
browser.window.eval(coreUmd);
assert.equal(typeof browser.window.stateRefBatch, 'undefined');
browser.window.eval(batchUmd);
assert.equal(typeof browser.window.stateRefBatch.batch, 'function');
const browserSeen = browser.window.eval(`
  var seen = [];
  var watch = stateRef.createStore({ b: 0, c: 0 });
  watch(state => seen.push([state.b.value, state.c.value]));
  var ref = watch();
  stateRefBatch.batch(() => {
    ref.b.value = 3;
    ref.c.value = 4;
  });
  seen;
`);
assert.deepEqual(JSON.parse(JSON.stringify(browserSeen)), [[0, 0], [3, 4]]);
browser.window.close();

assert.equal(coreUmd.includes('stateRefBatch'), false);
console.log('batch ESM and core→batch UMD browser smoke: PASS');
