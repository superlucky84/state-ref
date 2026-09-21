import {
  createBrowserSyncEnvironment,
  createSyncClient,
  MutationRejectedError,
  openPersistedMutationQueue,
  openPersistedLinkedMutation,
  restoreSyncSnapshot,
  saveSyncSnapshot,
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';
import type {
  AutomaticRefetchPolicy,
  BrowserSyncHost,
  InfiniteData,
  InfiniteQueryHandle,
  LocalSyncSnapshot,
  MutationResult,
  NetworkMode,
  ResourceSubmission,
  SyncClientOptions,
  SyncEnvironment,
  SyncEnvironmentEvent,
  SyncStorage,
  PersistedMutationQueue,
  PersistedLinkedMutation,
  SyncSnapshot,
} from '@stateref/sync';
import { createDraft } from 'state-ref/draft';
import { create } from 'state-ref';

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

async function prepareCache() {
  const client = createSyncClient({ ssr: true });
  const options = {
    queryKey: ['prepared'],
    queryFn: () => ({ city: '서울' }),
    initialData: { city: '부산' },
    initialUpdatedAt: 1000,
  };
  await client.prefetch(options);
  const fetched: { city: string } = await client.fetch(options);
  const ensured: { city: string } = await client.ensure(options);
  const query = client.query(options);
  const city: string = query.ref.city.value;
  void fetched;
  void ensured;
  void city;
  query.dispose();
}

void prepareCache;

async function displayView() {
  const client = createSyncClient({ ssr: true });
  const view = client.view(
    {
      queryKey: ['display'],
      queryFn: () => ({ city: '서울', count: 1 }),
    },
    {
      select: data => data.city,
      placeholderData: { city: '대기', count: 0 },
    }
  );
  const preview: string | undefined = view.ref.data.value;
  const placeholder: boolean = view.ref.isPlaceholder.value;
  // @ts-expect-error a view has no display-value setter
  view.ref.data.value = '수정';
  view.watch(ref => {
    // @ts-expect-error a view callback has no display-value setter
    ref.phase.value = 'success';
  });
  await view.query.load();
  const source: string = view.query.ref.city.value;
  void preview;
  void placeholder;
  void source;
  view.dispose();
}

void displayView;

async function liveDisplayView() {
  const client = createSyncClient({ ssr: true });
  const source = create({ id: null as number | null, enabled: false });
  const live = client.liveView(
    source.watch,
    input =>
      input.id === null
        ? null
        : {
            queryKey: ['account', input.id],
            queryFn: () => ({ city: '서울' }),
            enabled: input.enabled,
          },
    { select: data => data.city }
  );
  const enabled: boolean = live.ref.enabled.value;
  const selected: string | undefined = live.ref.data.value;
  // @ts-expect-error a live view has no display-value setter
  live.ref.data.value = '부산';
  source.updateRef.id.value = 1;
  source.updateRef.enabled.value = true;
  if (live.query) await live.query.load();
  void enabled;
  void selected;
  live.dispose();
}

void liveDisplayView;

const environmentListeners = new Set<(event: SyncEnvironmentEvent) => void>();
const environment: SyncEnvironment = {
  subscribe(listener) {
    environmentListeners.add(listener);
    return () => environmentListeners.delete(listener);
  },
  isFocused: () => true,
  isOnline: () => true,
};
const automaticOptions: SyncClientOptions = { environment };
const focusPolicy: AutomaticRefetchPolicy = 'always';
const automatic = createSyncClient(automaticOptions).query({
  queryKey: ['automatic'],
  queryFn: () => ({ city: '서울' }),
  refetchOnFocus: focusPolicy,
  refetchOnReconnect: false,
  refetchInterval: 30_000,
  refetchIntervalInBackground: true,
});
void automatic.load().then(() => automatic.dispose());

const browserHost: BrowserSyncHost = {
  window,
  document,
  navigator,
};
const browserEnvironment: SyncEnvironment =
  createBrowserSyncEnvironment(browserHost);
const networkMode: NetworkMode = 'offlineFirst';
const networkQuery = createSyncClient({
  environment: browserEnvironment,
}).query({
  queryKey: ['network'],
  queryFn: () => ({ n: 1 }),
  networkMode,
});
const networkFetchStatus: 'idle' | 'fetching' | 'paused' =
  networkQuery.status.fetchStatus.value;
void networkFetchStatus;
networkQuery.dispose();

async function infiniteDisplay() {
  const feed: InfiniteQueryHandle<{ id: number }, number> = createSyncClient({
    ssr: true,
  }).infiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam, signal }) => ({
      id: signal.aborted ? -1 : pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (last, pages, lastParam, params) =>
      pages.length === params.length ? last.id + lastParam + 1 : undefined,
    maxPages: 2,
  });
  const loaded: InfiniteData<{ id: number }, number> = await feed.load();
  const hasMore: boolean = feed.hasNextPage();
  const next: number = (await feed.fetchNextPage()).pageParams[1];
  void loaded;
  void hasMore;
  void next;
  // @ts-expect-error infinite data is a readonly view
  feed.ref.value = { pages: [], pageParams: [] };
  // @ts-expect-error infinite query has no editable change capture
  feed.capture();
  feed.dispose();
}

