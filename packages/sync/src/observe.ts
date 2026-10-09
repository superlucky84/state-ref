import { create } from 'state-ref';
import type { Renew, StateRefStore } from 'state-ref';
import { createLiveQuery } from './live-key';
import type {
  LiveQueryCursor,
  LiveQueryOptions,
  OpenedQuery,
} from './live-key';
import { createQueryDisplay } from './display';
import type {
  QueryDisplayHandle,
  QueryDisplayOptions,
  QueryDisplayRef,
  QueryDisplayState,
  QueryDisplayWatch,
} from './display';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { guardRef, guardedWatch } from './ref-guard';
import { reasonOf } from './peek';
import type { PeekOptions, PeekReader } from './peek';
import type { QueryHandle, QueryHandleCore, QueryOptions } from './index';

/** One observer's options: a query, how this observer shows it, and whether it runs. */
export type ObserveOptions<T, S = T> = QueryOptions<T> &
  QueryDisplayOptions<T, S> &
  Readonly<{ enabled?: boolean }>;

/** Settings for whoever builds an observer hook, not for the hook's users. */
export type ObserverSettings = Readonly<{
  /**
   * When to release a handle the observer no longer needs (DC-QH-11). The
   * default waits one macrotask, enough for React's StrictMode and for a
   * framework that unsubscribes and resubscribes in one task. Preact's
   * entry passes a later one.
   */
  scheduleRelease?: (release: () => void) => void;
}>;

export type QueryObserverControls<T> = Readonly<{
  /** Refetch the current key. Rejects while the observer is not attached. */
  refetch: () => Promise<T>;
  /** Invalidate the current key, and read it again while attached. */
  invalidate: () => void;
  /**
   * The handle for the current key, or null while not attached. It is the
   * query's own handle, so it can be linked to a mutation; releasing it is
   * the observer's job, which is why the type leaves `dispose` out.
   */
  handle: () => QueryHandleCore<T> | null;
}>;

/**
 * One observer of a query, attached while something subscribes to it
 * (docs/sync-query-hooks DC-QH-13).
 *
 * A building block for framework hooks: rendering reads `watch()` or
 * `peek(options)` and changes nothing; the first callback subscription
 * attaches and loads; the last one ending releases. `setOptions` is called
 * outside render - after commit, or in a reaction before render.
 */
export type QueryObserver<T, S = T> = Readonly<{
  /** No callback: the confirmed options' state. A callback: subscribe. */
  watch: QueryDisplayWatch<QueryDisplayState<S>>;
  /** The state for options a render has but has not confirmed yet. */
  peek: (
    options: ObserveOptions<T, S>
  ) => QueryDisplayRef<QueryDisplayState<S>>;
  /** Whether these options have the confirmed key and `enabled`. */
  matches: (options: ObserveOptions<T, S>) => boolean;
  /** Confirm new options; true when the key or `enabled` changed. */
  setOptions: (options: ObserveOptions<T, S>) => boolean;
  controls: QueryObserverControls<T>;
}>;

/** What an observer needs from the client that makes it. */
export type ObserverClient = Readonly<{
  ssr: boolean;
  peek: <T, S>(readOptions: () => PeekOptions<T, S>) => PeekReader<S>;
  open: <T>(options: QueryOptions<T>) => QueryHandle<T>;
  /** Opening checks without creating, configuring or owning an entry. */
  validate: (options: QueryOptions<any>) => void;
  invalidate: (key: QueryKey) => void;
}>;

/** The query READ retry delay when none is given (also used by `load`). */
export const defaultRetryDelay = (attempt: number) =>
  Math.min(1000 * 2 ** attempt, 30_000);

/**
 * Options whose change needs a new handle: the automatic refetch observer
 * reads them when the handle opens (DC-QH-26 item 3). Functions and
 * `initialData` are left out on purpose - a render makes new ones every
 * time, and comparing them would reopen the handle on every commit.
 */
