import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const DraftLifetimeKo = mount(() => {
  return () => (
    <div>
      <h1>수명과 정리</h1>

      <p>
        draft는 값이 아니라 세션입니다. 변경이 언제 충돌이 되는지 알려 주기 위해
        원본을 구독하고, 그 구독은 세션을 닫을 때까지 살아 있습니다.
      </p>

      <h2>연 것은 닫는다</h2>

      <p>
        draft를 끝내는 것은 <code>discard()</code>뿐입니다. 단지 도달할 수 없게
        된 draft는 여전히 구독 중입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const editor = createDraft(source.address);

// ... 화면이 사용한다 ...

editor.discard(); // 들고 있던 구독을 놓는다`}
      />

      <p>화면을 소유한 쪽과 짝지으세요. 컴포넌트라면 언마운트 경로입니다.</p>

      <CodeBlock
        language="typescript"
        code={`// React
useEffect(() => {
  const editor = createDraft(source.address);
  setEditor(editor);
  return () => editor.discard();
}, []);`}
      />

      <h2>반복해서 열고 닫기</h2>

      <p>
        draft를 열고 닫는 것은 아무것도 남기지 않습니다. 원본을 고치면 아직 열려
        있는 draft만 깨어납니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`for (let i = 0; i < 20; i += 1) {
  const editor = createDraft(source.address);
  editor.ref.city.value = 'Busan';
  editor.discard();
}

// 이후의 원본 쓰기는 저 스무 개 중 아무것도 깨우지 않는다
source.address.city.value = 'Daejeon';`}
      />

      <p>
        대신 두 개를 열어 두면 정확히 둘이 깨어납니다. 0과 2의 이 차이가 누수를
        드러내는 방식입니다.
      </p>

      <h2>draft는 원본의 자식이 아니다</h2>

      <p>
        draft를 폐기해도 원본에 닿지 않고, 원본이 draft를 소유하지도 않습니다.
        둘 사이에 참조 카운트 같은 것은 없습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.apply();   // 원본이 이것을 가진다
editor.discard(); // draft가 사라진 뒤에도 그대로 가진다`}
      />

      <p>
        반대도 성립합니다. 놓아 두면 draft는 자기를 만든 화면보다 오래 삽니다.
        핸들을 누군가 들고 있는 한, 마법사 UI가 1단계에서 분기해 3단계에서
        적용할 수 있습니다.
      </p>

      <h2>폐기한 뒤</h2>

      <p>
        모든 접근이 명시적으로 거절합니다. 읽을 &quot;마지막으로 알려진 값&quot;
        같은 것은 없습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`editor.discard();

editor.ref.city.value;  // throws: This draft has been discarded.
editor.changes();       // throws: This draft has been discarded.
editor.isDirty();       // throws: This draft has been discarded.
editor.apply();         // throws: This draft has been discarded.`}
      />

      <p>
        세션이 끝난 뒤에도 UI가 렌더될 수 있다면, 자체 플래그를 두고 draft
        읽기를 멈추세요. 행마다 예외를 잡지 마세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`let open = true;

function close() {
  editor.discard();
  open = false;
}

// 렌더
open ? <DraftRows draft={editor} /> : <p>Closed</p>;`}
      />

      <h2>draft가 내주는 구독</h2>

      <p>
        <code>draft.watch</code>와 <code>draft.watchStatus</code>는 스토어의{' '}
        <code>watch</code>와 같은 규칙을 따릅니다. 콜백은 첫 실행에서 의존성을
        수집하고, 자기 구독이 끝날 때까지 계속 실행됩니다. draft를 폐기하면 전부
        한 번에 끝납니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const controller = new AbortController();

editor.watchStatus(status => {
  // 건네받은 것을 읽어야 한다. 읽지 않으면 아무것도 등록되지 않는다
  void status.dirty.value;
  void status.conflicts.value;
  return controller.signal;
});

controller.abort(); // 이 구독 하나만 끝낸다
editor.discard();   // draft가 든 것을 전부 끝낸다`}
      />

      <p>
        콜백 안의 읽기에 주목하세요. 아무것도 읽지 않는 콜백은 의존성을 등록하지
        않아 다시는 깨어나지 않습니다 — 그리고 영원히 0을 답합니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/draft-apply">apply · reset · discard</a> - 세션
          끝내기
        </li>
        <li>
          <a href="#/ko/guide/subscription">구독</a> - 코어의 의존성과 정리
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">관측</a> - sync client가 아직
          무엇을 들고 있는지 세기
        </li>
      </ul>
    </div>
  );
});
