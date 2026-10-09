import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiSyncKo = mount(() => {
  return () => (
    <div>
      <h1>Sync API</h1>

      <p>
        <code>@stateref/sync</code>의 표면입니다. 설명은{' '}
        <a href="#/ko/guide/sync">createSyncClient</a>를, 모든 규칙의 자세한
        서술은 패키지 README를 보세요.
      </p>

      <h2>createSyncClient</h2>

      <CodeBlock
        language="typescript"
        code={`function createSyncClient(options?: {
  ssr?: boolean;
  environment?: SyncEnvironment;
}): SyncClient`}
      />

      <p>
        앱당 하나, 또는 SSR 요청당 하나입니다. SSR client는 무한{' '}
        <code>gcTime</code>과 조회 재시도 0을 쓰고, environment 구독도 polling
        타이머도 만들지 않습니다.
      </p>

      <h2>SyncClient</h2>

      <h3>조회</h3>

      <CodeBlock
        language="typescript"
        code={`client.query<T, S>(options): QueryHandle<T, S>          // fixed key
client.query<I, T, S>({ source, resolve, ...display }): QueryHandle<T, S>  // reactive key

client.fetch<T>(options): Promise<T>     // fresh cache or a READ; throws
client.prefetch<T>(options): Promise<void> // caches success, swallows rejection
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale

client.observe<T, S>(options, settings?): QueryObserver<T, S> // for hook authors`}
      />

      <h3>무한 조회</h3>

      <CodeBlock
        language="typescript"
        code={`client.infiniteQuery<Page, Param, S>(options): InfiniteQueryHandle<Page, Param, S>

client.fetchInfinite(options)
client.prefetchInfinite(options)
client.ensureInfinite(options)`}
      />

      <p>
        무한 페이지는 읽기 전용이고 <code>infiniteQuery</code>는 고정 key만
        받습니다. 반응형 key의 무한 조회판은 없습니다.
      </p>

      <p>
        가이드: <a href="#/ko/guide/sync-infinite">무한 조회</a>.
      </p>

      <CodeBlock
        language="typescript"
        code={`// InfiniteQueryOptions<Page, Param> — QueryOptions without queryFn / editable / initialData, plus:
{
  queryFn: (context: { signal: AbortSignal; pageParam: Param }) => Page | Promise<Page>;
  initialPageParam: Param;   // JSON-compatible
  getNextPageParam: (lastPage, pages, lastPageParam, pageParams) => Param | null | undefined;
  getPreviousPageParam?: (firstPage, pages, firstPageParam, pageParams) => Param | null | undefined;
  maxPages?: number;
  initialData?: { pages: Page[]; pageParams: Param[] };
}

// InfiniteQueryHandle — data is { pages, pageParams }
handle.ref / handle.watch          // readonly
handle.status / handle.watchStatus
handle.display / handle.watchDisplay
handle.load()                      // the first page only
handle.refetch()                   // re-reads held pages from the first
handle.fetchNextPage() / handle.fetchPreviousPage()
handle.hasNextPage() / handle.hasPreviousPage()
handle.invalidate()
handle.dispose()
// no changes(), no capture()`}
      />

      <h3>mutation</h3>

      <CodeBlock
        language="typescript"
        code={`client.mutation<I, T>(options): MutationHandle<I, T>`}
      />

      <h3>캐시</h3>

      <CodeBlock
        language="typescript"
        code={`client.invalidate(key: QueryKey): void
client.remove(key: QueryKey): boolean   // refused while anything holds the entry
client.size(): number

client.dehydrate()
client.hydrate(snapshot)
client.dehydrateLocal(options?: { inFlight?: 'reject' | 'unconfirmed' })
client.hydrateLocal(snapshot)   // into an empty client; starts no READ or WRITE`}
      />

      <h3>관측</h3>

      <CodeBlock
        language="typescript"
        code={`client.inspectCache(): readonly SyncCacheEntry[]
client.subscribeCache(listener): () => void

client.inspectMutations(): readonly SyncMutationEntry[]
client.subscribeMutations(listener): () => void`}
      />

      <p>
        읽기 전용 메타데이터 경계입니다. 조회 데이터, 로컬 편집, mutation 입력,
        호출자 소유 오류 객체는 빠져 있습니다.{' '}
        <a href="#/ko/guide/sync-observation">관측</a>을 보세요.
      </p>

      <h2>QueryOptions</h2>

      <CodeBlock
        language="typescript"
        code={`{
  queryKey: QueryKey;        // acyclic, JSON-compatible array
  queryFn: (context: { signal: AbortSignal }) => T | Promise<T>;

  editable?: boolean;        // default true
  initialData?: T;
  initialUpdatedAt?: number;
  staleTime?: number;        // default 0
  gcTime?: number;           // default 5 minutes; infinite in SSR
  retry?: number;
  retryDelay?: (attempt: number) => number;

  networkMode?: 'online' | 'always' | 'offlineFirst';  // default 'online'
  refetchOnFocus?: boolean | 'always';                 // default true
  refetchOnReconnect?: boolean | 'always';             // default true
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;               // default false
}`}
      />

      <h2>QueryHandle</h2>

      <CodeBlock
        language="typescript"
        code={`handle.queryKey     // the key this handle was opened with
handle.ref          // editable resource ref; throws before a first load
handle.watch        // the Watch shape; throws before a first load
handle.status       // readable from the start
handle.watchStatus

handle.load()       // uses a fresh cached result when there is one
handle.refetch()    // forces a READ
handle.invalidate() // marks stale, excludes an older in-flight response
handle.dispose()    // releases this handle's subscriptions

handle.isDirty()
handle.changes()
handle.version()
handle.capture(ids?)        // ResourceSubmission: frozen value + rows + version
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE
handle.serverValue()        // 로컬 편집을 뺀 서버 기준값; 로드 전에는 undefined`}
      />

      <h3>QueryStatus</h3>

      <CodeBlock
        language="typescript"
        code={`{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching' | 'paused';
  loaded: boolean;
  error: unknown | null;
  updatedAt: number | null;
  invalidated: boolean;

  // the editing axis, kept separate
  dirty: boolean;
  conflicts: number;
  version: number;
  pending: number;
  unconfirmed: boolean;
}`}
      />

      <h3>ResourceChange와 ResourceSubmission</h3>

      <p>
        <code>changes()</code>와 <code>capture()</code>가 돌려주는 것입니다.
        어떻게 쓰이는지는 <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>를
        보세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`type ResourceValue = Readonly<{ exists: boolean; value: unknown }>;

type ResourceChange = Readonly<{
  owner: object;           // the resource it belongs to
  id: number;              // what capture(ids) takes
  version: number;         // resource version when read
  path: readonly (string | number)[];
  before: ResourceValue;   // the baseline
  after: ResourceValue;    // the local value
  conflict: boolean;       // a READ brought a different value here
}>;

type ResourceSubmission<T> = Readonly<{
  owner: object;
  version: number;         // stale once the resource version moves
  value: T;                // the whole current value, frozen
  changes: readonly ResourceChange[]; // all rows, or the ids passed
}>;`}
      />

      <h2>표시(display)</h2>

      <CodeBlock
        language="typescript"
        code={`// display options, on the query itself
{ placeholderData?: T; select?: (data: T) => S; equals?: (a: S, b: S) => boolean }

// query.display / query.watchDisplay - readonly, built on first access
QueryStatus & { data, isPlaceholder, errorSource, queryKey, enabled }

// no phase: derive it
const phase = q.display.isPlaceholder.value ? 'placeholder' : q.display.status.value;

// a path under a missing value reads undefined:
// display.data.name.value is string | undefined

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}
      />

      <p>고정 key는 READ를 시작하지 않습니다. 활성 반응형 key는 시작합니다.</p>

      <h2>조회 관찰자(observer)</h2>

      <p>
        각 커넥터의 <code>/sync</code> 진입점 아래에 있는 저수준 API로, 다른
        프레임워크용 훅을 만들 때 씁니다. 앱 코드는 그 진입점을 쓰세요.{' '}
        <a href="#/ko/guide/sync-query">query와 resource</a>를 보세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`client.observe<T, S = T>(
  options: ObserveOptions<T, S>,
  settings?: ObserverSettings
): QueryObserver<T, S>

type ObserveOptions<T, S = T> = QueryOptions<T> &
  QueryDisplayOptions<T, S> & { enabled?: boolean };

type ObserverSettings = {
  scheduleRelease?: (release: () => void) => void; // default: one macrotask
};

type QueryObserver<T, S = T> = Readonly<{
  watch: QueryDisplayWatch<QueryDisplayState<S>>; // no callback: the confirmed options' state; a callback: subscribe
  peek: (options: ObserveOptions<T, S>) => QueryDisplayRef<QueryDisplayState<S>>; // options a render has not confirmed
  matches: (options: ObserveOptions<T, S>) => boolean;    // same key and enabled as the confirmed options
  setOptions: (options: ObserveOptions<T, S>) => boolean; // confirm; true when the key or enabled changed
  controls: QueryObserverControls<T>;
}>;

type QueryObserverControls<T> = Readonly<{
  refetch: () => Promise<T>;  // rejects 'This query observer is not attached.' while not attached
  invalidate: () => void;     // invalidates the key; reads again while attached and enabled
  handle: () => QueryHandleCore<T> | null; // the query's own handle; null while not attached
}>;

// a QueryHandle without the members that show or release it
type QueryHandleCore<T> = Omit<QueryHandle<T>, 'dispose' | 'display' | 'watchDisplay'>;`}
      />

      <ul>
        <li>
          관찰자를 만들고 읽는 것(콜백 없는 <code>watch()</code>,{' '}
          <code>peek</code>, <code>matches</code>)은 캐시를 바꾸지 않습니다.
        </li>
        <li>
          첫 콜백 구독에서 관찰자가 붙습니다. 조회를 열고, stale이면 불러오며,
          진행 중 READ를 공유합니다. 구독은 첫 실행이 반환한{' '}
          <code>AbortSignal</code>이 abort되거나 이후 실행이 <code>false</code>
          를 반환하면 끝납니다. 둘 다 없는 구독은 관찰자를 붙잡아 둡니다. 마지막
          구독이 끝나면 <code>scheduleRelease</code>에 따라 핸들을 놓습니다.
        </li>
        <li>
          <code>setOptions</code>는 렌더 밖에서 호출하세요. 커밋 뒤, 또는 렌더
          전의 반응에서 호출합니다. 렌더의 옵션에 대해{' '}
          <code>matches(options)</code>가 false인 동안에는 구독한 상태 대신{' '}
          <code>peek(options)</code>를 보여 주세요.
        </li>
        <li>
          <code>ssr: true</code> client에서는 붙지 않고, 구독은 확정된 옵션의
          상태를 받습니다.
        </li>
        <li>
          <code>controls.handle()</code>은 조회 자신의 핸들을 빌려줍니다.
          dispose하지 마세요. 해제는 관찰자가 합니다.
        </li>
      </ul>

      <h2>스트리밍</h2>

      <CodeBlock
        language="typescript"
        code={`streamQuery<T, M>(query, options: QueryStreamOptions<T, M>): QueryStream

// QueryStreamOptions<T, M>
{
  source: () => StreamSource<M>;  // 시작할 때와 refetch()마다 호출
  reduce: (current: T | undefined, message: M) => T; // current = 서버 값; 불변으로 다룰 것 (묶음 안의 중간값은 freeze되지 않을 수 있음)
  initialValue?: () => T;         // 'reset' / 'replace' 재시작에만 쓰임(첫 run 제외); 예외면 run 실패
  throttle?: number | 'frame';    // 반영을 묶는다; 기본 0
  onError?: (reason: unknown) => void; // 실패한 run마다 한 번; 첫 run의 동기 source 예외는 다시 던져지기도 함
}

// StreamSource<M>
AsyncIterable<M> | ((sink: StreamSink<M>, signal: AbortSignal) => void | (() => void))
// StreamSink<M> = { next(message), error(reason), complete() }

// QueryStream
stream.status       // 읽기 전용; QueryStreamStatus
stream.watchStatus
stream.refetch(options?: StreamRefetchOptions) // close() 뒤나 알 수 없는 모드면 예외
stream.close()

type StreamRefetchMode = 'reset' | 'append' | 'replace';
type StreamRefetchOptions = { mode?: StreamRefetchMode }; // 기본 'reset'

// QueryStreamStatus
{
  state: 'open' | 'complete' | 'error' | 'closed';
  received: number;  // 이번 run에서 반영된 메시지 수
  queued: number;    // 연결된 WRITE를 기다리며 보류 중인 수
  buffered: number;  // 'replace' run이 화면 밖에서 접은 수
  error: unknown;
}

ndjsonMessages<M>(input: Response | ReadableStream<Uint8Array> | (signal => Response | ReadableStream | Promise<...>)): StreamSource<M>
webSocketMessages<M>(socket: WebSocketLike, parse?: (data: unknown) => M): StreamSource<M>

// WebSocketLike — 브라우저 WebSocket이 그대로 맞는다
{
  readonly readyState: number; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
  addEventListener(type: 'close', listener: (event: { code: number; reason: string; wasClean: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
}`}
      />

      <p>
        가이드: <a href="#/ko/guide/sync-stream">스트리밍</a>.
      </p>

      <h2>mutation</h2>

      <CodeBlock
        language="typescript"
        code={`client.mutation({
  mutationFn: (input, context: {
    signal: AbortSignal;
    operationId: number;
    attempt: number;          // 0 on the first try
    idempotencyKey?: string;
  }) => T | Promise<T>;
  onSuccess?: (data, input, operationId) => void | Promise<void>;
  onError?: (error, input, operationId) => void | Promise<void>;
  onSettled?: (result, input) => void | Promise<void>;
})

mutation.run(input, options?): Promise<MutationResult>
mutation.start(input, options?): MutationOperation
mutation.status / mutation.watchStatus   // the latest operation
mutation.dispose()

// options
{
  scope?: string;          // same scope runs in start order
  signal?: AbortSignal;    // aborting settles as 'unknown'
  retry?: number;          // opt-in; requires idempotencyKey
  retryDelay?: (attempt: number) => number;
  idempotencyKey?: string;
  links?: Array<{
    query: QueryHandleCore<any>;        // a handle you own, or q.handle()
    submission?: ResourceSubmission<any>;
    accept?:                          // default { kind: 'none' }
      | { kind: 'none' | 'refetch' | 'submitted' }
      | { kind: 'response'; select: (response: T) => any };
    onReject?: 'keep' | 'remove';     // 'remove' requires a submission
  }>;
}

// result.kind
'success' | 'sync-error' | 'rejected' | 'unknown'`}
      />

      <p>
        link의 <code>query</code>는 <code>QueryHandleCore&lt;any&gt;</code>
        입니다. <code>dispose</code>·<code>display</code>·
        <code>watchDisplay</code>가 없는 조회 핸들이라 직접 소유한 핸들도,
        컴포넌트 훅이 <code>q.handle()</code>로 빌려준 핸들도 넣을 수 있습니다.{' '}
        <code>openPersistedLinkedMutation</code>의 <code>stage</code> links와{' '}
        <code>send(client, queries, mutation)</code>도 같은 타입을 받습니다.
      </p>

      <p>
        <code>unknown</code>은 편집을 지키고 자동으로 재시도하지 않습니다.{' '}
        <code>sync-error</code>는 재전송이 아니라 새 READ나 알려진 서버 값으로
        화해합니다.
      </p>

      <h3>MutationOperation, MutationStatus, MutationResult</h3>

      <CodeBlock
        language="typescript"
        code={`type MutationOperation<T> = Readonly<{
  id: number;
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  result: Promise<MutationResult<T>>;
  abort: () => void;       // settles as 'unknown'
  dispose: () => void;
}>;

type MutationStatus = Readonly<{
  phase: 'idle' | 'pending' | 'success' | 'sync-error' | 'rejected' | 'unknown';
  pending: number;
  operationId: number | null;
  error: unknown | null;
}>;

type MutationResult<T> =
  | { kind: 'success'; operationId: number; data: T; callbackError?: unknown }
  | { kind: 'sync-error'; operationId: number; data: T; error: unknown; callbackError?: unknown }
  | {
      kind: 'rejected' | 'unknown';
      operationId: number;
      error: unknown;          // a MutationRejectedError for 'rejected'
      recoveryError?: unknown; // onReject: 'remove' failed to revert
      callbackError?: unknown;
    };

class MutationRejectedError extends Error {
  constructor(message: string, reason?: unknown);
  readonly reason?: unknown;
}`}
      />

      <h2>environment</h2>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment } from '@stateref/sync';

createBrowserSyncEnvironment(host?: BrowserSyncHost): SyncEnvironment
// host 없이 부르면 window / document / navigator를 읽는다; 없는 곳에서는
// 'Browser sync environment requires a browser host.' 예외

type BrowserSyncHost = Readonly<{
  window: { addEventListener; removeEventListener };   // 'focus', 'online'
  document: { addEventListener; removeEventListener; visibilityState: string }; // 'visibilitychange'
  navigator: { onLine: boolean };
}>;`}
      />

      <CodeBlock
        language="typescript"
        code={`type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: 'focus' | 'reconnect') => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;`}
      />

      <p>
        호스트가 브라우저 전역보다 잘 아는 경우 — 네이티브 셸, 테스트, 자체 연결
        검사 — 에는 이것을 직접 구현해 주입합니다. 브라우저 어댑터의 판단 기준과
        구현 예시는 <a href="#/ko/guide/sync-refetch">자동 재조회</a>에
        있습니다.
      </p>

      <h2>영속화</h2>

      <CodeBlock
        language="typescript"
        code={`saveSyncSnapshot(client, storage, options)
restoreSyncSnapshot(client, storage, options)   // a new, empty client

saveLocalSyncSnapshot(client, storage, options)
restoreLocalSyncSnapshot(client, storage, options)

openPersistedLinkedMutation({ storage, key, buster, isOnline?, checkpoint? })
openPersistedMutationQueue({ storage, key, buster, maxAge?, commands, isOnline? })`}
      />

      <p>
        각각 자기 저장 키와 정확히 하나의 작성자를 원합니다.{' '}
        <a href="#/ko/guide/sync-persistence">영속화와 SSR</a>을 보세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`type SyncStorage = Readonly<{
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}>;

// options for save/restore(Local)SyncSnapshot
{ key: string; buster: string; maxAge?: number /* default Infinity */ }`}
      />

      <p>
        <code>localStorage</code>가 그대로 맞고, 비동기 시그니처라 IndexedDB나
        네이티브 저장소도 맞출 수 있습니다.
      </p>

      <h2>범위</h2>

      <p>
        프로젝트는 비교 범위를 행 단위로 추적하고, 어떤 라이브러리와의 동등성도
        선언하지 않습니다. 네 행이 부분 지원으로 기록돼 있습니다 — 무한 조회의
        key 전환, 프레임워크 SSR 경계, 관측 경계, 반응형 옵션의 커넥터별 차이.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync">createSyncClient</a> - 가이드
        </li>
        <li>
          <a href="#/ko/api/draft">Draft API</a>
        </li>
        <li>
          <a href="#/ko/api/plugin">Plugin API</a>
        </li>
      </ul>
    </div>
  );
});
