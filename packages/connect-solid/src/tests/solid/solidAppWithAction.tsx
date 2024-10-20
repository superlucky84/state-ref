import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@/index';

const { watch, updateRef, sync } = createStoreManualSync({
  name: 'brown',
  age: 13,
});

const changeAge = (newAge: number) => {
  updateRef.age.value = newAge;
  sync();
};

const useProfileShelf = connectSolid(watch);

function App() {
  const [age] = useProfileShelf<number>(store => store.age);
  const [name] = useProfileShelf<string>(store => store.name);

  //@ts-ignore
  window.p = watch();

  return (
    <div>
      <h1>Vite + Solid</h1>
      <div class="card">
        <button
          onClick={() => {
            // setAge(age => ({ ...age, age: age.age + 1 }));
            changeAge(age() + 1);
          }}
        >
          name is {name()}
          age is {age()}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Solid logos to learn more
      </p>
    </div>
  );
}

export default App;
