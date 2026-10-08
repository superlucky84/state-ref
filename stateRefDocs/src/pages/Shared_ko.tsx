import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SharedKo = mount(() => {
  return () => (
    <div>
      <h1>번들 간 스토어 공유</h1>
      <p>
        <code>state-ref/shared</code>는 한 페이지에서 따로 빌드된 번들들이 같은
        스토어를 쓰게 합니다. 한 번들이 이름을 붙여 watch를 제공하면, 다른
        번들은 그 이름으로 따라갑니다. 번들마다 state-ref 사본이 따로 들어
        있어도, 어느 번들이 먼저 로드돼도 동작합니다.
      </p>
      <p>
        별도 진입점입니다. <code>state-ref</code>만 import하면 로드되지 않고,
        런타임에 코어에서 가져오는 것도 없습니다.
      </p>
      <h2>언제 쓰나</h2>
      <ul>
        <li>
          한 페이지가 엔트리 번들 여러 개(공통 번들, 페이지 번들, 위젯 번들)를
          로드하고, 이들이 같은 상태를 써야 할 때.
        </li>
        <li>
          지금 <code>window.something</code>으로 번들 사이에 상태를 넘기고 있고,
          로드 순서에 따라 동작 여부가 갈릴 때.
        </li>
        <li>
          한 번들 안에서는 필요 없습니다. watch를 export하고 import하면 됩니다.
        </li>
      </ul>
      <h2>스토어 제공하기</h2>
      <p>
        제공 번들은 데이터를 소유하는 번들입니다. 스토어는 원하는 방식으로
        만들고, 그 watch를 <code>provideShared</code>로 등록합니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`// subs 번들 - 데이터를 소유하는 쪽
import { createStore } from 'state-ref';
import { provideShared } from 'state-ref/shared';

const subsWatch = createStore({ loaded: false, error: null, mySubs: [] });

provideShared('subs', subsWatch, {
  ready: ref => ref.loaded.value, // 데이터를 써도 되는 시점
});

// fetch는 이 번들만 한다.
const subs = subsWatch();
fetchMySubs()
  .then(list => {
    subs.mySubs.value = list;
    subs.loaded.value = true;
  })
  .catch(error => {
    subs.error.value = String(error);
  });`}
      />
      <p>
        <code>ready</code>는 "데이터를 써도 되는 시점"에 대한 제공 쪽의
        선언입니다. 소비 쪽은 어떤 필드가 그 뜻인지 알 필요가 없습니다. 생략하면
        제공되는 즉시 준비된 것으로 봅니다.
      </p>
      <h2>다른 번들에서 쓰기</h2>
      <p>
        <code>sharedWatch(name)</code>은 제공 번들이 로드됐든 아니든 바로
        watch를 돌려줍니다. 일반 watch처럼 쓰되, 규칙이 하나 있습니다. 읽기 전에
        가드를 거칩니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`// article 번들 - subs 번들보다 먼저 로드돼도, 나중에 로드돼도 된다
import { sharedWatch, isReady } from 'state-ref/shared';

const subsWatch = sharedWatch('subs');

subsWatch(ref => {
  if (!isReady(ref)) return; // 아직 제공 전이거나 로딩 중
  renderBadge(ref.mySubs.value.length); // 여기부터는 일반 ref
});`}
      />
      <p>
        구독 콜백은 즉시 한 번 실행됩니다. 스토어가 아직 없었다면 스토어가
        도착할 때 다시 실행되고, 이후에는 읽은 값이 바뀔 때마다 실행됩니다. 제공
        쪽의 준비 조건이 바뀔 때도 포함됩니다.
      </p>
      <h2>세 단계</h2>
      <p>
        공유 스토어는 세 단계를 거치고, 단계의 경계마다 가드가 하나씩 있습니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>단계</th>
            <th>isProvided</th>
            <th>isReady</th>
            <th>할 수 있는 것</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>제공 전</td>
            <td>false</td>
            <td>false</td>
            <td>없음. 경로를 읽으면 오류가 납니다.</td>
          </tr>
          <tr>
            <td>제공됨, 준비 전</td>
            <td>true</td>
            <td>false</td>
            <td>
              스토어를 읽고 씁니다. 스토어가 가진 로딩·오류 상태도 읽을 수
              있습니다.
            </td>
          </tr>
          <tr>
            <td>준비됨</td>
            <td>true</td>
            <td>true</td>
            <td>데이터를 씁니다.</td>
          </tr>
        </tbody>
      </table>
      <p>
        대부분의 코드는 <code>isReady</code> 하나면 됩니다. 스토어가 가진
        로딩이나 오류 상태를 보여 주려면 <code>isProvided</code>를 씁니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`subsWatch(ref => {
  if (!isProvided(ref)) return hideBadge(); // subs 번들이 아직 없다
  if (ref.error.value) return showRetry(); // 스토어는 있고, fetch가 실패했다
  if (!isReady(ref)) return showSpinner(); // 스토어는 있고, 아직 로딩 중
  renderBadge(ref.mySubs.value.length);
});`}
      />
      <h2>쓰기</h2>
      <p>
        가드를 지난 ref는 제공 번들의 ref 그대로입니다. 쓰면 제공 번들의
        스토어에 반영되고, 모든 번들의 구독자가 알림을 받습니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`const ref = subsWatch(); // 콜백 없이 호출: 구독 없는 ref

button.addEventListener('click', () => {
  if (!isProvided(ref)) return;
  ref.mySubs.value = [...ref.mySubs.value, newSub]; // 제공 번들의 구독자도 실행된다
});`}
      />
      <h2>준비되면 한 번 실행</h2>
      <p>
        "데이터가 오면 이걸 한 번 실행"에는 가드를 넣은 구독보다{' '}
        <code>whenReady</code>가 짧습니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { whenReady } from 'state-ref/shared';

