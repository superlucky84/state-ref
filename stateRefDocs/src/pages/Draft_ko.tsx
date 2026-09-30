import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftKo = mount(() => {
  return () => (
    <div>
      <h1>createDraft</h1>

      <p>
        draft는 기존 ref 위에 만드는 독립된 로컬 편집 세션입니다. 편집은{' '}
        <code>apply()</code>를 부를 때까지 draft 안에 머물기 때문에, 폼이
        완성되지 않은 입력을 들고 있어도 화면의 다른 곳은 그것을 보지 않습니다.
      </p>

      <p>
        별도 진입점입니다. <code>state-ref</code>만 import하면 로드되지
        않습니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();

const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

editor.isDirty();  // true
editor.changes();  // city: Seoul -> Busan
editor.apply();    // 원본에 로컬로 병합한다. 서버와 통신하지 않는다
editor.discard();  // 구독을 놓고 세션을 닫는다`}
      />

      <h2>분기한 시점의 값에서 시작한다</h2>

      <p>
        draft는 <em>분기하는 순간의</em> 원본 값을 복사하고, 원본이 가진 변경
        기록은 물려받지 않습니다. 이미 dirty한 원본에서 분기해도 draft는
        깨끗합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// 원본이 이미 저장되지 않은 편집을 들고 있다
source.address.city.value = 'Busan';

const editor = createDraft(source.address);

editor.ref.city.value;     // 'Busan'  — 분기 지점
editor.isDirty();          // false    — 부모의 기록이 아니다
editor.changes();          // []

editor.ref.city.value = 'Daejeon';
editor.changes()[0].before; // { exists: true, value: 'Busan' }`}
      />

      <p>
        그 변경의 <code>before</code>는 원본이 출발했던 <code>'Seoul'</code>이
        아니라 <code>'Busan'</code>입니다. 변경은 원본의 출발점이 아니라{' '}
        <strong>draft가 갈라져 나온 지점</strong>을 기준으로 합니다.
      </p>

      <h2>한 원본 위의 두 draft</h2>

      <p>
        draft끼리는 서로 독립입니다. 하나를 편집해도 다른 하나에 닿지 않고,
        적용하기 전까지는 원본에도 닿지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = createDraft(source.address);
const b = createDraft(source.address);

a.ref.city.value = 'Daejeon';

a.ref.city.value;            // 'Daejeon'
b.ref.city.value;            // 그대로
source.address.city.value;   // 그대로`}
      />

      <h2>draft 읽기</h2>

      <p>
        <code>draft.ref</code>는 draft 자신의 값을 읽고 씁니다.{' '}
        <code>draft.watch</code>는 UI 커넥터가 받는 <code>Watch</code>와 같은
        모양이라, draft를 컴포넌트에 연결하는 방법이 스토어와 똑같습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// 커넥터와 함께, 예를 들어 React
const useDraft = connectReact(editor.watch);

function CityField() {
  const state = useDraft();
  return (
    <input
      value={state.city.value}
      onChange={event => (state.city.value = event.target.value)}
    />
  );
}`}
      />

      <h2>상태</h2>

      <p>
        <code>draft.status</code>는 <code>dirty</code>·<code>conflicts</code>·
        <code>version</code>을 반응형 값으로 냅니다. 편집 중인 payload에는 어떤
        필드도 더하지 않습니다. <code>draft.watchStatus</code>는 그것의 구독
        가능한 형태입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.status.dirty.value;      // boolean
editor.status.conflicts.value;  // number
editor.status.version.value;    // number

// 또는 구독
editor.watchStatus(status => {
  console.log(status.dirty.value, status.conflicts.value);
});

// 같은 값을 한 번만 읽기
editor.isDirty();
editor.version();`}
      />

      <h2>변경 목록</h2>

      <p>
        <code>changes()</code>는 편집한 경로마다 한 줄을 냅니다. 각 줄은 분기
        시점의 값(<code>before</code>), 지금 draft가 든 값(<code>after</code>),
        그리고 <strong>지금 이 순간 원본이 든 값</strong>(<code>source</code>)을
        함께 들고 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const [change] = editor.changes();

change.path;      // ['city']
change.before;    // { exists: true, value: 'Seoul' }
change.after;     // { exists: true, value: 'Busan' }
change.source;    // { exists: true, value: 'Seoul' }  — 현재
change.conflict;  // false
change.id;        // 이 세션 안에서 안정적이다
change.version;   // 이 줄을 읽은 draft 버전`}
      />

      <p>
        <code>before</code>·<code>after</code>·<code>source</code>가 값 자체가
        아니라 <code>{'{ exists, value }'}</code>인 이유는, &quot;경로가
        없다&quot;와 &quot;경로가 <code>undefined</code>를 담고 있다&quot;가
        서로 다른 사실이기 때문입니다.
      </p>

      <h2>배열은 한 필드다</h2>

      <p>
        원소 하나를 고쳐도 변경은 <strong>배열 전체</strong>로 기록됩니다.
        인덱스는 위치이지 정체성이 아니므로, 원본이 재정렬되면 인덱스 단위의
        변경은 조용히 다른 항목에 내려앉게 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source);
editor.ref.contacts[0].name.value = 'Kim';

editor.changes()[0].path; // ['contacts'] — ['contacts','0','name']이 아니다`}
      />

      <h2>draft가 받는 것</h2>

      <p>
        draft는 순환 없는 평범한 데이터와 조밀한 배열을 편집합니다. 다음은 각각
        자기 오류로 거절합니다.
      </p>

      <ul>
        <li>
          함수, <code>Date</code>, <code>Map</code> 같은 평범하지 않은 값
        </li>
        <li>코어가 예약한 payload 키</li>
        <li>
          draft의 <code>.value</code>로 얻은 객체를 직접 변형하는 것 — 복사해서
          쓰세요
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        UMD 빌드는 동반 스크립트입니다. <code>state-ref.umd.js</code>를 먼저
        불러오고 그다음 <code>state-ref.draft.umd.js</code>를 불러온 뒤{' '}
        <code>stateRefDraft</code> 전역을 씁니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/draft-apply">apply · reset · discard</a> - 편집을
          원본으로 옮기고 세션을 끝내기
        </li>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a> - 원본이 밑에서
          움직였을 때
        </li>
        <li>
          <a href="#/ko/guide/draft-lifetime">수명과 정리</a> - 구독과 정리
        </li>
        <li>
          <a href="#/ko/api/draft">Draft API</a> - 전체 타입 표면
        </li>
      </ul>
    </div>
  );
});
