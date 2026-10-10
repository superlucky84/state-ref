import { renderToString } from 'react-dom/server';
import { createSyncClient } from '@stateref/sync';
import { INITIAL_SHIPS } from 'stateref-example-shared/mission';
import MissionSsr from './MissionSsr';
export async function render() {
  const client = createSyncClient({ ssr: true });
  let reads = 0;
  const queryFn = () => {
    reads++;
    return structuredClone(INITIAL_SHIPS[1]);
  };
  await client.prefetch({
    queryKey: ['mission', 2],
    queryFn,
    staleTime: Infinity,
  });
  const before = reads;
  const html = renderToString(
    <MissionSsr
      client={client}
      queryFn={queryFn}
      renderReads={0}
      serverOwners={0}
    />
  );
  if (
    reads !== before ||
    client.inspectCache().some(entry => entry.owners !== 0)
  )
    throw new Error('SSR query rendered with an owner or another READ.');
  return {
    html,
    snapshot: client.dehydrate(),
    model: { dispose: () => client.remove(['mission', 2]) },
  };
}
