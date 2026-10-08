import type { Renew, StateRefStore, Watch } from '@/types';
import { await_, registry } from './registry';
import type { Entry } from './registry';

/**
 * Names known to the type checker. Augment it to have a store's type follow
 * from its name:
 *
 *   declare module 'state-ref/shared' {
 *     interface SharedStores {
 *       subs: { loaded: boolean; mySubs: Sub[] | null };
 *     }
 *   }
 *
 * A name that is not listed still works; pass the value type as a type
 * argument, or leave it `unknown`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SharedStores {}

/** The value type behind a name: the listed one, else the fallback `T`. */
export type SharedValue<
  N extends string,
  T = unknown
> = N extends keyof SharedStores ? SharedStores[N] : T;

declare const PENDING: unique symbol;
declare const HINT: unique symbol;

/**
 * A shared ref whose store no bundle has provided yet. It has no paths: pass
 * it to `isProvided` or `isReady` before reading anything.
 */
export type PendingRef<R = unknown> = {
  readonly [PENDING]: true;
  readonly [HINT]?: R;
};

/** A shared ref whose store exists. `R` rides along for `isReady`. */
export type ProvidedRef<T, R = T> = StateRefStore<T> & {
  readonly [HINT]?: R;
};

export type SharedRef<T, R = T> = ProvidedRef<T, R> | PendingRef<R>;

/**
 * A watch over a store another bundle provides. It is usable before that
 * bundle loads - the ref it hands out is pending until then.
 */
export type SharedWatch<T, R = T> = {
  (renew?: Renew<SharedRef<T, R>>, option?: { cache?: boolean }): SharedRef<
    T,
    R
  >;
  /** The shared name this watch follows. */
  readonly shared: string;
};

export type SharedOptions = { signal?: AbortSignal };

export type ProvideOptions<V> = {
  /**
   * When the store's data can be used - for a store that exists before its
   * data does. `isReady` and `whenReady` in every bundle follow it. Omitted,
   * a store is ready as soon as it is provided.
   */
  ready?: (
    ref: V extends (...args: any[]) => infer Ref ? Ref : never
  ) => unknown;
};

export type ReadyOptions<Ref> = SharedOptions & {
  /** A further condition on top of the store being ready. */
  select?: (ref: Ref) => unknown;
};

const STATE = Symbol.for('state-ref.shared.ref');

type RefState = {
  name: string;
  provided: () => boolean;
  ready: () => boolean;
};

function checkName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || name === '') {
    throw new TypeError(
      'state-ref/shared: a shared name must be a non-empty string.'
    );
  }
}

function report(name: string, error: unknown) {
  console.error(`state-ref/shared: a callback for "${name}" threw.`, error);
}

/**
 * Registers a value under a name every bundle on the page can reach, and
 * connects whatever was already waiting for it - in the order it asked,
 * before this returns.
 *
 * The value is normally a watch, from `createStore` or anywhere else that
 * hands one out; consumers follow it with `sharedWatch`. It may also be an
 * object - a sync client, a mutation handle - that consumers fetch with
 * `getShared` or `onShared`.
 *
 * The first registration of a name stays. Registering something else under
 * the same name warns and hands back the first one, so a provider module that
 * ends up in two entry bundles does not break the page.
 *
 * The registry lives on `globalThis`. On a server that is shared between
 * requests - do not provide per-request state there.
 */
export function provideShared<N extends string, V>(
  name: N,
  value: V &
    (N extends keyof SharedStores
      ? (...args: any[]) => { readonly value: SharedStores[N] }
      : unknown),
  options?: ProvideOptions<V>
): V;
export function provideShared(
  name: string,
  value: unknown,
  options: ProvideOptions<any> = {}
): unknown {
  checkName(name);
  if (value === undefined || value === null) {
    throw new TypeError(
      `state-ref/shared: provideShared("${name}") needs a value to share.`
    );
  }
  if (options.ready !== undefined && typeof options.ready !== 'function') {
    throw new TypeError(
      `state-ref/shared: provideShared("${name}") takes "ready" as a function.`
    );
  }

  const { entries } = registry();
  const existing = entries.get(name);
  if (existing) {
    if (existing.value !== value) {
      console.warn(
        `state-ref/shared: "${name}" is already provided. The first registration stays and this one is ignored.`
      );
    }
    return existing.value;
  }

  return register(name, { value, ready: options.ready });
}

