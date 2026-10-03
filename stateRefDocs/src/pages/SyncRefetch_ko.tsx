import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncRefetchKo = mount(() => {
  return () => (
    <div>
      <h1>자동 재조회</h1>

      <p>
        focus·reconnect·polling 정책은{' '}
        <strong>
          핸들의 첫 <code>load()</code> 또는 <code>refetch()</code> 이후에
        </strong>{' '}
        활성화됩니다. 활성 <a href="#/ko/guide/sync-view">반응형 key</a>는 그 첫
        로드를 스스로 합니다. 한 번도 읽지 않은 조회를 polling하는 일은
        없습니다.
      </p>

      <h2>environment</h2>

      <p>
        이 패키지는 브라우저 전역을 스스로 읽지 않습니다. focus와 연결 상태는
        client에 주입하는 <code>SyncEnvironment</code>를 통해 들어오고, 브라우저
        어댑터는 브라우저 전역이 실제로 있는 곳에서 호출해야 합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { createBrowserSyncEnvironment, createSyncClient } from '@stateref/sync';

const environment = createBrowserSyncEnvironment();
const client = createSyncClient({ environment });`}
      />

      <p>
        environment가 없으면 focus·reconnect 사건 자체가 없고, polling은
        호스트를 focused·online으로 취급합니다. SSR client는 사건 구독도 polling
        타이머도 만들지 않습니다.
      </p>

      <h2>정책</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,

  // 옵션마다 따로 정한다: 사건(focus / 재연결)별로 값이 다를 수 있다
  refetchOnFocus: true,          // focus될 때: stale일 때만 다시 읽는다 (true가 기본값)
  refetchOnReconnect: 'always',  // 재연결될 때: 신선해도 다시 읽는다
  refetchInterval: 60_000,       // opt-in polling
  refetchIntervalInBackground: false, // 기본값
});

await account.load(); // 정책은 여기서 시작한다`}
      />

      <p>
        <code>refetchOnFocus</code>와 <code>refetchOnReconnect</code>는 서로
        독립된 옵션입니다. 위 예제는 &quot;focus 때는 stale일 때만, 재연결 때는
        무조건&quot;이라는 뜻이며, 두 값이 다른 것은 의도한 조합입니다. 두 옵션
        모두 같은 세 값을 받습니다.
      </p>

      <table>
        <thead>
          <tr>
            <th>값</th>
            <th>그 사건이 일어나면</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>true</code>
            </td>
            <td>
              데이터가 stale일 때만 다시 읽는다(<code>staleTime</code>이
              지났거나 <code>invalidate()</code>된 경우)
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;always&apos;</code>
            </td>
            <td>신선해도 다시 읽는다</td>
          </tr>
          <tr>
            <td>
              <code>false</code>
            </td>
            <td>다시 읽지 않는다</td>
          </tr>
        </tbody>
      </table>

      <p>
        기본값은 <code>refetchOnFocus: true</code>,{' '}
        <code>refetchOnReconnect: true</code>입니다. 단{' '}
        <code>networkMode: &apos;always&apos;</code>인 조회는 연결 상태와
        무관하게 동작하므로 <code>refetchOnReconnect</code>의 기본값이{' '}
        <code>false</code>입니다.
      </p>

      <ul>
        <li>
          사건은 environment가 focused인 동안에만 돕니다. online 모드는 연결까지
          필요합니다.
        </li>
        <li>
          polling은 opt-in이고, <code>refetchIntervalInBackground</code>로 달리
          말하지 않는 한 백그라운드에서 멈춥니다.
        </li>
      </ul>

      <h2>공유와 차단</h2>

      <ul>
        <li>
          같은 key의 관찰자들과 이미 돌고 있는 READ는 <strong>요청 하나</strong>
          를 공유합니다.
        </li>
        <li>
          자동 결과도 평범한 rebase 규칙을 씁니다. 로컬 편집은 남고, 겹치는 서버
          변경은 충돌이 됩니다.
        </li>
        <li>
          <strong>연결된 WRITE는 그 조회의 자동 READ를 막습니다</strong> — 아직
          답하지 않은 작업이 기준을 정하는 중이기 때문입니다.
        </li>
      </ul>

      <h2>정리</h2>

      <p>
        마지막으로 시작한 관찰자를 해제하면 environment 구독이 사라지고, 핸들을
        해제하면 그 polling 타이머가 정리됩니다.
      </p>

      <h2>network mode</h2>

      <p>조회마다 호스트가 오프라인일 때의 동작을 고릅니다.</p>

      <CodeBlock
        language="typescript"
        code={`networkMode: 'online'       // 기본값
networkMode: 'always'
networkMode: 'offlineFirst'`}
      />

      <ul>
        <li>
          <strong>
            <code>'online'</code>
          </strong>{' '}
          — 오프라인 READ는 <code>status.fetchStatus.value === 'paused'</code>로
          대기하고 재연결 시 재개합니다.
        </li>
        <li>
          <strong>
            <code>'always'</code>
          </strong>{' '}
          — 오프라인에서도 실행하고 재시도합니다. 기본 재연결 재조회 정책은{' '}
          <code>false</code>지만 <code>refetchOnReconnect</code>를 명시하면 켤
          수 있습니다. 오프라인에서 focus 재조회나 polling도 할 수 있습니다.
        </li>
        <li>
          <strong>
            <code>'offlineFirst'</code>
          </strong>{' '}
          — 오프라인에서 조회 함수를 한 번 시도해 로컬 캐시 적중을 허용하고,
          실패한 재시도는 재연결까지 멈춥니다.
        </li>
      </ul>

      <p>
        멈춘 요청은 앞선 데이터와 로컬 편집을 그대로 지킵니다. 무효화나 해제가
        그 대기를 취소합니다. SSR은 environment를 online으로 취급합니다.
      </p>

      <p>
        <code>navigator.onLine</code>은 힌트일 뿐이고, environment를 주입
        가능하게 둔 이유가 그것입니다 — 더 잘 아는 호스트가 그렇게 말할 수
        있습니다. 네트워크가 전혀 필요 없는 조회는 <code>'always'</code>를 쓰면
        됩니다.
      </p>

      <h2>mutation은 여기에 해당하지 않는다</h2>

      <p>
        mutation은 자기만의 명시적 재시도와 unknown 결과 규칙을 지킵니다.
        network mode가 무엇이든 <code>unknown</code> 쓰기는 자동으로 다시 보내지
        않습니다. 오프라인 명령은{' '}
        <a href="#/ko/guide/sync-persistence">영속화와 SSR</a>의 명시적 큐를
        쓰세요.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - rebase가 편집에
          하는 일
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">관측</a> - environment listener
          세기
        </li>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - 연결된
          WRITE가 READ를 막는 이유
        </li>
      </ul>
    </div>
  );
});
