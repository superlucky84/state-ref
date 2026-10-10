import { create } from 'state-ref';
import type { StateRefStore } from 'state-ref';
import { guardRef, snapshotValue } from './ref-guard';
import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { assertEditable, frozenCopy } from './tree';
import type { QueryStatus } from './index';
import {
  IDLE_STATUS,
  carryProjection,
  projectDisplay,
  sameDisplay,
  type ProjectedDisplay,
  type ProjectionMemo,
  type QueryDisplayOptions,
  type QueryDisplayRef,
  type QueryDisplayState,
} from './display';

/**
 * What a peek may read of a cache entry. Every member is a plain read or a
 * check that throws: none creates the entry, takes ownership, touches its gc
 * timer or emits an event.
 */
export type PeekEntry<T> = {
  readonly removed: boolean;
  readonly kind: 'query' | 'infinite';
  peekStatus(): QueryStatus;
  isLoaded(): boolean;
  /** The value observers see, local edits included. Only when loaded. */
  peekValue(): T;
  /** Whether a display hands `select` read-only snapshots of the value. */
  peekEditable(): boolean;
  /** Whether opening a query with `initialData` now would seed it. */
  canSeedInitial(): boolean;
  /** Throws as opening these options on this entry would. */
  assertCompatible(options: PeekOptions<T, any>): void;
};

/** The options a peek reads. A subset of an observer's options. */
export type PeekOptions<T, S = T> = QueryDisplayOptions<T, S> &
  Readonly<{
    queryKey: QueryKey;
    enabled?: boolean;
    editable?: boolean;
    initialData?: T;
    initialUpdatedAt?: number;
    retry?: number;
  }>;

