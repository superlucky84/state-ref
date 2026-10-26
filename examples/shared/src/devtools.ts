/// <reference types="vite/client" />
import type { Watch } from 'state-ref';
import type { SyncClient } from '@stateref/sync';

let generation = 0;
let cleanup: (() => void) | undefined;

interface DemoDevtoolsOptions {
  readonly stores?: readonly { watch: Watch<any>; name: string }[];
  readonly walkthrough?: boolean;
}

function releaseRegistrations(
  targets: readonly (Watch<any> | SyncClient)[],
  stop: (target: Watch<any> | SyncClient) => void,
  disposeGuide?: () => void
) {
  let remaining = targets;
  return () => {
    const current = remaining;
    remaining = [];
    for (const target of current) stop(target);
    disposeGuide?.();
    disposeGuide = undefined;
  };
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
  const { devtools, stopDevtools } = await import('@stateref/devtools/auto');
  if (current !== generation) return;
  const guide = options.walkthrough
    ? await import('./devtools-walkthrough').then(module =>
        current === generation ? module.mountWalkthrough() : undefined
      )
    : undefined;
  if (current !== generation) {
    guide?.dispose();
    return;
  }
  const targets = [
    watch,
    client,
    ...(options.stores ?? []).map(store => store.watch),
  ];
  const release = releaseRegistrations(targets, stopDevtools, guide?.dispose);
  try {
    devtools(watch, {
      name: 'Application UI',
      panel: {
        target: guide?.inspector ?? document.body,
        layout: guide ? 'inline' : 'floating',
      },
    });
    devtools(client, { name: 'Application cache' });
    for (const store of options.stores ?? [])
      devtools(store.watch, { name: store.name });
    cleanup = release;
  } catch (error) {
    release();
    throw error;
  }
}
