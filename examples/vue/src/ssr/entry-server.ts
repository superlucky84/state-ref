import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type { SsrModel } from 'stateref-example-shared';
import App from './App.vue';

/**
 * One request: the app loads its own client inside `onServerPrefetch`, and
 * `renderToString` waits for that before rendering. The model reaches this
 * function through the SSR context rather than through any module state.
 */
export async function render() {
  const app = createSSRApp(App);
  const context: { model?: SsrModel } = {};
  const html = await renderToString(app, context);
  const model = context.model;
  if (!model) throw new Error('onServerPrefetch가 모델을 남기지 않았다.');
  const snapshot = model.dehydrate();
  model.dispose();
  return { html, snapshot };
}

/**
 * Phase 8.4's measurement, re-run against this page. See the React entry for
 * why the renders share one model.
 */
export async function countRenewsAcrossRenders(renders = 11) {
  const { createSsrModelOnServer } = await import('stateref-example-shared');
  const SsrPage = (await import('./SsrPage.vue')).default;
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
    await renderToString(createSSRApp(SsrPage, { model }));
  }
  const afterRenders = renews;
  model.query.ref.memo.value = '서버 렌더 뒤 쓰기';
  const afterWrite = renews;
  model.dispose();
  return { renders, afterRenders, afterWrite };
}