/**
 * The shared value under `name`, made by `create` if no bundle has made it
 * yet. Every bundle that needs the value calls this with the same arguments;
 * whichever runs first creates it and the rest receive that one. It is always
 * there, so nothing has to wait and no guard is needed.
 *
 * This is for a value that needs no single owner - one where it does not
 * matter which bundle creates it. A `@stateref/sync` client is the usual
 * case: it starts empty, and its cache already makes sure a key is read once
 * however many bundles ask for it.
 *
 *   const client = ensureShared('sync', () => createSyncClient());
 *
 * A store that one bundle fills with data does have an owner: that bundle
 * should `provideShared` it, and the others follow it with `sharedWatch`.
 */
export function ensureShared<N extends string, V>(
  name: N,
  create: () => V &
    (N extends keyof SharedStores
      ? (...args: any[]) => { readonly value: SharedStores[N] }
      : unknown)
): V;
export function ensureShared(name: string, create: () => unknown): unknown {
  checkName(name);
  if (typeof create !== 'function') {
    throw new TypeError(
      `state-ref/shared: ensureShared("${name}") needs a function that creates the value.`
    );
  }

  const { entries } = registry();
  const existing = entries.get(name);
  if (existing) return existing.value;

  const value = create();
  if (value === undefined || value === null) {
    throw new TypeError(
      `state-ref/shared: ensureShared("${name}") created nothing to share.`
    );
  }
  // `create` may itself have ensured or provided this name.
  const nested = entries.get(name);
  return nested ? nested.value : register(name, { value });
}

function register(name: string, entry: Entry) {
  const { entries, waiters } = registry();
  entries.set(name, entry);

  const waiting = waiters.get(name);
  if (waiting) {
    waiters.delete(name);
    waiting.forEach(waiter => {
      try {
        waiter(entry);
      } catch (error) {
        report(name, error);
      }
    });
  }

  return entry.value;
}

/**
 * What is registered under `name` right now, if anything. For a value that is
 * not a watch, or where the provider is known to load first.
 */
export function getShared<T = unknown, N extends string = string>(
  name: N
): (N extends keyof SharedStores ? Watch<SharedStores[N]> : T) | undefined;
export function getShared(name: string): unknown {
  checkName(name);
  return registry().entries.get(name)?.value;
}

/**
 * Runs `callback` once with what is registered under `name` - immediately if
 * it is there, otherwise when a bundle provides it. For shared values that
 * are not watches; a store is easier to follow with `sharedWatch`.
 *
 * Aborting `signal` while still waiting drops the callback.
 */
export function onShared<T = unknown, N extends string = string>(
  name: N,
  callback: (
    value: N extends keyof SharedStores ? Watch<SharedStores[N]> : T
  ) => void,
  options?: SharedOptions
): void;
export function onShared(
  name: string,
  callback: (value: any) => void,
  options: SharedOptions = {}
): void {
  checkName(name);
  const { signal } = options;
  if (signal?.aborted) return;

  const cancel = await_(name, entry => {
    signal?.removeEventListener('abort', cancel);
    try {
      callback(entry.value);
    } catch (error) {
      report(name, error);
    }
  });
  signal?.addEventListener('abort', cancel, { once: true });
}

/** Names something is waiting for that no bundle has provided. */
export function pendingShared(): string[] {
  return [...registry().waiters.keys()];
}

/**
 * The ref a shared watch hands out: one stable object that is pending until
 * the store exists and forwards to the store's own ref from then on.
 *
 * Reading a path off it while pending throws. A pending store has no values,
 * and `undefined` would travel on as a quiet bug; the type says the same
 * thing by offering no paths until a guard has run.
 */
function sharedRef(
  name: string,
  find: () => { ref: any; entry: Entry } | null
) {
  const state: RefState = {
    name,
    provided: () => find() !== null,
    ready: () => {
      const found = find();
      if (!found) return false;
      return found.entry.ready ? Boolean(found.entry.ready(found.ref)) : true;
    },
  };
  const pending = (key: string | symbol) =>
    new Error(
      `state-ref/shared: "${name}" is not provided yet, so it has no "${String(
        key
      )}". Check isProvided(ref) or isReady(ref) before reading it.`
    );

  return new Proxy(
    {},
    {
      get(_, key) {
        if (key === STATE) return state;
        const found = find();
        if (found) return found.ref[key];
        if (typeof key === 'symbol' || PROBES.test(key)) return undefined;
        throw pending(key);
      },
      set(_, key, value) {
        const found = find();
        if (!found) throw pending(key);
        found.ref[key] = value;
        return true;
      },
      has(_, key) {
        if (key === STATE) return true;
        const found = find();
        return found ? key in found.ref : false;
      },
    }
  );
}

