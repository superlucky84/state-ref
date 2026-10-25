// Copied by check-packaging into its consumer sandbox. The component loads
// the public connector through require(), while Svelte renders through ESM.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';

const require = createRequire(import.meta.url);
const { createStore } = require('state-ref');
const fixture = new URL('./svelte-cjs-ssr-component.mjs', import.meta.url);
const source = `<script>
  import { createRequire } from 'node:module';
  const { connectSvelte } = createRequire(import.meta.url)('@stateref/connect-svelte');
  export let watch;
  const read = connectSvelte(watch);
  const value = read(ref => ref);
</script><p>{$value}</p>`;
writeFileSync(
  fixture,
  compile(source, { generate: 'server', filename: 'CjsConsumer.svelte' }).js
    .code
);
const { default: Component } = await import(fixture.href);
const store = createStore(7);
let active = 0;
let calls = 0;
const watch = renew =>
  store((ref, first) => {
    calls++;
    const signal = renew(ref, first);
    if (first) {
      assert.ok(signal instanceof AbortSignal);
      active++;
      signal.addEventListener('abort', () => active--, { once: true });
    }
    return signal;
  });
for (let i = 0; i < 2; i++) {
  const result = render(Component, { props: { watch } });
  assert.ok(result.body.includes('<p>7</p>'), result.body);
  assert.equal(active, 0, 'SSR must end the CommonJS connector subscription.');
}
assert.equal(calls, 2);
store().value = 8;
assert.equal(
  calls,
  2,
  'Server-rendered subscriptions must not run after teardown.'
);
console.log(
  'Svelte CommonJS consumer + ESM SSR rendering and subscription teardown PASS'
);
