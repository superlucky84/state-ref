# state-ref React Connector (connectReact)

## Usage with React

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

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
