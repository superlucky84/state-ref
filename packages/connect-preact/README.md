# state-ref Preact Connector (connectPreact)

## Usage with Preact

It can be easily integrated with other UI libraries, and below is an example using Preact.

### profileStore.ts

> Create the store and pass the `watch` to `connectPreact` to create a state that can be used in components.

```typescript
import { connectPreact } from "@stateref/connect-preact";
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

export const useProfileStore = connectPreact(watch);
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

You can create your own custom connection pattern by referring to the [connectPreact implementation code](https://github.com/superlucky84/state-ref/blob/main/packages/connect-preact/src/index.ts).

## Supported versions

Preact 10 (`preact ^10.0.0`). Only `preact/hooks` is used - no `preact/compat`.

## How the hook subscribes

- The subscription is made in an effect, after commit, and released by its cleanup; a render that suspends leaves nothing behind.
- **A mount renders twice**, as with the React connector: the first render paints with the correct values, the second collects the paths the component reads.
- A server render runs no effects and subscribes to nothing.

## Readonly query views

Use `connectPreactView(query.watchDisplay)` for the display of a `@stateref/sync` query. The returned hook exposes readonly display state; edit actual data through `query.ref` after it loads. Unmounting ends this component's subscription; whoever opened the query calls `query.dispose()`.

```tsx
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  select: account => account.address.city,
});
const useCity = connectPreactView(account.watchDisplay);

function AccountCity() {
  const display = useCity();
  return <span>{display.data.value ?? 'Loading'}</span>;
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
