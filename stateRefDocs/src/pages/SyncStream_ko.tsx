import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncStreamKo = mount(() => {
  return () => (
    <div>
      <h1>스트리밍</h1>

      <p>
        WebSocket, NDJSON 응답, 진행 상황 피드처럼 서버가 데이터를 밀어주는
        경우에는 <code>streamQuery</code>를 씁니다. push source를 일반 query에
        연결하며, 응답이 다 끝난 뒤가 아니라{' '}
        <strong>메시지가 도착할 때마다 화면에 반영됩니다</strong>.
      </p>

      <p>
        스트림은 query를 대체하지 않습니다. <code>queryFn</code>과 같은 캐시
        항목에 값을 쓰므로, 스트리밍 중인 query에서도 <code>ref</code>,{' '}
        <code>watch</code>, <code>display</code>, 로컬 편집, mutation이 그대로
        동작합니다.
      </p>

      <h2>기본 사용법</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient, ndjsonMessages, streamQuery } from '@stateref/sync';

type Report = { rows: string[] };
type Row = { row: string };

const client = createSyncClient();
const report = client.query<Report>({
  queryKey: ['report'],
  queryFn: () => ({ rows: [] }),
});

const stream = streamQuery<Report, Row>(report, {
  // 시작할 때, 그리고 refetch()할 때마다 호출된다
  source: () => ndjsonMessages<Row>(signal => fetch('/report', { signal })),
  // 메시지 하나를 다음 서버 값으로 접는다
  reduce: (current, message) => ({
    rows: [...(current?.rows ?? []), message.row],
  }),
});

report.ref.rows.value; // 줄이 올 때마다 늘어난다
stream.status.value;   // { state: 'open', received: 3, queued: 0, buffered: 0, error: null }`}
      />

      <p>
        먼저 <code>load()</code>를 부를 필요는 없습니다. 첫 메시지가 빈 query를
        로드합니다. 이미 로드되거나 hydrate된 query라면 그 값을 지우지 않고 그
        위에 이어서 접습니다.
      </p>

      <h2>source</h2>

      <p>
        <code>source</code>는 호출될 때마다 새 연결을 여는 함수입니다. async
        iterable이나 구독 함수 <code>(sink, signal) =&gt; teardown</code>을
        반환합니다. 흔한 경우는 기성 source 두 개로 해결됩니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`// NDJSON: 한 줄에 JSON 값 하나
ndjsonMessages<Row>(signal => fetch('/report', { signal })) // 요청을 늦게 시작
ndjsonMessages<Row>(response)                               // 이미 받은 Response나 body

// WebSocket: 기본은 JSON.parse, 직접 파서를 줄 수도 있다
webSocketMessages<Row>(new WebSocket('wss://example.com/report'))
webSocketMessages<Row>(socket, data => decode(data))

// 그 밖의 것: async iterable ...
source: () => myAsyncGenerator()
// ... 또는 구독 함수
source: () => (sink, signal) => {
  const off = feed.on('item', item => sink.next(item));
  feed.on('end', () => sink.complete());
  feed.on('fail', error => sink.error(error));
  return off; // 정리 함수
}`}
      />

      <ul>
        <li>
          <code>ndjsonMessages</code>는 네트워크 chunk 경계에서 잘린 줄(멀티바이트
          문자 포함)을 이어 붙이고, 빈 줄은 건너뛰며, 줄바꿈 없는 마지막 줄도
          읽습니다. 잘못된 JSON은 run을 실패시킵니다. 스트림을 닫으면 요청을
          중단하고 reader를 취소합니다.
        </li>
        <li>
          <code>webSocketMessages</code>는 정상 종료(clean close)면 run을
          완료하고, 그 외의 종료면 실패시킵니다. 스트림을 닫으면 소켓도
          닫습니다.
        </li>
      </ul>

      <h2>reduce는 리듀서다</h2>

      <p>
        라이브러리는 메시지를 해석하지 않습니다. 메시지 형식은 서버가 정하고,
        그 메시지가 데이터를 어떻게 바꾸는지는 <code>reduce</code>가 정합니다.
        Redux 리듀서와 같은 모양입니다. 서버가 이벤트를 보낸다면 type으로
        나눕니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { todos: Todo[] };
type Action =
  | { type: 'added'; todo: Todo }
  | { type: 'removed'; id: string }
  | { type: 'snapshot'; state: State };

streamQuery<State, Action>(todos, {
  source: () => webSocketMessages<Action>(new WebSocket(url)),
  reduce: (state, action) => {
    const list = state?.todos ?? [];
    switch (action.type) {
      case 'added':
        return { todos: [...list, action.todo] };
      case 'removed':
        return { todos: list.filter(t => t.id !== action.id) };
      case 'snapshot':
        return action.state;
      default:
        return state!; // 이 클라이언트가 아직 모르는 액션은 무시
    }
  },
});`}
      />

      <ul>
        <li>
          <code>current</code>는 <strong>서버 값</strong>이며, 사용자의 로컬
          편집은 들어 있지 않습니다. 첫 로드 전에는 <code>undefined</code>입니다.
          같은 값을 <code>query.serverValue()</code>로 직접 읽을 수 있습니다.
        </li>
        <li>
          편집 가능한 데이터에서 <code>current</code>는 freeze되어 있습니다.{' '}
          <strong>새 값을 반환하세요.</strong>{' '}
          <code>current.rows.push()</code>는 예외를 던집니다.
        </li>
        <li>
          TypeScript 타입은 런타임에 검사되지 않습니다. 서버 형식이 바뀔 수
          있다면 WebSocket의 <code>parse</code> 함수나 <code>reduce</code>{' '}
          안에서 검증하세요.
        </li>
      </ul>

      <h2>편집과 저장</h2>

      <p>
        메시지마다 <code>acceptServer</code>로 반영되므로, 스트림은 서버 읽기가
        연달아 일어나는 것과 같게 동작합니다.
      </p>

      <ul>
        <li>
          사용자의 로컬 편집은 새 서버 값 위에 계속 유지됩니다. 사용자가 고치는
          필드를 서버가 바꾸면 <code>status.conflicts</code>에 나타납니다.{' '}
          <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>를 보세요.
        </li>
        <li>
          query에 연결된 저장이 진행 중이면 메시지는{' '}
          <strong>보류됩니다</strong>(<code>stream.status.queued</code>). 저장이
          끝나면 저장이 수용한 값 위에 순서대로 접힙니다. 버려지는 메시지도,
          저장을 앞지르는 메시지도 없습니다.
        </li>
      </ul>

      <h2>다시 시작하기: refetch(&#123; mode &#125;)</h2>

      <p>
        한 run 안에서는 항상 메시지마다 화면이 바뀝니다. 모드는 스트림을{' '}
        <strong>다시 시작할 때</strong>만 의미가 있고, 이전 run이 화면에 남긴
        데이터를 어떻게 할지 정합니다. 호출할 때마다 고릅니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const stream = streamQuery(report, {
  source,
  reduce,
  initialValue: () => ({ rows: [] }), // reset / replace가 시작하는 값
});

stream.refetch();                    // 'reset' (기본값)
stream.refetch({ mode: 'append' });  // 예: 재연결 뒤
stream.refetch({ mode: 'replace' }); // 예: "새로고침" 버튼`}
      />

      <table>
        <thead>
          <tr>
            <th>모드</th>
            <th>새 run이 시작될 때</th>
            <th>메시지가 도착하는 동안</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>reset</code>
            </td>
            <td>
              <code>initialValue</code>를 바로 보여 줌(없으면 새 첫 메시지까지
              이전 데이터 유지)
            </td>
            <td>처음부터 메시지마다 갱신</td>
          </tr>
          <tr>
            <td>
              <code>append</code>
            </td>
            <td>보이는 데이터 유지</td>
            <td>그 뒤에 메시지마다 이어 붙임</td>
          </tr>
          <tr>
            <td>
              <code>replace</code>
            </td>
            <td>보이는 데이터 유지</td>
            <td>
              화면 밖에서 접다가(<code>status.buffered</code>) run이 끝나면 한
              번에 교체; 실패한 run은 버림
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>query.refetch()</code>는 다른 것입니다. <code>queryFn</code>을 한
        번 실행할 뿐 스트림에는 손대지 않습니다.
      </p>

      <h2>화면 갱신 throttle</h2>

      <p>
        메시지가 몰려오면 렌더가 너무 잦아질 수 있습니다.{' '}
        <code>throttle</code>로 반영 빈도를 제한합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`streamQuery(report, { source, reduce, throttle: 100 });     // 최대 100ms에 한 번
streamQuery(report, { source, reduce, throttle: 'frame' }); // 최대 애니메이션 프레임마다 한 번`}
      />

      <ul>
        <li>
          <strong>메시지는 하나도 버리지 않습니다.</strong> 모든 메시지가{' '}
          <code>reduce</code>를 거치고, 반영만 묶입니다. 한 구간에 50개가 오면
          50개가 모두 담긴 화면 갱신이 한 번 일어납니다.
        </li>
        <li>
          run의 첫 메시지와 한동안 조용하다가 온 첫 메시지는 바로 보입니다.
        </li>
        <li>
          완료, 오류, <code>close()</code> 때는 기다리지 않고 남은 것을
          반영합니다.
        </li>
        <li>
          <code>&apos;frame&apos;</code>은 <code>requestAnimationFrame</code>을
          쓰고, 없는 환경(서버, 테스트)에서는 16ms 타이머로 대신합니다.
          브라우저는 백그라운드 탭에서 애니메이션 프레임을 멈추므로, 탭이 다시
          보일 때까지 반영이 미뤄집니다.
        </li>
      </ul>

      <h2>상태, 오류, 정리</h2>

      <CodeBlock
        language="typescript"
        code={`stream.status.value
// {
//   state: 'open' | 'complete' | 'error' | 'closed',
//   received: number, // 이번 run에서 query에 반영된 메시지 수
//   queued: number,   // 연결된 저장이 끝나기를 기다리며 보류 중인 수
//   buffered: number, // 'replace' run이 화면 밖에서 접은 수
//   error: unknown,
// }

streamQuery(report, {
  source,
  reduce,
  onError: error => toast(String(error)), // 실패한 run마다 한 번
});

stream.close(); // 완전히 멈춤: 요청을 중단하고 소켓을 닫는다`}
      />

      <ul>
        <li>
          source 오류, source가 던진 예외, <code>reduce</code>가 던진 예외는 run을{' '}
          <code>state: &apos;error&apos;</code>로 끝냅니다.{' '}
          <strong>실패 전에 도착한 것은 남습니다.</strong>
        </li>
        <li>
          자동 재연결은 없습니다. 필요하면 <code>onError</code>나 상태 관찰에서{' '}
          <code>stream.refetch()</code>를 부르세요.
        </li>
        <li>
          <code>status</code>는 읽기 전용입니다. <code>stream.watchStatus</code>
          를 다른 Watch처럼 커넥터에 넘기면 됩니다.
        </li>
      </ul>

      <h2>컴포넌트에서</h2>

      <p>
        스트림으로만 채우는 query는 첫 메시지 전까지 데이터가 없고,{' '}
        <code>ref</code>/<code>watch</code>는 로드 전에 예외를 던집니다. 대신{' '}
        <a href="#/ko/guide/sync-view">display</a>를 연결하세요. 처음부터 읽을
        수 있고 스트림으로 들어오는 값을 모두 따라갑니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReact, connectReactView } from '@stateref/connect-react';