void infiniteDisplay;

async function persistedCommands() {
  const values = new Map<string, string>();
  const storage: SyncStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: key => {
      values.delete(key);
    },
  };
  const source = createSyncClient({ ssr: true });
  await saveSyncSnapshot(source, storage, { key: 'baseline', buster: 'v1' });
  const restored: boolean = await restoreSyncSnapshot(
    createSyncClient({ ssr: true }),
    storage,
    { key: 'baseline', buster: 'v1', maxAge: 1000 }
  );
  const send = source.mutation({
    mutationFn: (input: { n: number }) => input.n,
  });
  const queue: PersistedMutationQueue = await openPersistedMutationQueue({
    storage,
    key: 'jobs',
    buster: 'v1',
    maxAge: 1000,
    commands: { send },
    isOnline: () => true,
  });
  await queue.enqueue({
    id: 'one',
    command: 'send',
    input: { n: 1 },
    idempotencyKey: 'server-supported-key',
  });
  const state: 'queued' | 'inFlight' | 'unknown' | 'rejected' =
    queue.entries()[0].state;
  const results = await queue.resume();
  void restored;
  void state;
  void results;
}

void persistedCommands;

async function recoveredLocalEdits() {
  const client = createSyncClient({ ssr: true });
  const query = client.query({
    queryKey: ['local'],
    queryFn: () => ({ n: 1 }),
  });
  await query.load();
  query.ref.n.value = 2;
  const snapshot: LocalSyncSnapshot = client.dehydrateLocal();
  const restored = createSyncClient({ ssr: true });
  restored.hydrateLocal(snapshot);
  const storage: SyncStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  await saveLocalSyncSnapshot(client, storage, {
    key: 'local',
    buster: 'v1',
  });
  const loaded: boolean = await restoreLocalSyncSnapshot(
    createSyncClient({ ssr: true }),
    storage,
    { key: 'local', buster: 'v1' }
  );
  void loaded;
  query.dispose();
}

void recoveredLocalEdits;

async function persistedLinkedSubmission() {
  const client = createSyncClient({ ssr: true });
  const query = client.query({
    queryKey: ['linked'],
    queryFn: () => ({ city: '서울' }),
  });
  await query.load();
  query.ref.city.value = '부산';
  const values = new Map<string, string>();
  const storage: SyncStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: key => {
      values.delete(key);
    },
  };
  const journal: PersistedLinkedMutation = await openPersistedLinkedMutation({
    storage,
    key: 'linked',
    buster: 'v1',
  });
  await journal.stage(client, query, {
    id: 'one',
    input: { city: '부산' },
    idempotencyKey: 'server-key',
    ids: query.changes().map(change => change.id),
    accept: 'submitted',
  });
  const mutation = client.mutation({
    mutationFn: (input: { city: string }) => input.city,
  });
  const result: MutationResult<string> | null = await journal.send(
    client,
    query,
    mutation
  );
  void result;
  query.dispose();
}

void persistedLinkedSubmission;

createSyncClient().query({
  queryKey: ['bad-automatic-policy'],
  queryFn: () => 1,
  // @ts-expect-error automatic policy accepts only boolean or always
  refetchOnFocus: 'stale',
});
