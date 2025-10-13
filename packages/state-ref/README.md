# state-ref

> Universal state management library that can be easily integrated into UI libraries

![sref](https://github.com/user-attachments/assets/93e54d8f-1326-482c-b2f6-e9822386425b)

`StateRef` is a state management library focused on data immutability.

It combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data.

It provides more direct and fine-grained state management compared to other types of state management libraries.

It is also designed for easy integration with other UI libraries. We provide code snippets for connecting with React, Preact, Vue, Svelte, Solid, and Lithent , and users can also create their own connection snippets.


* Table of Contents
    * [Basic Usage](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#basic-usage)

    * [Using with UI Libraries](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#using-with-ui-libraries)
        * [Usage with React](https://github.com/superlucky84/state-ref/tree/main/packages/connect-react)
        * [Usage with Preact](https://github.com/superlucky84/state-ref/tree/main/packages/connect-preact)
        * [Usage with Svelte](https://github.com/superlucky84/state-ref/tree/main/packages/connect-svelte)
        * [Usage with Vue](https://github.com/superlucky84/state-ref/tree/main/packages/connect-vue)
        * [Usage with Solid](https://github.com/superlucky84/state-ref/tree/main/packages/connect-solid)
        * Usage with Lithent

    * [Advanced Usage](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#advanced-usage)
        * [combineWatch](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#combinewatch)
        * [createComputed](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#createcomputed)
        * [supports flux like state management](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#supports-flux-like-state-management)


    * [Acknowledgements](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#acknowledgements)
    * [npm](https://github.com/superlucky84/state-ref/?tab=readme-ov-file#npm)


## Basic Usage

The basic principle is that the subscription function only reacts to values retrieved through `.value`, and when a value is assigned with `.value=`, the subscription function is triggered if the value is already subscribed.

### Understanding References: Inner vs Outer

When you register a subscription function via `watch`, it is executed once initially to collect dependencies. The second argument `isFirst` indicates whether this is the first run.

```typescript
const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log(matrixCount);
};

// outerRef: Bound to subscribeCallback
const outerRef = watch(subscribeCallback);

// anotherRef: Not bound to any subscription
const anotherRef = watch();
```

**Key Points:**
- Both `innerRef` (callback argument) and `outerRef` (return value) are **the same reference**
- Both are **bound to the subscription** - accessing `.value` from either registers tracking
- `anotherRef` is **unbound** - accessing `.value` doesn't register any tracking

```typescript
// This WON'T trigger subscribeCallback when etcCount changes
const anotherRef = watch();

const subscribeCallback = (innerRef, isFirst) => {
  const result =
    innerRef.rowCount.value *        // Tracked
    innerRef.columnCount.value *     // Tracked
    anotherRef.etcCount.value;       // NOT tracked
  console.log(result);
};

const outerRef = watch(subscribeCallback);

// Both trigger subscribeCallback
anotherRef.rowCount.value = 10;
anotherRef.columnCount.value = 5;

// This doesn't trigger subscribeCallback
anotherRef.etcCount.value = 2;
```

Besides the `innerRef` reference object used inside the subscription function, as seen in the previous example, the `outerRef` returned by `watch` allows access outside the subscription callback. This design makes it easier to integrate with components in a UI library.

To illustrate, I’ll use my project, the component-based UI library [lithent](https://github.com/superlucky84/lithent), as an example.

```typescript
const Component = mount((renew) => {
    let count = 1;
  
    const change = () => {
        count += 1;
        renew();
    };
  
    return () => <button onClick={change}>{count}</button>;
});
```

`mount` is a function that creates a component, and it provides a `renew` function as the first argument to the function it consumes.

The `renew` function requests an update for the component. In the example below, it increments the `count` value by 1 and then re-renders the component.

> In Lithent, calling update functions like `renew` is generally seen as an anti-pattern, but this approach was adopted to keep state management simple and practical using native closures.


If you want to share store values using `state-ref` instead of the component’s internal `count` state, you can do so as follows.

```typescript

const watch = createStore(1);

const Component = mount((renew) => {
    count countRef = watch(renew);
  
    const change = () => {
      countRef.value += 1;
    };
  
    return () => <button onClick={change}>{count.value}</button>;
});
```

By returning a proxy reference externally via `watch`, you can easily collect the subscription points outside of the subscription function, making it useful in various scenarios.

Using `outerRef`, you can effortlessly connect components with state.

Building on this feature, you can also connect state easily in `React` and `Preact` using simple snippets:

* [react snippet](https://github.com/superlucky84/state-ref/blob/main/packages/connect-react/src/index.ts)
* [preact snippet](https://github.com/superlucky84/state-ref/blob/main/packages/connect-preact/src/index.ts)


### cancel subscription

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

## Using with UI Libraries

### Usage with React

* It can be easily integrated with other UI libraries, and below is an example using React.

* Create the store and pass the `watch` to `connectReact` to create a state that can be used in components.

> profileStore.ts
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

> UserComponent.tsx

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

### Usage with ...

* [React](https://www.npmjs.com/package/@stateref/connect-react)
* [Preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [Svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [Vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [Solid](https://www.npmjs.com/package/@stateref/connect-solid)
* Lithent

    ```tsx
    import { mount, h } from 'lithent';
    import { watch } from 'profileStore';

    const UserComponent = mount(renew => {
        const { john: { age: ageRef } } = watch(renew);
        const increaseAge = () => { ageRef.value += 1 };

        return () => <button onClick={increaseAge}> john's age: {ageRef.value} </button>;
    });
    ```



## Advanced Usage

### combineWatch

`combineWatch` is a helper function that **observes multiple `Watch` instances together** and produces a new `Watch` that delivers their **combined values as a tuple-like structure**.

Unlike `createComputed`, which produces a **single derived value**, `combineWatch` focuses on **grouping multiple watches** so you can react to changes from any of them in a **single subscription**.
When combined multiple times, the structure naturally **nests**, allowing you to build **hierarchical watch compositions**.

#### Basic Usage

```typescript
import { createStore, combineWatch } from "state-ref";

const countWatch = createStore<number>(100);
const textWatch = createStore<string>("hello");

// Combine multiple watches into one
const combinedCountTextWatch = combineWatch([countWatch, textWatch] as const);

combinedCountTextWatch(([countRef, textRef], isFirst) => {
  console.log("Combined Watches:", countRef.value, textRef.value, isFirst);
});

// Update a watch
const countRef = countWatch();
countRef.value = 200; 
// → triggers callback with [200, "hello"]
```

#### Nested Combination

You can **nest `combineWatch`** to observe more complex structures:

```typescript
const countWatch = createStore<number>(100);
const textWatch = createStore<string>("hello");
const toggleWatch = createStore<boolean>(false);

// Combine countWatch and textWatch
const combinedCountTextWatch = combineWatch([countWatch, textWatch] as const);

// Nest the combined watch with toggleWatch
const combinedAllWatch = combineWatch([combinedCountTextWatch, toggleWatch] as const);

combinedAllWatch(([countTextRef, toggleRef], isFirst) => {
  const [countRef, textRef] = countTextRef;
  console.log("Nested Watches:", countRef.value, textRef.value, toggleRef.value, isFirst);
});
```

### createComputed 

`createComputed` is a helper function that combines multiple watches to produce a new computed (derived) value, and executes a specified callback function whenever that computed value changes.

A Watch created with `createComputed` can be used just like any other watch, including in integrations such as `connectReact` or `connectPreact`.

Below is a simple usage example.

```typescript
import { createStore, createComputed } from "state-ref";
import type { StateRefStore, Watch } from "state-ref";

type Info = { age: number; house: { color: string; floor: number }[] };

const watch1 = createStore<Info>(
    { age: 10, house: [{ color: "blue", floor: 7 }] },
);
const watch2 = createStore<number>(20);

const computedWatch = creatComputed<[Watch<Info>, Watch<number>], number>([watch1, watch2], ([ref1, ref2]) => {
    return ref1.age.value + ref2.value;
});


// To subscribe
computedWatch((stateRef) => {
    console.log(
        "Changed Computed Value",
        stateRef.value
    );
});

// Change value
const computedRef = watch2();
computedRef.value = 30;

// Connect another ui library
const useComputedValue = connectReact(computedWatch);
```

### Supports Flux-like State Management
   
If users prefer to manage state using a centralized store pattern, `state-ref` provides flexibility with the `createStoreManualSync` function. This mode makes it easier to implement centralized patterns like `Flux`.

Below is a simple `Flux-like` example using `createStoreManualSync` with React.

#### profileStore

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

#### UserComponent.tsx

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

## Acknowledgements

I would like to extend my gratitude to the following people and projects:

- **[Juho Vepsäläinen](https://survivejs.com)**: Thank you for the [insightful interview](https://survivejs.com/blog/state-ref-interview/) and featuring me on your blog. Your work and contributions to the JavaScript community have been a great source of inspiration.

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)

