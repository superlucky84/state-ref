import { createSignal, createEffect } from 'solid-js';
import lenshelf from '@/index';
// import type { ShelfStore, Subscribe } from '@/index';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

function App() {
  const [count, setCount] = createSignal(0);
  const [age, setAge] = createSignal(0);

  subscribe((store, isFirst) => {
    setAge(() => store.age.value);
    if (isFirst) {
      createEffect(() => {
        if (age() !== store.age.value) {
          store.age.value = age();
        }
      });
    }
  });

  return (
    <>
      <h1>Vite + Solid</h1>
      <div class="card">
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
      <p class="read-the-docs">
        Click on the Vite and Solid logos to learn more
      </p>
    </>
  );
}

export default App;
