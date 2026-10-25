/// <reference types="vite/client" />
import type { Watch } from 'state-ref';
import type { SyncClient } from '@stateref/sync';

let generation = 0;
let cleanup: (() => void) | undefined;

interface DemoDevtoolsOptions {
  readonly stores?: readonly { watch: Watch<any>; name: string }[];
  readonly walkthrough?: boolean;
}

/** Opt in with ?devtools on a development demo; production drops both imports. */
export async function mountDemoDevtools(
  watch: Watch<any>,
  client: SyncClient,
  options: DemoDevtoolsOptions = {}
) {
  if (
    !import.meta.env.DEV ||
    typeof window === 'undefined' ||
    !new URLSearchParams(window.location.search).has('devtools')
  )
    return;
  const current = ++generation;
  cleanup?.();
  import.meta.hot?.dispose(() => {
    generation++;
    cleanup?.();
    cleanup = undefined;
  });
  const [{ createDevtools }, { mountPanel }] = await Promise.all([
    import('@stateref/devtools'),
    import('@stateref/devtools/panel'),
  ]);
  if (current !== generation) return;
  const tools = createDevtools();
  tools.attachStore(watch, { name: 'Application UI' });
  tools.attachSync(client, { name: 'Application cache' });
  for (const store of options.stores ?? [])
    tools.attachStore(store.watch, store);
  const guide = options.walkthrough
    ? await import('./devtools-walkthrough').then(module =>
        current === generation ? module.mountWalkthrough() : undefined
      )
    : undefined;
  if (current !== generation) {
    tools.dispose();
    guide?.dispose();
    return;
  }
  const unmount = mountPanel(tools, {
    target: guide?.inspector ?? document.body,
    layout: guide ? 'inline' : 'floating',
  });
  cleanup = () => {
    unmount();
    tools.dispose();
    guide?.dispose();
  };
}
