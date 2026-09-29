import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncKo = mount(() => {
  return () => (
    <div>
      <h1>createSyncClient</h1>

      <p>
        <code>@stateref/sync</code>는 공유 조회 캐시, 서버 기준 위의{' '}
        <strong>편집 가능한</strong> resource ref, 그리고 mutation을 더하는 별도
        패키지입니다. <code>state-ref</code>만 import하면 로드되지 않습니다.
      </p>

      <p>
        평범한 조회 캐시와 갈리는 지점은 이것입니다. 캐시된 값이 읽기 전용이
        아닙니다. 평범한 <code>state-ref</code> ref로 편집하고, client는 서버
        기준과 로컬 편집을 <strong>구별할 수 있는 두 가지</strong>로 계속 들고
        있습니다.
      </p>

      <h2>설치</h2>

      <CodeBlock
        language="bash"
        code={`npm install state-ref @stateref/sync`}
      />

      <h2>첫 조회</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';

type Account = { address: { city: string } };

const client = createSyncClient(); // 앱당 하나, 또는 SSR 요청당 하나

const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }): Promise<Account> => {
    const response = await fetch('/account/1', { signal });
    return response.json();
  },
});

await account.load();

account.ref.address.city.value = 'Busan'; // 로컬 편집이다. 네트워크 쓰기가 아니다
account.isDirty();  // true
account.changes();  // 서버 기준 -> 현재 로컬 편집`}
      />

      <p>
        <code>account.ref</code>는 <code>state-ref</code> ref이므로, 모든
        커넥터가 스토어와 똑같은 방식으로 연결합니다.
      </p>

      <h2>client</h2>

      <p>
        client는 자기 캐시를 소유합니다. 같은 client에서 같은 key를 쓰는 두
        핸들은 하나의 기준, 하나의 진행 중 READ, 하나의 로컬 편집을 공유합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = client.query(options);
const b = client.query(options); // 같은 key

a.ref.address.city.value = 'Busan';
b.ref.address.city.value;        // 'Busan' — 같은 resource다

// 다른 client는 다른 캐시다
const other = createSyncClient();
other.query(options).ref.address.city.value; // 영향 없음`}
      />

      <p>
        SSR 요청마다 별도 client를 만드세요. client를 공유하면 한 요청의
        데이터가 다른 요청으로 샙니다.
      </p>

      <h2>기본값</h2>

      <ul>
        <li>
          <code>staleTime: 0</code> — 기준은 도착하자마자 stale이다
        </li>
        <li>
          비활성 <code>gcTime</code>: 5분,{' '}
          <code>createSyncClient({'{ ssr: true }'})</code>에서는 무한
        </li>
        <li>client에서 조회 재시도 3회, SSR에서는 0회</li>
        <li>
          <code>queryKey</code>는 순환 없는 JSON 호환 배열이어야 하며, 해시할 때
          객체 키 순서는 무시한다
        </li>
      </ul>

      <h2>스스로 시작하는 것은 없다</h2>

      <p>
        고정 key 조회는 명시적인 <code>load()</code>가 필요합니다. 예외는
        mutation 응답, <code>acceptServer</code>, 그리고 스스로 로드하는 활성{' '}
        <a href="#/ko/guide/sync-view">반응형 key</a>입니다.
      </p>

      <p>
        반대 방향도 마찬가지입니다.{' '}
        <strong>로컬 편집은 절대 서버에 쓰지 않습니다.</strong> 저장은 언제나
        명시적인 mutation입니다.
      </p>

      <h2>범위와 한계</h2>

      <p>
        이 패키지는 정해진 비교 범위를 다루고, 프로젝트는 그것을 동등성 선언이
        아니라 <strong>행 단위로</strong> 추적합니다. 아홉 행 중 넷이{' '}
        <strong>부분 지원</strong>으로 기록돼 있습니다.
      </p>

      <ul>
        <li>
          <strong>pagination / infinite</strong> — 무한 조회의 반응형 key 전환이
          없다. <code>infiniteQuery</code>는 고정 key만 받는다
        </li>
        <li>
          <strong>SSR</strong> — 캐시 전송은 지원한다. 프레임워크별 로딩·오류
          경계는 패키지의 범위가 아니다
        </li>
        <li>
          <strong>devtools / 관측</strong> — 읽기 전용 메타데이터 경계이며,
          devtools나 플러그인 호환 API가 아니다
        </li>
        <li>
          <strong>커넥터 전반의 반응형 옵션</strong> — 반응형 key로 지원하며
          커넥터별 차이가 있다
        </li>
      </ul>

      <p>
        어떤 라이브러리와의 동등성도 선언하지 않습니다. 특정 동작이 중요하다면,
        익숙해 보이는 옵션 이름이 아니라 패키지 자체의 테스트에 대조해
        확인하세요.
      </p>

      <h2>다음으로</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - 로드·편집·변경
          읽기
        </li>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - 편집을 보내고
          결과를 수용하기
        </li>
        <li>
          <a href="#/ko/guide/sync-lifecycle">편집의 생애</a> -{' '}
          <code>capture()</code>가 얼리는 것과 결과마다 편집에 일어나는 일
        </li>
        <li>
          <a href="#/ko/guide/sync-view">표시와 반응형 key</a> -
          placeholder·선택·반응형 key
        </li>
        <li>
          <a href="#/ko/guide/sync-infinite">무한 조회</a> - 페이지가 쌓이는
          목록
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> -
          focus·reconnect·polling·network mode
        </li>
        <li>
          <a href="#/ko/guide/sync-persistence">영속화와 SSR</a> - 스냅숏과
          오프라인 큐
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">관측</a> - client가 무엇을 들고
          있는가
        </li>
        <li>
          <a href="#/ko/api/sync">Sync API</a> - 전체 표면
        </li>
      </ul>
    </div>
  );
});
