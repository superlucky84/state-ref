import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';
import { lithentQueryExample } from '@/content/lithent-sync';

export const SyncQueryKo = mount(() => {
  return () => (
    <div>
      <h1>query와 resource</h1>

      <p>
        조회 핸들은 두 가지를 동시에 듭니다. 마지막 READ가 확인한{' '}
        <strong>서버 기준</strong>과, 그 위에 올린 <strong>로컬 편집</strong>
        입니다. 이 둘을 갈라 두는 것이 저장되지 않은 필드와 낡은 필드를 구별하게
        해 줍니다.
      </p>

      <h2>Lithent 컴포넌트의 조회</h2>
      <p>
        mounter에서 <code>createSyncQuery</code>를 한 번 만들고 렌더에서
        <code>account()</code>를 읽습니다. 로딩·props key 변경·READ
        공유·언마운트 정리를 맡습니다. 새 커넥터는 이 브랜치에서 준비 중이며
        아직 게시되지 않았습니다.
        <a href="#/ko/guide/lithent">Lithent 안내</a>에는 편집·mutation
        links·SSR·선택적 concurrent 코어 사용도 있습니다.
      </p>
      <CodeBlock language="typescript" code={lithentQueryExample} />

      <h2>명시적 핸들</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});

await account.load();      // 신선한 캐시가 있으면 그것을 쓴다
await account.refetch();   // 강제로 READ한다
account.invalidate();      // key를 stale로 만들고, 앞선 진행 중 응답을 배제한다
account.dispose();         // 이 핸들의 구독을 놓는다`}
      />

      <p>
        <code>account.status</code>는 첫 로드 전에도 읽을 수 있습니다.{' '}
        <code>account.ref</code>와 <code>account.watch</code>는 로드가 성공할
        때까지 <strong>던집니다</strong> — 내줄 기준이 없고, 가짜 기준을
        돌려주는 것이야말로 로딩 화면이 해서는 안 되는 일이기 때문입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const status = account.status.value;

status.status;      // 'pending' | 'success' | 'error'
status.fetchStatus; // 'idle' | 'fetching' | 'paused'
status.loaded;      // 기준이 있는가
status.error;
status.updatedAt;
status.invalidated;

// 로딩 축과 분리된 편집 축
status.dirty;
status.conflicts;
status.version;
status.pending;      // 진행 중인 연결 WRITE
status.unconfirmed;  // 끝내 확인되지 않은 WRITE 결과`}
      />

      <h2>컴포넌트에 연결하기</h2>

      <p>
        <code>account.watch</code>와 <code>account.watchStatus</code>는{' '}
        <code>state-ref</code>의 <code>Watch</code> 모양이라 커넥터가 그대로
        받습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const useAccount = connectReact(account.watch);
const useAccountStatus = connectReact(account.watchStatus);

function CityField() {
  const state = useAccount();
  return (
    <input
      value={state.address.city.value}
      onChange={event => (state.address.city.value = event.target.value)}
    />
  );
}`}
      />

      <p>
        값 쪽은 <code>loaded</code>가 true가 된 뒤에만 마운트하세요. ref 자신이
        그 전에는 거절하는 것과 같은 이유입니다.
      </p>

      <h2>편집은 로컬이다</h2>

      <p>
        ref 쓰기는 이 client의 resource를 바꾸고 그것으로 끝입니다. 어떤 요청도
        나가지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan';

account.isDirty();  // true
account.changes();  // 한 줄: address.city, Seoul -> Busan
account.version();  // 로컬 리비전 카운터`}
      />

      <p>
        같은 client에서 같은 key를 쓰는 다른 핸들은 그 편집을 즉시 봅니다.
        핸들마다 복사본이 아니라 하나의 resource이기 때문입니다.
      </p>

      <h2>변경 목록</h2>

      <p>
        <code>changes()</code>는 <a href="#/ko/guide/draft">로컬 draft</a>가
        쓰는 것과 같은 변경 모델이고, 원본 자리에 서버 기준이 들어갑니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const [change] = account.changes();

