import { renderToString } from 'react-dom/server';
import { createSsrModelOnServer } from 'stateref-example-shared';
import type { SsrModelOptions } from 'stateref-example-shared';
import SsrPage from './SsrPage';

/**
 * One request: a fresh client, loaded, rendered, then dehydrated so the
 * browser can start from the same baseline without a READ.
 */
export async function render(options: SsrModelOptions = {}) {
  const model = await createSsrModelOnServer(options);
  const html = renderToString(<SsrPage model={model} />);
  const snapshot = model.dehydrate();
  return { html, snapshot, model };
}

/**
 * Phase 8.4's measurement, re-run against this page.
 *
 * A server render has no unmount, so a subscription made during one would
 * survive the request. Eleven renders share ONE model here - the long-lived
 * store condition - and a write afterwards must reach no renew at all.
 */
export async function countRenewsAcrossRenders(renders = 11) {
  let renews = 0;
  const model = await createSsrModelOnServer({
    wrap: watch =>
      ((
        renew?: Parameters<typeof watch>[0],
        option?: Parameters<typeof watch>[1]
      ) =>
        renew
          ? watch((store, isFirst) => {
              renews += 1;
              return renew(store, isFirst);
            }, option)
          : watch()) as typeof watch,
  });

  for (let index = 0; index < renders; index += 1) {
    renderToString(<SsrPage model={model} />);
  }
  const afterRenders = renews;
  model.query.ref.memo.value = '서버 렌더 뒤 쓰기';
  const afterWrite = renews;
  model.dispose();
  return { renders, afterRenders, afterWrite };
}
