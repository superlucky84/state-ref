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
 *
 * The peer range covers Svelte 4 and 5, and they render on the server through
 * different APIs: 4 has `Component.render(props)`, 5 has `render(Component,
 * { props })` from `svelte/server` and wraps the markup in hydration comments.
 */
import { describe, it, expect } from 'vitest';
import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { VERSION } from 'svelte/compiler';
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

/** Markup for one server render, on whichever major is installed. */
async function serverRenderer(): Promise<(props: unknown) => string> {
  if (Number(VERSION.split('.')[0]) >= 5) {
    // A variable specifier keeps Svelte 4, which has no `svelte/server`,
    // from failing at transform time.
    const id = 'svelte/server';
    const { render } = (await import(/* @vite-ignore */ id)) as {
      render: (
        component: unknown,
        options: { props: unknown }
      ) => {
        body: string;
      };
    };
    return props =>
      render(SsrCounter, { props })
        .body.replace(/<!--[^>]*-->/g, '')
        .trim();
  }
  const legacy = SsrCounter as unknown as {
    render: (props: unknown) => { html: string };
  };
  return props => legacy.render(props).html.trim();
}

describe('Svelte server rendering', () => {
  it('renders the current value and leaves no subscription behind', async () => {
    const watch = createStore<Counter>({ n: 7 });
    const writer = watch();
    let renews = 0;
    const counting = countingWatch(watch, () => (renews += 1));
    const render = await serverRenderer();

    expect(render({ watchRef: counting })).toBe('<div>7</div>');
    for (let index = 0; index < 10; index += 1) render({ watchRef: counting });

    const before = renews;
    writer.n.value = 8;
    expect(renews - before).toBe(0);
  });
});
