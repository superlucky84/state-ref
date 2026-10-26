import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';
import {
  devtoolsDemoCommand,
  devtoolsBootstrapExample,
  devtoolsHeadlessExample,
  devtoolsSyncExample,
} from '@/content/devtools-examples';

export const DevToolsKo = mount(() => {
  return () => (
    <div>
      <h1>DevTools</h1>
      <p>
        값 하나를 바꾼 뒤 현재 값, 변경 이력, 깨어난 구독을 이어서 살펴보세요.{' '}
        <code>@stateref/devtools</code>는 읽기 전용 recorder와 선택적 앱 내
        패널을 제공합니다. React·Preact·Vue·Svelte·Solid·Lithent에서 같은 도구를
        쓰며 브라우저 확장 설치가 필요 없습니다.
      </p>
      <div class="my-6 rounded-lg border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
        <strong>버전 안내</strong>
        <p>
          이 문서는 state-ref 3.3.0 이상과 DevTools 0.1.0을 설명합니다.
          state-ref 3.2.2에는 관측 API가 없습니다. 해당 버전이 있는 저장소를
          빌드해 체험하거나, npm에서 두 버전을 확인한 뒤 설치하세요.
        </p>
      </div>

      <h2>무엇을 볼 수 있나요?</h2>
      <ul>
        <li>
          <strong>State:</strong> 선택한 스토어의 현재 값을 한도가 있는 읽기
          전용 미리보기로 봅니다.
        </li>
        <li>
          <strong>Timeline:</strong> 성공한 쓰기의 변경 전후, batch 묶음, 구독
          사건과 기록 공백을 봅니다.
        </li>
        <li>
          <strong>Subscriptions:</strong> 읽은 경로, 관측된 실행 횟수와 갱신
          이유를 봅니다. 컴포넌트 렌더 횟수와는 다릅니다.
        </li>
        <li>
          <strong>Sync:</strong> 캐시 key, owners, 상태와 mutation 메타데이터를
          봅니다. 조회 데이터·mutation 입력/응답·오류 원문은 수집하지 않습니다.
        </li>
      </ul>

      <h2>10분짜리 이야기로 시작하기</h2>
      <p>
        저장소 폴더에서 Node 24.19.0과 pnpm 9.12.3을 사용합니다. 아래 명령은 nvm
        기준이며 저장소의 Volta 설정으로도 Node 버전을 맞출 수 있습니다.
      </p>
      <CodeBlock language="bash" code={devtoolsDemoCommand} />
      <p>
        마지막 명령이{' '}
        <a href="http://localhost:5181/mission.html?devtools=1">별빛 정비소</a>
        를 엽니다. 우주선 선택 → 별 모으기 → 구독 확인 → 이름 저장 → 장비 편집 →
        기록 제어의 여섯 단계로 이어집니다. 매 단계에서 앱으로 해볼 행동과
        관측창에서 찾아볼 내용을 함께 읽으세요. 여섯 프레임워크의 정비소 데모가
        같은 안내를 공유합니다.
      </p>
      <p>
        관측창은 앱을 가리지 않도록 옆에 배치했습니다. 작은 화면에서는
        「관측창」을 펼쳐 보세요. 실패 상황을 만드는 실험은 접혀 있습니다.
        Vite가 메모리 API까지 실행하므로 외부 서비스나 환경변수 설정이 필요
        없습니다. 종료는 Ctrl+C입니다. 다음 실행부터는 보통 <code>nvm use</code>{' '}
        후 <code>pnpm dev:devtools</code>만 실행합니다. 라이브러리 변경을
        내려받았다면 다시 빌드하세요. 새로고침하면 기록이 초기화되고, 서버를
        재시작하면 저장한 우주선 이름도 초기화됩니다. 주소에서{' '}
        <code>?devtools=1</code>을 빼면 일반 앱만 보입니다.
      </p>

      <h2>내 앱에 연결하기</h2>
      <p>
        원본 watch를 <code>@stateref/devtools/auto</code>의{' '}
        <code>devtools()</code>로 감싸세요. 원본 참조와 타입을 그대로 돌려주므로
        프레임워크 connector 사용법이 유지됩니다. Vite 개발 환경에서 처음
        활성화된 등록이 공통 recorder 하나를 시작하고 패널 하나를 지연
        로드합니다. 민감한 경로는 기록 전에 마스킹하세요.
      </p>
      <CodeBlock language="typescript" code={devtoolsBootstrapExample} />
      <p>
        기본 패널은 화면 위에 떠 있습니다. 첫 등록의 선택 사항인{' '}
        <code>{"panel: { target: element, layout: 'inline' }"}</code>으로 별도
        영역에 넣을 수 있습니다. <code>hot: import.meta.hot</code>을 넘기면 HMR
        때 해당 모듈의 등록을 해제합니다. 생략하면 명시적으로 해제하거나
        페이지를 새로고침할 때까지 유지합니다. <code>stopDevtools(watch)</code>
        는 해당 대상을, <code>stopDevtools()</code>는 자동 등록 전체를 종료하고
        패널도 제거합니다. 별도로 만든 headless session에는 영향을 주지
        않습니다.
      </p>

      <p>
        기본 production export는 <code>enabled: true</code>여도 원본만 반환하며
        recorder·패널을 import하지 않습니다. SSR과 <code>enabled: false</code>도
        대상을 건드리지 않습니다. Vite의 개발/배포 빌드와 Node의 development
        조건을 검증했으며, 다른 bundler에서는 export 조건 선택을 확인하세요.
        같은 대상의 반복 등록은 중복되지 않고 서로 다른 대상은 같은 이름을 쓸 수
        있습니다. 한 대상에 명시적으로 다른 이름이나 마스킹을 지정하면
        거절하므로 재등록 시 설정을 일관되게 유지하세요.
      </p>

      <h2>패널 없이 기록만 사용하기</h2>
      <p>
        recorder는 DOM을 요구하지 않는 ESM 진입점입니다. Vite 개발 서버는 개발용
        core를 자동 선택합니다. Node 개발 스크립트에서는{' '}
        <code>node --conditions=development script.mjs</code>로 실행하세요. 기본
        production core에 연결하면 해결 안내와 함께 거절됩니다.
      </p>
      <CodeBlock language="typescript" code={devtoolsHeadlessExample} />
      <p>
        <code>inspectStore()</code>는 최신 값을 즉시 읽고,{' '}
        <code>getSnapshot()</code>은 메타데이터와 이미 받은 이력을 돌려줍니다.
        이력은 마이크로태스크로 전달되므로 쓰기와 listener 호출이 동기적으로
        이어지지는 않습니다. detach는 한 대상의 기록을 끝내고, dispose는
        session과 연결된 패널을 종료합니다.
      </p>

      <h2>기존 Sync client 관측하기</h2>
      <p>
        같은 함수로 Sync client도 감싸면 원본 client가 그대로 반환됩니다. 앱의
        기존 client를 한 번 등록하면 여섯 프레임워크의 sync connector는 기존
        호출을 유지하며, query·mutation마다 설정할 필요가 없습니다. Sync는
        선택적 의존성입니다. 공개 메타데이터만 관측하므로 query 실행, owners
        증가, mutation 재시도는 일어나지 않습니다. 종료한 mutation이 진행
        목록에서 빠져도 한도 안에 이력이 남을 수 있습니다. SSR 요청마다 client를
        따로 만드는 원칙도 그대로 유지하세요.
      </p>
      <CodeBlock language="typescript" code={devtoolsSyncExample} />

      <h2>기록 제어와 한도</h2>
      <ul>
        <li>
          <strong>Pause / Resume:</strong> 캡처를 멈추고, 재개할 때 새
          generation과 명시적인 공백을 남깁니다. 앱은 계속 동작합니다.
        </li>
        <li>
          <strong>Clear:</strong> 이미 받은 이력만 비웁니다. 현재 앱 값과 등록
          대상은 유지합니다.
        </li>
        <li>
          <strong>Hide:</strong> 패널만 접고 기록은 계속합니다. unmount는 패널
          자원을 해제하고 session dispose는 기록까지 끝냅니다.
        </li>
        <li>
          기본 이력 한도는 200건 또는 직렬화한 레코드 1 MiB입니다. 오래되거나
          너무 큰 레코드의 생략을 표시합니다.
        </li>
        <li>
          미리보기는 깊이·노드 수·byte 한도가 있으며 잘림과 마스킹을 표시합니다.
          기록 byte를 실제 JavaScript heap 한도로 해석하지 않습니다.
        </li>
      </ul>
      <p>
        상태 편집, 타임트래블, undo/redo, 자동 원격 전송, 영속 이력, Redux
        DevTools 어댑터는 제공하지 않습니다. computed·combine·shared wrapper
        watch를 원본 스토어처럼 자동으로 풀어 등록하지도 않습니다. 이력은 완전한
        재생 로그가 아니며, 진단 상태는 서버 작업을 다시 보내도 된다는 허가가
        아닙니다.
      </p>
      <h2>함께 보기</h2>
      <ul>
        <li>
          <a href="#/ko/guide/subscription">구독의 수명</a>
        </li>
        <li>
          <a href="#/ko/guide/batch">batch 쓰기와 알림</a>
        </li>
        <li>
          <a href="#/ko/guide/sync-observation">Sync 메타데이터 관측</a>
        </li>
        <li>
          <a href="https://github.com/superlucky84/state-ref/blob/main/packages/devtools/README.md">
            패키지 설치·연결·API 가이드
          </a>
        </li>
      </ul>
    </div>
  );
});
