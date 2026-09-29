import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncInfinite = mount(() => {
  return () => (
    <div>
      <h1>Infinite Queries</h1>

      <p>
        For a list that grows page by page - a &quot;load more&quot; button or
        infinite scroll - use <code>client.infiniteQuery</code>. It holds
        several pages in order under one key, and the page you just received
        tells it where the next one comes from.
      </p>

      <p>
        If the screen shows one numbered page at a time, this is not the page
        you want: put the page number in the key with a{' '}
        <a href="#/guide/sync-view">reactive key</a> instead.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`type Page = { items: Item[]; next: number | null };

const feed = client.infiniteQuery({
  queryKey: ['feed'],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }): Promise<Page> =>
    api.readFeed({ cursor: pageParam, signal }),
  getNextPageParam: lastPage => lastPage.next, // null means the end
});

await feed.load();         // reads the first page only
feed.ref.value.pages;      // [page0]
feed.ref.value.pageParams; // [0]

if (feed.hasNextPage()) {
  await feed.fetchNextPage(); // pages: [page0, page1], pageParams: [0, 1]
}`}
      />

      <p>
        The data is <code>{'{ pages, pageParams }'}</code>.{' '}
        <code>pageParams[i]</code> is the value used to read{' '}
        <code>pages[i]</code>, and the two always have the same length.
      </p>

      <h2>Deciding the Next Page</h2>

      <CodeBlock
        language="typescript"
        code={`getNextPageParam: (lastPage, pages, lastPageParam, pageParams) =>
  lastPage.next ?? null,

// optional; only if the list can also be read backwards
getPreviousPageParam: (firstPage, pages, firstPageParam, pageParams) =>
  firstPageParam > 0 ? firstPageParam - 1 : null,`}
      />

      <ul>
        <li>
          Answering <code>null</code> or <code>undefined</code> marks the end in
          that direction. <code>hasNextPage()</code> becomes <code>false</code>,
          and <code>fetchNextPage()</code> then returns the current data without
          a request.
        </li>
        <li>
          Without <code>getPreviousPageParam</code>,{' '}
          <code>hasPreviousPage()</code> is always <code>false</code>.
        </li>
        <li>
          A <code>pageParam</code> must be JSON-compatible; it goes into
          snapshots.
        </li>
      </ul>

      <h2>maxPages</h2>

      <p>
        To keep a long list from growing in memory forever, cap the number of
        pages held. When it overflows, a page drops off the opposite end.
      </p>

      <CodeBlock
        language="typescript"
        code={`const feed = client.infiniteQuery({ ...options, maxPages: 2 });

await feed.load();          // pageParams: [0]
await feed.fetchNextPage(); // [0, 1]
await feed.fetchNextPage(); // [1, 2] — 0 dropped off the front
feed.hasPreviousPage();     // true (with getPreviousPageParam)
await feed.fetchPreviousPage(); // [0, 1] — this time 2 dropped off the back`}
      />

      <h2>Reading Again</h2>

      <p>
        <code>refetch()</code> and automatic refetches re-read as many pages as
        you hold,{' '}
        <strong>
          in order, starting from the first held page&apos;s value
        </strong>
        . From the second page on, the value is recomputed from the page just
        read rather than reused, so if the list changed on the server the page
        boundaries line up again. If <code>getNextPageParam</code> reports the
        end partway, it finishes with fewer pages.
      </p>

      <CodeBlock
        language="typescript"
        code={`// holding pageParams: [0, 1]
await feed.refetch(); // reads 0, then 1`}
      />

      <p>
        The other options - <code>staleTime</code>, <code>gcTime</code>,{' '}
        <code>retry</code>, <code>networkMode</code>,{' '}
        <code>refetchOnFocus</code> and so on - work as they do for{' '}
        <a href="#/guide/sync-refetch">ordinary queries</a>.
      </p>

      <h2>It Is Read-Only</h2>

      <p>
        Infinite pages cannot be edited. Writing to <code>ref</code> is refused
        with <code>This query is readonly.</code>, and the handle has neither{' '}
        <code>changes()</code> nor <code>capture()</code>. If the screen edits
        one item of the list, open that item as an ordinary query, save it, and
        then <code>invalidate()</code> or <code>refetch()</code> the infinite
        query.
      </p>

      <p>
        As with ordinary queries, reading <code>ref</code> before a load throws{' '}
        <code>Query data is not loaded. Call load() first.</code>
      </p>

      <h2>Flattening for the Screen</h2>

      <p>
        A <code>select</code> that flattens the pages keeps the rendering code
        simple. Display is per observer, so the cache keeps the page shape.
      </p>

      <CodeBlock
        language="typescript"
        code={`const feed = client.infiniteQuery({
  ...options,
  select: data => data.pages.flatMap(page => page.items),
});

await feed.load();
await feed.fetchNextPage();
feed.display.data.value; // [...page0.items, ...page1.items]

// React
const useFeed = connectReactView(feed.watchDisplay);`}
      />

      <h2>Limits</h2>

      <ul>
        <li>
          <strong>Fixed keys only.</strong> There is no infinite counterpart of
          a reactive key (<code>{'{ source, resolve }'}</code>). When a search
          term changes, <code>dispose()</code> the old handle and open a new one
          with the new key.
        </li>
        <li>
          Prepare the cache with <code>client.prefetchInfinite</code>,{' '}
          <code>fetchInfinite</code> and <code>ensureInfinite</code> - the same
          rules as <code>prefetch</code>, <code>fetch</code> and{' '}
          <code>ensure</code> for ordinary queries.
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-view">display and reactive keys</a> - numbered
          pages and <code>select</code>
        </li>
        <li>
          <a href="#/guide/sync-refetch">Automatic Refetch</a> - the same
          policies apply
        </li>
        <li>
          <a href="#/api/sync">Sync API</a> - <code>InfiniteQueryOptions</code>{' '}
          and the handle shape
        </li>
      </ul>
    </div>
  );
});
