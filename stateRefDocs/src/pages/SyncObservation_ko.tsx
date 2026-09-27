import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncObservationKo = mount(() => {
  return () => (
    <div>
      <h1>관측</h1>

      <p>
        도구는 조회 payload를 전혀 읽지 않고도 client가 무엇을 들고 있는지 볼 수
        있습니다. 이것은 <strong>읽기 전용 메타데이터 경계</strong>이지, 다른
        라이브러리의 devtools나 플러그인 호환 API가 아닙니다.
      </p>

      <h2>캐시</h2>

      <CodeBlock
        language="typescript"
        code={`const stopObserving = client.subscribeCache(event => {
  // event.type: 'added' | 'updated' | 'removed'
  console.log(event.type, event.entry.queryKey, event.entry.status);
});

const currentCache = client.inspectCache();

stopObserving();`}
      />

      <p>
        각 항목은 <code>queryKey</code>, <code>kind</code>, 활성 핸들 수(
        <code>owners</code>), <code>status</code>를 들고 있습니다.
      </p>

      <p>
        <code>inspectCache()</code>는 <strong>현재 client만</strong> 보고합니다.
        같은 key를 든 두 client가 따로 답하고, 그래서 &quot;client별&quot;이
        가정이 아니라 확인 가능한 진술이 됩니다.
      </p>

      <h3>이벤트에 없는 것</h3>

      <p>
        조회 데이터, 로컬 편집, mutation 입력, 그리고 호출자 소유인{' '}
        <code>status.error</code> 객체는 <strong>빠져 있습니다.</strong> 관측된
        필드 목록 자체가 증거입니다. payload가 샜다면 항목의 키 집합이 눈에 띄게
        달라집니다.
      </p>

      <p>
        이벤트는 변경 시점의 메타데이터를 그대로 들고, 현재의 동기 캐시 전이가
        끝난 뒤 마이크로태스크에서 순서대로 도착합니다. listener에서 난 오류는
        조회 결과를 바꾸지 않습니다. 돌려받은 함수로 listener를 해제하세요.
      </p>

      <h2>WRITE 작업</h2>

      <CodeBlock
        language="typescript"
        code={`const stopWatching = client.subscribeMutations(event => {
  // event.type: 'started' | 'updated' | 'settled'
  console.log(event.entry.operationId, event.entry.phase, event.entry.linkedKeys);
});

const running = client.inspectMutations();

stopWatching();`}
      />

      <p>
        <code>inspectMutations()</code>는 <strong>아직 종료되지 않은</strong>{' '}
        작업만 시작 순서대로 나열합니다.
      </p>

      <ul>
        <li>
          여기의 <code>phase</code>는 진단용이고{' '}
          <code>MutationStatus.phase</code>와 다릅니다. <code>queued</code>는 그
          작업이 자기 <code>scope</code>를 기다리는 중이라는 뜻입니다 — 아직
          나가지 않았습니다.
        </li>
        <li>
          <code>updated</code> 이벤트는 <code>queued</code> →{' '}
          <code>pending</code> 전이와 재시도 <code>attempt</code>마다 옵니다.
        </li>
        <li>
          <code>settled</code> 이벤트는 마지막 스냅숏을 들고 오고,{' '}
          <strong>그 뒤 client는 그 작업을 버립니다</strong> — 이력이 필요하다면
          직접 보관하세요.
        </li>
        <li>
          pending이 되기 전에 던진 작업(예: 낡은 제출)은 이벤트를 전혀 내지
          않습니다.
        </li>
      </ul>

      <p>
        입력, 응답, 호출자 소유 오류 객체, <code>idempotencyKey</code> 값은 빠져
        있습니다. <code>idempotent</code>는 키가 주어졌는지 <em>여부</em>만 알려
        줍니다.
      </p>

      <h3>success phase는 재전송 허가가 아니다</h3>

      <p>
        <code>success</code> phase를 관측하는 것은 진단 신호일 뿐,{' '}
        <code>unknown</code>이나 <code>sync-error</code> 작업을 다시 보낼 근거가
        절대 아닙니다. 그것들은{' '}
        <a href="#/ko/guide/sync-mutation">mutation과 link</a>에 적힌 명시적
        화해가 필요합니다.
      </p>

      <h2>보는 것과 보이는 것을 분리하라</h2>

      <p>
        패널이 시험 대상인 바로 그 핸들로 자기를 다시 그린다면, 그 핸들을 놓는
        순간 패널이 얼어붙습니다 — 그리고 얼어붙은 숫자는 결과처럼 보입니다.
        다시 그리는 구독과 관측 대상 구독을 따로 두세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`// 앱 수명 동안 살아 있고, 다시 그리기만 한다
const offRepaint = client.subscribeCache(() => repaint());

// "관측 해제" 버튼이 놓는 쪽이자, 패널이 세는 쪽
let offObserved = client.subscribeCache(event => {
  seen += 1;
});`}
      />

      <p>
        이렇게 나누면 &quot;해제한 뒤로 이벤트가 없다&quot;가{' '}
        <em>그 listener에 대한</em> 주장이 됩니다. 같은 흐름의 다른 listener는
        표를 계속 갱신하고 있기 때문입니다.
      </p>

      <h2>owners 0은 &quot;캐시에서 사라짐&quot;이 아니다</h2>

      <p>
        어떤 key의 마지막 핸들을 놓으면 <code>owners</code>가 0이 되지만, 그
        항목은 GC나 <code>client.remove()</code> 전까지 캐시에 남습니다.{' '}
        <code>client.size()</code>는 움직이지 않습니다. 서로 다른 사실이고, 둘을
        섞는 도구는 있지도 않은 누수를 보고하게 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`client.remove(['account', 1]); // boolean: 무언가 붙잡고 있으면 거절한다`}
      />

      <p>
        <code>remove()</code>는 맨 불리언을 답합니다. 항목이 유지되는 이유 —
        owners, dirty, unconfirmed, 진행 중 status — 는 앱이{' '}
        <code>inspectCache()</code>와 조회 상태로 직접 조합합니다.
      </p>

      <h2>아무것도 읽지 않는 콜백은 아무것도 등록하지 않는다</h2>

      <p>
        계측에 쓰는 모든 <code>watch</code>에 해당합니다. 건네받은 상태를 읽지
        않는 콜백은 의존성을 수집하지 않고, 다시 깨어나지 않으며, 영원히 0을
        보고합니다. 0을 믿기 전에 그 계측기가 1까지 셀 수 있는지 확인하세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.watchStatus(status => {
  void status.dirty.value; // 읽어야 한다. 아니면 아무것도 등록되지 않는다
  notices += 1;
});`}
      />

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - phase의 뜻
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> - environment
          listener와 polling 타이머
        </li>
        <li>
          <a href="#/ko/api/plugin">Plugin API</a> - 이것이 서 있는 코어 쪽
          이음새
        </li>
      </ul>
    </div>
  );
});
