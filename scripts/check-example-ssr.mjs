/**
 * Real server renders of the React and Vue SSR demos (step 5 of
 * docs/server-sync/PHASE8_5.md).
 *
 * WHAT THIS PROVES: the server HTML carries the value the request loaded -
 * for Vue, a value loaded inside `onServerPrefetch` - along with the
 * `createComputed` and `combineWatch` screens M2-04 names; two requests stay
 * apart; and eleven renders against one long-lived model leave no subscriber
 * behind, which is the condition Phase 8.4 measured.
 *
 * WHAT IT DOES NOT PROVE: that a browser hydrates that HTML without a
 * mismatch. There is no browser here. DC8-5-04 keeps hydration agreement with
 * the manual pass in Phase 8.7, and an SSR pass must never be written up as a
 * hydration result. Preact, Svelte and Solid have no SSR demo at all.
 */
import { createServer } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const expect = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
};

/**
 * Reads one `data-testid` element's text.
 *
 * Comments and tags are stripped because React splits adjacent text nodes
 * with `<!-- -->` markers, so a plain substring match on the rendered text
 * would fail for a reason that has nothing to do with state.
 */
const testId = (html, id) => {
  const match = html.match(
    new RegExp(`data-testid="${id}"[^>]*>([\\s\\S]*?)</`, 'u')
  );
  return match ? match[1].replace(/<!--[\s\S]*?-->|<[^>]+>/g, '').trim() : null;
};

async function withVite(appDir, run) {
  const server = await createServer({
    root: resolve(root, appDir),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    return await run(server);
  } finally {
    await server.close();
  }
}

console.log('\nReact server render');
await withVite('examples/react', async vite => {
  const entry = await vite.ssrLoadModule('/src/ssr/entry-server.tsx');

  const first = await entry.render();
  expect('HTML carries the loaded city', testId(first.html, 'city') === '서울');
  expect(
    'HTML carries the computed label',
    testId(first.html, 'derived') === '서울 01 · 연락처 3',
    testId(first.html, 'derived')
  );
  expect(
    'HTML carries the combined value',
    testId(first.html, 'combined') === '서울 / 대문자 false',
    testId(first.html, 'combined')
  );
  expect(
    'snapshot holds the clean baseline',
    JSON.stringify(first.snapshot).includes('서울')
  );
  const base = first.model.watch().value;
  first.model.dispose();

  const second = await entry.render({
    serverValue: { ...base, city: '광주' },
  });
  expect(
    'a second request renders its own value',
    testId(second.html, 'city') === '광주'
  );
  expect(
    'the first request is unaffected',
    testId(first.html, 'city') === '서울'
  );
  second.model.dispose();

  const counted = await entry.countRenewsAcrossRenders();
  expect(
    `${counted.renders} server renders leave no subscriber`,
    counted.afterRenders === 0 && counted.afterWrite === 0,
    `renews ${counted.afterRenders} after renders, ${counted.afterWrite} after the write`
  );
});

console.log('\nVue server render (onServerPrefetch)');
await withVite('examples/vue', async vite => {
  const entry = await vite.ssrLoadModule('/src/ssr/entry-server.ts');

  const first = await entry.render();
  // The value exists only because `onServerPrefetch` loaded it. A server
  // branch that copied the value before prefetch would leave the placeholder.
  expect(
    'HTML carries the prefetched city',
    testId(first.html, 'city') === '서울',
    testId(first.html, 'city')
  );
  expect(
    'HTML is not the pre-prefetch placeholder',
    !first.html.includes('아직 로드되지 않았다')
  );
  expect(
    'HTML carries the computed label',
    testId(first.html, 'derived') === '서울 01 · 연락처 3',
    testId(first.html, 'derived')
  );
  expect(
    'HTML carries the combined value',
    testId(first.html, 'combined') === '서울 / 대문자 false',
    testId(first.html, 'combined')
  );
  expect(
    'snapshot holds the clean baseline',
    JSON.stringify(first.snapshot).includes('서울')
  );

  const second = await entry.render();
  expect(
    'a second request renders independently',
    testId(second.html, 'city') === '서울'
  );

  const counted = await entry.countRenewsAcrossRenders();
  expect(
    `${counted.renders} server renders leave no subscriber`,
    counted.afterRenders === 0 && counted.afterWrite === 0,
    `renews ${counted.afterRenders} after renders, ${counted.afterWrite} after the write`
  );
});

if (failures.length > 0) {
  console.error(`\nSSR: ${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log(
  '\nSSR: React and Vue server renders carry the loaded value and leave no subscriber.' +
    '\n(No browser here: hydration agreement is Phase 8.7.)'
);
