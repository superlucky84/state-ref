# 별빛 정비소 — 10분 체험

세 우주선에 이름을 붙이고 다음 탐험의 장비를 꾸려 보세요. 두 화면이 같은 편집을 따라가고, 통신이 느리거나 끊겨도 입력은 남습니다. `state-ref`의 일반 상태·computed·draft·batch와 sync query·캐시·linked save를 한 흐름에서 체험하는 데모입니다.

## 실행

저장소 루트에서 한 번 준비합니다. Node 22 이상과 pnpm 9.12.3을 권장합니다.

```sh
pnpm install --frozen-lockfile
pnpm build
```

먼저 Lithent로 시작하려면:

```sh
pnpm --filter stateref-example-lithent dev
```

**로컬 컴퓨터의 브라우저**에서 Vite가 안내하는 `http://localhost:5186/`을 여세요. 기존 `/mission.html` 주소도 사용할 수 있습니다. 각 앱은 같은 로컬 HTTP 정비소를 사용하지만 서버 프로세스별로 데이터가 따로 있습니다. 외부 계정이나 API 키가 필요하지 않습니다.

| 화면               | 실행 명령                                               | 로컬 포트 |
| ------------------ | ------------------------------------------------------- | --------- |
| Lithent            | `pnpm --filter stateref-example-lithent dev`            | 5186      |
| Lithent concurrent | `pnpm --filter stateref-example-lithent dev:concurrent` | 5187      |
| React (StrictMode) | `pnpm --filter stateref-example-react dev`              | 5181      |
| Preact             | `pnpm --filter stateref-example-preact dev`             | 5182      |
| Vue                | `pnpm --filter stateref-example-vue dev`                | 5183      |
| Svelte (store API) | `pnpm --filter stateref-example-svelte dev`             | 5184      |
| Solid              | `pnpm --filter stateref-example-solid dev`              | 5185      |

Lithent base/concurrent는 `/`에서 정비소를 엽니다. 다른 다섯 프레임워크는 `/mission.html`을 엽니다. 기존 다섯 프레임워크의 `/` 데모도 남아 있습니다. 거기서는 배열·live index·투영·infinite query 등 정비소에서 다루지 않는 세부 기능을 더 실험할 수 있습니다.

## 오늘의 다섯 미션

1. **달 토끼의 배달선을 개명하세요.** 달빛 택배선을 골라 `우주선 이름`을 바꿉니다. 보조 화면에도 같은 이름이 즉시 나타나야 합니다. `탐험 별 모으기`를 세 번 눌러 별도 모으세요. 이름은 아직 로컬 편집입니다.
2. **다른 우주선에 다녀오세요.** 화성 탐험선에는 산소 정보가 추가로 보입니다. 택배선으로 돌아오면 방금 편집한 이름과 모은 별이 남아 있습니다. 보조 화면을 닫았다 열어도 같은 정보를 봅니다. 아래 `진단`을 열면 두 화면이 조회 한 번을 공유하는 것을 볼 수 있습니다.
3. **정비소보다 한 발 앞서 편집하세요.** 이름을 `Aurora`로 바꾸고 저장을 누른 직후 `Nova`로 다시 바꿉니다. 저장은 약 1초 걸립니다. `통신 실험실`에서 미리 `느린 통신`을 켜면 더 여유 있게 해볼 수 있습니다. 첫 저장이 끝나도 `Nova`는 남아 있고 아직 저장하지 않은 편집으로 표시됩니다. 다시 저장하면 정비소가 확인한 `NOVA`로 바뀌고 편집 표시가 사라집니다. 정비소는 영문 이름을 대문자로 정리합니다.
4. **우주 먼지를 통과하세요.** `통신 실험실`에서 무선 연결을 끊고 새로고침을 누르면 `무선 대기`가 됩니다. 복구하면 조회가 이어집니다. `다음 조회 실패`를 누른 뒤 새로고침하면 오류가 보이고, 한 번 더 새로고침하면 회복됩니다. `다음 저장 거절`은 다음 저장을 한 번 거절하고 입력을 유지합니다. `느린 통신`을 켜고 우주선을 빠르게 바꿔도 선택한 우주선만 보여야 합니다.
5. **장비를 꾸리고 출발 준비를 마치세요.** `장비 미리 편집`에서 연료를 고친 뒤 취소하면 원래 장비는 그대로입니다. 다시 편집해서 적용하면 준비 점수도 바뀝니다. 장비를 따로 보충하면 알림 2회, 한 번에 보충하면 알림 1회입니다. `자동 조회`를 켜고 정비 화면을 모두 닫으면 조회와 별 수집 구독도 정리됩니다.

