import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftConflictsKo = mount(() => {
  return () => (
    <div>
      <h1>충돌과 해소</h1>

      <p>
        draft가 편집을 들고 있는 동안에도 원본은 계속 살아 있습니다. draft가
        편집한 경로 밑에서 원본이 움직이면 그 변경은 <strong>충돌</strong>이
        됩니다. 한 필드에 답이 둘 생긴 것이고, draft는 대신 골라 주지 않습니다.
      </p>

      <h2>충돌은 apply 전에 보인다</h2>

      <p>
        알아내기 위해 <code>apply()</code>를 부를 필요가 없습니다. 원본이
        움직이는 순간 변경 줄이 바뀝니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

// 다른 곳에서 원본을 움직인다
source.address.city.value = 'Gwangju';

const [change] = editor.changes();
change.before;   // { exists: true, value: 'Seoul' }   — 분기 지점
change.after;    // { exists: true, value: 'Busan' }   — draft가 든 값
change.source;   // { exists: true, value: 'Gwangju' } — 지금 원본이 든 값
change.conflict; // true

editor.status.conflicts.value; // 1
editor.apply();                // { ok: false, reason: 'conflict' }`}
      />

      <p>
        이 세 값이 이야기의 전부입니다. draft가 어디서 시작했고, 어디로 갔고,
        원본이 어디로 갔는가. 화면은 그대로 그려 주고 사람이 고르게 하면 됩니다.
      </p>

      <h2>해소하기</h2>

      <p>
        <code>resolve(change, choice)</code>가 변경 하나를 정리합니다. choice는
        어느 쪽을 택할지입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// 원본 값을 받아들이고 이 편집을 버린다
editor.resolve(editor.changes()[0], 'source');
// { ok: true }
editor.ref.city.value; // 'Gwangju'
editor.isDirty();      // false — 편집이 사라졌다
editor.changes();      // []

// 또는 draft 값을 지키고, 편집을 새 원본 위로 다시 얹는다
editor.resolve(editor.changes()[0], 'draft');
// { ok: true }  — 변경은 남고, 더는 충돌이 아니다`}
      />

      <p>
        <code>'source'</code>는 편집을 제거합니다. <code>'draft'</code>는 편집을
        지키면서 그 <code>before</code>를 원본의 현재 값으로 옮기므로, 그 줄은
        충돌이 아니게 되고 이후의 <code>apply()</code>가 통과할 수 있습니다.
      </p>

      <h2>낡은 줄은 거절한다</h2>

      <p>
        <code>DraftChange</code>는 특정 draft 버전에서 찍은 스냅숏입니다. 읽은
        뒤 draft가 움직였다면 그 낡은 줄로 해소하는 것은 거절됩니다 — 이미 바뀐
        질문에 답하는 셈이기 때문입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const row = editor.changes()[0];

editor.ref.zip.value = 999;   // draft 버전이 올라간다

editor.resolve(row, 'draft'); // { ok: false, reason: 'stale' }

// 다시 읽으면 된다
editor.resolve(editor.changes()[0], 'draft'); // { ok: true }`}
      />

      <p>
        <em>다른</em> draft의 줄도 같은 방식으로 거절됩니다. 각 변경은 불투명한{' '}
        <code>owner</code>를 들고 있고, 한 draft는 다른 draft의 것을 절대 받지
        않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = createDraft(source.address);
const b = createDraft(source.address);

a.resolve(b.changes()[0], 'draft'); // { ok: false, reason: 'stale' }`}
      />

      <h3>나머지 두 거절</h3>

      <ul>
        <li>
          <code>missing-source</code> - draft가 분기한 경로가 통째로 사라져서,
          고를 원본 쪽이 없다.
        </li>
        <li>
          <code>boundary</code> - draft 값을 지키려면 원본의 구조가 허용하지
          않는 곳에 써야 한다.
        </li>
      </ul>

      <h2>해소 루프</h2>

      <p>
        해소는 들고 있던 줄을 무효로 만들므로, 스냅숏을 순회하지 말고 매번
        목록을 다시 읽으세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`function resolveAll(draft, choice: 'source' | 'draft') {
  for (;;) {
    const next = draft.changes().find(change => change.conflict);
    if (!next) return;

    const result = draft.resolve(next, choice);
    if (!result.ok) return result; // missing-source 또는 boundary
  }
}`}
      />

      <h2>충돌은 오류가 아니다</h2>

      <p>
        충돌은 두 편집에 대한 사실이지 실패가 아닙니다. draft는 계속 동작합니다.
        다른 필드는 그대로 편집할 수 있고, <code>apply()</code>를 막는 것은 충돌
        난 줄뿐입니다. 라이브러리가 추측하기를 거부하기 때문에 선택이 병합 전략
        옵션이 아니라 API 호출인 것입니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/draft-apply">apply · reset · discard</a> - 충돌이{' '}
          <code>apply()</code>에 하는 일
        </li>
        <li>
          <a href="#/ko/guide/draft">createDraft</a> - <code>changes()</code>{' '}
          읽기
        </li>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - 서버 기준 위의
          같은 변경 모델
        </li>
      </ul>
    </div>
  );
});
