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
  ndjsonMessages,
  streamQuery,
  webSocketMessages,
} from '@stateref/sync';
import type {
  AutomaticRefetchPolicy,
  AutoResumeHandlers,
  BrowserSyncHost,
  InfiniteData,
  InfiniteQueryHandle,
  InFlightDehydration,
  LocalSyncSnapshot,
  MutationResult,
  NetworkMode,
  QueryDisplayRef,
  QueryKey,
  ResourceSubmission,
  SyncClientOptions,
  SyncCacheEntry,
  SyncCacheEvent,
  SyncMutationEntry,
  SyncMutationEvent,
  SyncEnvironment,
  SyncEnvironmentEvent,
  SyncStorage,
  PersistedMutationQueue,
  ResumedMutation,
  PersistedLinkedMutation,
  PersistedLinkedMutationLink,
  SyncSnapshot,
  QueryStream,
  QueryStreamStatus,
  StreamRefetchMode,
  ObserveOptions,
  ObserverSettings,
  QueryHandle,
  QueryHandleCore,
  QueryObserver,
  QueryObserverControls,
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
  const applied = draft.apply();
  if (!applied.ok) {
    const reason:
      | 'readonly'
      | 'missing-source'
      | 'invalid-source'
      | 'conflict' = applied.reason;
    void reason;
  }
  draft.discard();
  query.dispose();
}

void edit;

const client = createSyncClient({ ssr: true });
const cacheEntries: readonly SyncCacheEntry[] = client.inspectCache();
// @ts-expect-error diagnostic snapshots omit caller-owned error objects
cacheEntries[0].status.error;
const stopCacheObservation: () => void = client.subscribeCache(
  (event: SyncCacheEvent) => {
    const owners: number = event.entry.owners;
    const loaded: boolean = event.entry.status.loaded;
    void owners;
    void loaded;
  }
);
void cacheEntries;
stopCacheObservation();
const mutationEntries: readonly SyncMutationEntry[] = client.inspectMutations();
// @ts-expect-error diagnostic snapshots omit the input, the response and errors
mutationEntries[0].error;
const stopMutationObservation: () => void = client.subscribeMutations(
  (event: SyncMutationEvent) => {
    const phase:
      | 'queued'
      | 'pending'
      | 'success'
      | 'sync-error'
      | 'rejected'
      | 'unknown' = event.entry.phase;
    const scope: string | null = event.entry.scope;
    const linked: readonly QueryKey[] = event.entry.linkedKeys;
    void phase;
    void scope;
    void linked;
  }
);
void mutationEntries;
stopMutationObservation();
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

async function displayQuery() {
  const client = createSyncClient({ ssr: true });
  const query = client.query({
    queryKey: ['display'],
    queryFn: () => ({ city: '서울', count: 1 }),
    select: data => data.city,
    placeholderData: { city: '대기', count: 0 },
  });
  const preview: string | undefined = query.display.data.value;
  const placeholder: boolean = query.display.isPlaceholder.value;
  // The display carries the shared status under the same names (DC9-09).
  const dirty: boolean = query.display.dirty.value;
  const version: number = query.display.version.value;
  // @ts-expect-error a display has no value setter
  query.display.data.value = '수정';
  query.watchDisplay(ref => {
    // @ts-expect-error a display callback has no value setter
    ref.status.value = 'success';
  });
  // @ts-expect-error `phase` is gone; `isPlaceholder` carries that fact
  void query.display.phase;
  await query.load();
  // The resource is the same handle now: no `.query` hop.
  const source: string = query.ref.city.value;
  void preview;
  void placeholder;
  void dirty;
  void version;
  void source;
  query.dispose();
}

void displayQuery;

