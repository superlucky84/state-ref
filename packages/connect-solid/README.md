# state-ref Solid Connector (connectSolid)

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

## Supported versions

Solid 1.9 (`solid-js ^1.9.1`).

## Writing rules

- The setter writes the store directly and synchronously, including a functional update: `setUser(prev => ({ ...prev, name: 'Jane' }))`.
- **The accessor returns a frozen copy of an object or array.** `user().name = 'x'`, or a functional update that mutates `prev` and returns it, throws a TypeError and the store is untouched - neither passes through the connector.
- A server render is detected with `isServer` and subscribes to nothing.

## Readonly query views

`connectSolidView(query.watchDisplay)(select)` returns a Solid accessor for the display of a `@stateref/sync` query. Dispose the owning root to end its subscription; whoever opened the query calls `query.dispose()`. Edit actual data through `query.ref` after it loads.

```tsx
const city = connectSolidView(account.watchDisplay)(display => display.data.value);
const label = () => city() ?? 'Loading';
```

## npm
* [state-ref](https://www.npmjs.com/package/state-ref)
* [connect-react](https://www.npmjs.com/package/@stateref/connect-react)
* [connect-preact](https://www.npmjs.com/package/@stateref/connect-preact)
* [connect-solid](https://www.npmjs.com/package/@stateref/connect-solid)
* [connect-svelte](https://www.npmjs.com/package/@stateref/connect-svelte)
* [connect-vue](https://www.npmjs.com/package/@stateref/connect-vue)
* [lithent](https://www.npmjs.com/package/lithent)
