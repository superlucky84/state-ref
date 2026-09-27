import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiPluginKo = mount(() => {
  return () => (
    <div>
      <h1>Plugin API</h1>

      <p>
        <code>state-ref/plugin</code>은 <code>state-ref/draft</code>와{' '}
        <code>@stateref/sync</code>가 서 있는 이음새입니다. UI가 쓰는 구독
        시스템을 거치지 않고, 패키지가 ref를 들여다보고(어디를 가리키는지, 쓸 수
        있는지, 지금 무엇을 읽는지) 쓰기를 관측할 수 있게 해 줍니다.
      </p>

      <p>
        <strong>먼저 이 전제를 읽으세요.</strong> 소스는 이것을{' '}
        <em>&quot;draft와 sync 패키지를 위한 선택적 통합 표면&quot;</em>이자{' '}
        <em>
          &quot;ref에 대한 내부적이고 opt-in인 뷰 … 패키지 루트 API가 아님&quot;
        </em>
        이라고 적고 있습니다. 여기에 문서화하는 이유는 <code>state-ref</code>{' '}
        위에 자기 층을 만드는 것이 이것이 존재하는 이유이기 때문이지, 루트
        export와 같은 안정성 약속을 진다는 뜻이 아닙니다. 상태를 읽고 쓰기만
        한다면 이 문서는 필요 없습니다.
      </p>

      <h2>connectRef</h2>

      <CodeBlock
        language="typescript"
        code={`import { connectRef } from 'state-ref/plugin';

function connectRef<T>(source: StateRefStore<T>): RefConnection<T>

type RefConnection<T> = {
  readonly owner: object;
  readonly parent: RefPathCursor;
  readonly segment: string | symbol | null;
  readonly editable: boolean;
  readonly read: () => T | undefined;
  readonly exists: () => boolean;
};`}
      />

      <p>
        ref를 자기 자신에 대한 설명으로 바꿉니다. ref가 아닌 것에는{' '}
        <code>Expected a state-ref reference.</code>로 던집니다.
      </p>

      <ul>
        <li>
          <code>owner</code> - 이 ref가 속한 루트 객체. 같은 스토어의 두 ref는
          이것을 공유한다.
        </li>
        <li>
          <code>parent</code> / <code>segment</code> - ref가 가리키는 위치. 루트
          ref면 <code>segment</code>는 <code>null</code>이다.
        </li>
        <li>
          <code>editable</code> - 이 ref로 쓰기가 허용되는가. 어떤 층이든 편집을
          제공하기 전에 확인해야 하는 값이고, readonly 조회의 ref는{' '}
          <code>false</code>로 답한다.
        </li>
        <li>
          <code>read()</code> - 현재 값, 또는 <code>undefined</code>.
        </li>
        <li>
          <code>exists()</code> - 그 경로가 존재하는가. <code>read()</code>와
          따로 있는 이유는 <code>undefined</code>를 담은 경로와 사라진 경로가
          다른 사실이기 때문입니다 — <code>DraftValue</code>가 지고 있는 것과
          같은 구별입니다.
        </li>
      </ul>

      <h2>observeRef</h2>

      <CodeBlock
        language="typescript"
        code={`import { observeRef } from 'state-ref/plugin';

function observeRef<T>(
  source: StateRefStore<T>,
  callback: (value: T | undefined) => void
): () => void`}
      />

      <p>
        <strong>그 경로만</strong> 듣고 해제 함수를 돌려줍니다. 값이 실제로
        바뀌었는지는 평범한 runner가 계속 판단하므로 — 조상이 가지 전체를 교체한
        경우까지 포함해서 — 지나가기만 한 무관한 쓰기로는 콜백이 깨지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const stop = observeRef(source.address.city, value => {
  console.log('city is now', value);
});

stop();`}
      />

      <h2>쓰기 관측</h2>

      <p>
        스토어는 성공한 모든 ref setter를, 구독자가 돌기 전에 보고할 수
        있습니다. 이 훅은 스토어를 만들 때 설치합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const store = create(
  { address: { city: 'Seoul' } },
  {
    // 인자 타입은 추론된다. 모양은 아래를 보라
    onWrite: write => {
      write.parent;   // 경로 커서 — 코어의 안정적인 path node
      write.segment;  // 쓰인 키, 루트 쓰기면 null
      write.before;
      write.after;
    },
  }
);`}
      />

      <p>
        커서가 배열이 아니라 코어의 path node인 이유는, 평범한 setter가 아무도
        읽지 않는 경로를 만드는 비용을 내지 않게 하기 위해서입니다. 쓰기를
        기록하는 층이 경로를 직접 만들어 씁니다.
      </p>

      <p>모양:</p>

      <CodeBlock
        language="typescript"
        code={`type RefWrite = Readonly<{
  parent: RefPathCursor;
  segment: string | symbol | null;
  before: unknown;
  after: unknown;
}>;

type RefPathCursor = {
  readonly segment: string | symbol;
  readonly parent: RefPathCursor | null;
};`}
      />

      <p>
        이 경계에 대해 나중에 발견하기보다 먼저 알아 두는 편이 나은 것이 둘
        있습니다. <code>onWrite</code>는 <code>create</code>의 옵션인데,{' '}
        <code>create</code>는 코어 소스에서 문서화된 API가 아니라 내부 이음새로
        표시돼 있습니다(<code>createStore</code>는 받지 않습니다). 그리고{' '}
        <code>RefWrite</code> 자체가 <code>state-ref</code>에서도{' '}
        <code>state-ref/plugin</code>에서도 <strong>export되지 않으므로</strong>
        , 콜백 인자는 추론으로 타입이 붙습니다. 이것이 지금 이 표면의 정직한
        상태입니다.
      </p>

      <h2>guardWriteObserver</h2>

      <CodeBlock
        language="typescript"
        code={`import { guardWriteObserver } from 'state-ref/plugin';

const onWrite = guardWriteObserver(write => {
  // ...
});`}
      />

      <p>
        관측자를 감싸서, <em>그 안에서</em> 시도한 쓰기를{' '}
        <code>A write observer cannot write to its own store.</code>로
        거절합니다. 중첩된 setter가 바깥 트리를 발행해 덮어쓰기 전에 막습니다.
        관측자가 되돌려 쓸 수 있는 코드를 실행한다면 쓰세요.
      </p>

      <h2>createWriteJournal</h2>

      <CodeBlock
        language="typescript"
        code={`import { createWriteJournal } from 'state-ref/plugin';

const journal = createWriteJournal();

const store = create(value, { onWrite: journal.onWrite });

journal.version();      // 쓰기마다 올라간다
journal.entries();      // 지금까지의 user 쓰기 복사본
journal.lastOrigin();
journal.clearEntries(); // 자기 변경 모델로 접어 넣은 뒤에

journal.runAs('accepted-server-result', () => {
  ref.address.city.value = fromServer; // version은 올리고 항목은 남기지 않는다
});`}
      />

      <p>
        소유자 하나를 위한 opt-in 편집 로그입니다. 핵심은 <code>origin</code>{' '}
        구별입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type WriteOrigin =
  | 'user'
  | 'source-refresh'
  | 'accepted-server-result'
  | 'rollback';

type JournalEntry = Readonly<{ version: number; write: RefWrite }>;`}
      />

      <p>
        <code>'user'</code> 쓰기만 항목이 됩니다. 기준 갱신, 수용된 서버 결과,
        롤백은 모두 <strong>version은 올리지만</strong> 사용자의 변경이 아닙니다
        — 그리고 그것이 resource가 &quot;당신이 편집했다&quot;와 &quot;서버가
        움직였다&quot;를 가르는 방법입니다. <code>runAs</code>로는 동기 setter를
        감싸세요. 비동기 요청이나 promise 체인이 아닙니다.
      </p>

      <p>
        관측자는 모든 검증이 끝난 뒤에야 자기 비공개 배열을 바꾸고, 사용자
        코드를 절대 호출하지 않습니다.
      </p>

      <h2>어디에 쓰이는가</h2>

      <p>
        <a href="#/ko/guide/draft">createDraft</a>가 원본의 경로, 편집 가능
        여부, 현재 값을 알고 편집을 <code>changes()</code>로 기록하는 데 씁니다.{' '}
        <a href="#/ko/guide/sync">@stateref/sync</a>는 같은 표면으로 한 ref
        위에서 서버 기준과 로컬 편집을 갈라 둡니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/custom-connector">커스텀 커넥터</a> - UI
          라이브러리를 연동하는 평범한 방법
        </li>
        <li>
          <a href="#/ko/api/draft">Draft API</a>
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">관측</a> - 이 위에 선 sync 쪽
          경계
        </li>
      </ul>
    </div>
  );
});