async function liveDisplayView() {
  const client = createSyncClient({ ssr: true });
  const source = create({ id: null as number | null, enabled: false });
  const live = client.query({
    source: source.watch,
    resolve: input =>
      input.id === null
        ? null
        : {
            queryKey: ['account', input.id],
            queryFn: () => ({ city: '서울' }),
            enabled: input.enabled,
          },
    select: data => data.city,
  });
  const enabled: boolean = live.display.enabled.value;
  const selected: string | undefined = live.display.data.value;
  // @ts-expect-error a display has no value setter
  live.display.data.value = '부산';
  source.updateRef.id.value = 1;
  source.updateRef.enabled.value = true;
  // `enabled` is the guard now: there is no handle to test for null (DC9-10).
  if (live.display.enabled.value) await live.load();
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

async function prepareInfiniteDisplay() {
  const client = createSyncClient({ ssr: true });
  const options = {
    queryKey: ['prepared-feed'],
    queryFn: ({ pageParam }: { pageParam: number }) => ({ id: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (page: { id: number }) => page.id + 1,
  };
  await client.prefetchInfinite(options);
  const fetched: InfiniteData<{ id: number }, number> =
    await client.fetchInfinite(options);
  const ensured: InfiniteData<{ id: number }, number> =
    await client.ensureInfinite(options);
  const view: InfiniteQueryHandle<{ id: number }, number, number> =
    client.infiniteQuery({
      ...options,
      placeholderData: { pages: [{ id: -1 }], pageParams: [-1] },
      select: data => data.pages.length,
    });
  const count: number | undefined = view.display.data.value;
  await view.fetchNextPage();
  // @ts-expect-error selected infinite display data is readonly
  view.display.data.value = 3;
  void fetched;
  void ensured;
  void count;
  view.dispose();
}

void prepareInfiniteDisplay;

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
  const results: readonly ResumedMutation[] = await queue.resume();
  const handlers: AutoResumeHandlers = {
    onSettled: settled => void settled.length,
    onError: error => void error,
  };
  const stopAutoResume: () => void = queue.autoResume(
    {
      subscribe: () => () => {},
      isFocused: () => true,
      isOnline: () => true,
    },
    handlers
  );
  stopAutoResume();
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
    checkpoint: true,
  });
  const checkpointed: LocalSyncSnapshot = client.dehydrateLocal({
    inFlight: 'unconfirmed',
  });
  const mode: InFlightDehydration = 'reject';
  void checkpointed;
  void mode;
  await journal.stage(client, {
    id: 'one',
    input: { city: '부산' },
    idempotencyKey: 'server-key',
    links: [
      {
        query,
        ids: query.changes().map(change => change.id),
        accept: 'submitted',
      },
    ],
  });
  const links: readonly PersistedLinkedMutationLink[] =
    journal.entry()?.links ?? [];
  void links;
  const mutation = client.mutation({
    mutationFn: (input: { city: string }) => input.city,
  });
  const result: MutationResult<string> | null = await journal.send(
    client,
    [query],
    mutation
  );
  void result;
  query.dispose();
}

void persistedLinkedSubmission;

/**
 * The value is still rejected, but the report moved.
 *
 * `query` is overloaded now (DC9-04), so a bad property fails the whole call
 * rather than that line: the marker has to sit on the call. Both overloads
 * are printed, which is a real cost of folding the reactive key in - the
 * diagnostic is worse even though the check is not.
 */
// @ts-expect-error automatic policy accepts only boolean or always
createSyncClient().query({
  queryKey: ['bad-automatic-policy'],
  queryFn: () => 1,
  refetchOnFocus: 'stale',
});

const streamed = createSyncClient().query({
  queryKey: ['streamed'],
  queryFn: () => ({ rows: [] as string[] }),
});
const baseline: { rows: string[] } | undefined = streamed.serverValue();
void baseline;
const mode: StreamRefetchMode = 'replace';
const stream: QueryStream = streamQuery(streamed, {
  source: () =>
    ndjsonMessages<{ row: string }>(signal => fetch('/rows', { signal })),
  reduce: (current, message) => ({
    rows: [...(current?.rows ?? []), message.row],
  }),
  initialValue: () => ({ rows: [] }),
  throttle: 'frame',
});
const streamState: QueryStreamStatus['state'] = stream.status.state.value;
void streamState;
stream.refetch();
stream.refetch({ mode });
// @ts-expect-error the mode is one of reset, append or replace
stream.refetch({ mode: 'merge' });
stream.close();
streamQuery(streamed, {
  source: () => webSocketMessages<{ row: string }>(new WebSocket('wss://x')),
  throttle: 100,
  // @ts-expect-error reduce must return the query data shape
  reduce: (_current, message) => message.row,
});

// Missing data keeps its paths open (docs/sync-query-hooks DC-QH-18, T-QH-08).
// Exact type checks: each `Exact` fails if a `| undefined` or `| null` is
// lost or added, which a plain assignment to a wider type cannot detect.
type Equal<A, B> = (<V>() => V extends A ? 1 : 2) extends <V>() => V extends B
  ? 1
  : 2
  ? true
  : false;
function exact<A, B>(_check: Equal<A, B>) {}

