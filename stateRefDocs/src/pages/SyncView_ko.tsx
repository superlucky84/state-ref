import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncViewKo = mount(() => {
  return () => (
    <div>
      <h1>표시(display)와 반응형 key</h1>

      <p>
        표시는 <strong>관찰자 한 명에게 속한 상태</strong>입니다. placeholder,
        선택, 비교 — 어느 것도 공유 캐시에 들어가지 않습니다. 한 key를 보는 두
        화면이 서로 다르게 보여 주고 싶을 수 있기 때문입니다.
      </p>

      <p>
        따로 여는 객체가 아닙니다. <code>select</code>,{' '}
        <code>placeholderData</code>, <code>equals</code>는 조회의 옵션이고, 그
        결과가 핸들의 <code>display</code>입니다.
      </p>

      <h2>display</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  placeholderData: previewAccount,
  select: account => account.address.city,
});

account.display.data.value;              // 이 관찰자의 placeholder 또는 선택된 값
await account.load();                    // 명시적 READ
account.ref.address.city.value = 'Busan'; // 공유 resource를 편집한다
account.dispose();`}
      />

      <p>
        한 핸들이 둘을 다 듭니다. <code>ref</code>는 편집하는 자원이고{' '}
        <code>display</code>는 그리는 것입니다. 편집은 표시를 지나지 않습니다 —
        표시는 선택된 문자열일 수도, 서버에 없던 placeholder일 수도 있고, 둘 다
        되돌려 쓸 수 있는 것이 아닙니다.
      </p>

      <h3>어휘는 하나입니다</h3>

      <p>
        <code>display</code>와 <code>watchDisplay</code>는{' '}
        <strong>읽기 전용</strong>이고, 상태는 조회 status에 다섯 필드를 더한
        것입니다. status 필드는 이름이 그대로라 두 번 배우지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.display.data.value;          // 선택된 값, 또는 undefined
account.display.isPlaceholder.value; // placeholderData를 보이는 중
account.display.errorSource.value;   // 'query' | 'select' | 'source' | null
account.display.queryKey.value;      // ['account', 1]
account.display.enabled.value;       // 반응형 key가 아무것도 가리키지 않을 때만 false

account.display.status.value;        // 'pending' | 'success' | 'error'
account.display.fetchStatus.value;   // account.status.fetchStatus와 같은 필드
account.display.dirty.value;         // ...status의 모든 필드가 이렇게 있습니다`}
      />

      <p>
        <code>phase</code>는 없습니다. <code>status</code>에{' '}
        <code>'placeholder'</code>를 더한 값이었고, 그 사실은{' '}
        <code>isPlaceholder</code>가 이미 들고 있었습니다. 예전 네 단어가
        필요하면 유도하면 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const phase = account.display.isPlaceholder.value
  ? 'placeholder'
  : account.display.status.value;`}
      />

      <p>
        <code>display</code>는 처음 건드릴 때 만들어집니다. 자원만 편집하는
        소비자는 표시의 비용을 지지 않습니다.
      </p>

      <h3>placeholder와 select</h3>

      <ul>
        <li>
          placeholder는 관찰자마다 따로입니다. <code>dehydrate()</code>나 편집
          가능한 resource에 들어가지 않고, 첫 READ가 실패하면 사라집니다.
        </li>
        <li>
          재조회 실패는 placeholder로 떨어지지 않고 이전에 불러온 데이터를
          유지합니다.
        </li>
        <li>
          <code>select</code>는 현재 로컬 편집을 봅니다. 다만 그 결과가 캐시된
          조회 모양을 대신하지는 않습니다.
        </li>
        <li>
          선택값 비교는 <code>equals</code>로 바꿀 수 있습니다(기본{' '}
          <code>Object.is</code>). 선택이나 비교가 실패하면{' '}
          <strong>그 관찰자만</strong> 오류가 되고 공유 조회는 그대로입니다.{' '}
          <code>equals</code>가 같다고 답하면 이전 선택값을 그대로 두므로{' '}
          <code>data</code>를 보는 구독이 깨어나지 않습니다.
        </li>
      </ul>

      <p>
        고정 key는 스스로 READ를 시작하지 <strong>않습니다</strong>.
      </p>

      <h2>반응형 key</h2>

      <p>
        key가 바뀌는 경우 — 선택된 id, 페이지 번호, 의존 조회 — 에는{' '}
        <code>query</code>에 key 대신 <code>state-ref</code> 원본을 줍니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.query({
  source: input.watch,
  resolve: ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  select: account => account.address.city,
});

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // 자동으로 READ를 시작한다

live.display.data.value;     // 현재 key의 선택값만
live.display.queryKey.value; // ['account', 1]
live.display.enabled.value;

// 기준이 로드된 뒤
live.ref.address.city.value = 'Busan';

live.dispose();`}
      />

      <p>
        <code>null</code>을 답하거나 <code>enabled: false</code>이면 표시를
        비우고 현재 조회를 놓습니다. <code>display</code>는 핸들의 수명 내내
        같은 관찰점이며, 활성 key가 없을 때도 <code>enabled</code>와{' '}
        <code>queryKey</code>를 답합니다.
      </p>

      <p>
        그 상태에서 <code>ref</code>, <code>watch</code>, <code>status</code>와
        조작들은 <code>This query has no active key.</code>로 던집니다. 자원에
        손을 뻗기 전에 <code>display.enabled</code>를 확인하세요.
      </p>

      <h3>key가 바뀔 때 일어나는 일</h3>

      <ul>
        <li>
          아래의 조회가 해제됩니다. 이전 key에서 손에 든 ref는 이후 모든 접근을
          거절합니다.
        </li>
        <li>
          <strong>주인이 없어진</strong> 진행 중 READ는 abort되고 늦은 결과를
          기준에 넣지 못합니다.
        </li>
        <li>
          <strong>같은 key를 든 다른 소유자가 있으면</strong> 공유 READ는 계속
          돌고, 그 결과는 그 소유자의 표시로 갑니다 — 내 표시가 아닙니다.
        </li>
        <li>원본이 다시 발행되면 key가 같아도 새 옵션으로 재연결합니다.</li>
      </ul>

      <p>
        기억할 것은 세 번째입니다. 이전 READ가 취소되는지는{' '}
        <strong>그 key를 아직 보고 있는 사람이 있는지</strong>로 갈립니다.
      </p>

      <h2>커넥터</h2>

      <p>
        커넥터마다 읽기 전용 표시 연결이 있어서, 표시가 setter를 내주는 일은
        없습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}
      />

      <p>
        <code>connectPreactView</code>, <code>connectVueView</code>,{' '}
        <code>connectSvelteView</code>, <code>connectSolidView</code>도
        같습니다.
      </p>

      <p>
        <strong>커넥터의 언마운트는 그 컴포넌트의 구독만 끝냅니다.</strong>{' '}
        핸들은 그것을 소유한 쪽이 <code>live.dispose()</code>로 놓습니다. 두
        컴포넌트가 한 표시를 볼 수 있고, 한 화면을 닫는다고 다른 화면의 데이터가
        사라지지 않습니다.
      </p>

      <h2>페이지네이션</h2>

      <p>
        번호 페이지는 원본이 답하는 key에 페이지를 넣습니다. 그러면 페이지마다
        자기 캐시 항목을 가집니다. <code>placeholderData</code>는 새 key의
        미리보기일 뿐 그 페이지의 서버 기준이 되지 않습니다. 같은 key에{' '}
        <code>prefetch</code>, <code>fetch</code>, <code>ensure</code>로
        페이지를 준비할 수 있습니다.
      </p>

      <p>
        쌓이는 목록은 <code>client.infiniteQuery</code>를 씁니다 —{' '}
        <a href="#/ko/guide/sync-infinite">무한 조회</a>를 보세요. 같은 표시
        옵션을 받고, 페이지는 읽기 전용이며, <strong>고정 key만</strong>{' '}
        받습니다. 반응형 key의 무한 조회 대응물은 없습니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> — 표시가 보여
          주는 공유 기준
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> — 활성 반응형 key가
          첫 로드를 수행합니다
        </li>
        <li>
          <a href="#/ko/guide/custom-connector">커스텀 커넥터</a> — 표시 연결에
          필요한 <code>Watch</code> 모양
        </li>
      </ul>
    </div>
  );
});
