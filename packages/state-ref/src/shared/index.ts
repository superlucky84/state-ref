import type { StateRefStore, Watch } from '@/types';
import { registry } from './registry';
import type { Waiter } from './registry';

/**
 * Names known to the type checker. Augment it to have `getShared`, `onShared`
 * and `whenReady` infer a store's type from its name:
 *
 *   declare module 'state-ref/shared' {
 *     interface SharedStores {
 *       'subs.ready': boolean;
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

/** The value type behind what `whenReady` was given - a watch or a name. */
export type ReadyValue<S, T = unknown> = S extends Watch<infer V>
  ? V
  : S extends string
  ? SharedValue<S, T>
  : T;

export type SharedOptions = { signal?: AbortSignal };

export type ReadyOptions<T> = SharedOptions & {
  /** What "ready" means. Defaults to the root value being truthy. */
  select?: (ref: StateRefStore<T>) => unknown;
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
 * Registers a watch under a name every bundle on the page can look up, and
 * runs the `onShared` callbacks that were waiting for it - in the order they
 * were made, before this returns.
 *
 * The first registration of a name stays. Registering a different watch under
 * the same name warns and hands back the first one, so a provider module that
 * ends up in two entry bundles does not break the page; registering the same
 * watch again is silent.
 *
 * The registry lives on `globalThis`. On a server that is shared between
 * requests - do not provide per-request state there.
 */
export function provideShared<N extends string, T>(
  name: N,
  watch: Watch<T> &
    (N extends keyof SharedStores ? Watch<SharedStores[N]> : unknown)
): Watch<T>;
export function provideShared(name: string, watch: Watch<any>): Watch<any> {
  checkName(name);
  if (typeof watch !== 'function') {
    throw new TypeError(
      `state-ref/shared: provideShared("${name}") needs a watch function.`
    );
  }

  const { stores, waiters } = registry();
  const existing = stores.get(name);
  if (existing) {
    if (existing !== watch) {
      console.warn(
        `state-ref/shared: "${name}" is already provided. The first registration stays and this one is ignored.`
      );
    }
    return existing;
  }

  stores.set(name, watch);

  const waiting = waiters.get(name);
  if (waiting) {
    waiters.delete(name);
    waiting.forEach(waiter => waiter(watch));
  }

  return watch;
}

/** The watch registered under `name` right now, if any. */
export function getShared<T = unknown, N extends string = string>(
  name: N
): Watch<SharedValue<N, T>> | undefined;
export function getShared(name: string): Watch<any> | undefined {
  checkName(name);
  return registry().stores.get(name);
}

/**
 * Runs `callback` once with the watch registered under `name` - immediately
 * if it is there, otherwise when a bundle provides it. Load order between the
 * provider and the consumer stops mattering.
 *
 * Aborting `signal` while still waiting drops the callback.
 */
export function onShared<T = unknown, N extends string = string>(
  name: N,
  callback: (watch: Watch<SharedValue<N, T>>) => void,
  options?: SharedOptions
): void;
export function onShared(
  name: string,
  callback: (watch: Watch<any>) => void,
  options: SharedOptions = {}
): void {
  checkName(name);
  const { signal } = options;
  if (signal?.aborted) return;

  const { stores, waiters } = registry();
  const run: Waiter = watch => {
    try {
      callback(watch);
    } catch (error) {
      report(name, error);
    }
  };

  const existing = stores.get(name);
  if (existing) {
    run(existing);
    return;
  }

  let waiting = waiters.get(name);
  if (!waiting) waiters.set(name, (waiting = new Set()));

  if (!signal) {
    waiting.add(run);
    return;
  }

  const queue = waiting;
  const cancel = () => {
    queue.delete(waiter);
    if (queue.size === 0 && waiters.get(name) === queue) waiters.delete(name);
  };
  const waiter: Waiter = watch => {
    signal.removeEventListener('abort', cancel);
    run(watch);
  };
  signal.addEventListener('abort', cancel, { once: true });
  queue.add(waiter);
}

/** Names something is waiting for that no bundle has provided. */
export function pendingShared(): string[] {
  return [...registry().waiters.keys()];
}

function gate<T>(
  name: string,
  watch: Watch<T>,
  callback: (ref: StateRefStore<T>) => void,
  options: ReadyOptions<T>
) {
  const { select, signal } = options;
  const controller = new AbortController();
  const stop = () => controller.abort();
  let done = false;

  signal?.addEventListener('abort', stop, { once: true });

  // A fresh closure per gate, so the watch's callback cache never hands two
  // gates the same subscription.
  watch((ref, isFirst) => {
    if (!done && !controller.signal.aborted) {
      if (select ? select(ref) : ref.value) {
        done = true;
        signal?.removeEventListener('abort', stop);
        try {
          callback(ref);
        } catch (error) {
          report(name, error);
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
 * `source` is a watch, or a shared name - a name also waits for the store to
 * be provided, so the consumer may load first. "Ready" is the root value being
 * truthy unless `select` says otherwise; only what `select` reads is watched.
 *
 * Aborting `signal` before the store is ready cancels both the wait and the
 * subscription.
 */
export function whenReady<T = unknown, S extends string | Watch<any> = string>(
  source: S,
  callback: (ref: StateRefStore<ReadyValue<S, T>>) => void,
  options?: ReadyOptions<ReadyValue<S, T>>
): void;
export function whenReady(
  source: string | Watch<any>,
  callback: (ref: StateRefStore<any>) => void,
  options: ReadyOptions<any> = {}
): void {
  if (options.signal?.aborted) return;

  if (typeof source === 'function') {
    gate('whenReady', source, callback, options);
    return;
  }

  onShared(source, watch => gate(source, watch, callback, options), {
    signal: options.signal,
  });
}
