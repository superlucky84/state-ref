import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncFormKo = mount(() => {
  return () => (
    <div>
      <h1>폼 저장 레시피</h1>

      <p>
        서버 데이터를 폼으로 고치고 저장하는 흐름을 처음부터 끝까지 보여 줍니다.
        앞 장들의 부품 — 조회, <a href="#/ko/guide/draft">draft</a>,{' '}
        <a href="#/ko/guide/sync-lifecycle">capture와 수용</a> — 을 한 화면에
        조립한 것입니다.
      </p>

      <h2>먼저 고를 것: draft를 쓸 것인가</h2>

      <table>
        <thead>
          <tr>
            <th />
            <th>조회 ref를 직접 편집</th>
            <th>조회 위에 draft</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>입력이 보이는 곳</td>
            <td>같은 key를 보는 모든 화면에 즉시</td>
            <td>
              <code>apply()</code> 전까지 이 폼 안에서만
            </td>
          </tr>
          <tr>
            <td>취소</td>
            <td>필드마다 서버 값을 다시 써야 한다</td>
            <td>
              <code>reset()</code> 한 번
            </td>
          </tr>
          <tr>
            <td>충돌 해소</td>
            <td>
              <code>resolve()</code> 없음 —{' '}
              <a href="#/ko/guide/sync-lifecycle">편집의 생애</a> 8절의 방법
            </td>
            <td>
              draft의 <code>resolve()</code>
            </td>
          </tr>
          <tr>
            <td>부분 저장</td>
            <td>
              필드 단위 <code>capture(ids)</code>
            </td>
            <td>
              draft 하나가 조회에 <strong>한 줄</strong>로 들어간다(아래)
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        폼이 그 데이터를 고치는 유일한 곳이고 입력이 바로 다른 화면에 보여도
        괜찮다면 ref를 직접 편집하는 쪽이 단순합니다 —{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>의 예제가 그
        방식입니다. 이 장은 &quot;저장을 누르기 전에는 아무 데도 반영하지
        않는&quot; 폼, 즉 draft를 쓰는 쪽을 다룹니다.
      </p>

      <h2>1. 열기</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const client = createSyncClient();
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});
await account.load();

// 폼이 고치는 가장 좁은 하위 트리에 연다
const form = createDraft(account.ref.address);`}
      />

      <h3>draft는 좁게 연다</h3>

      <p>
        <code>apply()</code>는 draft 루트에 값을 한 번에 씁니다. 그래서 조회
        쪽에는 draft를 연 경로의 편집 <strong>한 줄</strong>로 기록됩니다.
        위처럼 <code>account.ref.address</code>에 열면 줄의 경로는{' '}
        <code>['address']</code>이고, 조회 루트(<code>account.ref</code>)에 열면{' '}
        <code>[]</code>입니다.
      </p>

      <p>
        루트에 연 draft를 적용해 두면, 저장하기 전에 서버가{' '}
        <strong>폼과 무관한 필드</strong>를 바꿔도 충돌이 됩니다. 루트 줄이 모든
        필드를 덮고 있기 때문입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const form = createDraft(account.ref); // 루트
form.ref.address.city.value = '부산';
form.apply();

// 서버가 name만 'Kim' -> 'Choi'로 바꿨다
await account.refetch();
account.changes(); // [{ path: [], conflict: true, ... }]
account.ref.name.value; // 'Kim' — 새 이름이 보이지 않는다`}
      />

      <p>
        <code>address</code>에 열었다면 같은 상황에서 줄은{' '}
        <code>['address']</code>이고 충돌이 아니며, <code>name</code>은{' '}
        <code>'Choi'</code>로 갱신됩니다. 폼이 여러 하위 트리를 고친다면
        트리마다 draft를 하나씩 여는 것도 방법입니다.
      </p>

      <h2>2. 입력에 연결하기</h2>

      <CodeBlock
        language="typescript"
        code={`import { connectReact } from '@stateref/connect-react';

const useForm = connectReact(form.watch);
const useFormStatus = connectReact(form.watchStatus);

function AddressForm() {
  const address = useForm();
  const status = useFormStatus();
  return (
    <>
      <input
        value={address.city.value}
        onChange={event => (address.city.value = event.target.value)}
      />
      <button disabled={!status.dirty.value} onClick={save}>저장</button>
      <button onClick={() => form.reset()}>취소</button>
    </>
  );
}`}
      />

      <p>
        입력은 draft에만 쓰이므로 같은 계정을 보여 주는 다른 화면은 저장 전까지
        바뀌지 않습니다. 취소는 <code>reset()</code> 한 번이고 폼은 열린 채로
        남습니다.
      </p>

      <h2>3. 저장하기</h2>

      <CodeBlock
        language="typescript"
        code={`const saveAddress = client.mutation({
  mutationFn: (input: { address: Address }, { signal }) =>
    api.saveAddress(input, { signal }),
});

async function save() {
  // (1) draft -> 조회. 충돌이 있으면 여기서 멈춘다
  const applied = form.apply();
  if (!applied.ok) return applied; // { ok: false, reason: 'conflict' } 등

  // (2) 조회의 편집을 고정하고 곧바로 보낸다 — 사이에 await가 없다
  const submission = account.capture();
  return saveAddress.run(
    { address: submission.value.address },
    { links: [{ query: account, submission, accept: { kind: 'refetch' } }] }
  );
}`}
      />

      <ul>
        <li>
          <code>apply()</code>와 <code>capture()</code> 사이에 await가 없으므로
          제출이 낡을 틈이 없습니다(
          <a href="#/ko/guide/sync-lifecycle">낡은 제출</a>).
        </li>
        <li>
          DTO는 <code>submission.value</code>에서 만듭니다. 조회에 기록된 줄이{' '}
          <code>['address']</code>이므로 <code>address</code> 전체를 보내는 것이
          그 줄과 정직하게 맞습니다.
        </li>
        <li>
          <code>{"{ kind: 'refetch' }"}</code>는 쓰기 뒤 서버를 다시 읽어 새
          기준으로 삼습니다. 서버가 값을 정규화하는 API라면 이쪽이 안전합니다.
        </li>
      </ul>

      <p>
        성공하면 조회와 draft가 모두 깨끗해지고, 폼은 저장된 값을 보여 줍니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const result = await save(); // { kind: 'success', ... }
account.isDirty();      // false
form.isDirty();         // false
form.ref.city.value;    // '부산'`}
      />

      <h2>4. 저장 전에 서버가 움직였다면</h2>

      <p>
        폼이 열려 있는 동안 READ가 같은 필드를 바꿔 오면 draft의 줄이 충돌이
        되고 <code>apply()</code>가 멈춥니다. 세 값을 그대로 보여 주고 고르게
        하면 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`form.ref.city.value = '부산';
await account.refetch(); // 서버는 이제 '광주'

form.changes();
// [{ path: ['city'], before: '서울', after: '부산', source: '광주', conflict: true, ... }]
form.apply(); // { ok: false, reason: 'conflict' }

// 사용자가 '내 값 유지'를 골랐다
form.resolve(form.changes()[0], 'draft'); // { ok: true }
form.apply();                             // { ok: true, applied: 1 }
// 이어서 capture + run`}
      />

      <p>
        &quot;서버 값 받기&quot;를 골랐다면 <code>'source'</code>로 해소합니다.
        그 편집은 사라지고 폼은 <code>'광주'</code>를 보여 줍니다. 해소는 들고
        있던 줄을 무효로 만들므로 매번 <code>changes()</code>를 다시 읽으세요(
        <a href="#/ko/guide/draft-conflicts">충돌과 해소</a>).
      </p>

      <h2>5. 결과 처리</h2>

      <CodeBlock
        language="typescript"
        code={`const result = await save();
if ('ok' in result) {
  // apply가 멈췄다 — 4절
} else {
  switch (result.kind) {
    case 'success':
      break;
    case 'rejected':
      // 서버가 거절했다(MutationRejectedError). 편집은 조회에 남아 있다
      showError(result.error);
      break;
    case 'unknown':
    case 'sync-error':
      // unknown: 적용됐는지 모른다 / sync-error: 적용됐지만 수용이 실패했다
      // 어느 쪽이든 다시 보내지 말고 다시 읽어 화해한다
      await account.refetch();
      break;
  }
}`}
      />

      <ul>
        <li>
          <code>rejected</code>: <code>onReject</code>를 생략하면{' '}
          <code>'keep'</code>이라 입력이 사라지지 않습니다. 사용자가 고쳐 다시
          저장할 수 있습니다.
        </li>
        <li>
          <code>unknown</code>·<code>sync-error</code>: 편집은 남고{' '}
          <code>status.unconfirmed</code>가 true입니다. 성공한 READ가 그것을
          풉니다. 자동으로 다시 보내는 일은 없습니다.
        </li>
      </ul>

      <h2>6. 닫기</h2>

      <p>
        draft는 원본을 구독하므로 폼을 닫을 때 <code>discard()</code>로
        놓습니다. 조회 핸들도 그것을 연 쪽이 <code>dispose()</code>합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`useEffect(() => () => {
  form.discard();
  account.dispose();
}, []);`}
      />

      <h2>readonly 조회에는 쓸 수 없다</h2>

      <p>
        <code>editable: false</code>로 연 조회 위에도 draft를 열고 편집할 수는
        있지만 <code>apply()</code>가{' '}
        <code>{"{ ok: false, reason: 'readonly' }"}</code>로 답합니다. 저장할
        폼이라면 조회를 편집 가능하게 여세요.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-lifecycle">편집의 생애</a> - capture, 낡음,
          결과별 동작
        </li>
        <li>
          <a href="#/ko/guide/draft-apply">apply · reset · discard</a>
        </li>
        <li>
          <a href="#/ko/guide/draft-conflicts">충돌과 해소</a>
        </li>
        <li>
          <a href="#/ko/guide/react">React</a> - 다른 커넥터도 같은 모양
        </li>
      </ul>
    </div>
  );
});
