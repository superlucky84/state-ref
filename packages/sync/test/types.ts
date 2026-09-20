import { createSyncClient, MutationRejectedError } from '@stateref/sync';
import type {
  MutationResult,
  ResourceSubmission,
  SyncSnapshot,
} from '@stateref/sync';
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

const client = createSyncClient({ ssr: true });
const resource = client.query({
  queryKey: ['edit'],
  queryFn: () => ({ city: '서울' }),
});
const mutation = client.mutation({
  mutationFn: (input: { city: string }, { operationId, idempotencyKey }) => {
    const id: number = operationId;
    const key: string | undefined = idempotencyKey;
    void id;
    void key;
    return Promise.resolve({ acceptedCity: input.city });
  },
});

async function submit() {
  await resource.load();
  resource.ref.city.value = '부산';
  const submission: ResourceSubmission<{ city: string }> = resource.capture();
  const result: MutationResult<{ acceptedCity: string }> = await mutation.run(
    { city: submission.value.city },
    {
      scope: 'account-save',
      links: [
        {
          query: resource,
          submission,
          accept: {
            kind: 'response',
            select: data => ({ city: data.acceptedCity }),
          },
        },
      ],
    }
  );
  if (result.kind === 'success') {
    const city: string = result.data.acceptedCity;
    void city;
  }
  const rejected: Error = new MutationRejectedError('validation');
  void rejected;
}

void submit;

async function restore() {
  const server = createSyncClient({ ssr: true });
  const source = server.query({
    queryKey: ['hydrated'],
    queryFn: () => ({ city: '서울' }),
  });
  await source.load();
  const snapshot: SyncSnapshot = server.dehydrate();
  const browser = createSyncClient();
  browser.hydrate(snapshot);
  const restored = browser.query({
    queryKey: ['hydrated'],
    queryFn: () => ({ city: '부산' }),
  });
  const city: string = restored.ref.city.value;
  const unconfirmed: boolean = restored.status.unconfirmed.value;
  void city;
  void unconfirmed;
  source.dispose();
  restored.dispose();
}

void restore;
