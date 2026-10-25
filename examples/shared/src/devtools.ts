/// <reference types="vite/client" />
import type { Watch } from 'state-ref';
import type { SyncClient } from '@stateref/sync';

let generation = 0;
let cleanup: (() => void) | undefined;

/** Opt in with ?devtools on a development demo; production drops both imports. */
export async function mountDemoDevtools(watch: Watch<any>, client: SyncClient) {
  if (
    !import.meta.env.DEV ||
    typeof window === 'undefined' ||
    !new URLSearchParams(window.location.search).has('devtools')
  )
    return;
  const current = ++generation;
  cleanup?.();
  const [{ createDevtools }, { mountPanel }] = await Promise.all([
    import('@stateref/devtools'),
    import('@stateref/devtools/panel'),
  ]);
  if (current !== generation) return;
  const tools = createDevtools();
  tools.attachStore(watch, { name: 'Application UI' });
  tools.attachSync(client, { name: 'Application cache' });
  const unmount = mountPanel(tools, { target: document.body });
  cleanup = () => {
    unmount();
    tools.dispose();
  };
  import.meta.hot?.dispose(() => {
    generation++;
    cleanup?.();
    cleanup = undefined;
  });
}
