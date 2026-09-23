/**
 * Phase 8.4: what a server render leaves behind (docs/server-sync/PHASE8_4.md).
 *
 * Svelte is the one connector that was already correct here, because
 * `onDestroy` is the one lifecycle function Svelte runs during SSR. This pins
 * that, so a change to the teardown cannot quietly put it in the same state
 * the other four were in.
 *
 * Runs under `vite.ssr.config.js`: components have to be compiled with
 * `generate: 'ssr'`, which the browser config does not do.
 */
import { describe, it, expect } from 'vitest';
import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import SsrCounter from '@/tests/svelte/SsrCounter.svelte';

type Counter = { n: number };

const countingWatch = <T>(source: Watch<T>, onRenew: () => void): Watch<T> =>
  ((renew?: any, opt?: any) => {
    if (!renew) return (source as any)(undefined, opt);
    return (source as any)((store: StateRefStore<T>, isFirst: boolean) => {
      onRenew();
      return renew(store, isFirst);
    }, opt);
  }) as Watch<T>;

describe('Svelte server rendering', () => {
  it('renders the current value and leaves no subscription behind', () => {
    const watch = createStore<Counter>({ n: 7 });
    const writer = watch();
    let renews = 0;
    const counting = countingWatch(watch, () => (renews += 1));
    const render = (
      SsrCounter as unknown as {
        render: (props: unknown) => { html: string };
      }
    ).render;

    expect(render({ watchRef: counting }).html.trim()).toBe('<div>7</div>');
    for (let index = 0; index < 10; index += 1) render({ watchRef: counting });

    const before = renews;
    writer.n.value = 8;
    expect(renews - before).toBe(0);
  });
});
