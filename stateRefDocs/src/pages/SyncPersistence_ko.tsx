import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncPersistenceKo = mount(() => {
  return () => (
    <div>
      <h1>영속화와 SSR</h1>

      <p>
        여기에는 네 가지 저장 이야기가 있고, 일부러 하나의 기능으로 묶지
        않았습니다. SSR 캐시 전송, 깨끗한 기준 스냅숏, 로컬 편집 복구 스냅숏,
        오프라인 명령 큐. 각각 다른 질문에 답하고, 각각{' '}
        <strong>자기 저장 키와 단일 작성자</strong>를 원합니다.
      </p>

      <h2>SSR 캐시 전송</h2>

      <p>
        서로 다른 두 client 사이에는 <strong>종료되고 깨끗한</strong> 서버
        기준만 옮깁니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`const server = createSyncClient({ ssr: true });
const source = server.query(options);
await source.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot); // 조회 핸들을 만들기 전에
const restored = browser.query(options);`}
      />

      <p>
        스냅숏은 조회 key, 서버 데이터, 신선도 시각, 무효화, 편집 가능 여부를
        보존합니다. 데이터는 JSON 호환이어야 합니다.
      </p>

      <p>
        <code>dehydrate()</code>는 로컬 편집, 진행 중인 READ나 연결 WRITE,
        확인되지 않은 WRITE 결과를 조용히 버리는 대신{' '}
        <strong>거절합니다.</strong> 그 거절이 핵심입니다. 저장되지 않은 편집을
        조용히 잃는 스냅숏은 스냅숏이 없는 것보다 나쁩니다.
      </p>

      <p>
        <code>status.unconfirmed</code>는 unknown WRITE 결과나 실패한 사후 화해
        이후, 성공한 READ나 수용된 알려진 서버 값이 나올 때까지 true로 남습니다.
        그런 항목은 GC를 거쳐도 유지됩니다.
      </p>

      <p>
        이것은 캐시 전송입니다. 로컬 편집 영속화가 <strong>아니고</strong>{' '}
        오프라인 mutation 복구도 <strong>아닙니다.</strong>
      </p>

      <h2>깨끗한 기준 스냅숏</h2>

      <p>
        저장과 복원은 명시적인 작업이고, 복원은 비어 있는 새 client를
        요구합니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { saveSyncSnapshot, restoreSyncSnapshot } from '@stateref/sync';

const options = { key: 'account-baseline', buster: 'api-v1', maxAge: 60_000 };

await saveSyncSnapshot(client, localStorage, options);

const restored = createSyncClient();
await restoreSyncSnapshot(restored, localStorage, options);`}
      />

      <ul>
        <li>
          <code>saveSyncSnapshot</code>은 dirty resource, 진행 중 READ, 연결
          WRITE, 확인되지 않은 기준을 거절합니다.
        </li>
        <li>
          만료됐거나 buster가 다른 스냅숏은{' '}
          <strong>저장된 데이터를 지우지 않고 무시</strong>합니다.
        </li>
        <li>
          형식이 깨진 스냅숏은 client를 바꾸기 <em>전에</em> 던집니다.
        </li>
        <li>
          <code>localStorage</code>는 예시일 뿐이고 <code>SyncStorage</code>는
          비동기 메서드도 받습니다. 키는 현재 사용자와 데이터 파티션 범위로
          한정하세요.
        </li>
      </ul>

      <h2>로컬 복구 스냅숏</h2>

      <p>
        로컬 편집과 확인되지 않은 기준을 지키려면 별도의 schema 2 복구 스냅숏을
        쓰세요. 서버 기준, 표시 값, 변경 ID, 충돌 출처를 담습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import {
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';

const localOptions = { key: 'account-local', buster: 'api-v1', maxAge: 60_000 };

await saveLocalSyncSnapshot(client, localStorage, localOptions);

const recovered = createSyncClient();
await restoreLocalSyncSnapshot(recovered, localStorage, localOptions);`}
      />

      <p>
        복원은 READ도 WRITE도 시작하지 않습니다. 조회 함수와 함께 조회 핸들을
        다시 만드세요. 이후의 READ가 복원된 편집을 평범한 충돌 규칙으로
        rebase합니다. 확인되지 않은 WRITE는 성공한 READ나 명시적인 알려진 서버
        값이 나올 때까지 그대로 남습니다.
      </p>

      <p>
        저장된 로컬 스냅숏에는 진행 중이던 mutation의 DTO나 제출 기록이{' '}
        <strong>없으므로</strong>, 연결 WRITE를 재개할 수 없습니다.
      </p>

      <h2>영속화한 연결 제출</h2>

      <p>
        저장 도중의 재시작을 견디려면 DTO와 복구 스냅숏을 자기 키 아래에 함께
        두세요.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { openPersistedLinkedMutation } from '@stateref/sync';

const linked = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
  isOnline: () => navigator.onLine,
});