export type PeekReader<S> = Readonly<{
  /**
   * The live display ref. A read at any depth recomputes against the current
   * options and cache, and gives the same objects while neither changed.
   */
  ref: QueryDisplayRef<QueryDisplayState<S>>;
  /** The current display state, read-only, recomputed the same way. */
  state: () => QueryDisplayState<S>;
  /**
   * The same state as the frozen object the reader keeps, for a store that
   * re-serves it (`observe.ts`, server subscriptions). Not handed to users.
   */
  raw: () => QueryDisplayState<S>;
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
export const reasonOf = (error: unknown): string =>
  error instanceof Error
    ? `${error.name}: ${error.message}`
    : `invalid: ${String(error)}`;

/** Match load's retry check, before an observer starts its READ. */
export function checkObserverRetry(retry: number | undefined) {
  if (retry !== undefined && (retry < 0 || Number.isNaN(retry)))
    throw new RangeError('retry must be nonnegative.');
}

/**
 * A display ref that reads the cache without taking part in it (DC-QH-12,
 * DC-QH-29).
 *
 * Nothing here creates an entry or owns one, so a render may call it any
 * number of times, or throw it away, and the cache is exactly as it was. The
 * result is a state-ref-shaped ref like a display's, read-only like one, and:
 *
 * - live: every read or inspection, at any depth, recomputes from
 *   `readOptions()` and the cache, so a ref made before the data arrived - or
 *   held across a change of options - shows what is there now;
 * - stable: while nothing it depends on changed, every read returns the same
 *   objects. React compares a snapshot by identity, and a fresh object on
 *   every read makes it render forever (DESIGN 6절 E4).
 *
 * Options that opening the query would refuse - a bad key, `enabled` or
 * timing option, a key of another query kind, a mix of editable and readonly
 * data, non-plain editable `initialData` - show as a source error, as the
 * observer will once it attaches (DC-QH-13). `validate` holds the checks that
 * do not need an entry; the client passes the ones it runs on open.
 *
 * The state lives in a private store nobody subscribes to, so replacing it is
 * a plain write that notifies nothing.
 */
export function createPeekReader<T, S = T>(
  lookup: (hash: string) => PeekEntry<T> | undefined,
  readOptions: () => PeekOptions<T, S>,
  validate: (options: PeekOptions<T, S>) => void = () => {}
): PeekReader<S> {
  const memo: ProjectionMemo<T, S> = { last: null };
  const inputSnapshots = new WeakMap<object, object>();
  let inputs: Inputs<T, S> | null = null;
  let parsed: { hash: string; key: QueryKey } | null = null;
  let checked: {
    options: PeekOptions<T, S>;
    entry: PeekEntry<T> | undefined;
    seeded: boolean;
  } | null = null;
  let comparisonFailure: { data: S; error: unknown } | null = null;
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
      parsed = { hash, key: frozenCopy(JSON.parse(hash)) as QueryKey };
    return parsed.key;
  };

  /**
   * The checks opening the query runs, done once per options object and
   * entry: a render passes the same object to every read it makes.
   */
  const check = (
    options: PeekOptions<T, S>,
    entry: PeekEntry<T> | undefined,
    seeded: boolean
  ) => {
    if (
      checked &&
      checked.options === options &&
      checked.entry === entry &&
      checked.seeded === seeded
    )
      return;
    validate(options);
    checkObserverRetry(options.retry);
    if (entry) {
      if (entry.kind !== 'query')
        throw new TypeError('A query key cannot mix query kinds.');
      entry.assertCompatible(options);
    }
    if (seeded && (options.editable ?? true))
      assertEditable(options.initialData);
    checked = { options, entry, seeded };
  };

  const readInputs = (options: PeekOptions<T, S>): Inputs<T, S> => {
    try {
      if (
        options.enabled !== undefined &&
        typeof options.enabled !== 'boolean'
      ) {
        throw new TypeError('enabled must be a boolean.');
      }
      const hash = hashQueryKey(options.queryKey);
      if (options.enabled === false) return { kind: 'disabled', hash };
      const found = lookup(hash);
      const entry = found && !found.removed ? found : undefined;
      const seeded =
        options.initialData !== undefined && (!entry || entry.canSeedInitial());
      check(options, entry, seeded);
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
    } catch (error) {
      checked = null;
      return { kind: 'invalid', reason: reasonOf(error), error };
    }
  };

  /** The display's `equals` rule, failure included (R-QH-09). */
  const compare = (
    projected: ProjectedDisplay<S>,
    options: PeekOptions<T, S>,
    sameKey: boolean
  ) => {
    const data = projected.data;
    if (
      !sameKey ||
      !current.enabled ||
      data === undefined ||
      current.data === undefined ||
      Object.is(data, current.data)
    ) {
      comparisonFailure = null;
      return projected;
    }
    let error: unknown;
    if (comparisonFailure && Object.is(data, comparisonFailure.data)) {
      error = comparisonFailure.error;
    } else {
      try {
        comparisonFailure = null;
        return (options.equals ?? Object.is)(data, current.data)
          ? { ...projected, data: current.data }
          : projected;
      } catch (thrown) {
        comparisonFailure = { data, error: thrown };
        error = thrown;
      }
    }
    return {
      ...projected,
      data: undefined,
      status: 'error' as const,
      error,
      errorSource: 'select' as const,
      isPlaceholder: false,
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
    const key = keyOf(next.hash);
    const sameKey = current.queryKey === key;
    const onlyOptionsChanged =
      previous?.kind === 'enabled' &&
      previous.hash === next.hash &&
      previous.entry === next.entry &&
      previous.status === next.status &&
      Object.is(previous.value, next.value) &&
      previous.seeded === next.seeded &&
      Object.is(previous.initialData, next.initialData);
    if (onlyOptionsChanged && sameKey && current.enabled) {
      projected = carryProjection(projected, current, memo);
    }
    return Object.freeze({
      ...compare(projected, options, sameKey),
      queryKey: key,
      enabled: true,
    });
  };

  const refresh = () => {
    const options = readOptions();
    const next = readInputs(options);
    if (inputs && sameInputs(inputs, next)) return;
    // Built before it is remembered: a build that throws is retried on the
    // next read instead of leaving the old state standing for new inputs.
    const state = build(next, options, inputs);
    inputs = next;
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
    snapshots,
    true,
    false,
    refresh
  ) as QueryDisplayRef<QueryDisplayState<S>>;

  return Object.freeze({
    ref,
    state: () => {
      refresh();
      return snapshotValue(current, snapshots) as QueryDisplayState<S>;
    },
    raw: () => {
      refresh();
      return current;
    },
  });
}
