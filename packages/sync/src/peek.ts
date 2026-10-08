import { create } from 'state-ref';
import type { StateRefStore } from 'state-ref';
import { guardRef, snapshotValue } from './ref-guard';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import type { QueryStatus } from './index';
import {
  IDLE_STATUS,
  carryProjection,
  projectDisplay,
  sameDisplay,
  type ProjectionMemo,
  type QueryDisplayOptions,
  type QueryDisplayRef,
  type QueryDisplayState,
} from './display';

/**
 * What a peek may read of a cache entry. Every member is a plain read: none
 * creates the entry, takes ownership, touches its gc timer or emits an event.
 */
export type PeekEntry<T> = {
  readonly removed: boolean;
  peekStatus(): QueryStatus;
  isLoaded(): boolean;
  /** The value observers see, local edits included. Only when loaded. */
  peekValue(): T;
  /** Whether a display hands `select` read-only snapshots of the value. */
  peekEditable(): boolean;
  /** Whether opening a query with `initialData` now would seed it. */
  canSeedInitial(): boolean;
};

/** The options a peek reads. A subset of an observer's options. */
export type PeekOptions<T, S = T> = QueryDisplayOptions<T, S> &
  Readonly<{
    queryKey: QueryKey;
    enabled?: boolean;
    editable?: boolean;
    initialData?: T;
    initialUpdatedAt?: number;
  }>;

export type PeekReader<S> = Readonly<{
  /**
   * The live display ref. A read at any depth recomputes against the current
   * options and cache, and gives the same objects while neither changed.
   */
  ref: QueryDisplayRef<QueryDisplayState<S>>;
  /** The current display state, recomputed the same way. */
  state: () => QueryDisplayState<S>;
}>;

type Inputs<T, S> =
  | { kind: 'invalid'; reason: string; error: unknown }
  | { kind: 'disabled'; hash: string }
  | {
      kind: 'enabled';
      hash: string;
      entry: PeekEntry<T> | undefined;
      status: QueryStatus | undefined;
      value: T | undefined;
      seeded: boolean;
      initialData: T | undefined;
      initialUpdatedAt: number | undefined;
      select: QueryDisplayOptions<T, S>['select'];
      placeholderData: T | undefined;
    };

const sameInputs = <T, S>(a: Inputs<T, S>, b: Inputs<T, S>): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'invalid') return a.reason === (b as typeof a).reason;
  if (a.kind === 'disabled') return a.hash === (b as typeof a).hash;
  const other = b as typeof a;
  return (
    a.hash === other.hash &&
    a.entry === other.entry &&
    a.status === other.status &&
    Object.is(a.value, other.value) &&
    a.seeded === other.seeded &&
    Object.is(a.initialData, other.initialData) &&
    a.initialUpdatedAt === other.initialUpdatedAt &&
    a.select === other.select &&
    Object.is(a.placeholderData, other.placeholderData)
  );
};

/** The fixed marker an invalid option compares by (DC-QH-13). */
const reasonOf = (error: unknown): string =>
  error instanceof Error
    ? `${error.name}: ${error.message}`
    : `invalid: ${String(error)}`;

/**
 * A display ref that reads the cache without taking part in it (DC-QH-12,
 * DC-QH-29).
 *
 * Nothing here creates an entry or owns one, so a render may call it any
 * number of times, or throw it away, and the cache is exactly as it was. The
 * result is a state-ref-shaped ref like a display's, read-only like one, and:
 *
 * - live: every read, at any depth, recomputes from `readOptions()` and the
 *   cache, so a ref made before the data arrived - or held across a change of
 *   options - shows what is there now;
 * - stable: while nothing it depends on changed, every read returns the same
 *   objects. React compares a snapshot by identity, and a fresh object on
 *   every read makes it render forever (DESIGN 6절 E4).
 *
 * The state lives in a private store nobody subscribes to, so replacing it is
 * a plain write that notifies nothing.
 */
