# StateRef Documentation Plan

이 문서는 StateRef 문서 사이트 작업 계획서입니다. 작업자는 이 문서를 참고하여 문서 페이지를 작성해주세요.

---

## 📋 작업 체크리스트

작업 완료 시 `[ ]`를 `[x]`로 변경해주세요.

### 1. Getting Started (시작하기)
- [x] Introduction (소개) - `Introduction.tsx`, `Introduction_ko.tsx`
- [x] Quick Start (빠른 시작) - `QuickStart.tsx`, `QuickStart_ko.tsx`

### 2. Core Concepts (핵심 개념)
- [x] createStore - `CreateStore.tsx`, `CreateStore_ko.tsx`
- [x] Watch Function (Watch 함수) - `Watch.tsx`, `Watch_ko.tsx`
- [x] Understanding References (참조 이해하기) - `References.tsx`, `References_ko.tsx`
- [x] StateRefStore - `StateRefStore.tsx`, `StateRefStore_ko.tsx`
- [x] Subscription (구독) - `Subscription.tsx`, `Subscription_ko.tsx`
- [x] Primitive Types (원시 타입) - `Primitives.tsx`, `Primitives_ko.tsx`

### 3. Advanced Usage (고급 사용법)
- [x] createComputed - `Computed.tsx`, `Computed_ko.tsx`
- [x] combineWatch - `CombineWatch.tsx`, `CombineWatch_ko.tsx`
- [x] Manual Sync / Flux (수동 동기화) - `ManualSync.tsx`, `ManualSync_ko.tsx`

### 4. Helper Functions (헬퍼 함수)
- [x] Lens Pattern (Lens 패턴) - `Lens.tsx`, `Lens_ko.tsx`
- [x] copyable - `Copyable.tsx`, `Copyable_ko.tsx`
- [x] cloneDeep - `CloneDeep.tsx`, `CloneDeep_ko.tsx`

### 5. Framework Integration (프레임워크 연동)
- [x] React - `React.tsx`, `React_ko.tsx`
- [x] Preact - `Preact.tsx`, `Preact_ko.tsx`
- [x] Vue - `Vue.tsx`, `Vue_ko.tsx`
- [x] Svelte - `Svelte.tsx`, `Svelte_ko.tsx`
- [x] Solid - `Solid.tsx`, `Solid_ko.tsx`
- [x] Lithent - `Lithent.tsx`, `Lithent_ko.tsx`
- [x] Custom Connector (커스텀 커넥터) - `CustomConnector.tsx`, `CustomConnector_ko.tsx`

### 6. API Reference (선택사항)
- [x] Core API (코어 API) - `ApiCore.tsx`, `ApiCore_ko.tsx`
- [x] Helper API (헬퍼 API) - `ApiHelpers.tsx`, `ApiHelpers_ko.tsx`
- [x] TypeScript Types (타입) - `ApiTypes.tsx`, `ApiTypes_ko.tsx`

### 🔧 설정 작업
- [x] Layout.tsx 라우트 등록
- [x] Sidebar.tsx 메뉴 등록
- [x] 모든 라우트 등록 완료
- [x] 모든 메뉴 항목 등록 완료

---

**진행 현황: 21 / 21 완료 (100%)**

---

## 프로젝트 구조

```
stateRefDocs/
├── src/
│   ├── components/
│   │   ├── Layout.tsx      # 라우트 등록
│   │   ├── Sidebar.tsx     # 메뉴 등록
│   │   └── Header.tsx
│   ├── pages/              # 문서 페이지 (영문/한글)
│   │   ├── Home.tsx
│   │   ├── Home_ko.tsx
│   │   ├── Introduction.tsx
│   │   ├── Introduction_ko.tsx
│   │   └── ...
│   ├── store.ts
│   └── index.tsx
└── ...
```

## 새 페이지 추가 방법

