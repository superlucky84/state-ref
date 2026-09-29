import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncLifecycleKo = mount(() => {
  return () => (
    <div>
      <h1>편집의 생애: capture에서 수용까지</h1>

      <p>
        이 장은 편집 하나를 따라갑니다. 입력해서 dirty가 되고,{' '}
        <code>capture()</code>로 고정되고, mutation으로 나가고, 결과에 따라
        지워지거나 남는 과정입니다. 다른 장에 흩어져 있던 규칙을 한 흐름으로
        모았습니다.
      </p>

      <h2>네 단어</h2>

      <table>
        <thead>
          <tr>
            <th>단어</th>
            <th>뜻</th>
            <th>어디서 보나</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>기준 (baseline)</td>
            <td>서버가 마지막으로 확인해 준 값. READ나 수용이 옮긴다</td>
            <td>
              <code>change.before</code>
            </td>
          </tr>
          <tr>
            <td>로컬 편집</td>
            <td>기준 위에 올린, 아직 서버가 모르는 값. ref에 쓰면 생긴다</td>
            <td>
              <code>changes()</code>, <code>status.dirty</code>
            </td>
          </tr>
          <tr>
            <td>제출 (submission)</td>
            <td>
              &quot;이 WRITE는 이 편집들에 대한 것이다&quot;라는 호출자의 진술.{' '}
              <code>capture()</code>가 만든다
            </td>
            <td>
              <code>link.submission</code>
            </td>
          </tr>
          <tr>
            <td>수용 (acceptance)</td>
            <td>WRITE가 성공한 뒤 기준을 새 값으로 옮기는 것</td>
            <td>
              <code>link.accept</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>한눈에 보기</h2>

      <CodeBlock
        language="bash"
        code={`ref에 쓴다 ─────────────► changes()에 줄이 생긴다 (dirty)
      │
      │ capture()           값 · 변경 줄 · 버전을 얼린다
      ▼
run(input, { links: [{ query, submission, accept }] })
      │
      │ 버전이 그대로인가? ── 아니오 ─► 'Submission is stale' (WRITE 없음)
      ▼
    WRITE
      ├─ 성공 ──────────► accept에 따라 기준을 옮긴다 ─► 제출한 줄이 지워진다
      ├─ rejected ──────► onReject: 'keep' 이면 남기고, 'remove' 면 되돌린다
      ├─ unknown ───────► 편집은 남고 unconfirmed. 다시 보내지 않는다
      └─ sync-error ────► WRITE는 성공, 수용이 실패. 편집은 남고 unconfirmed`}
      />

      <h2>1. 편집</h2>

      <p>
        ref에 쓰면 편집한 경로마다 변경 줄이 하나 생기고, 쓸 때마다 resource
        버전이 하나 오릅니다. 같은 값을 다시 대입하는 것은 쓰기가 아니라서
        버전이 오르지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// 서버: { address: { city: '서울', zip: '100' }, name: 'Kim' }
await account.load();
account.version(); // 0

account.ref.address.city.value = '부산';
account.ref.name.value = 'Lee';
account.version(); // 2

account.changes();
// [
//   { id: 1, path: ['address', 'city'], before: { exists: true, value: '서울' },
//     after: { exists: true, value: '부산' }, conflict: false, ... },
//   { id: 2, path: ['name'], before: { exists: true, value: 'Kim' },
//     after: { exists: true, value: 'Lee' }, conflict: false, ... },
// ]`}
      />

      <h2>2. capture가 왜 필요한가</h2>

      <p>
        mutation에 보내는 입력(DTO)은 조회 데이터와 모양이 다를 수 있습니다. 위
        편집을 저장하는 API가 <code>{"{ city: '부산' }"}</code>만 받는다면,
        client는 그 DTO가 두 편집 중 어느 것을 저장했는지 알 방법이 없습니다.
        이름으로 맞춰 볼 수도 없고, 필드가 합쳐지거나 나뉘는 API도 흔합니다.
      </p>

      <p>
        그래서 호출자가 직접 말합니다. <code>capture()</code>가 만든 제출을
        link에 넘기는 것이 &quot;이 WRITE는 이 줄들에 대한 것이다&quot;라는
        진술입니다. client는 그 진술에 따라 성공하면 그 줄들만 지우고, 거절되면
        그 줄들만 되돌릴 수 있습니다.
      </p>

      <h2>3. capture가 얼리는 것</h2>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
submission.version; // 2 — 지금의 resource 버전
submission.value;   // { address: { city: '부산', zip: '100' }, name: 'Lee' } (얼린 복사본)
submission.changes; // 지금의 변경 줄 두 개 (얼린 복사본)`}
      />

      <ul>
        <li>
          <code>value</code>는 편집이 반영된 <strong>현재 값 전체</strong>
          입니다. DTO를 만들 때 여기서 읽으면, 캡처 뒤에 누가 ref를 고쳐도 보낼
          값이 흔들리지 않습니다.
        </li>
        <li>
          <code>changes</code>는 제출하는 줄입니다. 인자가 없으면 전부, ID
          배열을 주면 그 줄만 담습니다(아래 &quot;부분 저장&quot;).
        </li>
        <li>
          <code>version</code>은 낡음 판정에 씁니다(다음 절).
        </li>
        <li>
          편집이 없어도 capture는 성공합니다. <code>changes</code>가 빈 제출이
          됩니다.
        </li>
      </ul>

      <p>capture 자체가 거절하는 경우는 셋입니다.</p>

      <CodeBlock
        language="typescript"
        code={`account.capture([999]);   // TypeError: Unknown or repeated resource change ID.
account.capture([1, 1]);  // TypeError: Unknown or repeated resource change ID.
settings.capture();       // editable: false 조회 — TypeError: This query is readonly.`}
      />

      <h2>4. 낡은 제출</h2>

      <p>
        캡처한 뒤 <code>run</code>하기 전에 버전이 움직이면 그 제출은 낡습니다.
        link는 WRITE를 보내기 <strong>전에</strong> 거절하고{' '}
        <code>mutationFn</code>은 호출되지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
account.ref.address.zip.value = '200'; // 제출과 무관한 필드라도

save.start(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// 동기로 던진다: Error: Submission is stale. Capture the current edits again.

await save.run(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// 같은 메시지로 reject한다`}
      />

      <ul>
        <li>
          <strong>어느 필드든</strong> 편집하면 낡습니다. 판정은 경로가 아니라
          버전으로 합니다.
        </li>
        <li>
          READ가 끝나도 낡습니다. <code>refetch()</code>가 기준을 옮기면 버전이
          오릅니다.
        </li>
        <li>같은 값을 다시 대입하는 것은 낡게 하지 않습니다.</li>
      </ul>

      <p>
        그래서 capture는 <strong>보내기 직전에, 같은 동기 흐름에서</strong>{' '}
        합니다. 저장 버튼의 핸들러에서 capture하고 바로 <code>run</code>을
        부르면 됩니다. 사용자가 확인 대화상자를 보는 동안처럼 사이에 await가
        끼면, 그 뒤에 다시 capture하세요.
      </p>

      <h2>5. 쓰는 동안</h2>

      <p>
        <code>run</code>이 시작하면 그 조회의 <code>status.pending</code>이 1이
        되고, 결과가 나올 때까지 이 조회에는 다음이 적용됩니다.
      </p>

      <ul>
        <li>
          <strong>입력은 계속 받습니다.</strong> 쓰는 중에 한 편집은 제출과
          별개로 남고, 결과가 어떻든 살아남습니다.
        </li>
        <li>
          두 번째 연결 쓰기는 큐에 쌓이지 않고 거절됩니다:{' '}
          <code>A linked operation is already pending for this query.</code>
        </li>
        <li>
          <code>acceptServer()</code>도 거절됩니다:{' '}
          <code>A linked operation is pending for this query.</code>
        </li>
        <li>
          focus·reconnect·polling 같은 자동 READ가 멈춥니다. 아직 답하지 않은
          작업이 기준을 정하는 중이기 때문입니다.
        </li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = '부산';
const submission = account.capture();
const pending = save.run({ city: '부산' }, {
  links: [{ query: account, submission, accept: { kind: 'submitted' } }],
});

account.ref.address.zip.value = '999'; // 쓰는 중의 입력

await pending; // { kind: 'success', ... }
account.ref.value;  // { address: { city: '부산', zip: '999' }, ... }
account.changes();  // zip 한 줄만 남는다 (before: '100')`}
      />

      <h2>6. 결과마다 편집에 일어나는 일</h2>

      <table>
        <thead>
          <tr>
            <th>결과</th>
            <th>기준</th>
            <th>제출한 편집</th>
            <th>
              <code>unconfirmed</code>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'submitted' }"}</code>
            </td>
            <td>제출한 값으로 옮긴다</td>
            <td>지워진다</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'response' }"}</code>
            </td>
            <td>
              <code>select(응답)</code>으로 옮긴다
            </td>
            <td>
              지워진다. 서버가 값을 고쳐 보냈으면(<code>lee</code> →{' '}
              <code>LEE</code>) 고친 값이 보인다
            </td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'refetch' }"}</code>
            </td>
            <td>다시 읽은 값으로 옮긴다</td>
            <td>지워진다</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>success</code> + <code>{"{ kind: 'none' }"}</code> (생략 시
              기본)
            </td>
            <td>그대로</td>
            <td>
              <strong>남는다</strong> (dirty 유지)
            </td>
            <td>true — 다음 성공한 READ까지</td>
          </tr>
          <tr>
            <td>
              <code>rejected</code> + <code>onReject: 'keep'</code> (기본)
            </td>
            <td>그대로</td>
            <td>남는다</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>rejected</code> + <code>onReject: 'remove'</code>
            </td>
            <td>그대로</td>
            <td>쓰는 중에 다시 고치지 않은 줄만 기준 값으로 되돌린다</td>
            <td>false</td>
          </tr>
          <tr>
            <td>
              <code>unknown</code>
            </td>
            <td>그대로</td>
            <td>남는다. 다시 보내지 않는다</td>
            <td>true</td>
          </tr>
          <tr>
            <td>
              <code>sync-error</code>
            </td>
            <td>그대로. 여러 link 중 이미 수용한 link는 되돌리지 않는다</td>
            <td>남는다</td>
            <td>true</td>
          </tr>
        </tbody>
      </table>

      <p>
        어느 행이든 <strong>쓰는 중에 입력한 편집은 남습니다.</strong> 성공으로
        지워지는 것은 제출에 들어 있던 줄뿐이고, 그 뒤의 입력은 새 기준 위의
        편집으로 이어집니다.
      </p>

      <p>
        제출 없이 만들 수 있는 link도 있지만, 제출이 있어야만 뜻이 서는 조합은
        거절합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`{ query, accept: { kind: 'submitted' } } // TypeError: Submitted acceptance requires a submission.
{ query, onReject: 'remove' }             // TypeError: Removing rejected edits requires a submission.
{ query: account, submission: other.capture() } // TypeError: Submission belongs to another resource.`}
      />

      <p>
        <code>rejected</code>와 <code>unknown</code>이 어떻게 갈리는지(
        <code>MutationRejectedError</code>)와 재시도 규칙은{' '}
        <a href="#/ko/guide/sync-mutation">mutation과 link</a>에 있습니다.
      </p>

      <h2>7. 부분 저장</h2>

      <p>
        편집한 것 중 일부만 저장하는 화면이면 변경 줄의 <code>id</code>를 골라
        capture합니다. 저장하지 않은 줄은 dirty로 남습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = '부산';
account.ref.address.zip.value = '200';

const cityId = account
  .changes()
  .find(change => change.path.join('.') === 'address.city')!.id;
const submission = account.capture([cityId]);

submission.changes.map(change => change.path); // [['address', 'city']]
submission.value.address.zip;                  // '200' — value는 여전히 전체다

await saveCity.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.changes(); // zip 한 줄만 남는다`}
      />

      <p>
        <code>value</code>는 고른 줄과 상관없이 전체 값입니다. DTO에 넣는 필드와
        고른 줄을 맞추는 것은 호출자의 몫입니다 — 제출하지 않은 변경을
        제출했다고 말하면 기준이 틀어지고, 그것을 잡아 줄 장치는 없습니다.
      </p>

      <h2>8. 조회에서 난 충돌 풀기</h2>

      <p>
        편집이 남아 있는 경로에 READ가 다른 값을 들고 오면 그 줄은 충돌이
        됩니다. 화면은 여전히 로컬 값을 보여 줍니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = '부산';
await account.refetch(); // 서버는 이제 '광주'

const [change] = account.changes();
change.before;  // { exists: true, value: '광주' } — 새 기준
change.after;   // { exists: true, value: '부산' } — 로컬 값
change.conflict; // true
account.status.value.conflicts; // 1
account.ref.address.city.value;  // '부산'`}
      />

      <p>
        <a href="#/ko/guide/draft-conflicts">draft</a>와 달리 조회 핸들에는{' '}
        <code>resolve()</code>가 <strong>없습니다.</strong> 지금 있는 수단으로
        푸는 방법은 셋입니다.
      </p>

      <h3>서버 값을 받는다</h3>

      <p>
        그 경로에 새 기준 값(<code>change.before.value</code>)을 쓰면 로컬
        편집이 기준과 같아져 줄이 사라집니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`account.ref.address.city.value = change.before.value as string; // '광주'
account.isDirty();              // false
account.status.value.conflicts; // 0`}
      />

      <h3>내 값을 지킨다</h3>

      <p>
        로컬 값을 다시 쓰는 것으로는 풀리지 않습니다. 같은 값을 써도, 세 번째
        값을 써도 충돌은 그대로입니다 — 서버가 아직 모르는 값이기 때문입니다. 내
        값을 지키는 방법은 그것을 <strong>저장하는 것</strong>입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();