export function createPeekReader<T, S = T>(
  lookup: (hash: string) => PeekEntry<T> | undefined,
  readOptions: () => PeekOptions<T, S>
): PeekReader<S> {
  const memo: ProjectionMemo<T, S> = { last: null };
  const inputSnapshots = new WeakMap<object, object>();
  let inputs: Inputs<T, S> | null = null;
  let parsed: { hash: string; key: QueryKey } | null = null;
  let current: QueryDisplayState<S> = Object.freeze({
    ...IDLE_STATUS,
    data: undefined,
    isPlaceholder: false,
    errorSource: null,
    queryKey: null,
    enabled: false,
  });
  const store = create<QueryDisplayState<S>>(current, { autoSync: false });

  const keyOf = (hash: string): QueryKey => {
    if (parsed?.hash !== hash)
      parsed = { hash, key: JSON.parse(hash) as QueryKey };
    return parsed.key;
  };

  const readInputs = (options: PeekOptions<T, S>): Inputs<T, S> => {
    let hash: string;
    try {
      if (
        options.enabled !== undefined &&
        typeof options.enabled !== 'boolean'
      ) {
        throw new TypeError('enabled must be a boolean.');
      }
      hash = hashQueryKey(options.queryKey);
    } catch (error) {
      return { kind: 'invalid', reason: reasonOf(error), error };
    }
    if (options.enabled === false) return { kind: 'disabled', hash };
    const found = lookup(hash);
    const entry = found && !found.removed ? found : undefined;
    const seeded =
      options.initialData !== undefined && (!entry || entry.canSeedInitial());
    const loaded = !seeded && entry !== undefined && entry.isLoaded();
    return {
      kind: 'enabled',
      hash,
      entry,
      status: entry?.peekStatus(),
      value: loaded ? entry!.peekValue() : undefined,
      seeded,
      initialData: options.initialData,
      initialUpdatedAt: options.initialUpdatedAt,
      select: options.select,
      placeholderData: options.placeholderData,
    };
  };

  const build = (
    next: Inputs<T, S>,
    options: PeekOptions<T, S>,
    previous: Inputs<T, S> | null
  ): QueryDisplayState<S> => {
    if (next.kind === 'invalid') {
      // Same as a reactive key whose source fails (live-key.ts).
      return Object.freeze({
        ...IDLE_STATUS,
        status: 'error' as const,
        error: next.error,
        data: undefined,
        isPlaceholder: false,
        errorSource: 'source' as const,
        queryKey: null,
        enabled: false,
      });
    }
    if (next.kind === 'disabled') {
      return Object.freeze({
        ...IDLE_STATUS,
        data: undefined,
        isPlaceholder: false,
        errorSource: null,
        queryKey: keyOf(next.hash),
        enabled: false,
      });
    }
    const editable = next.entry?.isLoaded()
      ? next.entry.peekEditable()
      : options.editable ?? true;
    const protect = (value: T): T =>
      editable ? (snapshotValue(value, inputSnapshots) as T) : value;
    let status = next.status ?? IDLE_STATUS;
    let read: () => T = () => protect(next.value as T);
    if (next.seeded) {
      // What opening the query would install: `seedInitial` in index.ts. The
      // time is left out unless given, so a render stays deterministic.
      status = Object.freeze({
        ...status,
        status: 'success' as const,
        fetchStatus: 'idle' as const,
        loaded: true,
        error: null,
        updatedAt: next.initialUpdatedAt ?? null,
        invalidated: false,
        unconfirmed: false,
      });
      read = () => protect(next.initialData as T);
    }
    let projected = projectDisplay(status, read, options, memo);
    const onlyOptionsChanged =
      previous?.kind === 'enabled' &&
      previous.hash === next.hash &&
      previous.entry === next.entry &&
      previous.status === next.status &&
      Object.is(previous.value, next.value) &&
      previous.seeded === next.seeded &&
      Object.is(previous.initialData, next.initialData);
    if (onlyOptionsChanged && current.enabled) {
      projected = carryProjection(projected, current, memo);
    }
    let data = projected.data;
    if (
      current.enabled &&
      current.queryKey === keyOf(next.hash) &&
      data !== undefined &&
      current.data !== undefined &&
      !Object.is(data, current.data)
    ) {
      try {
        if ((options.equals ?? Object.is)(data, current.data)) {
          data = current.data;
        }
      } catch {
        // The display reports a failing `equals`; a peek just shows the
        // new value rather than inventing a second error path.
      }
    }
    return Object.freeze({
      ...projected,
      data,
      queryKey: keyOf(next.hash),
      enabled: true,
    });
  };

  const refresh = () => {
    const options = readOptions();
    const next = readInputs(options);
    if (inputs && sameInputs(inputs, next)) return;
    const previous = inputs;
    inputs = next;
    const state = build(next, options, previous);
    if (Object.is(state.data, current.data) && sameDisplay(state, current))
      return;
    current = state;
    store.updateRef.value = state;
  };

  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
  const ref = guardRef(
    store.watch() as StateRefStore<QueryDisplayState<S>>,
    refresh,
    refs,
    snapshots
  ) as QueryDisplayRef<QueryDisplayState<S>>;

  return Object.freeze({
    ref,
    state: () => {
      refresh();
      return current;
    },
  });
}
