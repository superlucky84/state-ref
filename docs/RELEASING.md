# 배포 가이드

npm 배포는 GitHub Actions의 **Release** workflow(`.github/workflows/release.yml`)를 손으로 실행해서 한다. 개인 PC에서 `npm publish`를 하지 않고, npm 토큰도 저장하지 않는다. 인증은 npm Trusted Publishing(OIDC)으로 한다.

workflow는 `pnpm gate`를 통과한 뒤 `scripts/release.mjs`를 실행한다. 스크립트가 하는 일은 다음과 같다.

1. `packages/*` 중 private이 아닌 패키지마다 `package.json`의 버전이 npm에 있는지 조회한다. 이미 있는 버전은 건너뛴다.
2. 남은 패키지를 의존 순서(core → sync → connector·DevTools)대로 `pnpm pack`한다. 이때 `workspace:` 범위가 실제 버전으로 바뀐다. 그 tarball을 `npm publish --provenance`로 올린다. prerelease 버전(`-`가 들어간 버전)은 `next` dist-tag, 나머지는 `latest`로 올린다.
3. 올라간 버전마다 `name@version` annotated 태그를 만들어 push한다. 이미 원격에 같은 태그가 있으면 건드리지 않는다.

중간에 실패해도 그때까지 올라간 버전은 태그를 남기고 멈춘다. 원인을 고친 뒤 workflow를 다시 실행하면 npm에 이미 있는 버전은 건너뛰므로 실패한 패키지부터 이어서 배포된다. npm에 올라간 버전은 덮어쓸 수 없다. 배포된 내용을 고쳐야 하면 다음 patch 버전을 준비한다.

과거 릴리스별 기록은 [docs/release](./release/)에 있다.

## 1. 최초 1회 설정

아래 명령은 저장소 루트에서 한 줄씩 실행한다. 각 명령이 성공한 것을 확인한 뒤 다음으로 넘어간다.

### 1-1. GitHub `npm` environment 만들기

Release job은 `environment: npm`에서 돈다. npm의 Trusted Publisher도 이 environment 이름으로 등록하므로, 이 environment가 아닌 job은 배포할 수 없다.

```sh
gh auth status
gh api -X PUT repos/superlucky84/state-ref/environments/npm
```

environment를 `main` 브랜치에서만 쓸 수 있게 제한한다(선택이지만 권장).

```sh
gh api -X PUT repos/superlucky84/state-ref/environments/npm -F 'deployment_branch_policy[protected_branches]=false' -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/superlucky84/state-ref/environments/npm/deployment-branch-policies -f name=main -f type=branch
gh api repos/superlucky84/state-ref/environments/npm/deployment-branch-policies --jq '.branch_policies[].name'
```

마지막 명령의 출력이 `main`이면 된다. 배포 직전에 한 번 더 승인하는 단계를 두려면 GitHub 저장소의 Settings → Environments → `npm` → Required reviewers에 본인을 추가한다.

### 1-2. npm Trusted Publisher 등록

`npm trust`는 npm **11.15.0 이상**, 계정 2FA, 각 패키지의 쓰기 권한이 필요하다. 패키지가 npm에 이미 있어야 하는데, 아래 9개는 모두 등록되어 있다.

```sh
npm --version
npm login --registry https://registry.npmjs.org
npm whoami --registry https://registry.npmjs.org
```

패키지마다 한 줄씩 실행한다. 첫 명령에서 2FA를 요구한다. 이때 npm 웹 화면의 "5분 동안 2FA 건너뛰기"를 선택하면 나머지는 2FA 없이 이어서 실행할 수 있다.

```sh
npm trust github state-ref --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/sync --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-react --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-preact --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-vue --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-svelte --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-solid --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/connect-lithent --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
npm trust github @stateref/devtools --repo superlucky84/state-ref --file release.yml --env npm --allow-publish -y
```

등록 결과를 확인한다. 각 패키지에 `superlucky84/state-ref`, `release.yml`, `npm`이 보여야 한다.

