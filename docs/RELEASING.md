# DevTools 배포 가이드

이 문서는 배포 준비와 실행 방법을 정리한다. **아직 npm 발행·main 병합·사이트 배포를 실행하지 않았다.** 2026-10-26 조회한 registry 상태를 기준으로 하며, 실제 실행 직전에 다시 확인한다.

## 1. 이번에 발행할 패키지

| 순서 | 패키지               | npm 현재 버전 | 이번 버전   | 이유                                            |
| ---- | -------------------- | ------------- | ----------- | ----------------------------------------------- |
| 1    | `state-ref`          | `3.2.2`       | **`3.3.0`** | 개발용 관측 API와 조건부 core/batch 산출물 추가 |
| 2    | `@stateref/devtools` | 없음          | **`0.1.0`** | recorder·Sync 관측·브라우저 패널의 첫 발행      |

두 목표 버전은 이미 package.json에 준비되어 있으므로 다시 증가시키지 않는다. DevTools의 core peer는 `^3.3.0`이고 선택적 Sync peer는 `^0.3.1`이다. **core를 먼저 발행하고 조회되는 것을 확인한 뒤 DevTools를 발행한다.**

이번 변경에서 Sync와 connector의 source/API는 그대로다. `@stateref/sync@0.3.1`, React `19.1.0`, Preact `10.5.0`, Vue `3.5.0`, Svelte `5.1.0`, Solid `1.5.0`, Lithent `0.2.0`은 현재 버전을 유지하고 재발행하지 않는다. private인 루트·문서 사이트·예제의 버전도 올리지 않는다.

## 2. 배포할 브랜치 받기

이번 가이드는 검증한 feature 브랜치에서 npm에 발행한 뒤 main에 병합하는 순서다. 브랜치는 `feat/state-ref-devtools`다. 기존 커밋을 모두 포함한 깨끗한 checkout에서 실행한다.

```sh
git fetch origin
git switch feat/state-ref-devtools
git pull --ff-only
nvm install
nvm use
corepack enable
corepack prepare pnpm@9.12.3 --activate
node --version
pnpm --version
pnpm install --frozen-lockfile
```

Node는 **24.19.0**, pnpm은 **9.12.3**이다. Volta 사용자는 저장소 pin을 사용해도 된다. `git status --short`에 수정 파일이 남아 있으면 먼저 변경을 정리하고 커밋·푸시한다. 아래 실제 발행 명령은 git 검사를 유지한다.

```sh
git status --short
pnpm gate
pnpm check:examples
pnpm build:docs
```

`pnpm gate`에는 전체 build·타입·lint·runtime·SSR·패키징·성능/번들 한도 검사가 포함된다. build 후 declaration 경로와 bundled skills도 정리되므로 부분 build만으로 발행하지 않는다. 브라우저 검증은 `pnpm test:devtools:browser`, `pnpm test:devtools:walkthrough`이며 Chromium 경로가 다르면 `CHROMIUM_PATH`를 지정한다. 사람의 사용성/heap 검사는 [체크리스트](./devtools/MANUAL_TEST_CHECKLIST.md)에서 별도로 확인한다.

## 3. npm 계정과 배포 내용 확인

패키지에 발행 권한이 있는 npm 계정으로 로그인한다. 신규 scoped 패키지인 `@stateref/devtools`를 만들 권한도 필요하다.

```sh
npm login --registry https://registry.npmjs.org
npm whoami --registry https://registry.npmjs.org
npm view state-ref version --registry https://registry.npmjs.org
npm view @stateref/devtools version --registry https://registry.npmjs.org
```

DevTools가 첫 발행 전이면 마지막 조회의 E404는 예상 결과다. 다른 네트워크/권한 오류를 미등록으로 해석하지 않는다. 목표 버전이 이미 발행되어 있으면 아래 해당 발행을 반복하지 말고 5절의 버전 확인부터 수행한다.

실제 업로드 없이 tarball 구성과 npm 발행 내용을 확인한다.

```sh
pnpm --filter state-ref publish --dry-run --access public --tag latest --publish-branch feat/state-ref-devtools
pnpm --filter @stateref/devtools publish --dry-run --access public --tag latest --publish-branch feat/state-ref-devtools
```

`--publish-branch`는 pnpm 9의 기본 브랜치 검사와 실제 feature 브랜치를 맞춘다. main에서 발행하기로 바꾼 경우에는 먼저 병합·검증을 완료하고 두 명령의 브랜치 값도 `main`으로 바꾼다. 실제 발행에 `--no-git-checks`나 `--force`를 붙일 필요가 없다. 두 package.json은 npm registry와 public access를 명시한다.

직접 archive도 확인하려면 macOS/Linux 셸에서 다음을 실행한다. 출력한 디렉터리에 core와 DevTools tarball이 생성된다.