/**
 * Keys the runtime and tooling ask any object for - `await`, serializers,
 * test matchers, framework and devtools type checks. A pending ref answers
 * them with `undefined` like a plain object would, so that being inspected or
 * compared does not look like the user reading a path.
 */
const PROBES =
  /^(then|toJSON|constructor|nodeType|tagName|asymmetricMatch|\$\$.*|__.*|@@.*)$/;

function stateOf(ref: unknown): RefState | undefined {
  if (ref === null || typeof ref !== 'object') return undefined;
  // A store's own ref answers any key with a child ref, never a function.
  const state = (ref as { [STATE]?: RefState })[STATE];
  return state && typeof state.provided === 'function' ? state : undefined;
}

/**
 * Whether the store behind a shared ref exists yet. After it, the ref reads
 * and writes like any state-ref ref - including whatever loading or error
 * state the store carries.
 *
 * A ref that did not come from `sharedWatch` is a store's own ref, so it
 * counts as provided.
 */
export function isProvided<T, R>(
  ref: SharedRef<T, R>
): ref is ProvidedRef<T, R> {
  const state = stateOf(ref);
  return state ? state.provided() : true;
}

/**
 * Whether the store exists *and* its provider says the data can be used. The
 * provider states that with `provideShared(name, watch, { ready })`; a store
 * provided without it is ready at once.
 *
 * Called inside a subscription or a connected component it reads the
 * provider's condition through the subscribed ref, so the caller runs again
 * when the answer changes.
 *
 * The ref narrows to the ready type given to `sharedWatch<T, R>`.
 */
export function isReady<T, R>(
  ref: SharedRef<T, R>
): ref is ProvidedRef<T, R> & StateRefStore<R> {
  const state = stateOf(ref);
  return state ? state.ready() : true;
}

/**
 * A watch over the store provided under `name`, usable whether or not the
 * providing bundle has loaded.
 *
 * Until it has, the ref is pending: a subscriber runs once with it, and runs
 * again when the store arrives - arrival is a change like any other. Check
 * `isProvided(ref)` or `isReady(ref)` before reading; after that the ref is
 * the store's own.
 *
 *   const subsWatch = sharedWatch<Subs>('subs');
 *   subsWatch(ref => {
 *     if (!isReady(ref)) return;
 *     render(ref.mySubs.value);
 *   });
 *
 * `R` is the store's type once it is ready, for `isReady` to narrow to. It is
 * a promise the type checker cannot verify against the provider's `ready`.
 */
export function sharedWatch<
  T = unknown,
  R extends T = T,
  N extends string = string
>(
  name: N
): SharedWatch<
  SharedValue<N, T>,
  N extends keyof SharedStores ? SharedStores[N] : R
