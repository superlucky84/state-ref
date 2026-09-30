import { combineWatch, createComputed, createStore } from 'state-ref';
import type { Watch } from 'state-ref';
import { createSyncClient } from '@stateref/sync';
import type { QueryHandle, SyncClient } from '@stateref/sync';
import { INITIAL_PROFILE } from './scenario';
import type { Profile } from './types';

/**
 * The server-rendered page, minus the UI.
 *
 * This is deliberately NOT the interactive demo model. A server render has no
 * unmount, and Phase 8.4 measured what a long-lived store costs when eleven
 * renders each leave a subscription behind. The contract that follows from
 * that is one client per request, thrown away with the request - so this
 * factory builds a fresh client every time and the page never reaches for a
 * module-level singleton.
 *
 * M2-04 asks for the derived screens too, so the page reads a
 * `createComputed` and a `combineWatch` built on the query as well as the
 * query itself.
 */

export type SsrPrefs = Readonly<{ upperCase: boolean }>;

export type SsrModel = Readonly<{
  client: SyncClient;
  query: QueryHandle<Profile>;
  /** The query's watch, after any wrapper the caller asked for. */
  watch: Watch<Profile>;
  /**
   * `createComputed` over the query. It derives a string rather than an
   * object: a connector hands back `StateRefStore<T>`, and for an object the
   * computed's `{ value }` proxy has none of that shape.
   */
  derived: Watch<string>;
  /** `combineWatch` over the query and a plain core store. */
  combined: Watch<[Profile, SsrPrefs]>;
  /** The clean baseline to embed in the HTML. */
  dehydrate: () => ReturnType<SyncClient['dehydrate']>;
  dispose: () => void;
}>;

export type SsrModelOptions = Readonly<{
  /** The value the request's server holds. */
  serverValue?: Profile;
  /**
   * Wraps the query's watch. The SSR check uses this to count how often the
   * core actually calls a renew, which is the only way to see a subscription
   * that a server render left behind.
   */
  wrap?: (watch: Watch<Profile>) => Watch<Profile>;
}>;

function build(
  client: SyncClient,
  query: QueryHandle<Profile>,
  options: SsrModelOptions
): SsrModel {
  const watch = options.wrap ? options.wrap(query.watch) : query.watch;
  const prefs = createStore<SsrPrefs>({ upperCase: false });

  const derived = createComputed<[Watch<Profile>], string>(
    [watch],
    ([profile]) =>
      `${profile.city.value} ${profile.zip.value} · 연락처 ${profile.contacts.value.length}`
  );

  return {
    client,
    query,
    watch,
    derived,
    combined: combineWatch([watch, prefs]),
    dehydrate: () => client.dehydrate(),
    dispose: () => query.dispose(),
  };
}

/** One request on the server: a fresh client, loaded before the render. */
export async function createSsrModelOnServer(
  options: SsrModelOptions = {}
): Promise<SsrModel> {
  const value = options.serverValue ?? INITIAL_PROFILE;
  const client = createSyncClient({ ssr: true });
  const query = client.query<Profile>({
    queryKey: ['profile'],
    queryFn: () => value,
  });
  await query.load();
  return build(client, query, options);
}

/**
 * The browser side: a fresh client restored from the HTML's snapshot.
 *
 * `hydrate` installs the baseline, so the handle is usable without a load -
 * which is what keeps the first client render equal to the server's HTML.
 */
export function createSsrModelFromSnapshot(
  snapshot: ReturnType<SyncClient['dehydrate']>,
  options: SsrModelOptions = {}
): SsrModel {
  const client = createSyncClient();
  client.hydrate(snapshot);
  const query = client.query<Profile>({
    queryKey: ['profile'],
    queryFn: () => {
      throw new Error('The hydrated page does not refetch on its own.');
    },
  });
  return build(client, query, options);
}
