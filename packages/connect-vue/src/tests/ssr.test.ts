// @vitest-environment node
/**
 * Phase 8.4: what a server render leaves behind (docs/server-sync/PHASE8_4.md).
 *
 * `onUnmounted` never runs during a server render, so a subscription made
 * there is never released. This runs in node: with a `window` present the
 * connector takes its browser path and the server branch is never reached.
 */
import { describe, it, expect } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  h,
  onServerPrefetch,
  isRef,
  isReadonly,
} from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createStore, combineWatch, createComputed } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { QueryViewState } from '@stateref/sync';
import type { StateRefStore, Watch } from 'state-ref';
import { connectVue, connectVueView } from '@/index';

type Counter = { n: number };

/**
 * Counts the renews the core actually delivers. A renew-less call is forwarded
 * as one, so asking for no subscription really makes none.
 */
const countingWatch = <T>(source: Watch<T>, onRenew: () => void): Watch<T> =>
  ((renew?: any, opt?: any) => {
    if (!renew) return (source as any)(undefined, opt);
    return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
      onRenew();
      return renew(store, isFirst);
    }, opt);
  }) as Watch<T>;

describe('Vue server rendering', () => {
  it.each(['editable', 'view'] as const)(
    'reads the latest selection after server prefetch (%s)',
    async kind => {
      const watch = createStore({ flag: true, a: 0, b: 0 });
      let renews = 0;
      const counting = countingWatch(watch, () => {
        renews += 1;
      });
      const View = defineComponent({
        setup() {
          const value =
            kind === 'editable'
              ? connectVue(counting)(ref => (ref.flag.value ? ref.a : ref.b))
              : connectVueView(counting)(ref =>
                  ref.flag.value ? ref.a.value : ref.b.value
                );
          expect(value.value).toBe(0);
          if (kind === 'view') {
            expect(isRef(value)).toBe(true);
            expect(isReadonly(value)).toBe(true);
          }
          onServerPrefetch(async () => {
            await Promise.resolve();
            watch().flag.value = false;
            watch().b.value = 7;
          });
          return () => h('div', String(value.value));
        },
      });
      expect(await renderToString(createSSRApp(View))).toBe('<div>7</div>');
      expect(renews).toBe(0);
    }
  );

  it('reads query data loaded in server prefetch through a readonly view', async () => {
    const client = createSyncClient({ ssr: true });
    const view = client.view<Counter, number>(
      { queryKey: ['ssr-prefetch'], queryFn: async () => ({ n: 7 }) },
      { select: data => data.n }
    );
    try {
      const View = defineComponent({
        setup() {
          const data = connectVueView(view.watch)(ref => ref.data.value);
          expect(data.value).toBeUndefined();
          onServerPrefetch(async () => {
            await view.query.load();
          });
          return () => h('div', String(data.value));
        },
      });
      expect(await renderToString(createSSRApp(View))).toBe('<div>7</div>');
    } finally {
      view.dispose();
    }
  });

  it.each(['combine', 'computed'] as const)(
    'renders helpers without subscribing to their sources (%s)',
    async kind => {
      const source = createStore<Counter>({ n: 7 });
      let renews = 0;
      const counting = countingWatch(source, () => {
        renews += 1;
      });
      const useCombined = connectVue(combineWatch([counting]));
      const useComputed = connectVue(
        createComputed([counting], ([ref]) => ref.n.value)
      );
      const View = defineComponent({
        setup() {
          const value =
            kind === 'combine'
              ? useCombined(ref => ref[0].n)
              : useComputed(ref => ref);
          return () => h('div', String(value.value));
        },
      });
      for (let index = 0; index < 11; index += 1) {
        expect(await renderToString(createSSRApp(View))).toBe('<div>7</div>');
      }
      source().n.value = 8;
      expect(renews).toBe(0);
      expect(await renderToString(createSSRApp(View))).toBe('<div>8</div>');
    }
  );

  it('renders the current value and subscribes to nothing', async () => {
    const watch = createStore<Counter>({ n: 7 });
    const writer = watch();
    let renews = 0;
    const useStore = connectVue(countingWatch(watch, () => (renews += 1)));
    const View = defineComponent({
      setup() {
        const n = useStore(store => store.n);
        return () => h('div', String(n.value));
      },
    });

    expect(await renderToString(createSSRApp(View))).toBe('<div>7</div>');
    for (let index = 0; index < 10; index += 1) {
      await renderToString(createSSRApp(View));
    }

    const before = renews;
    writer.n.value = 8;
    // Eleven renders must leave eleven nothings behind, not eleven live
    // subscriptions waiting for an unmount that never comes.
    expect(renews - before).toBe(0);
  });

  it('renders a readonly view without subscribing either', async () => {
    const client = createSyncClient({ ssr: true });
    const view = client.view<Counter, number>(
      { queryKey: ['ssr-view'], queryFn: () => ({ n: 3 }) },
      { select: data => data.n }
    );
    await view.query.load();
    let renews = 0;
    type ViewRef = { data: { value: number | undefined } };
    const counting = countingWatch(
      view.watch as unknown as Watch<QueryViewState<number>>,
      () => (renews += 1)
    ) as unknown as (renew?: unknown, option?: unknown) => ViewRef;
    const useView = connectVueView(counting);
    const View = defineComponent({
      setup() {
        const data = useView(ref => ref.data.value);
        return () => h('div', String(data.value));
      },
    });

    expect(await renderToString(createSSRApp(View))).toBe('<div>3</div>');
    for (let index = 0; index < 10; index += 1) {
      await renderToString(createSSRApp(View));
    }

    const before = renews;
    view.query.ref.n.value = 4; // a change every live view would be told about
    expect(renews - before).toBe(0);
    view.dispose();
  });
});