await linked.stage(client, {
  id: 'city-42',
  input: { city: account.ref.address.city.value },
  idempotencyKey: 'city-42',
  links: [
    {
      query: account,
      ids: account
        .changes()
        .filter(change => change.path.join('.') === 'address.city')
        .map(change => change.id),
      accept: 'submitted',
    },
    { query: preferences, accept: 'refetch', onReject: 'remove' },
  ],
});

// 오프라인이면 null. 핸들은 staged key와 맞아야 하며 순서는 상관없다
const outcome = await linked.send(client, [account, preferences], save);`}
      />

      <p>
        <code>ids</code>는 변경 줄 ID입니다 — <code>capture(ids)</code>가 받는
        것과 같습니다. <code>stage</code>가 대신 capture하고, <code>ids</code>가
        없는 link는 현재의 모든 줄을 제출합니다. 수용 이름이 문자열(
        <code>'submitted'</code>)인 것에 주의하세요. 이 API는 그것을 직렬화하고,{' '}
        <code>mutation.run</code>은 <code>{"{ kind: 'submitted' }"}</code>를
        받습니다. 제출이 무엇이고 언제 낡는지는{' '}
        <a href="#/ko/guide/sync-lifecycle">편집의 생애</a>를 보세요.
      </p>

      <p>
        <code>send</code>는 모든 link를 먼저 다시 확인하고, 하나라도 바뀌었으면
        WRITE를 시작하지 않습니다. <code>mutationFn</code>을 부르기{' '}
        <em>전에</em> <code>inFlight</code> 표시와 확인되지 않은 복구 스냅숏을
        씁니다. 그 표시 쓰기가 실패하면 WRITE 자체가 일어나지 않습니다.
      </p>

      <p>
        <strong>
          재시작하면 <code>inFlight</code> 기록은 <code>unknown</code>이 됩니다.
        </strong>{' '}
        <code>discard()</code>를 부르기 전에 서버와 대조해 화해하세요. 절대
        자동으로 재생되지 않습니다.
      </p>

      <p>
        각 link는 직렬화 가능한 <code>none</code>·<code>submitted</code>·
        <code>refetch</code> 수용 정책과 자기 거절 정책을 들고 있습니다.{' '}
        <code>response.select</code>는 함수가 필요하므로 그 수용은 여전히 직접{' '}
        <code>mutation.run</code>을 요구합니다.
      </p>

      <h3>checkpoint</h3>

      <p>
        <code>checkpoint: true</code>로 열면 WRITE가 도는 <em>동안</em> 한
        편집까지 지속시킵니다. 로컬 변경마다 스냅숏을 갱신하고, 몰아치는 변경은
        마지막 한 번의 쓰기로 합쳐지며, checkpoint가 실패해도 이전 스냅숏이 남고
        WRITE는 취소되지 않습니다. 변경마다 저장소 쓰기가 한 번씩 드니까 기본은
        꺼져 있습니다.
      </p>

      <h2>오프라인 명령 큐</h2>

      <p>
        독립 명령은 서버가 지원하는 idempotency 키와 함께 JSON DTO를 큐에
        넣습니다.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { openPersistedMutationQueue } from '@stateref/sync';

const send = client.mutation({
  mutationFn: (input: { note: string }, { idempotencyKey }) =>
    api.sendNote(input, { idempotencyKey }),
});

const queue = await openPersistedMutationQueue({
  storage: localStorage,
  key: 'pending-notes',
  buster: 'api-v1',
  maxAge: 24 * 60 * 60 * 1000,
  commands: { send },
  isOnline: () => navigator.onLine,
});

await queue.enqueue({
  id: 'note-42',
  command: 'send',
  input: { note: 'Hello' },
  idempotencyKey: 'note-42',
});

await queue.resume();

// 또는 재연결이 resume()을 부르게 한다
const stopAutoResume = queue.autoResume(environment, {
  onSettled: results => console.log(results.map(item => item.result.kind)),
  onError: error => report(error),
});`}
      />

      <p>
        <code>autoResume</code>이 자동화하는 것은 <code>resume()</code>이{' '}
        <strong>언제</strong> 도는가뿐이고, 어떤 작업이 돌아도 되는지는 절대
        아닙니다. focus가 아니라 <code>reconnect</code>에 반응하고,{' '}
        <code>environment.isOnline()</code>을 먼저 확인하며, 이미 온라인인
        상태에서 붙으면 즉시 한 번 돕니다. 실행은 겹치지 않습니다. 자동 재개는{' '}
        <code>retryUnknown</code>을 절대 부르지 않습니다.
      </p>

      <p>
        연결 제출은 일부러 큐에서 제외했습니다. 그것을 보내려면 살아 있는 조회
        핸들과, 아직 유효한지 앱만 아는 로컬 상태가 필요하기 때문입니다.
      </p>

      <h3>unknown 작업은 큐를 막는다</h3>

      <ul>
        <li>
          큐는 모든 WRITE 앞에 <code>inFlight</code> 표시를 씁니다. 재시작하면
          그 작업이 <code>unknown</code>이 되고, 그것과 이후 작업이 붙들립니다.
        </li>
        <li>
          <code>retryUnknown(id)</code>은 같은 키를 재사용합니다. 서버가 그 키의
          멱등성을 보장하거나, 서버와 화해를 마친 뒤에만 쓰세요.
        </li>
        <li>
          <code>discard(id)</code>는 명시적이고, 이미 나간 서버 WRITE를 취소할
          수 없습니다.
        </li>
        <li>
          <code>maxAge</code>보다 오래된 명령은 큐에 남아 이후 작업을 막습니다.
          검토하거나 버릴 때까지 사라지지 않습니다.
        </li>
      </ul>

      <p>
        큐는 resource 제출, 로컬 편집, mutation 콜백, 조회 핸들을 직렬화하지
        않습니다. 새 client마다 명령 레지스트리를 다시 만들고, 명령이 성공하면
        영향받은 조회를 무효화하거나 재조회하세요.
      </p>

      <h2>키 하나에 작성자 하나</h2>

      <p>
        연결 제출, 깨끗한 기준, 로컬 스냅숏, 독립 명령은 각각 다른 저장 키를
        쓰고, 키마다 작성자는 정확히 하나여야 합니다.
      </p>

      <h2>관련 문서</h2>

      <ul>
        <li>
          <a href="#/ko/guide/sync-mutation">mutation과 link</a> -{' '}
          <code>unknown</code>과 <code>sync-error</code>의 뜻
        </li>
        <li>
          <a href="#/ko/guide/sync-refetch">자동 재조회</a> - 오프라인에서의
          network mode
        </li>
        <li>
          <a href="#/ko/api/sync">Sync API</a> - 전체 표면
        </li>
      </ul>
    </div>
  );
});
