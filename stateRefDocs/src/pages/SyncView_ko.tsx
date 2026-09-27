import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncViewKo = mount(() => {
  return () => (
    <div>
      <h1>view와 liveView</h1>

      <p>
        view는 <strong>관찰자 한 명에게 속한 표시 상태</strong>입니다.
        placeholder, 선택, 비교 — 어느 것도 공유 캐시에 들어가지 않습니다. 한
        key를 보는 두 화면이 서로 다르게 보여 주고 싶을 수 있기 때문입니다.
      </p>

      <h2>view</h2>

      <CodeBlock
        language="typescript"
        code={`const view = client.view(
  {
    queryKey: ['account', 1],
    queryFn: ({ signal }) => api.readAccount(1, { signal }),
  },
  {
    placeholderData: previewAccount,
    select: account => account.address.city,
  }
);

view.ref.data.value;   // 이 view의 placeholder 또는 선택된 현재 값
await view.query.load(); // 명시적 READ. client.query(...)와 같다
view.query.ref.address.city.value = 'Busan'; // 공유 resource를 편집한다
view.dispose();          // view와 그것이 소유한 조회 핸들을 놓는다`}
      />

      <p>
        <code>view.ref</code>와 <code>view.watch</code>는{' '}
        <strong>읽기 전용</strong> 표시 상태입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`view.ref.phase.value;          // 'pending' | 'placeholder' | 'success' | 'error'
view.ref.fetchStatus.value;
view.ref.isPlaceholder.value;
view.ref.error.value;
view.ref.errorSource.value;`}
      />

      <p>
        편집은 표시가 아니라 <code>view.query.ref</code>로 합니다. 이 분리는
        의도된 것입니다. 표시는 선택된 문자열일 수도 있고 서버에 존재한 적 없는
        placeholder일 수도 있는데, 둘 다 되돌려 쓸 수 있는 것이 아닙니다.
      </p>

      <h3>placeholder와 select</h3>

      <ul>
        <li>
          placeholder는 관찰자 로컬입니다. <code>dehydrate()</code>에도 편집
          가능한 resource에도 들어가지 않고, 첫 READ 오류 뒤에는 사라집니다.
        </li>
        <li>
          재조회 오류는 placeholder로 떨어지지 않고 앞서 로드한 데이터를
          유지합니다.
        </li>
        <li>
          <code>select</code>는 현재 로컬 편집을 봅니다. 다만 그 결과가 캐시된
          조회의 모양을 대체하지는 않습니다.
        </li>
        <li>
          선택 값 비교는 <code>equals</code>로 바꿀 수 있습니다(기본{' '}
          <code>Object.is</code>). select나 비교에서 난 오류는 공유 조회가
          아니라 그 view에만 영향을 줍니다.
        </li>
      </ul>

      <p>
        고정 key <code>view</code>는 스스로 READ를 시작하지{' '}
        <strong>않습니다.</strong>
      </p>

      <h2>liveView</h2>

      <p>
        선택된 id, 페이지 번호, 의존 조회처럼 key가 바뀌는 경우에는 고정 key
        대신 <code>state-ref</code> 원본을 연결합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.liveView(
  input.watch,
  ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  { select: account => account.address.city }
);

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // 자동으로 READ를 시작한다

live.ref.data.value;      // 선택된 현재 key의 값만
live.ref.queryKey.value;  // ['account', 1]
live.ref.enabled.value;

// 기준이 로드된 뒤
live.query?.ref.address.city.value = 'Busan';

live.dispose();`}
      />

      <p>
        <code>null</code>을 돌려주거나 <code>enabled: false</code>이면 표시가
        비고 현재 조회를 놓습니다. <code>live.ref</code>는 수명 내내 안정적이고
        읽기 전용이며, <code>live.query</code>는 현재 핸들이거나{' '}
        <code>null</code>입니다.
      </p>

      <h3>key를 바꿀 때 일어나는 일</h3>

      <ul>
        <li>이전 핸들은 해제됩니다. 앞서 붙잡아 둔 핸들은 쓸 수 없습니다.</li>
        <li>
          <strong>소유자가 없는</strong> 진행 중 READ는 취소되고, 늦은 결과를
          설치할 수 없습니다.
        </li>
        <li>
          <strong>같은 key를 다른 소유자가 들고 있으면</strong> 그 공유 READ는
          계속 돌고, 결과는 그 소유자의 표시로 들어갑니다 — 내 표시가 아닙니다.
        </li>
        <li>
          원본이 갱신될 때마다 새 옵션으로 다시 연결합니다. key가 그대로여도
          그렇습니다.
        </li>
      </ul>

      <p>
        기억할 만한 것은 셋째입니다. 이전 READ가 취소되는지 아닌지는{' '}
        <strong>그 key를 아직 보고 있는 사람이 있는가</strong>에 달려 있습니다.
      </p>

      <h2>커넥터</h2>

      <p>
        모든 커넥터에 읽기 전용 view 바인딩이 있어서, 표시가 setter를 내주는
        일이 없습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watch);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}
      />

      <p>
        <code>connectPreactView</code>·<code>connectVueView</code>·
        <code>connectSvelteView</code>·<code>connectSolidView</code>도 같은
        모양으로 있습니다.
      </p>

      <p>
        <strong>
          커넥터의 언마운트는 그 컴포넌트의 구독만 끝내고 그 외에는 아무것도
          하지 않습니다.
        </strong>{' '}
        view 자체는 소유자가 <code>live.dispose()</code>로 놓습니다. 두
        컴포넌트가 한 view를 볼 수 있고, 한 화면을 닫아도 다른 화면의 데이터를
        빼앗지 않습니다.
      </p>

      <h2>페이지네이션</h2>

      <p>
        번호가 있는 페이지는 <code>liveView</code>에 주는 key에 페이지를
        넣습니다. 그러면 페이지마다 자기 캐시 항목이 생깁니다.{' '}
        <code>placeholderData</code>는 새 key의 미리보기일 뿐이고, 그 페이지의
        서버 기준이 되지 않습니다. 같은 key로 <code>prefetch</code>·
        <code>fetch</code>·<code>ensure</code>를 써서 페이지를 준비하세요.
      </p>

      <p>
        누적되는 목록은 <code>client.infiniteQuery</code>를 쓰세요 —{' '}
        <a href="#/ko/api/sync">Sync API</a>를 보세요. 무한 페이지는 읽기
        전용이고, <code>infiniteView</code>는 고정 key만 받습니다.{' '}
        <code>liveView</code>의 무한 조회판은 없습니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - view가 표시하는
          공유 기준
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> - 활성{' '}
          <code>liveView</code>는 첫 로드를 스스로 한다
        </li>
        <li>
          <a href="#/ko/guide/custom-connector">커스텀 커넥터</a> - view
          바인딩이 요구하는 <code>Watch</code> 모양
        </li>
      </ul>
    </div>
  );
});
