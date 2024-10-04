import { lenshelf, copyable } from '@/index';
import { connectShelfWithSolid } from '@/connectSnippetExamples/solid/solid-latest';

const take = lenshelf({
  name: 'brown',
  age: 13,
});

const useProfileShelf = connectShelfWithSolid(take);

function App() {
  const [profile, setProfile] = useProfileShelf<{ name: string; age: number }>(
    store => store
  );
  const [name] = useProfileShelf<string>(store => store.name);

  //@ts-ignore
  window.p = take();

  return (
    <div>
      <h1>Vite + Solid</h1>
      <div className="card">
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
      <p className="read-the-docs">
        Click on the Vite and Solid logos to learn more
      </p>
    </div>
  );
}

export default App;