// 'subs'가 제공되고 준비되면 한 번 실행한 뒤 구독을 끝낸다.
whenReady('subs', ref => {
  insertBanner(ref.mySubs.value); // 이 안에서는 가드가 필요 없다
});

// 공유 watch도 받는다. select로 조건을 더할 수 있다.
whenReady(subsWatch, ref => openOnboarding(), {
  select: ref => ref.mySubs.value.length === 0,
});

// 기다리는 중에 취소한다.
const controller = new AbortController();
whenReady('subs', start, { signal: controller.signal });
controller.abort();`}
      />
      <p>
        공유 watch가 아닌 일반 watch를 넘기면 <code>whenReady</code>는 루트 값이
        truthy일 때를 준비로 보고, <code>select</code>가 그 판정을 대체합니다.
      </p>
      <h2>UI 커넥터와 함께</h2>
      <p>
        공유 watch는 커넥터의 view 형태에 넘깁니다. 훅을 모듈 최상위에서 만들 수
        있고, 컴포넌트는 단계가 바뀔 때마다 스스로 다시 렌더링됩니다.
      </p>
      <CodeBlock
        language="tsx"
        code={`import { connectPreactView } from '@stateref/connect-preact';
import { sharedWatch, isProvided, isReady } from 'state-ref/shared';

// 모듈 최상위. 제공 번들이 아직 없어도 된다.
const useSubs = connectPreactView(sharedWatch('subs'));

function Badge() {
  const subs = useSubs();
  if (!isProvided(subs)) return null;
  if (!isReady(subs)) return <Spinner />;
  return <span>{subs.mySubs.value.length}</span>;
}`}
      />
      <p>
        Preact(<code>connectPreactView</code>)는 테스트로 확인했습니다. 다른
        커넥터에도 같은 view 형태가 있지만, 공유 watch를 넘기는 조합은 아직
        테스트하지 않았습니다.
      </p>
      <h2>TypeScript</h2>
      <p>
        공유 ref는 가드를 거치기 전에는 경로가 없어서, 가드를 빠뜨리면 컴파일
        오류가 납니다. 두 번째 타입 인자로 준비된 뒤의 스토어 모양을 알려 주면
        가드가 안쪽 필드까지 좁혀 줍니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`type Subs = { loaded: boolean; error: string | null; mySubs: Sub[] | null };
type LoadedSubs = Subs & { loaded: true; mySubs: Sub[] };

// 두 번째 타입 인자는 준비된 뒤의 스토어 모양이다.
const subsWatch = sharedWatch<Subs, LoadedSubs>('subs');

subsWatch(ref => {
  ref.mySubs; // 컴파일 오류: 가드 전의 공유 ref에는 경로가 없다
  if (!isProvided(ref)) return;
  ref.mySubs.value; // Sub[] | null
  if (!isReady(ref)) return;
  ref.mySubs.value.length; // Sub[] - null 검사가 필요 없다
});`}
      />
      <p>
        준비 타입은 타입 검사기가 제공 쪽의 <code>ready</code> 함수와 대조해 줄
        수 없는 약속입니다. 둘을 같은 곳에 두세요.
      </p>
      <p>
        이름만으로 타입이 정해지게 하려면 <code>SharedStores</code>에 이름을
        등록합니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`// shared/subs.ts - 두 번들이 함께 import하는 모듈
