import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreUmd = readFileSync(
  resolve(packageRoot, 'dist/state-ref.umd.js'),
  'utf8'
);
const draftUmd = readFileSync(
  resolve(packageRoot, 'dist/state-ref.draft.umd.js'),
  'utf8'
);

const source = createStore({ city: '서울' })();
const draft = createDraft(source);
draft.ref.city.value = '부산';
assert.deepEqual(draft.apply(), { ok: true, applied: 1 });
assert.equal(source.city.value, '부산');
draft.discard();

const browser = new JSDOM('', { runScripts: 'dangerously' });
browser.window.eval(coreUmd);
browser.window.eval(draftUmd);
assert.equal(typeof browser.window.stateRef.createStore, 'function');
assert.equal(typeof browser.window.stateRefDraft.createDraft, 'function');
const browserSource = browser.window.eval(
  'stateRef.createStore({ count: 0 })()'
);
const browserDraft = browser.window.stateRefDraft.createDraft(browserSource);
browserDraft.ref.count.value = 1;
assert.equal(browserDraft.apply().ok, true);
assert.equal(browserSource.count.value, 1);
browserDraft.discard();
browser.window.close();

const missingCore = new JSDOM('', { runScripts: 'dangerously' });
missingCore.window.eval(draftUmd);
assert.throws(
  () => missingCore.window.stateRefDraft.createDraft({ value: 1 }),
  /requires the stateRef core bundle/
);
missingCore.window.close();

assert.equal(coreUmd.includes('createDraft'), false);
assert.equal(draftUmd.includes('fetch('), false);
console.log('draft ESM and core→draft UMD browser smoke: PASS');