// display는 첫 메시지 전에도 동작한다; report.watch는 그때까지 예외를 던진다
const useReport = connectReactView(report.watchDisplay);
const useStreamStatus = connectReact(stream.watchStatus);

function ReportView() {
  const rows = useReport().data.value?.rows ?? [];
  const { state, received } = useStreamStatus().value;
  return (
    <>
      <p>{state === 'open' ? \`받는 중… (\${received})\` : state}</p>
      <ul>{rows.map(row => <li key={row}>{row}</li>)}</ul>
    </>
  );
}

// 화면이 사라질 때 stream.close()를 부른다`}
      />

      <h2>제한</h2>

      <ul>
        <li>
          자동 재연결·backoff, Server-Sent Events 전용 helper, 메시지 순서
          재정렬·중복 제거는 없습니다. SSE가 필요하면 <code>EventSource</code>를
          구독 함수로 감싸세요.
        </li>
        <li>
          <a href="#/ko/guide/sync-view">반응형 key</a> query에 연결한 스트림은
          key가 바뀌어도 다시 열리지 않습니다. key마다 스트림을 따로 여세요.
        </li>
        <li>
          자동 재조회(focus, reconnect, polling)는 <code>queryFn</code>을
          실행하며 스트림을 재시작하지 않습니다. 스트림 메시지는 진행 중이던
          이전 읽기를 배제합니다.
        </li>
      </ul>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-query">query와 resource</a> - 스트림이 값을
          쓰는 query
        </li>
        <li>
          <a href="#/ko/guide/sync-lifecycle">편집의 생애</a> - 새 서버 값 위에
          편집이 유지되는 방식
        </li>
        <li>
          <a href="#/ko/api/sync">Sync API</a> - <code>streamQuery</code>와{' '}
          <code>QueryStreamOptions</code>
        </li>
      </ul>
    </div>
  );
});
