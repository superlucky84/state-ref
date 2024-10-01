import { createSignal, onCleanup, createEffect } from 'solid-js';
import h from 'solid-js/h';
import type { Signal } from 'solid-js';
import type { ShelfStore, Subscribe } from '@/index';
import lenshelf from '@/index';

function connectShelfWithSolid<T>(subscribe: Subscribe<T>) {
  return <V,>(callback: (store: ShelfStore<T>) => ShelfStore<V>): Signal<V> => {
    const abortController = new AbortController();
    let signalValue!: Signal<V>;
    let shelf!: ShelfStore<V>;

    onCleanup(() => {
      abortController.abort();
    });

    createEffect(() => {
      shelf.value = signalValue[0]();
    });

    subscribe(shelfStore => {
      shelf = callback(shelfStore);
      if (signalValue) {
        signalValue[1](() => shelf.value as V);
      } else {
        signalValue = createSignal<V>(shelf.value as V);
      }

      return abortController.signal;
    });

    return signalValue;
  };
}

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

// @ts-ignore
// window.p = subscribe();

const useProfileShelf = connectShelfWithSolid(subscribe);

function App() {
  const [count, setCount] = createSignal<number>(0);
  const [age, setAge] = useProfileShelf<number>(store => store.age);

  return (
    <div>
      <h1>Vite + Solid</h1>
      <div className="card">
        <button
          onClick={() => {
            setCount(count => count + 1);
            setAge(age => age + 1);
          }}
        >
          count is {count()}
          age is {age()}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and Solid logos to learn more
      </p>
    </div>
  );
}

export default App;
