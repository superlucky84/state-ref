import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const query = createSyncClient({ ssr: true }).query({
  queryKey: ['account', { id: 1 }],
  queryFn: async ({ signal }) => {
    const aborted: boolean = signal.aborted;
    return { city: aborted ? '중단' : '서울' };
  },
});

async function edit() {
  await query.load();
  const city: string = query.ref.city.value;
  query.ref.city.value = city;
  const draft = createDraft(query.ref);
  draft.ref.city.value = city;
  draft.discard();
  query.dispose();
}

void edit;
