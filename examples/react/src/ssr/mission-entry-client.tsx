import { hydrateRoot } from 'react-dom/client';
import { createSyncClient } from '@stateref/sync';
import type { Ship } from 'stateref-example-shared/mission';
import MissionSsr from './MissionSsr';
import 'stateref-example-shared/mission.css';
declare global {
  interface Window {
    __MISSION_SNAPSHOT__?: ReturnType<
      ReturnType<typeof createSyncClient>['dehydrate']
    >;
  }
}
const client = createSyncClient();
if (!window.__MISSION_SNAPSHOT__) throw new Error('Missing mission snapshot');
client.hydrate(window.__MISSION_SNAPSHOT__);
const queryFn = async ({ signal }: { signal: AbortSignal }): Promise<Ship> => {
  const response = await fetch('/mission-api/ships/2', { signal });
  if (!response.ok) throw new Error('조회에 실패했어요.');
  return response.json();
};
const root = hydrateRoot(
  document.getElementById('app') as HTMLElement,
  <MissionSsr
    client={client}
    queryFn={queryFn}
    renderReads={0}
    serverOwners={0}
  />
);
window.addEventListener('pagehide', () => root.unmount(), { once: true });
