# state-ref

> UI 라이브러리에 쉽게 통합될 수 있는 범용 상태 관리 라이브러리

![sref](https://github.com/user-attachments/assets/93e54d8f-1326-482c-b2f6-e9822386425b)

`StateRef`는 데이터 불변성을 중심으로 한 상태 관리 라이브러리입니다.

이 라이브러리는 프록시와 함수형 프로그래밍의 렌즈 패턴을 결합하여 깊게 구조화된 데이터에 효율적이고 안전하게 접근하고 수정할 수 있게 합니다.

다른 상태 관리 라이브러리에 비해 더 직접적이고 세밀한 상태 관리를 제공합니다.

또한 다른 UI 라이브러리와의 쉬운 통합을 위해 설계되었습니다. React, Preact, Vue, Svelte, Solid, Lithent와의 연결을 위한 코드 스니펫을 제공하며, 사용자가 자신의 연결 스니펫을 만들 수도 있습니다.

* 목차
    * [감사](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#acknowledgements)
    * [기본 사용법](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#basic-usage)
    * [React와의 사용법 (Preact와 동일)](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-react-same-for-preact)
    * [Svelte와의 사용법](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-svelte)
    * [Vue와의 사용법](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-vue)
    * [Solid와의 사용법](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-solid)
    * [Lithent와의 사용법](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-lithent)
    * [Flux와 유사한 상태 관리 지원](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#supports-flux-like-state-management)
    * [npm](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#npm)
    * [테스트](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#test)

## 감사

다음 사람들과 프로젝트에 감사의 말씀을 전하고 싶습니다:

- **[Juho Vepsäläinen](https://survivejs.com)**: [통찰력 있는 인터뷰](https://survivejs.com/blog/state-ref-interview/)에 감사드리며, 블로그에 저를 소개해 주셔서 감사합니다. 당신의 작업과 자바스크립트 커뮤니티에 대한 기여는 큰 영감을 주었습니다.
- **[lens.ts](https://github.com/hatashiro/lens.ts)**: 이 프로젝트는 MIT 라이센스 하에 라이센스된 `lens.ts` 프로젝트에서 일부 코드를 포함하고 있습니다.
  - lens.ts: 불변 데이터 구조를 다루기 위한 TypeScript 유틸리티입니다.
  - [MIT 라이센스](https://github.com/hatashiro/lens.ts/blob/master/LICENSE).

## 기본 사용법

기본 원칙은 구독 함수가 `.value`를 통해 검색된 값에만 반응하며, `.value=`로 값을 할당할 때 해당 값이 이미 구독되었다면 구독 함수가 트리거된다는 것입니다.

아래는 간단한 사용 예시입니다.

```typescript
import { createStore } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

const watch = createStore<People>({
    john: {
        age: 20,
        house: [
            { color: "red", floor: 5 },
            { color: "red", floor: 5 },
        ],
    },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
    sara: { age: 26, house: [{ color: "red", floor: 5 }] },
});

// 참조 가져오기
const stateRef = watch();

// 값 사용하기
console.log(stateRef.john.house[1].color.value);

// 값 변경하기
stateRef.john.house[1].color.value = "yellow";

// 구독하기
watch((stateRef) => {
    console.log(
        "Changed John's Second House Color",
        stateRef.john.house[1].color.value
    );
});
```

초기 상태를 `createStore` 함수를 사용하여 정의하면 `watch`가 반환되어 값에 구독하거나 참조할 수 있습니다.

`watch`로 구독 함수에 등록하면 값이 변경될 때 트리거됩니다.

구독 함수에 전달된 첫 번째 인자는 `stateRef`이며, `stateRef`의 `value` 속성을 사용하여 값을 검색할 수 있습니다. 구독 함수는 참조된 값이 변경될 때만 실행됩니다.

다른 예시는 다음과 같습니다.

```typescript
const stateRef = watch((stateRef) => {
    console.log(
        "Changed John's Second House Color",
        stateRef.john.house[1].color.value
    );
});

const {
    john: {
        house: [, { color: colorhandleref }],
    },
} = stateRef;

stateRef.john.house[1].color.value = "blue";
colorHandleRef.value = "green";
```

`watch` 함수는 `stateRef`를 반환합니다. 반환된 `stateRef`를 통해 구독 함수 외부에서 값을 변경하거나 참조할 수 있습니다.

`stateRef`에서 직접 체이닝하여 변경하고자 하는 부분의 `.value`에 값을 할당하면, 스토어의 원본 데이터는 `copyOnWrite`가 적용되어 반영됩니다.

예제에서 볼 수 있듯이, 비구조화 할당 연산자를 사용하여 특정 상태에 대한 참조를 직접 추출하고 사용할 수 있습니다.

반자동 업데이트를 피하고 싶다면, 구독 함수와 연결되지 않은 `new stateRef`를 사용할 수 있습니다.

```typescript
const otherStateRef = watch();
```

구독을 취소하고 싶다면 아래 예시와 같이 `abortController`를 사용합니다.

```typescript
const abortController = new AbortController();

watch((stateRef) => {
    console.log(
        "Changed John's Second House Color",
        stateRef.john.house[1].color.value
    );

    return abortController.signal;
});

abortController.abort(); // abort 실행
```

**프리미티브 타입**인 숫자나 문자열도 쉽게 처리할 수 있습니다. 방법은 다음과 같습니다.

```typescript
const watch = createStore<number>(3);

watch((stateRef) => {
    console.log(
        "Changed Primitive Number",
        stateRef.value
    );
});
```

## React와의 사용법 (Preact와 동일)

다른 UI 라이브러리와 쉽게 통합할 수 있으며, 아래는 React를 사용한 예입니다.

### profileStore.ts

> 스토어를 생성하고 `watch`를 `connectReact`에 전달하여 컴포넌트에서 사용할 수 있는 상태를 만듭니다.

```typescript
import { connectReact } from "@stateref/connect-react";
// import { connectPreact } from "@stateref/connect-preact"; // Preact의 경우
import { createStore } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

const watch = createStore<People>({
    john: {
        age: 20,
        house: [
            { color: "red", floor: 5 },
            { color: "red", floor: 5 },
        ],
    },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
    sara: { age: 26, house: [{ color: "red", floor: 5 }] },
});

export const useProfileStore = connectReact(watch);
```

### UserComponent.tsx

```tsx
import { useProfileStore } from 'profileStore';

function UserComponent() {
  const {
    john: { age: ageRef },
  } = useProfileStore();

  const increaseAge = () => {
    ageRef.value += 1;
  };

  return (
    <button onClick={increaseAge}>
        john's age: {ageRef.value}
    </button>
  );
}
```

위 예제에서 `useProfileStore`는 `stateRef`를 직접 반환하여 값에 대한 접근과 수정이 `copyOnWrite`를 통해 쉽게 이루어집니다.

자신만의 사용자 정의 연결 패턴을 만들 수 있으며, [connectReact 구현 코드](https://github.com/superlucky84/state-ref/blob/main/packages/connect-react/src/index.ts)를 참조하면 됩니다.

## Svelte와의 사용법

React 및 Preact의 `useProfile` 함수가 직접 `stateRef`를 반환하는 반면, SvelteConnect는 Svelte의 내장 반응형 [Writable](https://svelte.dev/docs/svelte-store#writable)과 `stateRef` 상태

 값을 동기화합니다.

아래는 사용 예제입니다.

### profileStore.ts

```typescript
import { connectSvelte } from "@stateref/connect-svelte";
// ... React 예제와 동일
export const useProfileStore = connectSvelte(watch);
```

### UserComponent.svelte

```svelte
<script lang="ts">
import { useProfileStore } from 'profileStore';
const age = useProfileStore<number>(stateRef => stateRef.john.age);

function handleClick() {
  age.update(n => n + 1);
}
</script>

<button on:click={handleClick}>
    john's age is {$age}
</button>
```

스토어에서 객체를 참조하고 수정해야 할 경우, `copyable` 함수를 사용하여 `copyOnWrite`를 지원합니다.

```typescript
import { copyable } from "state-ref";
const profileObj = useProfileRef(stateRef => stateRef);

function handleClick() {
   profileObj.update(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

자신만의 커스터마이즈를 원하신다면 [connectSvelte 구현 코드](https://github.com/superlucky84/state-ref/blob/main/packages/connect-svelte/src/index.ts)를 참조하면 됩니다.

## Vue와의 사용법

Vue에서는 스토어가 연결되어 Vue의 내장 반응형 [Reactive](https://ko.vuejs.org/api/reactivity-core#reactive)과 `stateRef` 상태 값을 동기화하여 반환됩니다.

자신만의 커스터마이즈를 원하신다면 [connectVue 구현 코드](https://github.com/superlucky84/state-ref/blob/main/packages/connect-vue/src/index.ts)를 참조하면 됩니다.

### profileStore.ts

```typescript
import { connectVue } from "@stateref/connect-vue";
// ... React 예제와 동일
export const useProfileStore = connectVue(watch);
```

### UserComponent.vue

```vue
<script setup lang="ts">
import { useProfileStore } from 'profileStore';

const age = useProfileStore<number>(store => store.john.age);

const incrementFromProfile = () => {
  // 이것은 stateRef와 동일하게 보이지만, Vue의 반응형 값입니다.
  age.value += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    john's age is: {{ age.value }}
  </button>
</template>
```

## Solid와의 사용법

Solid는 `stateRef`를 직접 사용하지 않고, `stateRef` 상태 값과 동기화된 Solid의 내장 반응형 [Signal](https://www.solidjs.com/docs/latest/api#basic-reactivity)을 반환합니다.

자신만의 커스터마이즈를 원하신다면 [connectSolid 구현 코드](https://github.com/superlucky84/state-ref/blob/main/packages/connect-solid/src/index.ts)를 참조하면 됩니다.

### profileStore.ts

```typescript
import { connectSolid } from "@stateref/connect-solid";
// ... React 예제와 동일
export const useProfileStore = connectSolid(watch);
```

### UserComponent.tsx

```tsx
import { useProfileStore } from 'profileStore';

function UserComponent() {
    const [age, setAge] = useProfileStore<number>(store => store.john.age);

    function increaseAge() {
      setAge(age => age + 1);
    }

    return (
      <button onClick={increaseAge}>
          john's age: {age()}
      </button>
    );
}
```

Signal이 스토어에서 객체를 참조하고 수정해야 할 경우, `copyable` 함수를 사용하여 `copyOnWrite`를 지원합니다.

```typescript
import { copyable } from "state-ref";
const [profileObj, setProfileObj] = useProfileStore(stateRef => stateRef);

function handleClick() {
   setProfileObj(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

## Lithent와의 사용법

### profileStore.ts

> [Lithent](https://github.com/superlucky84/lithent)에서는 연결 코드 없이 `watch`를 직접 사용할 수 있습니다.

```typescript
import { createStore } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

export const watch = createStore<People>({
    john: {
        age: 20,
        house: [
            { color: "red", floor: 5 },
            { color: "red", floor: 5 },
        ],
    },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
    sara: { age: 26, house: [{ color: "red", floor: 5 }] },
});
```

### UserComponent.tsx

```tsx
import { mount, h } from 'lithent';
import { watch } from 'profileStore';

const UserComponent = mount(r => {
    const {
        john: { age: ageRef },
    } = watch(r);

    const increaseAge = () => {
        ageRef.value += 1;
    };

    return () => (
        <button onClick={increaseAge}>
            john's age: {ageRef.value}
        </button>
    );
});
```

## Flux와 유사한 상태 관리 지원

사용자가 중앙 집중식 스토어 패턴을 사용하여 상태를 관리하기를 원한다면, `state-ref`는 `createStoreManualSync` 함수를 통해 유연성을 제공합니다. 이 모드는 `Flux`와 같은 중앙 집중식 패턴을 구현하기 쉽게 만들어줍니다.

아래는 React를 사용한 간단한 `Flux-like` 예제입니다.

### profileStore

`createStoreManualSync`는 `updateRef`, `sync`와 함께 `watch`를 반환합니다.

기본 모드에서는 `watch`로 생성된 참조를 통해 값을 수정할 수 있지만, `manualSync` 모드에서는 `watch`를 통해 값을 수정할 수 없습니다.

값을 업데이트하려면 `updateRef`를 사용해야 하며, 구독 코드에 변경 사항을 전파하려면 (구독 콜백을 트리거하려면) 원하는 시간에 `sync` 함수를 수동으로 실행해야 합니다.

```typescript
import { createStoreManualSync } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

const { watch, updateRef, sync } = createStoreManualSync<People>({
    john: { age: 20, house: [ { color: "red", floor: 5 }] },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
});

export const useProfileStore = connectReact(watch);

// John's age 변경을 위한 액션
export const changeJohnAge = (newAge: number) => {
    updateRef.john.age.value = newAge;
    sync();
};

// Brown의 첫 번째 집 정보를 변경하기 위한 액션
export const changeBrownFirstHouseInfo = (
    firstHouseInfo = { color: 'blue', floor: 7 }
) => {
    updateRef.brown.house[0].value = firstHouseInfo;
    sync();
};
```

### UserComponent.tsx

값은 `profileStore`에서 생성한 액션을 통해서만 업데이트할 수 있습니다. 다른 방법으로 값을 수정하려고 하면 오류가 발생합니다.

```tsx
import { useProfileStore, changeJohnAge } from 'profileStore';

function UserComponent() {
  // watch나 connect를 통해 받은 stateRef는 참조용일 뿐입니다.
  // (직접 수정은 허용되지 않습니다.)
  const {
    john: { age: ageRef },
  } = useProfileStore();

  const increaseAge = () => {
    // 'ageRef'를 직접 수정하려고 하면 오류가 발생합니다.
    // ageRef.value += 1; // 

    // 반드시 액션의 updateRef를 통해 참조를 수정해야 합니다.
    // 그 후, 구독 코드가 sync 함수를 통해 동기화됩니다.
    changeJohnAge(ageRef.value + 1);
  };

  return (
    <button onClick={increaseAge}>
        john's age: {ageRef.value}
    </button>
  );
}
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)

## 테스트

> 플러그인은 테스트를 수행하기 전에 빌드해야 합니다.

```bash
pnpm install
pnpm build
pnpm test
```
