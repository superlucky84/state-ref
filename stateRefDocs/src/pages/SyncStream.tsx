import { mount } from 'lithent';
import { CodeBlock } from '@/components/CodeBlock';

export const SyncStream = mount(() => {
  return () => (
    <div>
      <h1>Streaming</h1>

      <p>
        When the server pushes data - a WebSocket, an NDJSON response, a
        progress feed - use <code>streamQuery</code>. It connects a push source
        to an ordinary query, and{' '}
        <strong>every message shows on screen as it arrives</strong> instead of
        after the whole response.
      </p>

      <p>
        A stream does not replace the query. It writes into the same cache entry
        as <code>queryFn</code> does, so <code>ref</code>, <code>watch</code>,{' '}
        <code>display</code>, local edits and mutations keep working on a
        streamed query.
      </p>

      <h2>Basic Usage</h2>

      <CodeBlock
        language="typescript"
        code={`import { createSyncClient, ndjsonMessages, streamQuery } from '@stateref/sync';

type Report = { rows: string[] };
type Row = { row: string };

const client = createSyncClient();
const report = client.query<Report>({
  queryKey: ['report'],
  queryFn: () => ({ rows: [] }),
});

const stream = streamQuery<Report, Row>(report, {
  // called on start and again on every refetch()
  source: () => ndjsonMessages<Row>(signal => fetch('/report', { signal })),
  // fold one message into the next server value
  reduce: (current, message) => ({
    rows: [...(current?.rows ?? []), message.row],
  }),
});

report.ref.rows.value; // grows line by line
stream.status.value;   // { state: 'open', received: 3, queued: 0, buffered: 0, error: null }`}
      />

      <p>
        You do not have to call <code>load()</code> first: the first message
        loads an empty query. If the query is already loaded or hydrated, the
        stream folds onto that value instead of wiping it.
      </p>

      <h2>Sources</h2>

      <p>
        <code>source</code> is a function that opens a new connection each time
        it is called. It returns an async iterable or a subscribe function{' '}
        <code>(sink, signal) =&gt; teardown</code>. Two ready-made sources
        cover the common cases.
      </p>

      <CodeBlock
        language="typescript"
        code={`// NDJSON: one JSON value per line
ndjsonMessages<Row>(signal => fetch('/report', { signal })) // lazy request
ndjsonMessages<Row>(response)                               // a Response or body you already have

// WebSocket: JSON.parse by default, or your own parser
webSocketMessages<Row>(new WebSocket('wss://example.com/report'))
webSocketMessages<Row>(socket, data => decode(data))

// Anything else: an async iterable ...
source: () => myAsyncGenerator()
// ... or a subscribe function
source: () => (sink, signal) => {
  const off = feed.on('item', item => sink.next(item));
  feed.on('end', () => sink.complete());
  feed.on('fail', error => sink.error(error));
  return off; // teardown
}`}
      />

      <ul>
        <li>
          <code>ndjsonMessages</code> handles a line split across network
          chunks (including multi-byte characters), skips blank lines and
          reads a last line without a newline. Invalid JSON fails the run.
          Closing the stream aborts the request and cancels the reader.
        </li>
        <li>
          <code>webSocketMessages</code> completes the run on a clean close and
          fails it on any other close. Closing the stream closes the socket.
        </li>
      </ul>

      <h2>reduce Is a Reducer</h2>

      <p>
        The library does not interpret messages. The server decides what a
        message looks like, and <code>reduce</code> decides what it does to the
        data - the same shape as a Redux reducer. When the server sends events,
        switch on their type.
      </p>

      <CodeBlock
        language="typescript"
        code={`type State = { todos: Todo[] };
type Action =
  | { type: 'added'; todo: Todo }
  | { type: 'removed'; id: string }
  | { type: 'snapshot'; state: State };

streamQuery<State, Action>(todos, {
  source: () => webSocketMessages<Action>(new WebSocket(url)),
  reduce: (state, action) => {
    const list = state?.todos ?? [];
    switch (action.type) {
      case 'added':
        return { todos: [...list, action.todo] };
      case 'removed':
        return { todos: list.filter(t => t.id !== action.id) };
      case 'snapshot':
        return action.state;
      default:
        return state!; // ignore actions this client does not know yet
    }
  },
});`}
      />

      <ul>
        <li>
          <code>current</code> is the <strong>server value</strong>, never the
          user&apos;s local edits. It is <code>undefined</code> before the
          first load. Read the same value yourself with{' '}
          <code>query.serverValue()</code>.
        </li>
        <li>
          For editable data <code>current</code> is frozen.{' '}
          <strong>Return a new value</strong>; <code>current.rows.push()</code>{' '}
          throws.
        </li>
        <li>
          TypeScript types are not checked at run time. If the server format
          may change, validate inside the WebSocket <code>parse</code> function
          or inside <code>reduce</code>.
        </li>
      </ul>

      <h2>Edits and Saves</h2>

      <p>
        Each message is applied with <code>acceptServer</code>, so a stream
        behaves like a series of server reads.
      </p>

      <ul>
        <li>
          The user&apos;s local edits stay on top of every new server value. If
          the server changes a field the user is editing, it shows up in{' '}
          <code>status.conflicts</code>. See{' '}
          <a href="#/guide/sync-lifecycle">Edit Lifecycle</a>.
        </li>
        <li>
          While a linked save on the query is pending, messages are{' '}
          <strong>held</strong> (<code>stream.status.queued</code>). When the
          save settles they are folded, in order, on top of the value the save
          accepted. Nothing is dropped and nothing overtakes the save.
        </li>
      </ul>

      <h2>Restarting: refetch(&#123; mode &#125;)</h2>

      <p>
        Inside one run, every message updates the screen no matter what. A mode
        only matters when you <strong>restart</strong> the stream, and it
        decides what happens to the data the previous run left on screen. You
        pick it per call.
      </p>

      <CodeBlock
        language="typescript"
        code={`const stream = streamQuery(report, {
  source,
  reduce,
  initialValue: () => ({ rows: [] }), // what reset / replace start from
});

stream.refetch();                    // 'reset' (the default)
stream.refetch({ mode: 'append' });  // e.g. after a reconnect
stream.refetch({ mode: 'replace' }); // e.g. a "refresh" button`}
      />

      <table>
        <thead>
          <tr>
            <th>mode</th>
            <th>when the new run starts</th>
            <th>while its messages arrive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>reset</code>
            </td>
            <td>
              shows <code>initialValue</code> at once (without one, keeps the
              old data until the first new message)
            </td>
            <td>updates per message, from scratch</td>
          </tr>
          <tr>
            <td>
              <code>append</code>
            </td>
            <td>keeps what is shown</td>
            <td>updates per message, added to it</td>
          </tr>
          <tr>
            <td>
              <code>replace</code>
            </td>
            <td>keeps what is shown</td>
            <td>
              folded off screen (<code>status.buffered</code>), swapped in once
              when the run completes; a failed run is dropped
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>query.refetch()</code> is a different thing: it runs{' '}
        <code>queryFn</code> once and does not touch the stream.
      </p>

      <h2>Throttling Screen Updates</h2>

      <p>
        A busy source can re-render too often. <code>throttle</code> limits how
        often the value is published:
      </p>

      <CodeBlock
        language="typescript"
        code={`streamQuery(report, { source, reduce, throttle: 100 });     // at most once per 100 ms
streamQuery(report, { source, reduce, throttle: 'frame' }); // at most once per animation frame`}
      />

      <ul>
        <li>
          <strong>No message is dropped.</strong> Every message is still folded
          by <code>reduce</code>; only the publishes are coalesced. 50 messages
          in one window become one screen update that contains all 50.
        </li>
        <li>
          The first message of a run - and the first one after a quiet window -
          shows at once.
        </li>
        <li>
          Completion, an error and <code>close()</code> publish what the window
          still holds without waiting.
        </li>
        <li>
          <code>&apos;frame&apos;</code> uses <code>requestAnimationFrame</code>
          ; where there is none (server, tests) it falls back to a 16 ms timer.
          Browsers pause animation frames in background tabs, so updates wait
          until the tab is visible again.
        </li>
      </ul>

      <h2>Status, Errors and Cleanup</h2>

      <CodeBlock
        language="typescript"
        code={`stream.status.value
// {
//   state: 'open' | 'complete' | 'error' | 'closed',
//   received: number, // messages of this run applied to the query
//   queued: number,   // held while a linked save is pending
//   buffered: number, // folded off screen by a 'replace' run
//   error: unknown,
// }

streamQuery(report, {
  source,
  reduce,
  onError: error => toast(String(error)), // once per failed run
});

stream.close(); // stop for good: aborts the request / closes the socket`}
      />

      <ul>
        <li>
          A source error, a source that throws, or a <code>reduce</code> that
          throws ends the run with <code>state: &apos;error&apos;</code>.{' '}
          <strong>What arrived before the failure is kept.</strong>
        </li>
        <li>
          There is no automatic reconnect. Call <code>stream.refetch()</code>{' '}
          from <code>onError</code> or from a status observer when you want one.
        </li>
        <li>
          <code>status</code> is readonly. Pass <code>stream.watchStatus</code>{' '}
          to a connector like any other Watch.
        </li>
      </ul>

      <h2>In a Component</h2>

      <p>
        A query that only the stream fills has no data until the first message,
        and <code>ref</code>/<code>watch</code> throw before a load. Bind the{' '}
        <a href="#/guide/sync-view">display</a> instead; it is readable from the
        start and follows every streamed value.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { connectReact, connectReactView } from '@stateref/connect-react';

// display works before the first message; report.watch throws until then
const useReport = connectReactView(report.watchDisplay);
const useStreamStatus = connectReact(stream.watchStatus);

function ReportView() {
  const rows = useReport().data.value?.rows ?? [];
  const { state, received } = useStreamStatus().value;
  return (
    <>
      <p>{state === 'open' ? \`Receiving… (\${received})\` : state}</p>
      <ul>{rows.map(row => <li key={row}>{row}</li>)}</ul>
    </>
  );
}

// call stream.close() when the screen goes away`}
      />

      <h2>Limits</h2>

      <ul>
        <li>
          No automatic reconnect or backoff, no Server-Sent Events helper, no
          reordering or de-duplication of messages. Wrap an{' '}
          <code>EventSource</code> in a subscribe function if you need SSE.
        </li>
        <li>
          A stream on a <a href="#/guide/sync-view">reactive key</a> query does
          not reopen when the key changes. Open one stream per key.
        </li>
        <li>
          Automatic refetches (focus, reconnect, polling) run{' '}
          <code>queryFn</code>; they do not restart the stream. A stream
          message excludes an older in-flight read.
        </li>
      </ul>

      <h2>Related</h2>

      <ul>
        <li>
          <a href="#/guide/sync-query">query and resource</a> - the query a
          stream writes into
        </li>
        <li>
          <a href="#/guide/sync-lifecycle">Edit Lifecycle</a> - how edits ride
          on top of new server values
        </li>
        <li>
          <a href="#/api/sync">Sync API</a> - <code>streamQuery</code> and{' '}
          <code>QueryStreamOptions</code>
        </li>
      </ul>
    </div>
  );
});
