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
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale`}
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
handle.capture(ids?)        // an immutable value + change snapshot for a mutation
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE`}
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

      <h2>표시(display)</h2>

      <CodeBlock
        language="typescript"
        code={`// display options, on the query itself
{ placeholderData?: T; select?: (data: T) => S; equals?: (a: S, b: S) => boolean }

// query.display / query.watchDisplay - readonly, built on first access
QueryStatus & { data, isPlaceholder, errorSource, queryKey, enabled }

// no phase: derive it
const phase = q.display.isPlaceholder.value ? 'placeholder' : q.display.status.value;

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}
      />

      <p>고정 key는 READ를 시작하지 않습니다. 활성 반응형 key는 시작합니다.</p>

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
    query: QueryHandle<any>;
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
        <code>unknown</code>은 편집을 지키고 자동으로 재시도하지 않습니다.{' '}
        <code>sync-error</code>는 재전송이 아니라 새 READ나 알려진 서버 값으로
        화해합니다.
      </p>

      <h2>environment</h2>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment } from '@stateref/sync';

const environment = createBrowserSyncEnvironment(); // browser globals only`}
      />

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