1. `src/pages/` 에 페이지 컴포넌트 생성 (영문 + 한글)
2. `src/components/Layout.tsx` 의 `routes` 객체에 라우트 등록
3. `src/components/Sidebar.tsx` 의 `menuData` 배열에 메뉴 항목 추가

---

## 문서 목차 구조

### 1. Getting Started (시작하기)

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/guide/introduction` | Introduction | 소개 | `Introduction.tsx` | ✅ 완료 |
| `/guide/quick-start` | Quick Start | 빠른 시작 | `QuickStart.tsx` | ✅ 완료 |

**내용 가이드:**
- **Introduction**: StateRef 개요, 주요 특징, 설치 방법 (`npm install state-ref`)
- **Quick Start**: 첫 번째 스토어 만들기, createStore 기본 사용법, .value로 읽기/쓰기

---

### 2. Core Concepts (핵심 개념)

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/guide/create-store` | createStore | createStore | `CreateStore.tsx` | ✅ 완료 |
| `/guide/watch` | Watch Function | Watch 함수 | `Watch.tsx` | ✅ 완료 |
| `/guide/references` | Understanding References | 참조 이해하기 | `References.tsx` | ✅ 완료 |
| `/guide/state-ref-store` | StateRefStore | StateRefStore | `StateRefStore.tsx` | ✅ 완료 |
| `/guide/subscription` | Subscription | 구독 | `Subscription.tsx` | ✅ 완료 |
| `/guide/primitives` | Primitive Types | 원시 타입 | `Primitives.tsx` | ✅ 완료 |

**내용 가이드:**
- **createStore**: 스토어 생성 API, 초기값 설정, 타입 지정
- **Watch Function**: watch 함수의 두 가지 사용법 (구독 vs 참조)
- **Understanding References**: innerRef(내부 참조), outerRef(외부 참조), unbound reference(언바운드 참조) 개념, 추적되는 참조 vs 추적되지 않는 참조
- **StateRefStore**: .value 프로퍼티 접근, 프록시 동작 원리, 깊은 중첩 접근
- **Subscription**: 구독 콜백 작성, isFirst 파라미터, AbortController로 구독 취소
- **Primitive Types**: number, string 등 원시 타입 스토어 다루기

---

### 3. Advanced Usage (고급 사용법)

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/guide/computed` | createComputed | createComputed | `Computed.tsx` | ✅ 완료 |
| `/guide/combine-watch` | combineWatch | combineWatch | `CombineWatch.tsx` | ✅ 완료 |
| `/guide/manual-sync` | Manual Sync (Flux) | 수동 동기화 (Flux) | `ManualSync.tsx` | ✅ 완료 |

**내용 가이드:**
- **createComputed**: 여러 watch에서 파생 값 계산, 읽기 전용 computed 값
- **combineWatch**: 여러 watch를 하나로 결합, 튜플 구조, 중첩 결합
- **Manual Sync (Flux)**: createStoreManualSync, updateRef와 sync(), Flux 패턴 구현

---

### 4. Helper Functions (헬퍼 함수)

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/guide/lens` | Lens Pattern | Lens 패턴 | `Lens.tsx` | ✅ 완료 |
| `/guide/copyable` | copyable | copyable | `Copyable.tsx` | ✅ 완료 |
| `/guide/clone-deep` | cloneDeep | cloneDeep | `CloneDeep.tsx` | ✅ 완료 |

**내용 가이드:**
- **Lens Pattern**: lens() 함수, chain()으로 경로 탐색, get()/set()으로 불변 업데이트
- **copyable**: copyOnWrite 헬퍼, writeCopy() 메서드 사용법
- **cloneDeep**: 깊은 복사 유틸리티, 사용 케이스

---