`다른 조종사의 연료 보충`은 정비소의 연료·산소를 바꿉니다. 새로고침이나 자동 조회로 받아 보세요. 로컬에서 바꾼 이름은 재조회로 덮이지 않습니다. `다시 확인`은 query를 무효화하여 열린 화면의 정보를 다시 가져옵니다.

`Lithent concurrent`의 별 수집 구독은 2개로 표시됩니다. 읽은 경로의 알림과 렌더러의 버전 알림을 각각 연결하며 같은 AbortSignal로 함께 정리합니다. 정비 화면을 닫으면 둘 다 0이 되어야 합니다.

캐시는 30초 동안 신선하며 마지막 화면을 닫은 뒤 60초간 남습니다. 신선한 캐시를 다시 열면 새 조회 없이 나타나고, 오래된 캐시는 먼저 보여 준 뒤 갱신합니다. 페이지를 새로 열면 로컬 편집·별·장비가 초기화됩니다. 저장한 우주선과 통신 설정은 **정비소 서버 프로세스를 재시작**할 때 초기화됩니다. 서버의 데이터는 메모리에만 있습니다.

## 서버 렌더도 체험하기

```sh
pnpm --filter stateref-example-react dev:ssr
```

로컬 `http://localhost:5191/sync-query`에서 화성 탐험선을 봅니다. 페이지 소스에도 이름이 있고, 서버 렌더 중 추가 조회·소유자는 0입니다. 브라우저가 snapshot을 hydrate해 이어받을 때 추가 GET이나 hydration 불일치가 없어야 합니다. 이 예제는 `staleTime: Infinity`를 사용합니다.

## Playwright로 같은 미션 검증

```sh
pnpm exec playwright install chromium
pnpm test:mission
```

일곱 프로덕션 빌드(여섯 프레임워크 + Lithent concurrent), React 개발 StrictMode, React SSR을 실제 Chromium에서 검증합니다. 각 테스트 전에 로컬 정비소를 초기화하고, 실제 HTTP 요청·취소와 DOM을 관찰합니다. 테스트는 캐시 시간 경과와 polling 해제를 확인할 때 브라우저 시계를 진행시킵니다. 외부 API를 mock하거나 query 내부를 직접 호출하지 않습니다.

빌드가 이미 되어 있으면 한 대상만 실행할 수 있습니다:

```sh
pnpm --filter stateref-example-e2e e2e:mission --grep 'Lithent'
```

시스템 Chromium을 쓰려면 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`을 지정합니다. 실행은 4381~4387·4481·4491·4591 포트를 사용하며, 기존 서버를 재사용하지 않습니다. 실패 trace·스크린샷은 `examples/e2e/test-results`, JSON 결과는 `examples/e2e/transcripts/mission-last-run.json`에 남습니다. 장비 시나리오는 데스크톱·390px 화면 스크린샷도 첨부합니다.

브라우저 자동 검증은 동작을 판정합니다. 설명 없이도 조작하기 쉬운지, 재미있는지, 실제 휴대폰에서 편한지는 [사람이 해볼 체험](../docs/sync-query-hooks/MANUAL_TEST_CHECKLIST.md#사람이-해볼-체험)으로 남겨 두었습니다.

## 코드 살펴보기

- `shared/src/mission.ts`: 일반 상태·장비·sync client·제출 capture와 linked save.
- `shared/mission-server.mjs`: dev/preview 공통의 실제 HTTP 서버. 조회 지연·한 번 실패·저장 거절.
- 각 앱의 `src/MissionApp`·`src/mission-main`: 해당 프레임워크의 공개 sync 진입점과 일반 커넥터.
- `react/src/ssr/mission-entry-*`: 요청별 SSR client, prefetch, dehydrate/hydrate.
- `e2e/src/mission.spec.ts`: 화면·네트워크·수명·오류·작은 화면 검증.

읽기는 읽기 전용 display의 `.value`로 하고, 이름 수정은 로드된 `q.handle()`의 mutable ref로 합니다. 빌린 핸들은 컴포넌트가 직접 dispose하지 않습니다. 일반 상태의 `createDraft`는 장비에만 사용합니다.
