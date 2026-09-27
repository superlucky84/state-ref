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
        고정은 불변 값과 변경 스냅숏을 담습니다. <code>run</code>이 시작하기
        전에 resource가 다시 편집되면 그 고정은 <strong>낡은 것</strong>이
        됩니다 — 일찍 말고 늦게 고정하세요.
      </p>

      <p>
        <code>run</code>은 <code>mutationFn</code>을 부르기 전에 입력을{' '}
        <code>structuredClone</code>으로 복제하므로, 입력은 복제 가능해야
        합니다.
      </p>

      <h2>결과 수용 방식</h2>

      <p>link마다 새 기준을 어떻게 정할지 고릅니다.</p>

      <ul>
        <li>
          <code>{"{ kind: 'refetch' }"}</code> - 쓰기 뒤 서버를 다시 읽는다
        </li>
        <li>
          <code>{"{ kind: 'response', select }"}</code> - mutation 응답을
          기준으로 매핑한다
        </li>
        <li>
          <code>'submitted'</code> - 보낸 값이 그대로 수용됐음을 서버 계약이
          보장할 때만
        </li>
        <li>
          <code>'none'</code> - 아무것도 수용하지 않는다. 기준은 그 자리에 있다
        </li>
      </ul>

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

      <h2>dirty와 pending은 다른 축이다</h2>

      <p>
        연결된 조회의 <code>status.pending</code>은 작업을 추적하고,{' '}
        <code>status.dirty</code>는 저장되지 않은 입력을 추적합니다. 쓰기가 떠
        있는데 필드는 깨끗할 수 있고, 아무것도 보내지 않는데 dirty일 수
        있습니다.
      </p>

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
        <code>start</code>는 요청 ID, 읽기 전용 상태 ref, 결과 Promise,
        abort·dispose 메서드를 돌려줍니다. UI가 개별 작업을 보여 주거나 취소해야
        할 때 씁니다.
      </p>

      <h2>정직한 매핑은 호출자의 몫이다</h2>

      <p>
        자유 형식 DTO가 어떤 필드를 저장했는지 라이브러리는 추론할 수 없습니다.
        제출하지 않은 변경을 제출했다고 link에 말하면 기준이 틀리게 되고, 그것을
        잡아 줄 장치는 없습니다. 실제 DTO와 고정한 변경을 정직하게 대응시키세요.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> -{' '}
          <code>capture()</code>와 <code>acceptServer()</code>
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