import type { Sub } from './types';

export type Subs = { loaded: boolean; mySubs: Sub[] | null };

declare module 'state-ref/shared' {
  interface SharedStores {
    subs: Subs;
  }
}

// 그다음부터는 어디서든:
provideShared('subs', createStore('nope')); // 컴파일 오류: Subs 스토어가 아니다
sharedWatch('subs'); // SharedWatch<Subs>, 타입 인자 없이`}
      />
      <h2>제공 쪽이 @stateref/sync를 쓸 때</h2>
      <p>
        소비 쪽은 제공 쪽이 스토어를 어떻게 만들었는지 신경 쓰지 않습니다. sync
        query에서 공유할 만한 것은 세 가지입니다.
      </p>
      <h3>display watch</h3>
      <p>상태와 데이터가 한 트리에 있습니다. 소비 쪽이 읽기만 할 때 씁니다.</p>
      <CodeBlock
        language="typescript"
        code={`// 제공 쪽: query의 display watch는 상태와 데이터를 한 트리에 담는다.
import { createSyncClient } from '@stateref/sync';
import { provideShared } from 'state-ref/shared';

const client = createSyncClient();
const subsQuery = client.query({ queryKey: ['subs'], queryFn: fetchMySubs });

provideShared('subs', subsQuery.watchDisplay, {
  ready: ref => ref.loaded.value,
});
subsQuery.load();

// 소비 쪽: 앞에서와 같은 세 줄이다.
sharedWatch('subs')(ref => {
  if (!isProvided(ref)) return;
  if (ref.error.value) return showRetry();
  if (!isReady(ref)) return showSpinner();
  renderBadge(ref.data.value.length);
});`}
      />
      <h3>데이터 watch</h3>
      <p>
        query의 <code>watch</code>는 첫 load 전에는 읽을 수 없으므로{' '}
        <code>load()</code>가 끝난 뒤에 제공합니다. 소비 쪽은 그때까지 "제공 전"
        단계에 머뭅니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`// 제공 쪽: 첫 load가 끝난 뒤 편집 가능한 데이터 watch를 공유한다.
await subsQuery.load();
provideShared('subs', subsQuery.watch);

// 소비 쪽: 그때까지 pending이고, 이후 query 데이터를 읽고 편집한다.
const subsWatch = sharedWatch('subs');
const ref = subsWatch();
if (isProvided(ref)) ref.value = [...ref.value, newSub]; // query에 대한 로컬 편집`}
      />
      <h3>클라이언트 자체</h3>
      <p>
        소비 쪽이 같은 캐시를 대상으로 자기 query와 mutation을 실행하게 하려면
        클라이언트를 공유합니다. 클라이언트는 watch가 아니므로{' '}
        <code>sharedWatch</code> 대신 <code>onShared</code>나{' '}
        <code>getShared</code>로 받습니다.
      </p>
      <CodeBlock
        language="typescript"
        code={`// 제공 쪽
const client = provideShared('sync', createSyncClient());

// 소비 쪽 - 페이지에 캐시가 하나이므로 같은 key는 한 번만 읽는다
import { onShared } from 'state-ref/shared';

onShared('sync', client => {
  const subs = client.query({ queryKey: ['subs'], queryFn: fetchMySubs });

  const subscribe = client.mutation({
    mutationFn: input => api.subscribe(input),
    onSuccess: () => client.invalidate(['subs']),
  });
});`}
      />
      <h2>규칙</h2>
      <ul>
        <li>
          <strong>이름 하나에 제공자 하나.</strong> 첫 등록이 유지됩니다. 같은
          이름으로 다른 것을 제공하면 경고를 남기고 첫 등록을 돌려줍니다. 제공
          모듈이 두 번들에 들어가도 페이지가 깨지지 않습니다.
        </li>
        <li>
          <strong>fetch는 제공 쪽이 한다.</strong> 로딩은 provideShared를
          호출하는 번들에 둡니다. 소비 쪽도 fetch해서 쓰면 서로 경쟁합니다.
        </li>
        <li>
          <strong>읽기 전에 가드.</strong> JavaScript에서는 가드를 건너뛰는 것을
          막을 수단이 없습니다. 제공되지 않은 스토어의 경로를 읽으면 가드 이름이
          적힌 오류가 납니다.
        </li>
        <li>
          <strong>이름은 페이지 전역이다.</strong> 기능별 접두사를 붙이고,
          이름·타입·준비 조건을 두 번들이 함께 import하는 모듈 하나에 둡니다.
        </li>
        <li>
          <strong>등록 해제는 없다.</strong> 공유 스토어는 페이지와 수명이
          같습니다.
        </li>
        <li>
          <strong>batch는 사본을 넘지 못한다.</strong>{' '}
          <code>state-ref/batch</code>의 <code>batch</code>는 같은 state-ref
          사본이 만든 스토어의 쓰기만 묶습니다. 자기 사본을 가진 소비 번들에서는
          쓰기마다 알림이 나갑니다. 값은 올바릅니다.
        </li>
        <li>
          <strong>서버의 요청별 상태에는 쓰지 않는다.</strong> 레지스트리는{' '}
          <code>globalThis</code>에 있고, 서버에서는 요청 사이에 공유됩니다.
        </li>
      </ul>
      <CodeBlock
        language="typescript"
        code={`const ref = sharedWatch('subs')();
ref.mySubs.value;
// Error: state-ref/shared: "subs" is not provided yet, so it has no "mySubs".
// Check isProvided(ref) or isReady(ref) before reading it.`}
      />
      <h2>빠진 제공자 찾기</h2>
      <CodeBlock
        language="typescript"
        code={`import { pendingShared } from 'state-ref/shared';

pendingShared(); // ['subs'] - 기다리는 곳은 있는데 제공한 번들이 없다`}
      />
      <h2>UMD</h2>
      <p>
        UMD 빌드는 단독으로 동작하며 <code>stateRefShared</code>를 노출합니다.
      </p>
      <CodeBlock
        language="html"
        code={`<script src="state-ref.umd.js"></script>
<script src="state-ref.shared.umd.js"></script>
<script>
  var subsWatch = stateRefShared.sharedWatch('subs');
  subsWatch(function (ref) {
    if (!stateRefShared.isReady(ref)) return;
    render(ref.mySubs.value);
  });
</script>`}
      />
      <h2>API</h2>
      <table>
        <thead>
          <tr>
            <th>함수</th>
            <th>하는 일</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>provideShared(name, value, options?)</code>
            </td>
            <td>
              watch(또는 임의의 값)를 이름으로 등록합니다. options.ready로
              스토어의 데이터를 써도 되는 시점을 알립니다.
            </td>
          </tr>
          <tr>
            <td>
              <code>sharedWatch(name)</code>
            </td>
            <td>
              그 이름의 스토어를 따라가는 watch. 제공 전에도 쓸 수 있습니다.
            </td>
          </tr>
          <tr>
            <td>
              <code>isProvided(ref)</code>
            </td>
            <td>스토어가 있는지. ref를 일반 ref로 좁힙니다.</td>
          </tr>
          <tr>
            <td>
              <code>isReady(ref)</code>
            </td>
            <td>스토어가 있고 제공 쪽의 준비 조건도 참인지.</td>
          </tr>
          <tr>
            <td>
              <code>whenReady(source, callback, options?)</code>
            </td>
            <td>
              준비되면 콜백을 한 번 실행하고 구독을 끝냅니다. source는 공유
              watch, 이름, 일반 watch.
            </td>
          </tr>
          <tr>
            <td>
              <code>getShared(name)</code>
            </td>
            <td>지금 등록된 것, 없으면 undefined. watch가 아닌 값에 씁니다.</td>
          </tr>
          <tr>
            <td>
              <code>onShared(name, callback, options?)</code>
            </td>
            <td>
              등록된 값으로 콜백을 한 번 실행합니다. 지금 있으면 즉시, 없으면
              제공될 때.
            </td>
          </tr>
          <tr>
            <td>
              <code>pendingShared()</code>
            </td>
            <td>기다리는 곳은 있는데 어느 번들도 제공하지 않은 이름들.</td>
          </tr>
        </tbody>
      </table>
      <h2>관련 문서</h2>
      <ul>
        <li>
          <a href="#/ko/guide/subscription">Subscription</a> - 구독자가 읽은
          값을 수집하는 방식
        </li>
        <li>
          <a href="#/ko/guide/sync">@stateref/sync</a> - query와 mutation
        </li>
        <li>
          <a href="#/ko/guide/batch">batch</a> - 한 사본 안에서 쓰기 묶기
        </li>
      </ul>
    </div>
  );
});