change.path;      // ['address', 'city']
change.before;    // 서버 기준
change.after;     // 로컬 값
change.conflict;  // READ가 이 경로에 다른 값을 들고 왔을 때 true
change.id;`}
      />

      <p>
        배열은 <strong>하나의 원자적 필드</strong>로 추적됩니다. 원소 하나를
        고쳐도 배열 전체의 변경으로 기록됩니다. 인덱스는 정체성이 아니라
        위치이기 때문입니다.
      </p>

      <h2>READ는 덮어쓰지 않고 rebase한다</h2>

      <p>
        나중에 READ가 도착해도 로컬 편집은 남습니다. 서버가 밑에서 움직인 경로는
        조용히 교체되는 대신 충돌이 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = 'Busan'; // 로컬

await account.refetch();  // 서버는 이제 그 경로에 'Gwangju'라고 답한다

account.status.value.conflicts;      // 1
account.changes()[0].conflict;       // true
account.ref.address.city.value;      // 여전히 'Busan' — 편집이 지켜졌다`}
      />

      <p>
        조회 핸들에는 <code>resolve()</code>가 없습니다. 서버 값을 받거나, 내
        값을 저장해서 지키거나, 사람이 고르게 하는 방법은{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>에 있습니다.
      </p>

      <h2>알려진 서버 값 수용</h2>

      <p>
        <code>acceptServer(value)</code>는 아무것도 보내지 않고 기준을 옮깁니다.
        캐시 전용 수용이고, 아직 떠 있는 앞선 READ를 배제합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.acceptServer(knownAccount);`}
      />

      <p>
        그 조회에 연결된 WRITE가 진행 중이면 거절합니다 — 아직 답하지 않은
        작업이 기준을 정하고 있는 중이기 때문입니다.
      </p>

      <h2>readonly 조회</h2>

      <p>
        절대 편집하지 않는 데이터나, 평범한 트리가 아닌 데이터(예:{' '}
        <code>Date</code>)에는 <code>editable: false</code>를 주세요. ref
        setter가 거절됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const settings = client.query({
  queryKey: ['settings'],
  queryFn: ({ signal }) => api.readSettings({ signal }),
  editable: false,
});

settings.ref.theme.value = 'dark'; // throws: This query is readonly.`}
      />

      <p>
        readonly 조회에도 <code>changes()</code>와 <code>version</code>은{' '}
        <strong>있습니다.</strong> 영원히 비어 있고 0일 뿐입니다. 거절하는 것은{' '}
        <code>capture()</code>입니다. 비어 있는 검토 표면과 존재하지 않는 표면은
        다른 사실이고, 그 빈 목록이 둘을 가릅니다.
      </p>

      <p>
        편집 가능한 조회에서 <code>capture()</code>가 무엇을 얼리고 저장 뒤
        편집이 어떻게 되는지는{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>를 보세요. 조회에서
        난 충돌을 푸는 방법도 거기 있습니다.
      </p>

      <h2>resource가 받는 것</h2>

      <p>
        편집 가능한 데이터는 기본적으로 순환 없는 평범한 트리와 조밀한
        배열입니다. 예약된 프록시 키와, <code>.value</code>가 돌려준 객체를 직접
        변형하는 것은 거절합니다. <code>load/fetch/ensure</code>가 돌려주는
        결과는 얼린 복사본이므로 ref로 편집하세요.
      </p>

      <h2>캐시 준비하기</h2>

      <CodeBlock
        language="typescript"
        code={`await client.prefetch(options); // 성공하면 캐시하고, 로드 거절은 삼킨다
const fresh = await client.fetch(options);   // 신선한 캐시 또는 READ. 오류는 던진다
const cached = await client.ensure(options); // 확인된 캐시. stale이어도 준다

const seeded = client.query({ ...options, initialData: knownAccount });`}
      />

      <p>
        이들은 client의 캐시와 진행 중 READ를 key로 공유하고, 임시 옵션이 기존
        핸들의 옵션을 대체하지 않습니다. <code>initialData</code>는 완전하고
        확인된 서버 값에만 쓰세요 — 그것이 편집 기준이 됩니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - 그 변경을
          보내기
        </li>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a> - 로컬 draft에서
          같은 충돌 모델
        </li>
        <li>
          <a href="#/ko/guide/sync-view">표시와 반응형 key</a> - 관찰자별 표시
          상태
        </li>
      </ul>
    </div>
  );
});
