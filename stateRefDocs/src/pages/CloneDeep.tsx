import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const CloneDeep = mount(() => {
  return () => (
    <div>
      <h1>cloneDeep</h1>

      <p>
        <code>cloneDeep</code> creates a recursive deep copy of plain objects and
        arrays. It’s a small utility for cases where you need an independent copy
        of nested data.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}
      />

      <h2>Arrays and Objects</h2>

      <CodeBlock
        language="typescript"
        code={`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}
      />

      <h2>What It Copies</h2>

      <ul>
        <li>
          <strong>Plain objects</strong> (own enumerable properties)
        </li>
        <li>
          <strong>Arrays</strong> (recursively deep-copied)
        </li>
        <li>
          <strong>Primitives</strong> are returned as-is
        </li>
      </ul>

      <h2>Limitations</h2>

      <p>
        <code>cloneDeep</code> is intentionally minimal. It does not handle
        special object types or circular references.
      </p>

      <ul>
        <li>
          <strong>Not supported</strong>: Date, Map, Set, class instances,
          functions, symbols, or circular references
        </li>
        <li>
          <strong>Prototype is not preserved</strong> (plain object output)
        </li>
      </ul>

      <h2>When to Use</h2>

      <ul>
        <li>
          <strong>Test fixtures</strong> or quick cloning of JSON-like data
        </li>
        <li>
          <strong>Defensive copies</strong> before in-place changes
        </li>
        <li>
          <strong>Lightweight utilities</strong> without extra dependencies
        </li>
      </ul>

      <h2>API Summary</h2>

      <CodeBlock language="typescript" code={`cloneDeep<T>(value: T): T`} />

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/copyable">copyable</a> - copy-on-write updates
        </li>
        <li>
          <a href="#/guide/lens">Lens Pattern</a> - path-based immutable updates
        </li>
      </ul>
    </div>
  );
});
