// check-packaging copies this into its consumer sandbox after compiling the
// exact README/site examples. Imports below therefore use the public entries.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { h, mount, render, nextTick } from 'lithent';
import { createSyncClient } from '@stateref/sync';
import { createSyncQuery } from '@stateref/connect-lithent/sync';
import { AccountDetail } from './lithent-examples/lithentQueryExample.js';
import { accountSave } from './lithent-examples/lithentSaveExample.js';
import { renderAccount } from './lithent-examples/lithentSsrExample.js';

const server = await renderAccount(1, { name: 'server', age: 1 });
assert.equal(server.html, '<p>server</p>');
const dom = new JSDOM('<!doctype html><body></body>');
for (const name of [
  'window',
  'document',
  'HTMLElement',
  'Element',
  'Node',
  'DocumentFragment',
])
  globalThis[name] = dom.window[name];
const requests = [];
globalThis.fetch = async (url, options = {}) => {
  requests.push({ url, ...options });
  const data =
    options.method === 'PUT'
      ? { name: JSON.parse(options.body).name.toUpperCase(), age: 2 }
      : { name: 'loaded', age: 1 };
  return { ok: true, json: async () => data };
};
const tick = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};
const host = document.createElement('div');
const stop = render(h(AccountDetail, { id: 1 }), host);
await tick();
assert.equal(host.querySelector('p').textContent, 'loaded');
assert.equal(requests.length, 1);
const input = host.querySelector('input');
input.value = 'edited';
input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
await tick();
assert.equal(host.querySelector('p').textContent, 'edited');
host.querySelectorAll('button')[0].click();
await tick();
assert.equal(requests.length, 2);
assert.equal(host.querySelector('p').textContent, 'edited');
host.querySelectorAll('button')[1].click();
await tick();
assert.equal(requests.length, 3);
stop();

const client = createSyncClient();
let q;
let save;
const Panel = mount(() => {
  const [account, controls] = createSyncQuery(client, {
    queryKey: ['account', 2],
    gcTime: 0,
    queryFn: () => ({ name: 'original', age: 1 }),
  });
  q = controls;
  save = accountSave(client, q);
  return () => h('p', {}, account().data.name.value ?? 'waiting');
});
const stopSave = render(h(Panel, {}), host);
await tick();
q.handle().ref.name.value = 'saved';
await save();
await tick();
assert.equal(host.textContent, 'SAVED');
assert.equal(q.handle().isDirty(), false);
assert.equal(requests.at(-1).url, '/api/accounts/2');
assert.equal(requests.at(-1).method, 'PUT');
assert.deepEqual(JSON.parse(requests.at(-1).body), { name: 'saved' });
stopSave();
await tick();
// Observer release and zero-delay GC each run in a separate timer turn.
await new Promise(resolve => setTimeout(resolve, 0));
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(client.size(), 0);
dom.window.close();
console.log(
  'Lithent public documentation examples: query/edit/refetch/invalidate, linked save and SSR PASS'
);