>;
export function sharedWatch(name: string): SharedWatch<any, any> {
  checkName(name);

  const cached = new WeakMap<Renew<any>, unknown>();
  let unsubscribed: { ref: any; entry: Entry } | null = null;
  const detached = sharedRef(name, () => {
    if (unsubscribed) return unsubscribed;
    const entry = registry().entries.get(name);
    if (!entry) return null;
    return (unsubscribed = { ref: source(entry)(), entry });
  });

  const source = (entry: Entry) => {
    if (typeof entry.value !== 'function') {
      throw new TypeError(
        `state-ref/shared: "${name}" is not a watch, so sharedWatch cannot follow it. Use getShared or onShared for it.`
      );
    }
    return entry.value as Watch<any>;
  };

  const watch = (renew?: Renew<any>, option?: { cache?: boolean }) => {
    if (!renew) return detached;

    const cache = option?.cache ?? true;
    if (cache && cached.has(renew)) return cached.get(renew);

    let found: { ref: any; entry: Entry } | null = null;
    const ref = sharedRef(name, () => found);
    if (cache) cached.set(renew, ref);

    // Follows the store's watch with the user's callback seeing `ref`. The
    // core registers a signal only from a first run and understands only
    // `false` from later ones; `asFirst` says which of those this subscriber
    // has already had.
    const connect = (entry: Entry, asFirst: boolean, ended: AbortSignal) => {
      let dropped = false;
      source(entry)((real, isFirst) => {
        found = { ref: real, entry };
        if (isFirst && asFirst) return renew(ref, true);
        if (ended.aborted) return isFirst ? ended : false;

        const result = renew(ref, false);
        if (!isFirst) return result;
        dropped = result === false;
        return ended;
      });
      return dropped;
    };

    const entry = registry().entries.get(name);
    if (entry) {
      connect(entry, true, new AbortController().signal);
      return ref;
    }

    // Not provided: the subscriber has its first run now, with a pending ref,
    // and the store's arrival is its next one.
    const controller = new AbortController();
    const first = renew(ref, true);
    if (first instanceof AbortSignal) {
      if (first.aborted) return ref;
      first.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }

    const cancel = await_(name, arrived => {
      controller.signal.removeEventListener('abort', cancel);
      if (connect(arrived, false, controller.signal)) controller.abort();
    });
    controller.signal.addEventListener('abort', cancel, { once: true });

    return ref;
  };

  return Object.assign(watch, { shared: name }) as SharedWatch<any, any>;
}

function gate(
  label: string,
  watch: (renew: Renew<any>) => unknown,
  open: (ref: any) => unknown,
  callback: (ref: any) => void,
  signal: AbortSignal | undefined
) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  let done = false;

  signal?.addEventListener('abort', stop, { once: true });

  // A fresh closure per gate, so the watch's callback cache never hands two
  // gates the same subscription.
  watch((ref, isFirst) => {
    if (!done && !controller.signal.aborted) {
      if (open(ref)) {
        done = true;
        signal?.removeEventListener('abort', stop);
        try {
          callback(ref);
        } catch (error) {
          report(label, error);
        }
      }
    }
    // The core registers a signal only on the first run and understands
    // only `false` afterwards.
    if (isFirst) return controller.signal;
    return done ? false : undefined;
  });

  // A signal that is already aborted when the first run returns it is never
  // heard, so a gate that opened on the first run is closed from out here.
  if (done) stop();
}

/**
 * Runs `callback` exactly once, as soon as the store is ready, then ends its
 * own subscription. A store that is ready already runs it straight away.
 *
 * Given a shared watch or a shared name, "ready" is `isReady` - provided, and
 * the provider's `ready` condition holds - so the callback's ref needs no
 * guard. Given a plain watch, it is the root value being truthy. `select`
 * adds a condition in the first case and replaces the default in the second;
 * only what the conditions read is watched.
 *
 * Aborting `signal` first cancels both the wait and the subscription.
 */
export function whenReady<T, R>(
  source: SharedWatch<T, R>,
  callback: (ref: ProvidedRef<T, R> & StateRefStore<R>) => void,
  options?: ReadyOptions<ProvidedRef<T, R> & StateRefStore<R>>
): void;
export function whenReady<T>(
  source: Watch<T>,
  callback: (ref: StateRefStore<T>) => void,
  options?: ReadyOptions<StateRefStore<T>>
): void;
export function whenReady<T = unknown, N extends string = string>(
  source: N,
  callback: (ref: StateRefStore<SharedValue<N, T>>) => void,
  options?: ReadyOptions<StateRefStore<SharedValue<N, T>>>
): void;
export function whenReady(
  source: string | Watch<any> | SharedWatch<any, any>,
  callback: (ref: any) => void,
  options: ReadyOptions<any> = {}
): void {
  const { select, signal } = options;
  if (signal?.aborted) return;

  const shared =
    typeof source === 'string'
      ? sharedWatch(source)
      : typeof (source as SharedWatch<any, any>).shared === 'string'
      ? (source as SharedWatch<any, any>)
      : null;

  if (shared) {
    gate(
      shared.shared,
      shared,
      ref => isReady(ref) && (select ? select(ref) : true),
      callback,
      signal
    );
    return;
  }

  gate(
    'whenReady',
    source as Watch<any>,
    select ?? (ref => ref.value),
    callback,
    signal
  );
}