```sh
release_pack_dir=$(mktemp -d)
pnpm --dir packages/state-ref pack --pack-destination "$release_pack_dir"
pnpm --dir packages/devtools pack --pack-destination "$release_pack_dir"
printf '%s\n' "$release_pack_dir"
tar -tzf "$release_pack_dir/state-ref-3.3.0.tgz"
tar -tzf "$release_pack_dir/stateref-devtools-0.1.0.tgz"
```

core에는 기본/개발 ESM·CJS, 공개 export의 선언 파일과 LICENSE가 있어야 한다. DevTools에는 recorder/panel ESM·선언·README·LICENSE가 있어야 한다. packed manifest의 `workspace:` 참조는 실제 버전으로 치환된다. 검증 결과는 IMPLEMENT의 배포 준비 절에 기록한다.

## 4. npm에 순서대로 발행

아래는 **실제 업로드** 명령이다. `latest` tag로 정식 발행한다.

```sh
pnpm --filter state-ref publish --access public --tag latest --publish-branch feat/state-ref-devtools
npm view state-ref@3.3.0 version --registry https://registry.npmjs.org
```

`3.3.0`이 확인되면 다음으로 진행한다.

```sh
pnpm --filter @stateref/devtools publish --access public --tag latest --publish-branch feat/state-ref-devtools
npm view @stateref/devtools@0.1.0 version --registry https://registry.npmjs.org
```

2FA를 요구하면 npm의 안내를 따르거나 해당 publish 명령에 현재 일회용 코드의 `--otp` 값을 추가한다. 코드나 토큰을 파일·문서·커밋에 보관하지 않는다.

## 5. 발행 결과와 설치 확인

```sh
npm view state-ref@3.3.0 version dist-tags --registry https://registry.npmjs.org
npm view @stateref/devtools@0.1.0 version dist-tags peerDependencies peerDependenciesMeta --registry https://registry.npmjs.org
```

별도의 빈 디렉터리에서 실제 registry 설치를 확인한다. core는 기존 CommonJS/ESM 소비자를 유지하고, DevTools는 ESM entry다. 두 패키지 외에 Sync를 설치할 필요는 없다.

```sh
release_smoke_dir=$(mktemp -d)
cd "$release_smoke_dir"
npm init -y
npm install state-ref@3.3.0 @stateref/devtools@0.1.0
node --conditions=development --input-type=module -e "import { createStore } from 'state-ref'; import { createDevtools } from '@stateref/devtools'; const watch=createStore({count:0}); const tools=createDevtools(); tools.attachStore(watch); watch().count.value=1; console.log(tools.inspectStore(tools.getSnapshot().sources[0].id).value); tools.dispose();"
cd -
```

core가 성공하고 DevTools 발행만 실패했다면 core 버전을 다시 발행하지 않는다. DevTools의 권한/오류를 해결하고 미발행인 0.1.0부터 재개한다. 이미 npm에 등록된 동일 버전의 내용을 덮어쓸 수 없으므로, 발행된 내용에 수정이 필요할 때에만 다음 patch 버전을 준비한다.

## 6. 태그와 문서 사이트 배포

두 npm 버전이 확인된 뒤 저장소 루트의 같은 release commit에서 기존 monorepo 형식대로 태그를 남긴다.

```sh
git tag -a state-ref@3.3.0 -m "state-ref 3.3.0"
git tag -a @stateref/devtools@0.1.0 -m "@stateref/devtools 0.1.0"
git push origin state-ref@3.3.0 @stateref/devtools@0.1.0
```

같은 이름의 태그가 이미 있다면 다시 만들거나 덮어쓰지 말고 올바른 release commit을 가리키는지 확인한다.

그다음 GitHub에서 `feat/state-ref-devtools`를 main으로 병합한다. main의 `stateRefDocs/**` 변경은 기존 **Deploy docs site** workflow를 실행해 `gh-pages`를 갱신한다. npm 발행만으로 사이트가 갱신되지는 않는다. npm 패키지 2개가 준비된 뒤 병합하면 가이드에서 안내한 버전을 바로 설치할 수 있다.

자동 배포가 정상 완료되면 수동 명령을 추가 실행할 필요가 없다. 수동으로 다시 배포할 때만 main의 최신 커밋에서 다음을 사용한다.

```sh
git switch main
git pull --ff-only
pnpm install --frozen-lockfile
pnpm deploy:docs --dry-run
pnpm deploy:docs
```

수동 스크립트는 git으로 `gh-pages`에 push하므로 해당 저장소의 push 권한이 필요하다. 최종 사이트: <https://superlucky84.github.io/state-ref/#/ko/guide/devtools> (한국어), <https://superlucky84.github.io/state-ref/#/guide/devtools> (영문).

발행/배포를 실제 완료한 뒤 이 문서 첫 문단과 IMPLEMENT의 상태를 완료 사실·커밋·버전으로 갱신한다. 현재 공개 가이드는 버전 요구사항을 설명하며, 배포 준비를 발행 완료로 주장하지 않는다.