const HANDLE_OPTIONS = [
  'staleTime',
  'gcTime',
  'retry',
  'networkMode',
  'editable',
  'refetchOnFocus',
  'refetchOnReconnect',
  'refetchInterval',
  'refetchIntervalInBackground',
] as const;

/** The key as observers compare it: its hash, or why it has none (DC-QH-13). */
type Marker = Readonly<
  { ok: true; hash: string } | { ok: false; reason: string }
>;

const markers = new WeakMap<object, Marker>();

function markerOf(options: ObserveOptions<any, any>): Marker {
  let marker = markers.get(options);
  if (!marker) {
    try {
      if (
        options.enabled !== undefined &&
        typeof options.enabled !== 'boolean'
      ) {
        throw new TypeError('enabled must be a boolean.');
      }
      marker = { ok: true, hash: hashQueryKey(options.queryKey) };
    } catch (error) {
      marker = { ok: false, reason: reasonOf(error) };
    }
    markers.set(options, marker);
  }
  return marker;
}

const sameMarker = (a: Marker, b: Marker) =>
  a.ok ? b.ok && a.hash === b.hash : !b.ok && a.reason === b.reason;

const enabledOf = (options: ObserveOptions<any, any>) =>
  options.enabled !== false;

/**
 * The handle as the cursor sees it: everything delegates to the query's own
 * handle except `dispose`, which waits for the release schedule. The cursor
 * opens a key's new handle before it disposes the old one, so with the old
 * one held a moment longer the entry never runs out of owners and a READ in
 * flight is shared instead of cancelled (DC-QH-11, DC-QH-31).
 *
 * Getters are forwarded rather than copied: `ref` and `watch` throw until
 * the query has loaded.
 */
function releaseLater<H extends object>(
  handle: H,
  schedule: (release: () => void) => void
): H {
  const wrapper: Record<PropertyKey, unknown> = {};
  for (const key of Reflect.ownKeys(handle)) {
    if (key === 'dispose') continue;
    Object.defineProperty(wrapper, key, {
      enumerable: true,
      get: () => Reflect.get(handle, key),
    });
  }
  let released = false;
  Object.defineProperty(wrapper, 'dispose', {
    enumerable: true,
    value: () => {
      if (released) return;
      released = true;
      schedule(() => (handle as { dispose: () => void }).dispose());
    },
  });
  return Object.freeze(wrapper) as H;
}

/**
 * Build one observer (docs/sync-query-hooks 단계 2).
 *
 * Attaching is a `live-key` cursor over a private store: the cursor already
 * opens a key's handle and display, loads it, keeps an older key's late
 * result out and shows `enabled: false` as idle. A write to the store is
 * what tells it to look at the options again, and the options it opens are
 * always the latest ones the observer was given.
 */