```sh
npm trust list state-ref
npm trust list @stateref/sync
npm trust list @stateref/connect-react
npm trust list @stateref/connect-preact
npm trust list @stateref/connect-vue
npm trust list @stateref/connect-svelte
npm trust list @stateref/connect-solid
npm trust list @stateref/connect-lithent
npm trust list @stateref/devtools
```

npm은 패키지마다 Trusted Publisher 설정을 하나만 허용한다. 이미 설정이 있어서 등록이 실패하면 `npm trust list <패키지>`로 id를 확인하고, `npm trust revoke <패키지> --id=<id>`로 지운 뒤 다시 등록한다.

`packages/` 아래에 새 공개 패키지를 추가하면, 그 패키지의 첫 버전은 직접 배포해야 한다. `npm trust`는 이미 npm에 있는 패키지에만 설정할 수 있기 때문이다. 첫 배포 뒤 같은 형식으로 등록한다.

첫 workflow 배포가 성공한 뒤에는 npm 웹의 각 패키지 Settings → Publishing access를 "Require two-factor authentication and disallow tokens"로 바꿔 둘 수 있다. Trusted Publishing은 이 설정과 상관없이 계속 동작한다.

## 2. 릴리스할 때마다

1. 기능 PR과 별도로, 또는 함께 배포할 패키지의 `package.json` 버전을 올린다. connector·DevTools의 `@stateref/sync` peer 범위가 새 sync 버전을 받는지 확인한다(`pnpm check:packaging`이 connector 범위를 검사한다). 그리고 `CHANGELOG.md`에 패키지별 절을 적는다.
2. PR을 `main`에 병합한다.
3. 배포 대상을 미리 확인한다. 아래 명령은 npm만 조회하고, 아무것도 올리지 않는다.

   ```sh
   git switch main
   git pull --ff-only
   pnpm install --frozen-lockfile
   pnpm build
   node scripts/release.mjs --dry-run
   ```

   맨 위의 `Release plan`에 `publish`로 표시된 패키지가 이번에 배포된다.

4. GitHub의 Actions → **Release** → Run workflow에서 `main`을 고르고 실행한다. `dry_run`을 체크하면 CI에서 gate와 pack까지만 실행하고 아무것도 배포하지 않는다. 명령줄에서는 다음과 같이 실행한다.

   ```sh
   gh workflow run release.yml --ref main
   gh run watch "$(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
   ```

5. 결과를 확인한다.

   ```sh
   npm view @stateref/sync version dist-tags
   git fetch --tags
   git tag --sort=-creatordate | head
   ```

문서 사이트는 `main`에 `stateRefDocs/**`가 바뀌면 **Deploy docs site** workflow가 따로 배포한다. npm 배포와는 별개다.

GitHub 릴리스 노트도 만들려면 태그가 생긴 뒤 CHANGELOG의 해당 절로 만든다.

```sh
section() { awk -v h="## $1" '$0==h{f=1;next} /^## /{f=0} f' CHANGELOG.md; }
section "@stateref/sync 0.4.0" > /tmp/sync-notes.md
gh release create "@stateref/sync@0.4.0" --verify-tag --title "@stateref/sync 0.4.0" --notes-file /tmp/sync-notes.md
```

## 3. 실패했을 때

- **gate 실패**: 아무것도 배포되지 않는다. 로그의 `GATE:` 요약에서 실패한 단계를 확인한다. `bench` 단계는 절대 시간 기준이라 CI 러너가 느리면 실패할 수 있다. 이 경우 그냥 다시 실행해 본다.
- **`npm publish`가 E401/E403/E404로 실패**: 그 패키지의 Trusted Publisher 설정을 다시 확인한다(`npm trust list <패키지>`). 저장소, workflow 파일 이름(`release.yml`), environment(`npm`)가 정확히 같아야 한다.
- **배포는 됐는데 태그 push가 실패**: 다음 실행에서는 그 버전을 건너뛰므로 태그가 자동으로 생기지 않는다. 배포한 커밋에서 손으로 만든다: `git tag -a "<name>@<version>" -m "<name>@<version>" <commit>` 다음 `git push origin "<name>@<version>"`.
