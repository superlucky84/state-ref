# state-ref

> Universal state management library that can be easily integrated into UI libraries

* [README_KR](https://github.com/superlucky84/state-ref/blob/main/README_KR.md)

![sref](https://github.com/user-attachments/assets/93e54d8f-1326-482c-b2f6-e9822386425b)

`StateRef` is a state management library focused on data immutability.

It combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data.

It provides more direct and fine-grained state management compared to other types of state management libraries.

It is also designed for easy integration with other UI libraries. We provide code snippets for connecting with React, Preact, Vue, Svelte, Solid, and Lithent , and users can also create their own connection snippets.


* Table of Contents
    * [Acknowledgements](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#acknowledgements)
    * [Basic Usage](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#basic-usage)
    * [Usage with React (Same for Preact)](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-react-same-for-preact)
    * [Usage with Svelte](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-svelte)
    * [Usage with Vue](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-vue)
    * [Usage with Solid](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-solid)
    * [Usage with Lithent](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#usage-with-lithent)
    * [Supports Flux-like State Management](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#supports-flux-like-state-management)
    * [npm](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#npm)
    * [test](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#test)

## Acknowledgements

I would like to extend my gratitude to the following people and projects:

- **[Juho Vepsäläinen](https://survivejs.com)**: Thank you for the [insightful interview](https://survivejs.com/blog/state-ref-interview/) and featuring me on your blog. Your work and contributions to the JavaScript community have been a great source of inspiration.
- **[lens.ts](https://github.com/hatashiro/lens.ts)**: This project includes portions of code from the `lens.ts` project, which is licensed under the MIT License.
  - lens.ts: A TypeScript utility for working with immutable data structures.
  - Licensed under the [MIT License](https://github.com/hatashiro/lens.ts/blob/master/LICENSE).
  


## Basic Usage

The basic principle is that the subscription function only reacts to values retrieved through `.value`, and when a value is assigned with `.value=`, the subscription function is triggered if the value is already subscribed.

Below is a simple usage example.

```typescript
import { createStore } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

// const watch = createStore<number>(3); // Primitive types can also be used easily."
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

// Get references
const stateRef = watch();

// Using value.
console.log(stateRef.john.house[1].color.value);

// Change value.
stateRef.john.house[1].color.value = "yellow";

// To subscribe
watch((stateRef) => {
    console.log(
        "Changed John's Second House Color",
        stateRef.john.house[1].color.value
    );
});
```

When you define the initial state using the `createStore` function, it returns `watch`, which helps you subscribe to or reference the values.

You can register a subscription function with `watch` that triggers when the value changes.

The first argument passed to the subscription function is `stateRef`, and by using the `value` property of `stateRef`, you can retrieve the value. The subscription function will only execute when the referenced value changes.

Here is another example:

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

The `watch` function returns a `stateRef`. Through the returned `stateRef`, you can change or reference values outside of the subscription function.

By chaining directly from the `stateRef` and assigning a value to the `.value` of the part you want to change, the original data in the store will be reflected with `copyOnWrite` applied.

You can see in the example that you can use the destructuring operator to directly extract a reference to a specific state and use it.

If you simply read the `.value` from the returned `stateRef`, any changes to that value will automatically trigger the subscription function."

If you want to avoid automatic updates, you can use a `new stateRef` that is not connected to the subscription function.

```typescript
const otherStateRef = watch();
```

If you want to cancel the subscription, use `abortController` as shown in the example below.

```typescript
const abortController = new AbortController();

watch((stateRef) => {
    console.log(
        "Changed John's Second House Color",
        stateRef.john.house[1].color.value
    );

    return abortController.signal;
});

abortController.abort(); // run abort
```

**Primitive types** like numbers or strings can also be handled easily. Here's how:

```typescript
const watch = createStore<number>(3);

watch((stateRef) => {
    console.log(
        "Changed Privitive Number",
        stateRef.value
    );
});

```

## Usage with React (Same for Preact)

It can be easily integrated with other UI libraries, and below is an example using React.

### profileStore.ts

> Create the store and pass the `watch` to `connectReact` to create a state that can be used in components.

```typescript
import { connectReact } from "@stateref/connect-react";
// import { connectPreact } from "@stateref/connect-preact"; // for Preact
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
    </button>;
  );
}
```

In the example above, `useProfileStore` directly returns `stateRef`, allowing easy access to values and modification through `copyOnWrite`.

You can create your own custom connection pattern by referring to the [connectReact implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-react/src/index.ts).


## Usage with Svelte

While React and Preact's `useProfile` function directly returns `stateRef`, SvelteConnect returns Svelte's built-in reactive [Writable](https://svelte.dev/docs/svelte-store#writable) synchronized with the `stateRef` state value.

Below is a usage example.

### profileStore.ts

```typescript
import { connectSvelte } from "@stateref/connect-svelte";
// ... same as React example
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

If Writable needs to reference and modify an object from the store, the `copyable` function is available to assist with `copyOnWrite`.

```typescript
import { copyable } from "state-ref";
const profileObj = useProfileRef(stateRef => stateRef);

function handleClick() {
   profileObj.update(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

You can customize it by referring to the [connectSvelte implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-svelte/src/index.ts).


## Usage with Vue

In Vue, the store is connected and returns Vue's built-in reactive [Reactive](https://ko.vuejs.org/api/reactivity-core#reactive) synchronized with the `stateRef` state value.

You can customize it by referring to the [connectVue implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-vue/src/index.ts).

### profileStore.ts

```typescript
import { connectVue } from "@stateref/connect-vue";
// ... same as React example
export const useProfileStore = connectVue(watch);
```

### UserComponent.vue

```vue
<script setup lang="ts">
import { useProfileStore } from 'profileStore';

const age = useProfileStore<number>(store => store.john.age);

const incrementFromProfile = () => {
  // This looks the same as stateRef, but it's a Reactive value in Vue.
  age.value += 1;
};
</script>

<template>
  <button @click="incrementFromProfile">
    john's age is: {{ age.value }}
  </button>
</template>
```


## Usage with Solid

Solid does not directly use `stateRef` but returns Solid's built-in reactive [Signal](https://www.solidjs.com/docs/latest/api#basic-reactivity) synchronized with the `stateRef` state value.

You can customize it by referring to the [connectSolid implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-solid/src/index.ts).


### profileStore.ts

```typescript
import { connectSolid } from "@stateref/connect-solid";
// ... same as React example
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
      </button>;
    );
}
```

If Signal needs to reference and modify an object from the store, the `copyable` function is available to assist with `copyOnWrite`.

```typescript
import { copyable } from "state-ref";
const [profileObj, setProfileObj] = useProfileStore(stateRef => stateRef);

function handleClick() {
   setProfileObj(n => copyable(n).john.age.writeCopy(n.john.age + 1));
}
```

## Usage with Lithent

### profileStore.ts

> In [Lithent](https://github.com/superlucky84/lithent), you can use it directly with watch without needing a connect code.



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
        </button>;
    );
});
```

## Supports Flux-like State Management
   
If users prefer to manage state using a centralized store pattern, `state-ref` provides flexibility with the `createStoreManualSync` function. This mode makes it easier to implement centralized patterns like `Flux`.

Below is a simple `Flux-like` example using `createStoreManualSync` with React.

### profileStore

`createStoreManualSync` returns `updateRef` and `sync`, along with `watch`.

In the default mode, values can be modified through the references created by `watch`. However, in `manualSync` mode, values cannot be modified via `watch`.

To update values, you must use `updateRef`. To propagate the changes to subscribed code (and trigger subscription callbacks), you can manually execute the `sync` function at your desired time.

```typescript
import { createStoreManualSync } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };
type People = { john: Info; brown: Info; sara: Info };

const { watch, updateRef, sync } = createStoreManualSync<People>({
    john: { age: 20, house: [ { color: "red", floor: 5 }] },
    brown: { age: 26, house: [{ color: "red", floor: 5 }] },
});

export const useProfileStore = connectReact(watch);

// Action to change John's age
export const changeJohnAge = (newAge: number) => {
    updateRef.john.age.value = newAge;
    sync();
};

// Action to change Brown's first house info
export const changeBrownFirstHouseInfo = (
    firstHouseInfo = { color: 'blue', floor: 7 }
) => {
    updateRef.brown.house[0].value = firstHouseInfo;
    sync();
};
```

### UserComponent.tsx

Values can only be updated through actions created by `profileStore`. Any attempt to modify the values in other ways will result in an error.

```tsx
import { useProfileStore, changeJohnAge } from 'profileStore';

function UserComponent() {
  // The stateRef received via watch or the values received via connect are for reference only
  // (direct modification is not allowed).
  const {
    john: { age: ageRef },
  } = useProfileStore();

  const increaseAge = () => {
    // An error occurs if you attempt to modify 'ageRef' directly.
    // ageRef.value += 1; // 

    // You must modify the reference through the action's updateRef.
    // Afterward, the subscribed code will synchronize via the sync function
    // (triggering subscription callbacks).
    changeJohnAge(ageRef.value + 1);
  };

  return (
    <button onClick={increaseAge}>
        john's age: {ageRef.value}
    </button>;
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

## test

> Plugins must be build before they can be tested.

```bash
pnpm install
pnpm build
pnpm test
```