await save.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.isDirty();              // false
account.status.value.conflicts; // 0
account.ref.address.city.value; // '부산'`}
      />

      <p>
        <code>{"{ kind: 'refetch' }"}</code>로 수용해도 충돌은 풀립니다. 그때는
        서버가 다시 답한 값이 기준이 됩니다.
      </p>

      <h3>사람이 고르게 한다</h3>

      <p>
        두 값을 나란히 보여 주고 고르게 하려면, 위의 <code>before</code>와{' '}
        <code>after</code>를 그대로 그리고 고른 쪽에 따라 앞의 두 방법 중 하나를
        실행하면 됩니다. 편집 중인 폼이 따로 있다면 그 폼을 draft로 두는 편이
        편합니다 — draft의 <code>resolve()</code>를 그대로 쓸 수 있습니다.{' '}
        <a href="#/ko/guide/sync-form">폼 저장 레시피</a>를 보세요.
      </p>

      <p>
        이미 알고 있는 서버 값이 로컬 값과 같다면{' '}
        <code>acceptServer(value)</code>도 줄을 지웁니다. 아무것도 보내지 않고
        기준만 옮깁니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> - 결과 분류,
          재시도, <code>start()</code>
        </li>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - 변경 목록과
          rebase
        </li>
        <li>
          <a href="#/ko/guide/sync-form">폼 저장 레시피</a> - draft와 함께 쓰는
          저장 흐름
        </li>
        <li>
          <a href="#/ko/guide/sync-persistence">영속화와 SSR</a> - 제출을 재시작
          너머로 가져가기
        </li>
      </ul>
    </div>
  );
});
