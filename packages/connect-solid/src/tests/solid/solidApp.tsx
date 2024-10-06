import { createStore, copyable } from 'state-ref';
import { connectWithSolidA } from '@/index';

const capture = createStore({
  name: 'brown',
  age: 13,
});

const useProfileShelf = connectWithSolidA(capture);

function App() {
  const [profile, setProfile] = useProfileShelf<{ name: string; age: number }>(
    store => store
  );
  const [name] = useProfileShelf<string>(store => store.name);

  //@ts-ignore
  window.p = capture();

  return (
    <div>
      <h1>Vite + Solid</h1>
      <div class="card">
        <button
          onClick={() => {
            // setAge(age => ({ ...age, age: age.age + 1 }));
            setProfile(profile =>
              copyable(profile).age.writeCopy<{ name: string; age: number }>(
                profile.age + 1
              )
            );
          }}
        >
          name is {name()}
          age is {profile().age}
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
