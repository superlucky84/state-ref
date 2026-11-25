# MANUAL_TEST_CHECKLIST — state-ref 수정 및 개선 (2026-11-25)

- 작성일: 2026-11-25
- 작업 브랜치: `fix/improvement-2026-11-25` (기준 커밋: `main` `a6e72fd215fba63d77feabb00ef40c284836a3b9`)
- 상태: 미수행 (자동 검증 구현 후 릴리즈 전 확인용).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md)

---

## 실행 전 기록

- 검증 환경: Node `24.19.0`, pnpm `9.12.3`, 대상 커밋 SHA, `git status` clean 여부.
- 자동 검증(`pnpm gate`) 통과 기록과 사람의 확인 결과를 구분해 기록한다.

---

## M-IMP-01 — 코어 구독·순회·NaN 회귀 점검

관련: `RQ-IMP-01`, `RQ-IMP-02`, `RQ-IMP-03`, `RQ-IMP-05`, `RQ-IMP-06`, `DC-IMP-01`, `DC-IMP-04`, `DC-IMP-06`, `T-IMP-01`, `T-IMP-04`, `T-IMP-05`, `T-IMP-07`.

- [ ] `pnpm gate` 실행 결과에서 `bench`(읽기/쓰기/누적)와 `bundle`(minified gzip ≤ 3,800 B) 수치가 기준 이내인지 육안 확인한다.
- [ ] 기존 데모(예: React/Vue/Svelte 리스트 화면)에서 빈 배열에 항목 추가, 마지막 항목 삭제, 기존 항목 수정 시 화면이 정상 갱신되고 불필요한 콘솔 오류가 없는지 확인한다.
- [ ] DevTools를 켠 상태에서 `return false` 종료·재구독, 이미 abort된 시그널 반환, `NaN → NaN` 쓰기 시 구독 목록과 이벤트 타임라인이 기대와 일치하는지 확인한다.

통과: 번들·성능 예산 이내이며, 목록 증감 및 구독 수명 시나리오에서 누수·오류가 없다.
실패: 코어 gzip이 3,800 B를 초과하거나, 종료된 구독이 재실행·누수되거나, 목록 추가가 화면에 반영되지 않는다.

---

## M-IMP-02 — `draft` / `shared` / `batch` 경계 동작 점검

관련: `RQ-IMP-04`, `RQ-IMP-07`, `RQ-IMP-12`, `DC-IMP-02`, `DC-IMP-05`, `DC-IMP-06`, `T-IMP-03`, `T-IMP-06`, `T-IMP-08`.

- [ ] Starlight Garage 데모에서 equipment draft 편집·적용·취소 및 batched upgrade 시나리오가 기존과 동일하게 동작하는지 확인한다.
- [ ] `draft.watch(fn, { cache: false })` 및 `sharedWatch` 재구독 시나리오에서 예기치 않은 경고·오류가 없는지 확인한다.

통과: 기존 draft/batch 데모 회귀가 없고 독립 구독 및 재구독이 의도대로 동작한다.
실패: draft/batch 데모에서 상태 불일치나 unhandled rejection/error가 발생한다.

---

## M-IMP-03 — Svelte 커넥터 내장 객체(`Date`/`Map`/`Set`/`RegExp`) 점검

관련: `RQ-IMP-08`, `DC-IMP-03`, `T-IMP-02`.

- [ ] Svelte 데모 또는 로컬 Svelte 컴포넌트에서 `Date` 값을 스토어에 두고 `$dateStore = new Date(...)`로 교체했을 때 무한 루프 없이 새 시각이 화면과 스토어에 반영되는지 확인한다.
- [ ] 기존 Svelte 데모(Starlight Garage Svelte 화면)의 일반 객체·배열·중첩 쓰기가 회귀 없이 동작하는지 확인한다.

통과: 내장 객체 마운트·변경 시 무한 루프와 쓰기 누락이 모두 없고 기존 Svelte 동작이 유지된다.
실패: 콘솔에 `subscriber write loop exceeded` 오류가 나거나 `$store` 대입이 무시된다.

---

## M-IMP-04 — 패키징·소비자 타입·문서 위생 점검

관련: `RQ-IMP-15`, `RQ-IMP-16`, `DC-IMP-07`, `T-IMP-10`.

- [ ] `packages/state-ref/package.json`의 `exports` 서브패스와 `typesVersions` 항목이 1:1 일치하는지 눈으로 대조한다.
- [ ] 저장소 루트에 빈 파일 `@`이 존재하지 않고 `git status`에 잔여 임시 파일이 없는지 확인한다.
- [ ] `CLAUDE.md`의 Node/pnpm 버전, 패키지 목록, 서브패스 설명, 주요 명령이 실제 `package.json`·`.nvmrc`와 일치하는지 확인한다.

통과: `typesVersions` 누락이 없고, 루트 위생과 `CLAUDE.md` 내용이 현재 저장소와 일치한다.
실패: 공개 서브패스 중 `typesVersions`에 빠진 항목이 있거나 `CLAUDE.md`에 구버전(Node 20.3.0 등) 안내가 남아 있다.
