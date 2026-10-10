import { ensureShared } from 'state-ref/shared';
import { createSyncClient } from '@stateref/sync';
import type { QueryObserverControls } from '@stateref/sync';
import { createPanel } from './common';

export type Account = { name: string };

type SyncDemo = {
  maker: string;
  reads: number;
  writes: number;
  replies: Array<() => void>;
  releases: Array<() => void>;
  controls: Map<string, QueryObserverControls<Account>>;
};

export const syncDemo = (): SyncDemo =>
  ((window as unknown as { __syncHookDemo?: SyncDemo }).__syncHookDemo ??= {
    maker: '',
    reads: 0,
    writes: 0,
    replies: [],
    releases: [],
    controls: new Map(),
  });

/** Each separately built bundle carries its own copy of both packages. */
export function syncClient(who: string) {
  return ensureShared('demo.sync-hooks', () => {
    syncDemo().maker = who;
    return createSyncClient();
  });
}

export const accountOptions = (id: number) => ({
  queryKey: ['account', id],
  staleTime: Infinity,
  gcTime: Infinity,
  queryFn: () => {
    syncDemo().reads += 1;
    return new Promise<Account>(resolve => {
      syncDemo().replies.push(() => resolve({ name: `user-${id}` }));
    });
  },
});

export function syncPanel(who: string) {
  const panel = createPanel(who);
  const client = syncClient(who);
  client.subscribeCache(panel.repaint);
  return { panel, client };
}
