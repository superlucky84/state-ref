import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncView = mount(() => {
  return () => (
    <div>
      <h1>display and reactive keys</h1>

      <p>
        A display is <strong>state that belongs to one observer</strong>. A
        placeholder, a selection, a comparison - none of them belong in the
        shared cache, because two screens looking at one key may want to show it
        differently.
      </p>

      <p>
        It is not a separate object you open. <code>select</code>,{' '}
        <code>placeholderData</code> and <code>equals</code> are options on the
        query, and what they produce is the handle's <code>display</code>.
      </p>

      <h2>display</h2>

      <CodeBlock
        language="typescript"
        code={`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  placeholderData: previewAccount,
  select: account => account.address.city,
});

account.display.data.value;              // this observer's placeholder, or its selected value
await account.load();                    // an explicit READ
account.ref.address.city.value = 'Busan'; // edits the shared resource
account.dispose();`}
      />

      <p>
        One handle holds both: <code>ref</code> is the resource you edit, and{' '}
        <code>display</code> is what you render. Editing never goes through the
        display - a display can be a selected string, or a placeholder that was
        never on the server, and neither is something you can write back.
      </p>

      <h3>One vocabulary</h3>

      <p>
        <code>display</code> and <code>watchDisplay</code> are{' '}
        <strong>readonly</strong>, and the state is the query status plus five
        fields. The status fields keep their names, so you do not learn them
        twice:
      </p>

      <CodeBlock
        language="typescript"
        code={`account.display.data.value;          // the selected value, or undefined
account.display.isPlaceholder.value; // showing placeholderData
account.display.errorSource.value;   // 'query' | 'select' | 'source' | null
account.display.queryKey.value;      // ['account', 1]
account.display.enabled.value;       // false only while a reactive key resolves to nothing

account.display.status.value;        // 'pending' | 'success' | 'error'
account.display.fetchStatus.value;   // same field as account.status.fetchStatus
account.display.dirty.value;         // ...and so on, for every status field`}
      />

      <p>
        There is no <code>phase</code>. It used to be <code>status</code> with{' '}
        <code>'placeholder'</code> added, and <code>isPlaceholder</code> already
        carries that fact. If you want the old four words back, derive them:
      </p>

      <CodeBlock
        language="typescript"
        code={`const phase = account.display.isPlaceholder.value
  ? 'placeholder'
  : account.display.status.value;`}
      />

      <p>
        <code>display</code> is built the first time you touch it. A consumer
        that only edits the resource never pays for one.
      </p>

      <h3>Placeholder and select</h3>

      <ul>
        <li>
          A placeholder is observer-local. It never enters{' '}
          <code>dehydrate()</code> or the editable resource, and it disappears
          after a first READ error.
        </li>
        <li>
          A refetch error keeps previously loaded data rather than dropping to
          the placeholder.
        </li>
        <li>
          <code>select</code> sees current local edits, but its result never
          replaces the cached query shape.
        </li>
        <li>
          An optional <code>equals</code> compares selected values (default{' '}
          <code>Object.is</code>). A select or comparison error affects that
          observer alone, not the shared query. When <code>equals</code> answers
          true the previous selected value is kept, so nothing watching{' '}
          <code>data</code> is woken.
        </li>
      </ul>

      <p>
        A fixed key does <strong>not</strong> start a READ on its own.
      </p>

      <h2>A reactive key</h2>

      <p>
        For a key that changes - a selected id, a page number, a dependent query
        - give <code>query</code> a <code>state-ref</code> source instead of a
        key.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.query({
  source: input.watch,
  resolve: ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  select: account => account.address.city,
});

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // starts a READ automatically

live.display.data.value;     // the selected current key only
live.display.queryKey.value; // ['account', 1]
live.display.enabled.value;

// after the baseline loads
live.ref.address.city.value = 'Busan';

live.dispose();`}
      />

      <p>
        Returning <code>null</code>, or <code>enabled: false</code>, clears the
        display and releases the current query. <code>display</code> is one
        stable observation point for the handle's whole life, and it reports{' '}
        <code>enabled</code> and <code>queryKey</code> even while there is no
        active key.
      </p>

      <p>
        In that state <code>ref</code>, <code>watch</code>, <code>status</code>{' '}
        and the operations throw <code>This query has no active key.</code> - so
        check <code>display.enabled</code> before reaching for the resource.
      </p>

      <h3>What happens on a key switch</h3>

      <ul>
        <li>
          The query underneath is disposed; a ref you captured from the previous
          key refuses every access afterwards.
        </li>
        <li>
          An <strong>unowned</strong> in-flight READ is aborted and cannot
          install a late result.
        </li>
        <li>
          If <strong>another owner holds the same key</strong>, its shared READ
          keeps running and its result lands in that owner's display - not in
          yours.
        </li>
        <li>
          Each source update reconnects with the new options, including when the
          key is unchanged.
        </li>
      </ul>

      <p>
        That third point is the one worth remembering: whether the old READ is
        cancelled depends on whether anyone else was still watching that key.
      </p>

      <h2>Connectors</h2>

      <p>
        Every connector has a readonly display binding, so a display never hands
        out setters:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}
      />

      <p>
        The same exists as <code>connectPreactView</code>,{' '}
        <code>connectVueView</code>, <code>connectSvelteView</code> and{' '}
        <code>connectSolidView</code>.
      </p>

      <p>
        <strong>
          A connector unmount ends that component's subscription and nothing
          else.
        </strong>{' '}
        The handle is released by whoever owns it, by calling{' '}
        <code>live.dispose()</code>. Two components can watch one display and
        closing one screen does not take the other's data away.
      </p>

      <h2>Pagination</h2>

      <p>
        For numbered pages, put the page in the key your source resolves to.
        Each page then has its own cache entry. A <code>placeholderData</code>{' '}
        value is only a preview for the new key; it never becomes that page's
        server baseline. Prepare a page with <code>prefetch</code>,{' '}
        <code>fetch</code> or <code>ensure</code> on the same key.
      </p>

      <p>
        For an accumulating list, use <code>client.infiniteQuery</code> - see
        the <a href="#/api/sync">Sync API</a>. It takes the same display
        options, its pages are readonly, and it takes a{' '}
        <strong>fixed key only</strong>: a reactive key has no infinite
        equivalent.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - the shared
          baseline a display shows
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic refetch</a> - an active
          reactive key performs the first load
        </li>
        <li>
          <a href="#/guide/custom-connector">Custom Connector</a> - the{' '}
          <code>Watch</code> shape a display binding needs
        </li>
      </ul>
    </div>
  );
});
