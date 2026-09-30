# Phase 7.3 — 타입 Negative Case와 배포 경계

**진입:** Phase 7.2의 모델 대조와 전체 gate 통과.
**범위:** Phase 7 항목 5의 타입 negative case, 배포 `exports`, 지원 모듈 형식, baseline 대비 비용.
**종료:** 선언한 진입점이 지원 소비자 형태에서 모두 해석됨, 발견한 결함 수정, 회귀 검사 gate 편입.

## 발견한 결함

- [x] **결함 1 / CJS `require` 전면 고장:** `"type": "module"` 패키지에서 UMD를 `.js`로 내보내면 Node가 ESM으로 파싱한다. UMD 래퍼의 `typeof exports` 분기가 죽어 `require('state-ref')`·`state-ref/draft`·커넥터 5종이 **빈 네임스페이스**를 돌려주고, `state-ref/batch`는 **예외를 던졌다**. `dist/package.json`에 `{"type":"commonjs"}`를 두는 우회는 self-reference import를 깨뜨려 쓸 수 없음을 확인했다.
- [x] **결함 2 / 선언의 확장자 없는 상대 import:** 배포한 `.d.ts`가 `./core` 같은 확장자 없는 경로를 쓴다. ESM 패키지의 선언이므로 `node16`/`nodenext`에서 TS2834가 나고, **ESM 소비자**도 영향을 받았다.
- [x] **결함 3 / CommonJS 선언 부재:** `types`가 하나뿐이라 CJS 소비자는 런타임이 고쳐진 뒤에도 TS1479로 거절됐다.

## 요구와 결정

- [x] **DC7-3-01 / 별도 CJS 산출물:** `exports.require`와 `main`은 새 `dist/*.cjs`를 가리키고, 기존 `dist/*.umd.js`는 `<script>` 태그용으로 유지한다. 이미 배포된 UMD 경로를 깨지 않는다.
- [x] **DC7-3-02 / 선언 후처리:** 빌드 뒤 `.d.ts`의 상대 import에 명시적 `.js`를 붙이고, `require`를 광고하는 패키지에만 `.cjs` 확장자로 재작성한 `.d.cts` 트리를 만든다. ESM 전용 패키지에는 만들지 않고 남아 있으면 지운다.
- [x] **DC7-3-03 / 조건별 types:** `exports`를 `import`/`require`별 `{types, default}` 형태로 바꾼다. `state-ref/plugin`과 `@stateref/sync`는 ESM 전용을 유지해 `require`가 `ERR_PACKAGE_PATH_NOT_EXPORTED`로 **명확히 실패**한다. 조용히 빈 객체를 주지 않는 것이 계약이다.
- [x] **DC7-3-04 / 타입이 못 막는 것은 런타임이 막는다:** 두 가지는 타입으로 좁히지 않고 런타임 거절을 계약으로 고정한다. `QueryKey`는 `readonly unknown[]`이라 비-JSON 값을 허용하지만 hash가 거절한다(좁히면 무한 조회의 page parameter 제네릭까지 제약해야 해 공개 API 변경이 된다). reactive status 쓰기는 타입을 통과하지만 ref guard가 거절한다.
- [x] **DC7-3-05 / 회귀 방지:** 배포 경계 검사를 gate에 넣는다. 선언한 모든 경로의 존재, 지원 진입점의 `require`·`import` 해석, ESM 전용 진입점의 명확한 실패, `node16` ESM·CJS 소비자의 타입 해석을 확인한다. 빈 네임스페이스는 실패로 간주한다.

## 검증

- `scripts/check-packaging.mjs`를 gate의 `packaging` 단계로 추가했다. 원래 결함을 재현해 검사가 잡는지 확인했다: `require` 조건을 UMD로 되돌리면 `state-ref: require resolved to an empty namespace`와 `state-ref/batch: require threw ...`로 실패한다. 선언의 확장자를 제거해도 실패한다.
- `packages/sync/test/negative-types.ts`를 gate의 `negative-types` 단계로 추가했다. 모든 `@ts-expect-error`는 자기 검증된다(컴파일되기 시작하면 tsc가 미사용 지시자를 보고한다). 처음 작성한 3건이 실제로는 통과해 결함 3·4로 분류했다.
- `packages/sync/src/tests/negative-runtime.test.ts`가 타입이 표현하지 못하는 두 거절을 고정한다.
- 비용: 기본 core minified gzip **3,433/3,500 B 불변**(소비자 ESM 번들 영향 없음). 배포 산출물은 `state-ref` 패킹 144.2 kB(`.cjs` 19.1 kB, `.d.cts` 28.3 kB 추가), `@stateref/sync`는 ESM 전용이라 불필요한 `.d.cts`를 빼 43.8 → **36.7 kB**로 줄었다.

## 인계

- done: 배포 결함 3건을 찾아 모두 고쳤다. CJS `require`가 6개 패키지에서 복구됐고, `node16`/`nodenext` 소비자가 ESM·CJS 양쪽에서 타입을 해석한다. `packaging`·`negative-types` gate 단계와 런타임 거절 반례를 추가했다. sync 런타임 **170개 테스트 PASS**, core **325개 PASS**, `pnpm gate` **PASS**.
- next: Phase 7의 마지막 하위 범위인 수명 반복·복구 중 pin·메모리 보존 사유(항목 4). 그 뒤 Phase 8.
- blockers: 외부 차단 없음. `QueryKey` 정밀화와 status 타입 readonly화는 공개 API 변경이라 별도 결정으로 남긴다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `68cb0cc` (Phase 7.2). Phase 7.3 변경은 이 문서와 같은 커밋에 있다.
