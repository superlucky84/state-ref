import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const ApiDraftKo = mount(() => {
  return () => (
    <div>
      <h1>Draft API</h1>

      <p>
        <code>state-ref/draft</code>가 내보내는 전부입니다. 설명은{' '}
        <a href="#/ko/guide/draft">createDraft</a>를 보세요.
      </p>

      <h2>createDraft</h2>

      <CodeBlock
        language="typescript"
        code={`function createDraft<T>(source: StateRefStore<T>): Draft<T>`}
      />

      <p>
        <code>source</code> 위에 독립된 로컬 편집 세션을 열고, 호출 시점의 그
        값에서 시작합니다. source는 스토어 전체 ref일 수도, 그 아래 아무 자식
        ref일 수도 있습니다.
      </p>

      <h2>Draft</h2>

      <CodeBlock
        language="typescript"
        code={`type Draft<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<DraftStatus>;
  watchStatus: Watch<DraftStatus>;
  isDirty: () => boolean;
  changes: () => readonly DraftChange[];
  version: () => number;
  apply: () => DraftApplyResult;
  resolve: (
    change: DraftChange,
    choice: 'source' | 'draft'
  ) => DraftResolveResult;
  reset: () => void;
  discard: () => void;
}>`}
      />

      <ul>
        <li>
          <code>ref</code> - draft 자신의 값을 읽고 쓴다.
        </li>
        <li>
          <code>watch</code> / <code>watchStatus</code> - UI 커넥터가 받는{' '}
          <code>Watch</code> 모양.
        </li>
        <li>
          <code>status</code> - payload에 필드를 더하지 않고 내는 반응형{' '}
          <code>dirty</code>·<code>conflicts</code>·<code>version</code>.
        </li>
        <li>
          <code>reset()</code> - 로컬 편집을 버리고 세션은 열어 둔다.
        </li>
        <li>
          <code>discard()</code> - 세션을 끝내고 구독을 놓는다. 이후의 모든
          접근은 <code>This draft has been discarded.</code>로 던진다.
        </li>
      </ul>

      <h2>DraftStatus</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftStatus = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
}>`}
      />

      <h2>DraftValue</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftValue = Readonly<{ exists: boolean; value: unknown }>`}
      />

      <p>
        맨 값이 아니라 감싼 형태인 이유는, &quot;경로가 없다&quot;와
        &quot;경로가 <code>undefined</code>를 담고 있다&quot;를 구별하기
        위해서입니다.
      </p>

      <h2>DraftChange</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftChange = Readonly<{
  /** 불투명한 정체성. 다른 draft의 변경은 여기서 절대 받지 않는다. */
  owner: object;
  id: number;
  version: number;
  path: readonly (string | number)[];
  before: DraftValue;   // 분기 시점의 값
  after: DraftValue;    // draft가 지금 든 값
  source: DraftValue;   // 원본이 지금 든 값
  conflict: boolean;
}>`}
      />

      <p>
        편집한 경로마다 한 줄입니다. 배열은 하나의 원자적 필드로 추적되므로
        원소를 고치면 배열의 변경으로 기록됩니다.
      </p>

      <h2>DraftApplyResult</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftApplyResult =
  | Readonly<{ ok: true; applied: number }>
  | Readonly<{
      ok: false;
      reason: 'readonly' | 'missing-source' | 'invalid-source' | 'conflict';
    }>`}
      />

      <p>
        거절은 아무것도 바꾸지 않습니다. 검사 순서는 원본 경로가 사라졌거나 쓸
        수 없는 경우, 그다음 <code>readonly</code>, 그다음 충돌입니다.
      </p>

      <ul>
        <li>
          <code>conflict</code> - 경로는 아직 있지만 draft가 분기한 값을 더는
          들고 있지 않다. 타입 교체도 여기에 포함된다.
        </li>
        <li>
          <code>missing-source</code> - 경로 자체가 사라졌다.
        </li>
        <li>
          <code>invalid-source</code> - 원본 ref로는 쓸 수 없다.
        </li>
        <li>
          <code>readonly</code> - 원본이 모든 쓰기를 거절한다. 실제로는{' '}
          <code>editable: false</code>로 연 조회.
        </li>
        <li>
          <code>applied</code> - 쓰인 경로 수. 깨끗한 draft는{' '}
          <code>{'{ ok: true, applied: 0 }'}</code>으로 답한다.
        </li>
      </ul>

      <h2>DraftResolveResult</h2>

      <CodeBlock
        language="typescript"
        code={`type DraftResolveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'stale' | 'missing-source' | 'boundary' }>`}
      />

      <ul>
        <li>
          <code>stale</code> - 그 변경이 다른 draft의 것이거나, 줄을 읽은 뒤
          draft 버전이 움직였다. <code>changes()</code>를 다시 읽으세요.
        </li>
        <li>
          <code>missing-source</code> - 고를 원본 쪽이 남아 있지 않다.
        </li>
        <li>
          <code>boundary</code> - draft 값을 지키려면 원본의 구조가 허용하지
          않는 곳에 써야 한다.
        </li>
      </ul>

      <h2>UMD</h2>

      <p>
        <code>state-ref.umd.js</code>를 <code>state-ref.draft.umd.js</code>보다
        먼저 불러온 뒤 <code>stateRefDraft</code> 전역을 쓰세요.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/draft">createDraft</a> - 가이드
        </li>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a>
        </li>
        <li>
          <a href="#/ko/api/sync">Sync API</a> - 서버 기준 위의 같은 변경 모델
        </li>
      </ul>
    </div>
  );
});