export function createObserver<T, S = T>(
  client: ObserverClient,
  initial: ObserveOptions<T, S>,
  settings: ObserverSettings = {}
): QueryObserver<T, S> {
  const schedule =
    settings.scheduleRelease ??
    ((release: () => void) => {
      setTimeout(release, 0);
    });
  let latest = initial;
  let rendered = initial;
  const confirmedPeek = client.peek<T, S>(() => latest);
  const renderedPeek = client.peek<T, S>(() => rendered);
  const openingReason = (options: ObserveOptions<T, S>): string | null => {
    if (!markerOf(options).ok || !enabledOf(options)) return null;
    try {
      client.validate(options);
      return null;
    } catch (error) {
      return reasonOf(error);
    }
  };
  let confirmedOpeningReason = openingReason(initial);

  /**
   * The functions a key's handles call (DC-QH-26 item 1). One slot per key:
   * a new key gets a new slot, and the old one keeps the functions it had,
   * so whatever still reads the old key - another handle's refetch, a retry,
   * a mutation's `accept: 'refetch'` - never runs the new key's `queryFn`.
   */
  let slot: {
    hash: string;
    queryFn: ObserveOptions<T, S>['queryFn'];
    retryDelay: ObserveOptions<T, S>['retryDelay'];
  } | null = null;
  const slotFor = (hash: string) => {
    if (slot?.hash !== hash) {
      slot = { hash, queryFn: latest.queryFn, retryDelay: latest.retryDelay };
    }
    return slot;
  };

  const resolve = (): LiveQueryOptions<T> => {
    const options = latest;
    // An invalid key throws here, and the cursor shows it as a source error.
    if (options.enabled !== undefined && typeof options.enabled !== 'boolean')
      throw new TypeError('enabled must be a boolean.');
    const current = slotFor(hashQueryKey(options.queryKey));
    // The checks read the cache, which may have changed since setOptions last
    // ran them (an entry evicted while detached, say). Remember what this
    // open saw, so the next setOptions compares against what is shown.
    confirmedOpeningReason = null;
    if (options.enabled !== false) {
      try {
        client.validate(options);
      } catch (error) {
        confirmedOpeningReason = reasonOf(error);
        throw error;
      }
    }
    return {
      ...options,
      queryFn: context => current.queryFn(context),
      retryDelay: attempt => (current.retryDelay ?? defaultRetryDelay)(attempt),
    };
  };

  const originals = new WeakMap<object, QueryHandle<T>>();
  const displays = new WeakMap<object, QueryDisplayHandle<S>>();
  const open = (options: QueryOptions<T>): OpenedQuery<T, S> => {
    const handle = client.open<T>(options);
    let display: QueryDisplayHandle<S>;
    try {
      display = createQueryDisplay<T, S>(handle, () => latest);
    } catch (error) {
      handle.dispose();
      throw error;
    }
    const wrapper = releaseLater(handle, schedule);
    originals.set(wrapper, handle);
    displays.set(wrapper, display);
    return Object.freeze({
      query: wrapper as unknown as QueryHandle<T, S>,
      display,
    });
  };

  // Writing a new object here is what makes the cursor resolve again.
  const trigger = create<{ version: number }>({ version: 0 });
  let version = 0;
  const reopen = () => {
    version += 1;
    trigger.updateRef.value = { version };
  };

  let cursor: LiveQueryCursor<T, S> | null = null;
  const attach = () => {
    if (!cursor) cursor = createLiveQuery(trigger.watch, resolve, open);
    return cursor;
  };
  const detach = () => {
    const ending = cursor;
    cursor = null;
    ending?.dispose();
  };
  const current = () => {
    const wrapper = cursor?.current();
    return wrapper ? wrapper : null;
  };

  /**
   * Subscriptions, counted the way the core ends them (DC-QH-30): the abort
   * of the signal the first run returned, or a later run returning `false`.
   */
  let count = 0;
  const records = new WeakMap<object, { ref: unknown; ended: boolean }>();
  const subscribe = (
    renew: Renew<QueryDisplayRef<QueryDisplayState<S>>>,
    option?: { cache?: boolean }
  ) => {
    const known = records.get(renew);
    if (known && !known.ended && option?.cache !== false) return known.ref;
    const record = { ref: undefined as unknown, ended: false };
    let firstResult: unknown;
    const end = () => {
      if (record.ended) return;
      record.ended = true;
      count -= 1;
      if (count === 0) detach();
    };
    const callback = (
      ref: QueryDisplayRef<QueryDisplayState<S>>,
      first: boolean
    ) => {
      // A throwing first run may already have collected paths in the core.
      // Retire that leftover without calling or counting it again.
      if (record.ended && !first) return false;
      const result = renew(ref, first);
      if (first) firstResult = result;
      else if (result === false) end();
      return result;
    };
    // A first run may end another subscription synchronously.
    count += 1;
    try {
      record.ref = attach().watch(callback, option);
    } catch (error) {
      end();
      throw error;
    }
    if (option?.cache !== false) records.set(renew, record);
    if (firstResult instanceof AbortSignal) {
      if (firstResult.aborted) end();
      else firstResult.addEventListener('abort', end, { once: true });
    }
    return record.ref;
  };

  /**
   * A server render never attaches (DC-QH-15). A subscription there - Svelte's
   * store API subscribes on the server - gets the confirmed options' state,
   * read when it subscribes.
   */
  let server: {
    store: ReturnType<typeof create<QueryDisplayState<S>>>;
    watch: QueryDisplayWatch<QueryDisplayState<S>>;
  } | null = null;
  const subscribeOnServer = (
    renew: Renew<QueryDisplayRef<QueryDisplayState<S>>>,
    option?: { cache?: boolean }
  ) => {
    const state = confirmedPeek.raw();
    if (!server) {
      // Not auto-synced, so its refs refuse writes as the cursor's do.
      const store = create<QueryDisplayState<S>>(state, { autoSync: false });
      const refs = new WeakMap<object, object>();
      const snapshots = new WeakMap<object, object>();
      const guard = (ref: StateRefStore<QueryDisplayState<S>>) =>
        guardRef(ref, () => {}, refs, snapshots);
      server = {
        store,
        watch: guardedWatch(
          store.watch,
          store.watch(),
          guard,
          () => {},
          new Set(),
          true
        ) as unknown as QueryDisplayWatch<QueryDisplayState<S>>,
      };
    } else if (server.store.updateRef.value !== state) {
      server.store.updateRef.value = state;
      server.store.sync();
    }
    return server.watch(renew, option);
  };

  const watch = ((
    renew?: Renew<QueryDisplayRef<QueryDisplayState<S>>>,
    option?: { cache?: boolean }
  ) => {
    if (!renew) return confirmedPeek.ref;
    if (client.ssr) return subscribeOnServer(renew, option);
    return subscribe(renew, option);
  }) as QueryDisplayWatch<QueryDisplayState<S>>;

  const handle = (): QueryHandle<T> | null => {
    const wrapper = current();
    return wrapper ? originals.get(wrapper) ?? null : null;
  };

  const controls: QueryObserverControls<T> = Object.freeze({
    refetch: () => {
      const query = handle();
      return query
        ? query.refetch()
        : Promise.reject(new Error('This query observer is not attached.'));
    },
    invalidate: () => {
      const marker = markerOf(latest);
      if (!marker.ok) return;
      client.invalidate(JSON.parse(marker.hash) as QueryKey);
      // An attached observer reads again, as TanStack refetches active
      // observers. A linked WRITE refuses the READ; its acceptance decides.
      void handle()
        ?.load()
        .catch(() => {});
    },
    handle: () => handle(),
  });

  const setOptions = (next: ObserveOptions<T, S>): boolean => {
    const previous = latest;
    if (next === previous) return false;
    latest = next;
    const before = markerOf(previous);
    const after = markerOf(next);
    const previousOpeningReason = confirmedOpeningReason;
    confirmedOpeningReason = openingReason(next);
    if (slot && after.ok && after.hash === slot.hash) {
      slot.queryFn = next.queryFn;
      slot.retryDelay = next.retryDelay;
    }
    const switched =
      !sameMarker(before, after) || enabledOf(previous) !== enabledOf(next);
    if (
      switched ||
      (after.ok &&
        (previousOpeningReason !== confirmedOpeningReason ||
          HANDLE_OPTIONS.some(key => !Object.is(previous[key], next[key]))))
    ) {
      reopen();
    } else if (
      next.select !== previous.select ||
      !Object.is(next.placeholderData, previous.placeholderData)
    ) {
      const wrapper = current();
      if (wrapper) displays.get(wrapper)?.reproject();
    }
    return switched;
  };

  return Object.freeze({
    watch,
    peek: (options: ObserveOptions<T, S>) => {
      rendered = options;
      return renderedPeek.ref;
    },
    matches: (options: ObserveOptions<T, S>) =>
      sameMarker(markerOf(options), markerOf(latest)) &&
      enabledOf(options) === enabledOf(latest),
    setOptions,
    controls,
  });
}