async function displayLeafPaths() {
  type Profile = {
    name: string;
    address: { city: string } | null;
    nickname?: string;
    tags: string[];
    pair: [number, string];
    counts: Record<string, number>;
  };
  const profile = (): Profile => ({
    name: 'Lee',
    address: null,
    tags: [],
    pair: [1, 'a'],
    counts: {},
  });
  const client = createSyncClient({ ssr: true });
  const query = client.query({ queryKey: ['profile'], queryFn: profile });
  const data = query.display.data;
  // Under `data`, which is missing before the first load, every leaf may be
  // undefined.
  exact<typeof data.name.value, string | undefined>(true);
  exact<typeof data.value, Profile | undefined>(true);
  exact<typeof data.address.value, { city: string } | null | undefined>(true);
  exact<typeof data.address.city.value, string | undefined>(true);
  exact<typeof data.nickname.value, string | undefined>(true);
  exact<typeof data.tags.value, string[] | undefined>(true);
  exact<(typeof data.tags)[0]['value'], string | undefined>(true);
  exact<typeof data.tags.length.value, number | undefined>(true);
  for (const item of data.tags) {
    exact<typeof item.value, string | undefined>(true);
  }
  exact<(typeof data.pair)[0]['value'], number | undefined>(true);
  exact<typeof data.counts.anything.value, number | undefined>(true);
  // A check on `.value` narrows, as it did before.
  if (data.value !== undefined) {
    exact<typeof data.name.value, string>(true);
    exact<typeof data.address.city.value, string | undefined>(true);
    if (data.address.value !== null) {
      exact<typeof data.address.city.value, string>(true);
    }
    exact<typeof data.nickname.value, string | undefined>(true);
    exact<typeof data.counts.anything.value, number>(true);
  }
  // @ts-expect-error a display leaf has no setter
  data.name.value = 'Kim';
  // @ts-expect-error `missing` is not a Profile field
  void data.missing;
  // A loaded ref where `null` is the only absence: still `| undefined` below.
  const loaded = {} as QueryDisplayRef<Profile>;
  exact<typeof loaded.name.value, string>(true);
  exact<typeof loaded.address.city.value, string | undefined>(true);
  exact<typeof loaded.counts.anything.value, number>(true);
  // A field named `value` is not a path; the node's value keeps its absence.
  type Option = { label: string; value: string };
  const option = {} as QueryDisplayRef<Option | undefined>;
  exact<typeof option.value, Option | undefined>(true);
  exact<typeof option.label.value, string | undefined>(true);
  const choice = {} as QueryDisplayRef<{ selected: Option | null }>;
  exact<typeof choice.selected.value, Option | null>(true);
  // A discriminated union still reads its common fields.
  type Shape = { kind: 'a'; x: number } | { kind: 'b'; y: string };
  const shape = {} as QueryDisplayRef<Shape | undefined>;
  exact<typeof shape.kind.value, 'a' | 'b' | undefined>(true);
  // A generic helper keeps its constraint's fields.
  function rowId<R extends { id: string }>(row: QueryDisplayRef<R>) {
    return row.id.value;
  }
  void rowId;
  // An infinite query's ref reads a record value as before.
  type Page = { byId: Record<string, number> };
  const feed = client.infiniteQuery({
    queryKey: ['feed'],
    initialPageParam: 0,
    queryFn: (): Page => ({ byId: {} }),
    getNextPageParam: () => undefined,
  });
  exact<typeof feed.display.data.value, InfiniteData<Page, number> | undefined>(
    true
  );
  exact<(typeof feed.ref.pages)[0]['byId']['anything']['value'], number>(true);
  // Selecting a primitive keeps the plain `S | undefined`.
  const selected = client.query({
    queryKey: ['profile'],
    queryFn: profile,
    select: value => value.name.length,
  });
  exact<typeof selected.display.data.value, number | undefined>(true);
  // The status fields read as before.
  exact<typeof query.display.status.value, 'pending' | 'success' | 'error'>(
    true
  );
  exact<typeof query.display.queryKey.value, QueryKey | null>(true);
  query.dispose();
  selected.dispose();
  feed.dispose();
}

void displayLeafPaths;

/**
 * The observer for connector entries (docs/sync-query-hooks T-QH-08, 단계 2):
 * its exported types, and the handle it lends, which goes wherever a linked
 * query does.
 */
async function observerTypes(journal: PersistedLinkedMutation) {
  type Account = { name: string; age: number };
  const client = createSyncClient();
  const settings: ObserverSettings = {
    scheduleRelease: release => {
      setTimeout(release, 0);
    },
  };
  const options: ObserveOptions<Account, string> = {
    queryKey: ['account', 1],
    queryFn: (): Account => ({ name: 'Lee', age: 3 }),
    select: account => account.name,
    enabled: true,
  };
  const observer: QueryObserver<Account, string> = client.observe(
    options,
    settings
  );
  exact<typeof options.select, ((data: Account) => string) | undefined>(true);
  exact<ReturnType<typeof observer.setOptions>, boolean>(true);
  exact<ReturnType<typeof observer.matches>, boolean>(true);
  const shown = observer.watch();
  exact<typeof shown.data.value, string | undefined>(true);
  exact<ReturnType<typeof observer.peek>, typeof shown>(true);
  const controls: QueryObserverControls<Account> = observer.controls;
  const refetched: Account = await controls.refetch();
  void refetched;
  const handle = controls.handle();
  exact<typeof handle, QueryHandleCore<Account> | null>(true);
  if (!handle) return;
  const name: string = handle.ref.name.value;
  handle.ref.name.value = name;
  await client.mutation({ mutationFn: (input: { name: string }) => input }).run(
    { name },
    {
      links: [
        {
          query: handle,
          submission: handle.capture(),
          accept: { kind: 'submitted' },
        },
      ],
    }
  );
  // An existing handle still goes everywhere a lent one does.
  const query: QueryHandle<Account> = client.query<Account>({
    queryKey: ['account', 2],
    queryFn: options.queryFn,
  });
  const core: QueryHandleCore<Account> = query;
  void core;
  await journal.stage(client, {
    id: 'observer',
    input: { name },
    idempotencyKey: 'observer-key',
    links: [{ query: handle, accept: 'submitted' }],
  });
  const mutation = client.mutation({
    mutationFn: (input: { name: string }) => input.name,
  });
  void (await journal.send(client, [handle, query], mutation));
  query.dispose();
}

void observerTypes;
