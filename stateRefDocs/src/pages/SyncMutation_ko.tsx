import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncMutationKo = mount(() => {
  return () => (
    <div>
      <h1>mutation과 link</h1>

      <p>
        로컬 편집은 스스로 서버에 닿지 않습니다. 보내는 것은 명시적인
        mutation이고, 그 mutation을 조회에 <em>연결</em>하는 것이 이 쓰기가 어떤
        편집에 대한 것인지 client에 알려 주는 방법입니다.
      </p>

      <h2>고정하고 실행하기</h2>

      <p>
        mutation 입력은 조회 데이터와 전혀 다른 모양일 수 있으므로, client는
        어떤 필드를 저장했는지 추론할 수 없습니다. 제출할 편집을 실행 직전에
        고정합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const submission = account.capture();

const save = client.mutation({
  mutationFn: (input: { city: string }, { signal, idempotencyKey }) =>
    api.saveCity(input, { signal, idempotencyKey }),
});

const result = await save.run(
  { city: submission.value.address.city },
  {
    links: [
      {
        query: account,
        submission,
        accept: { kind: 'refetch' },
        onReject: 'keep',
      },
    ],
  }
);`}
      />

      <p>
        <code>capture()</code>는 이 순간의 세 가지를 얼립니다. 현재 값 전체,
        변경 줄(전부, 또는 넘긴 ID만), 그리고 resource 버전입니다. 그 뒤에{' '}
        <strong>어느 필드든</strong> 한 번 편집하거나 READ가 끝나면 버전이
        움직이고, link는 WRITE를 보내기 전에 그 제출을 거절합니다 — 일찍 말고
        늦게 고정하세요.
      </p>

      <p>
        왜 필요한지, 쓰기 뒤에 각 편집이 어떻게 되는지, 충돌은 어떻게 푸는지는{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>에 모았습니다.
      </p>

      <p>
        <code>run</code>은 <code>mutationFn</code>을 부르기 전에 입력을{' '}
        <code>structuredClone</code>으로 복제하므로, 입력은 복제 가능해야
        합니다.
      </p>

      <h2>결과 수용 방식</h2>

      <p>
        link마다 <code>accept</code> 객체로, WRITE가 성공한 뒤 새 기준을 어떻게
        정할지 고릅니다.
      </p>

      <ul>
        <li>
          <code>{"{ kind: 'refetch' }"}</code> - 쓰기 뒤 서버를 다시 읽는다
        </li>
        <li>
          <code>{"{ kind: 'response', select }"}</code> - mutation 응답을
          기준으로 매핑한다
        </li>
        <li>
          <code>{"{ kind: 'submitted' }"}</code> - 보낸 값을 새 기준으로 삼는다.
          보낸 값이 그대로 수용됐음을 서버 계약이 보장할 때만.{' '}
          <code>submission</code>이 필요하다
        </li>
        <li>
          <code>{"{ kind: 'none' }"}</code> - <code>accept</code>를 생략하면
          이것이다. 기준은 움직이지 않고, 편집은 dirty로 남고,{' '}
          <code>status.unconfirmed</code>가 성공한 READ가 올 때까지 true가 된다
        </li>
      </ul>

      <p>
        문자열(<code>'submitted'</code>)로 받는 것은 직렬화해야 하는 영속 API(
        <a href="#/ko/guide/sync-persistence">영속화와 SSR</a>의{' '}
        <code>linked.stage</code>)뿐입니다. <code>run</code>과{' '}
        <code>start</code>는 위의 객체를 받습니다.
      </p>

      <h2>연결된 결과가 될 수 있는 것</h2>

      <CodeBlock
        language="typescript"
        code={`// result.kind
'success'     // WRITE가 성공했고 수용도 끝났다
'sync-error'  // WRITE는 성공했으나 수용이나 후속 READ가 실패했다
'rejected'    // 서버가 명시적으로 거절했다 (MutationRejectedError)
'unknown'     // 전송 결과가 불확실하다`}
      />

      <p>설계할 때 신경 써야 하는 것은 뒤의 둘입니다.</p>

      <ul>
        <li>
          <strong>
            <code>unknown</code>은 편집을 지키고 절대 자동으로 재전송하지
            않습니다.
          </strong>{' '}
          서버가 쓰기를 적용했는지 client는 모릅니다. 명시적 재시도는 서버가
          지원하는 <code>idempotencyKey</code>가 필요합니다.
        </li>
        <li>
          <strong>
            <code>sync-error</code>는 새 READ나 알려진 서버 값으로 화해해야
            합니다.
          </strong>{' '}
          이미 성공한 쓰기를 다시 보내는 것으로 해결하지 마세요.
        </li>
      </ul>

      <p>
        확정된 거절은 편집을 지키거나(<code>onReject: 'keep'</code>) 바뀌지 않은
        제출 항목만 되돌릴 수 있습니다(<code>onReject: 'remove'</code>). WRITE가
        떠 있는 동안 입력한 것은 어느 쪽이든 살아남고, 옛 기준으로 되돌린 것까지
        포함합니다. 콜백 실패는 쓰기 결과를 바꾸지 않고{' '}
        <code>callbackError</code>로 보고됩니다.
      </p>

      <h2>결과가 갈리는 기준</h2>

      <p>
        client는 거절과 끊긴 연결을 스스로 구별할 수 없습니다.{' '}
        <code>rejected</code>는 <code>mutationFn</code>이{' '}
        <code>MutationRejectedError</code>를 던질 때<strong>만</strong>{' '}
        보고됩니다. 그 밖의 모든 예외와 abort는 <code>unknown</code>입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { MutationRejectedError } from '@stateref/sync';

const save = client.mutation({
  mutationFn: async (input: { name: string }, { signal }) => {
    const response = await fetch('/account', {
      method: 'PUT',
      body: JSON.stringify(input),
      signal,
    });
    if (response.status === 422) {
      // 서버가 요청을 읽고 거절했다
      throw new MutationRejectedError('name taken', await response.json());
    }
    if (!response.ok) throw new Error('HTTP ' + response.status); // -> 'unknown'
    return response.json();
  },
});

const result = await save.run({ name: 'Lee' });
if (result.kind === 'rejected') {
  (result.error as MutationRejectedError).reason; // 위의 두 번째 인자
}`}
      />

      <h2>재시도</h2>

      <p>
        mutation은 기본적으로 한 번만 시도합니다. <code>retry</code>는 실행마다
        켜는 opt-in이고 <code>idempotencyKey</code>가 필요합니다 — 없으면{' '}
        <code>run</code>이{' '}
        <code>Mutation retry requires an idempotencyKey.</code>로 거절합니다.{' '}
        <code>MutationRejectedError</code>는 재시도하지 않습니다. 서버가 이미
        답했기 때문입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`await save.run(input, {
  retry: 2,                        // 최대 3번 시도
  idempotencyKey: 'account-1-save-42',
  retryDelay: attempt => 500 * attempt,
});`}
      />

      <p>
        <code>mutationFn</code>의 두 번째 인자에는 <code>signal</code>,{' '}
        <code>operationId</code>, <code>attempt</code>,{' '}
        <code>idempotencyKey</code>가 들어 있습니다. 작업이 <code>unknown</code>
        으로 끝난 뒤에는 아무것도 그것을 다시 보내지 않습니다.
      </p>

      <h2>콜백</h2>

      <p>
        <code>onSuccess</code>, <code>onError</code>, <code>onSettled</code>는
        mutation 옵션에 둡니다. 콜백이 던져도 결과는 바뀌지 않습니다.{' '}
        <code>kind</code>는 그대로이고 그 오류는 <code>callbackError</code>로
        보고됩니다.
      </p>

      <h2>dirty와 pending은 다른 축이다</h2>

      <p>
        연결된 조회의 <code>status.pending</code>은 작업을 추적하고,{' '}
        <code>status.dirty</code>는 저장되지 않은 입력을 추적합니다. 쓰기가 떠
        있는데 필드는 깨끗할 수 있고, 아무것도 보내지 않는데 dirty일 수
        있습니다.
      </p>

      <h2>저장 중 표시하기</h2>

      <p>
        진행 상태는 두 곳에 있고, 보는 대상이 다릅니다. 둘 다 읽기 전용 ref이고{' '}
        <code>watchStatus</code>가 커넥터에 그대로 연결됩니다.
      </p>

      <table>
        <thead>
          <tr>
            <th />
            <th>
              조회의 <code>account.status</code>
            </th>
            <th>
              mutation의 <code>save.status</code>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>무엇을 보나</td>
            <td>데이터: 이 조회에 연결된 쓰기가 진행 중인가</td>
            <td>명령: 이 핸들로 보낸 작업들</td>
          </tr>
          <tr>
            <td>진행 중</td>
            <td>
              <code>pending</code> 0 또는 1 (연결 쓰기는 한 번에 하나)
            </td>
            <td>
              <code>pending</code> = 이 핸들에서 끝나지 않은 작업 수. scope를
              기다리는 작업도 센다
            </td>
          </tr>
          <tr>
            <td>link 없는 명령</td>
            <td>나타나지 않는다</td>
            <td>보인다 — 유일한 창구</td>
          </tr>
          <tr>
            <td>결과</td>
            <td>
              종류가 없다. <code>unknown</code>·<code>sync-error</code> 뒤에{' '}
              <code>unconfirmed</code>가 true가 될 뿐, <code>rejected</code>는
              흔적이 없다
            </td>
            <td>
              <code>phase</code>가 <code>'success'</code>·
              <code>'rejected'</code>·<code>'unknown'</code>·
              <code>'sync-error'</code>, <code>error</code>에 던져진 오류
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        여러 조회를 link한 작업은 각 조회의 <code>pending</code>을 따로 1로
        만듭니다. 쓰는 동안에도 입력은 계속되므로 <code>pending</code>과{' '}
        <code>dirty</code>가 함께 true인 것이 정상입니다.
      </p>

      <h3>저장 중인지는 phase가 아니라 pending으로</h3>

      <p>
        핸들의 <code>phase</code>는 <strong>가장 최근에 일어난 사건</strong>을
        따라갑니다. 작업 둘이 떠 있다가 하나가 끝나면 다른 하나가 아직 도는데도{' '}
        <code>phase</code>는 <code>'success'</code>가 됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const a = send.start(inputA);
const b = send.start(inputB);
send.status.value; // { phase: 'pending', pending: 2, operationId: 3, ... }

// a가 먼저 끝났다
send.status.value; // { phase: 'success', pending: 1, operationId: 2, ... } — b는 아직 돈다`}
      />

      <p>
        그래서 &quot;저장 중&quot;은 <code>pending.value &gt; 0</code>으로
        판정하고, <code>phase</code>와 <code>error</code>는 끝난 결과를 보여 줄
        때 씁니다. 작업 하나하나를 따로 보여야 하면 <code>start()</code>가
        돌려주는 <code>operation.status</code>를 씁니다 — 그{' '}
        <code>pending</code>은 0 또는 1이고, scope 때문에 아직 시작하지 못한
        작업도 <code>'pending'</code>입니다.
      </p>

      <h3>화면에 붙이기</h3>

      <CodeBlock
        language="typescript"
        code={`const useAccountStatus = connectReact(account.watchStatus);
const useSaveStatus = connectReact(save.watchStatus);

function SaveBar() {
  const status = useAccountStatus(); // 데이터 쪽
  const saving = useSaveStatus();    // 명령 쪽 — 결과 표시에만
  return (
    <>
      {status.pending.value > 0 && <span>저장 중…</span>}
      {status.dirty.value && <span>저장하지 않은 변경 있음</span>}
      {status.unconfirmed.value && <span>저장 여부 확인 필요</span>}
      {saving.phase.value === 'rejected' && <span>저장 거절됨</span>}
      <button disabled={status.pending.value > 0} onClick={onSave}>
        저장
      </button>
    </>
  );
}`}
      />

      <p>
        link가 하나뿐인 폼 저장이라면 저장 중 표시와 버튼 비활성화는 조회의{' '}
        <code>status</code>만으로 충분합니다. mutation의 <code>status</code>는
        거절 메시지처럼 결과 종류나 <code>error</code>가 필요할 때, 그리고 link
        없는 명령의 진행을 보일 때 더합니다.
      </p>

      <ul>
        <li>
          <code>watchStatus</code>로 본 <code>phase</code>는 한 번의 실행에서{' '}
          <code>'idle'</code> → <code>'pending'</code> → 결과 순서로 바뀝니다.
        </li>
        <li>
          낡은 제출처럼 WRITE 전에 던지는 실행은 status를 바꾸지 않습니다(
          <code>'idle'</code> 그대로).
        </li>
        <li>두 status 모두 쓸 수 없습니다. 쓰면 던집니다.</li>
      </ul>

      <h2>연결하지 않은 mutation</h2>

      <p>
        link가 없는 mutation은 독립적으로 실행되고 resource 편집을 절대 지우지
        않습니다. &quot;이 폼을 저장&quot;이 아닌 명령에 맞는 모양입니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const sendNote = client.mutation({
  mutationFn: (input: { note: string }) => api.sendNote(input),
});

await sendNote.run({ note: 'Hello' }); // link 없음, resource와 무관`}
      />

      <h2>순서</h2>

      <p>
        독립 mutation은 기본적으로 동시에 실행됩니다. 같은 <code>scope</code>{' '}
        문자열을 주면 콜백까지 포함해 시작 순서대로 실행되고, 하나가 실패해도
        다음을 막지 않습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`await Promise.all([
  sendNote.run({ note: 'first' }, { scope: 'notes' }),
  sendNote.run({ note: 'second' }, { scope: 'notes' }), // 첫째를 기다린다
]);`}
      />

      <p>
        한 조회는 <strong>연결된 작업을 한 번에 하나만</strong> 허용합니다. 같은
        조회에 두 번째 연결 쓰기는 큐에 쌓이는 것이 아니라 거절됩니다 — 앞선
        결과를 await하고 현재 편집을 다시 고정해서 순서를 만드세요.
      </p>

      <p>
        여러 조회를 묶은 link는 서버 간·조회 간 원자성을 약속하지 않습니다. 일부
        link만 화해에 실패하면 그 작업은 <code>sync-error</code>이고, 이미
        적용된 link는 되돌리지 않습니다.
      </p>

      <h2>더 세밀한 제어가 필요하면 start</h2>

      <p>
        <code>start</code>는 Promise 대신 작업 자체를 돌려줍니다. UI가 개별
        작업을 보여 주거나 취소해야 할 때 씁니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const operation = save.start(input, { links });
operation.id;                  // 작업 ID
operation.status.phase.value;  // 'pending', 끝나면 결과 kind
operation.watchStatus;         // 커넥터가 받는 Watch 모양
operation.abort();             // 'unknown'으로 끝난다
const result = await operation.result;
operation.dispose();

save.status.phase.value;       // 핸들의 가장 최근 작업
// { phase: 'idle' | 'pending' | 결과 kind, pending, operationId, error }`}
      />

      <h2>정직한 매핑은 호출자의 몫이다</h2>

      <p>
        자유 형식 DTO가 어떤 필드를 저장했는지 라이브러리는 추론할 수 없습니다.
        제출하지 않은 변경을 제출했다고 link에 말하면 기준이 틀리게 되고, 그것을
        잡아 줄 장치는 없습니다. 실제 DTO와 고정한 변경을 정직하게 대응시키세요.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-lifecycle">편집의 생애</a> -{' '}
          <code>capture()</code>가 얼리는 것과 결과마다 편집에 일어나는 일
        </li>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> -{' '}
          <code>acceptServer()</code>
        </li>
        <li>
          <a href="#/ko/guide/sync-persistence">영속화와 SSR</a> - 큐에 넣은
          명령과 영속화한 제출
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">관측</a> - 떠 있는 WRITE 보기
        </li>
      </ul>
    </div>
  );
});
