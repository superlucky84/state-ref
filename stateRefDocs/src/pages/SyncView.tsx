import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncView = mount(() => {
  return () => (
    <div>
      <h1>view and liveView</h1>

      <p>
        A view is <strong>display state that belongs to one observer</strong>. A
        placeholder, a selection, a comparison - none of them belong in the
        shared cache, because two screens looking at one key may want to show it
        differently.
      </p>

      <h2>view</h2>

      <CodeBlock
        language="typescript"
        code={`const view = client.view(
  {
    queryKey: ['account', 1],
    queryFn: ({ signal }) => api.readAccount(1, { signal }),
  },
  {
    placeholderData: previewAccount,
    select: account => account.address.city,
  }
);

view.ref.data.value;   // this view's placeholder, or its selected current value
await view.query.load(); // an explicit READ, as with client.query(...)
view.query.ref.address.city.value = 'Busan'; // edits the shared resource
view.dispose();          // releases the view and the query handle it owns`}
      />

      <p>
        <code>view.ref</code> and <code>view.watch</code> are{' '}
        <strong>readonly</strong> display state:
      </p>

      <CodeBlock
        language="typescript"
        code={`view.ref.phase.value;          // 'pending' | 'placeholder' | 'success' | 'error'
view.ref.fetchStatus.value;
view.ref.isPlaceholder.value;
view.ref.error.value;
view.ref.errorSource.value;`}
      />

      <p>
        Editing goes through <code>view.query.ref</code>, never through the
        display. That separation is deliberate: a display can be a selected
        string or a placeholder that was never on the server, and neither of
        those is something you can write back.
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
          view alone, not the shared query.
        </li>
      </ul>

      <p>
        A fixed-key <code>view</code> does <strong>not</strong> start a READ on
        its own.
      </p>

      <h2>liveView</h2>

      <p>
        For a key that changes - a selected id, a page number, a dependent query
        - bind a <code>state-ref</code> source instead of a fixed key.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.liveView(
  input.watch,
  ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  { select: account => account.address.city }
);

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // starts a READ automatically

live.ref.data.value;      // the selected current key only
live.ref.queryKey.value;  // ['account', 1]
live.ref.enabled.value;

// after the baseline loads
live.query?.ref.address.city.value = 'Busan';

live.dispose();`}
      />

      <p>
        Returning <code>null</code>, or <code>enabled: false</code>, clears the
        display and releases the current query. <code>live.ref</code> is stable
        and readonly for the whole lifetime; <code>live.query</code> is the
        current handle or <code>null</code>.
      </p>

      <h3>What happens on a key switch</h3>

      <ul>
        <li>
          The old handle is disposed; a handle you captured earlier is gone.
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
        Every connector has a readonly view binding, so a display never hands
        out setters:
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watch);

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
        The view itself is released by whoever owns it, by calling{' '}
        <code>live.dispose()</code>. Two components can watch one view and
        closing one screen does not take the other's data away.
      </p>

      <h2>Pagination</h2>

      <p>
        For numbered pages, put the page in the key you give{' '}
        <code>liveView</code>. Each page then has its own cache entry. A{' '}
        <code>placeholderData</code> value is only a preview for the new key; it
        never becomes that page's server baseline. Prepare a page with{' '}
        <code>prefetch</code>, <code>fetch</code> or <code>ensure</code> on the
        same key.
      </p>

      <p>
        For an accumulating list, use <code>client.infiniteQuery</code> - see
        the <a href="#/api/sync">Sync API</a>. Infinite pages are readonly, and{' '}
        <code>infiniteView</code> takes a fixed key only: there is no infinite
        equivalent of <code>liveView</code>.
      </p>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - the shared
          baseline a view displays
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic refetch</a> - an active{' '}
          <code>liveView</code> performs the first load
        </li>
        <li>
          <a href="#/guide/custom-connector">Custom Connector</a> - the{' '}
          <code>Watch</code> shape a view binding needs
        </li>
      </ul>
    </div>
  );
});
