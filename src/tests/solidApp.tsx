import lenshelf from '@/index';
import { connectShelfWithSolid } from '@/connectSnippetExamples/solid/solid-v1';

const subscribe = lenshelf({
  name: 'brown',
  age: 13,
});

const useProfileShelf = connectShelfWithSolid(subscribe);

function App() {
  const [age, setAge] = useProfileShelf<number>(store => store.age);
  const [name] = useProfileShelf<string>(store => store.name);

  return (
    <div>
      <h1>Vite + Solid</h1>
      <div className="card">
        <button
          onClick={() => {
            setAge(age => age + 1);
          }}
        >
          name is {name()}
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
