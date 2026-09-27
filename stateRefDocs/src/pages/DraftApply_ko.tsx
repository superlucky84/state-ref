import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftApplyKo = mount(() => {
  return () => (
    <div>
      <h1>apply · reset · discard</h1>

      <p>
        draft가 끝나는 방법은 셋입니다. 편집을 원본으로 옮기거나(
        <code>apply</code>), 편집을 버리되 세션은 열어 두거나(<code>reset</code>
        ), 세션을 닫거나(<code>discard</code>).
      </p>

      <h2>apply</h2>

      <p>
        <code>apply()</code>는 편집한 경로들을 원본의 <strong>최신</strong> 값에
        병합하고, 예외를 던지는 대신 결과 객체를 답합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

const result = editor.apply();
// { ok: true, applied: 1 }

source.address.value; // { city: 'Busan', zip: 100 }`}
      />

      <p>
        로컬 병합입니다. 어디로도 보내지 않습니다 — draft는 서버가 있는지조차
        모릅니다.
      </p>

      <h3>성공한 뒤</h3>

      <p>
        세션은 열린 채로 rebase합니다. 적용된 편집은 <code>changes()</code>에서
        사라지고 draft는 다시 깨끗해집니다. 계속 편집할 수 있습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();      // { ok: true, applied: 1 }

editor.changes();    // []
editor.isDirty();    // false
editor.ref.city.value; // 'Busan' — 이제 원본과 같다`}
      />

      <h3>적용할 것이 없을 때</h3>

      <p>
        깨끗한 draft는 성공으로 답하고 0을 보고합니다. 오류가 아니라, 옮길 것이
        없었을 뿐입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`createDraft(source.address).apply(); // { ok: true, applied: 0 }`}
      />

      <h3>거절할 때</h3>

      <p>
        거절은 <code>reason</code>을 들고 오고 아무것도 바꾸지 않습니다. 원본은
        있던 그대로 남습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const result = editor.apply();

if (!result.ok) {
  switch (result.reason) {
    case 'conflict':
      // 경로는 아직 있지만, draft가 분기한 값을 더는 들고 있지 않다
      // — 충돌 문서를 보라
      break;
    case 'missing-source':
      // draft가 분기한 경로 자체가 사라졌다
      break;
    case 'invalid-source':
      // 원본 ref로는 쓸 수 없다
      break;
    case 'readonly':
      // 원본이 모든 쓰기를 거절한다 — 예: readonly sync 조회
      break;
  }
}`}
      />

      <p>
        실제로 만나게 되는 것은 <code>conflict</code>와{' '}
        <code>missing-source</code> 둘이고, 그 경계는{' '}
        <strong>경로가 아직 살아 있는가</strong>입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// draft 밑에서 값이 바뀌었다 -> conflict
source.address.city.value = 'Gwangju';
editor.apply(); // { ok: false, reason: 'conflict' }

// 자식 draft 밑에서 부모가 사라졌다 -> missing-source
const room = createDraft(source.office.room);
room.ref.value = '999';
source.office.value = null;
room.apply(); // { ok: false, reason: 'missing-source' }`}
      />

      <p>
        타입 교체는 missing-source가 아니라 충돌입니다. 경로는 살아 있고, 다른
        종류의 것을 담고 있을 뿐입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`source.office.room.value = ['301']; // string -> string[]
room.apply(); // { ok: false, reason: 'conflict' }`}
      />

      <p>
        <code>readonly</code>는 평범한 스토어에서는 나오지 않습니다. 원본이
        쓰기를 거절하는 ref일 때 나오고, 실제로는{' '}
        <a href="#/ko/guide/sync-query">@stateref/sync</a>에서{' '}
        <code>editable: false</code>로 연 조회를 뜻합니다. 그런 원본도 분기하고
        편집할 수는 있고, <code>apply()</code>만 거절합니다.
      </p>

      <h3>apply는 원자적이다</h3>

      <p>
        편집한 모든 경로가 한 패스에 쓰이고, 검사는 원본에 닿기{' '}
        <strong>전에</strong> 끝납니다. 거절이 절반만 적용된 상태를 남기는 일은
        없습니다.
      </p>

      <h2>reset</h2>

      <p>
        <code>reset()</code>은 로컬 편집을 버리고 세션은 열어 둡니다. draft는
        원본의 현재 값으로 돌아갑니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.ref.city.value = 'Busan';
editor.isDirty(); // true

editor.reset();

editor.ref.city.value; // 'Seoul' — 원본으로 되돌아왔다
editor.isDirty();      // false
editor.changes();      // []

// 계속 쓸 수 있다
editor.ref.city.value = 'Daejeon';`}
      />

      <p>
        폼의 &quot;취소&quot; 버튼이 원하는 동작이 이것입니다. 입력은 사라지고,
        폼은 열려 있습니다.
      </p>

      <h2>discard</h2>

      <p>
        <code>discard()</code>는 세션을 끝내고 draft가 들고 있던 구독을
        놓습니다. 이미 적용된 것을 되돌리지는 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();   // 원본이 이제 'Busan'을 든다
editor.discard();

source.address.city.value; // 'Busan' — discard는 undo가 아니다`}
      />

      <p>
        폐기한 뒤에는 모든 접근이 낡은 값을 돌려주는 대신 명시적으로 거절합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.ref.city.value = 'X'; // throws: This draft has been discarded.
editor.changes();            // throws: This draft has been discarded.`}
      />

      <p>
        이 거절은 의도된 것입니다. 폐기한 draft가 계속 답한다면, 아무도 듣지
        않는 세션에 컴포넌트가 계속 쓰게 됩니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a> - 충돌을 읽고
          해소하기
        </li>
        <li>
          <a href="#/ko/guide/draft-lifetime">수명과 정리</a> - draft가 무엇을
          들고 언제 놓는가
        </li>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> -{' '}
          <code>readonly</code>가 나오는 곳
        </li>
      </ul>
    </div>
  );
});