### 5. Framework Integration (프레임워크 연동)

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/guide/react` | React | React | `React.tsx` | ✅ 완료 |
| `/guide/preact` | Preact | Preact | `Preact.tsx` | ✅ 완료 |
| `/guide/vue` | Vue | Vue | `Vue.tsx` | ✅ 완료 |
| `/guide/svelte` | Svelte | Svelte | `Svelte.tsx` | ✅ 완료 |
| `/guide/solid` | Solid | Solid | `Solid.tsx` | ✅ 완료 |
| `/guide/lithent` | Lithent | Lithent | `Lithent.tsx` | ✅ 완료 |
| `/guide/custom-connector` | Custom Connector | 커스텀 커넥터 | `CustomConnector.tsx` | ✅ 완료 |

**내용 가이드:**
- **React**: `@stateref/connect-react` 설치, connectReact() 사용법, 컴포넌트 예제
- **Preact**: `@stateref/connect-preact` 설치, connectPreact() 사용법
- **Vue**: `@stateref/connect-vue` 설치, connectVue() 사용법
- **Svelte**: `@stateref/connect-svelte` 설치, connectSvelte() 사용법
- **Solid**: `@stateref/connect-solid` 설치, connectSolid() 사용법
- **Lithent**: 커넥터 없이 watch를 직접 renew와 연결하는 방법
- **Custom Connector**: 직접 커넥터 만들기, connectReact 구현 코드 분석

---

### 6. API Reference (API 레퍼런스) - 선택사항

| 라우트 | 영문 제목 | 한글 제목 | 파일명 | 상태 |
|--------|----------|----------|--------|------|
| `/api/core` | Core API | 코어 API | `ApiCore.tsx` | ✅ 완료 |
| `/api/helpers` | Helper API | 헬퍼 API | `ApiHelpers.tsx` | ✅ 완료 |
| `/api/types` | TypeScript Types | 타입스크립트 타입 | `ApiTypes.tsx` | ✅ 완료 |

**내용 가이드:**
- **Core API**: createStore, createStoreManualSync 시그니처 및 옵션
- **Helper API**: lens, copyable, cloneDeep, createComputed, combineWatch 시그니처
- **TypeScript Types**: StateRefStore<T>, Watch<T>, Renew<T>, ManualSyncStore<T>

---

## 작업 우선순위

### 1차 (핵심) - 먼저 작업
- [ ] Quick Start
- [ ] createStore
- [ ] Watch Function
- [x] React

### 2차 (중요)
- [ ] Subscription
- [ ] createComputed
- [ ] combineWatch
- [x] Manual Sync (Flux)

### 3차 (완성도)
- [ ] StateRefStore
- [ ] Primitives
- [ ] Preact, Vue, Svelte, Solid, Lithent
- [x] Lens, copyable, cloneDeep

### 4차 (선택)
- [ ] Custom Connector
- [ ] API Reference 전체

---

## 페이지 작성 템플릿

```tsx
import { mount } from 'lithent';

export const PageName = mount(() => {
  return () => (
    <div>
      <h1>Page Title</h1>

      <p>
        Introduction paragraph explaining the concept.
      </p>

      <h2>Basic Usage</h2>

      <p>Description of basic usage.</p>

      <pre>
        <code>
{`// Code example
const example = 'code';`}
        </code>
      </pre>

      <h2>Advanced Example</h2>

      <p>More detailed explanation.</p>

      <pre>
        <code>
{`// Advanced code example`}
        </code>
      </pre>

      <h2>API</h2>

      <ul>
        <li><code>param1</code> - Description of param1</li>
        <li><code>param2</code> - Description of param2</li>
      </ul>
    </div>
  );
});
```

---

## 참고 자료

- [README.md](/README.md) - 메인 프로젝트 문서
- [CLAUDE.md](/CLAUDE.md) - 프로젝트 아키텍처 설명
- [packages/state-ref/src/](/packages/state-ref/src/) - 코어 소스 코드
- [packages/connect-react/src/](/packages/connect-react/src/) - React 커넥터 구현

---

## 진행 상황

- **총 페이지**: 21개 (API Reference 제외)
- **완료**: 21개
- **진행률**: 100%

마지막 업데이트: 2026-01-22
