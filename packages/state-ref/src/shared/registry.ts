export type Waiter = (entry: Entry) => void;

/**
 * One shared name. `value` is whatever the provider handed over - usually a
 * watch, sometimes an object such as a sync client. `ready` is the provider's
 * own statement of when a watch's data can be used.
 */
export type Entry = {
  value: unknown;
  ready?: (ref: any) => unknown;
};

/**
 * What every bundle on the page agrees on. Only functions and plain
 * collections live here, so copies of state-ref at different versions can
 * share it - nothing in it depends on core internals.
 *
 * `v` is the shape's version. A copy that finds a shape it does not know
 * stops instead of overwriting it: another bundle is still using it.
 */
export type Registry = {
  v: number;
  entries: Map<string, Entry>;
  waiters: Map<string, Set<Waiter>>;
};

const KEY = Symbol.for('state-ref.shared');
const PROTOCOL = 1;

export function registry(): Registry {
  const host = globalThis as { [KEY]?: Registry };
  const found = host[KEY];

  if (found === undefined) {
    const created: Registry = {
      v: PROTOCOL,
      entries: new Map(),
      waiters: new Map(),
    };
    Object.defineProperty(host, KEY, {
      value: created,
      configurable: true,
      enumerable: false,
      writable: false,
    });
    return created;
  }

  if (found.v !== PROTOCOL) {
    throw new Error(
      `state-ref/shared: the page already holds a shared registry at protocol ${String(
        found.v
      )}, and this copy speaks protocol ${PROTOCOL}. Align the state-ref versions of the bundles on this page.`
    );
  }

  return found;
}

/**
 * Runs `waiter` with the entry under `name` - now if it is there, otherwise
 * when it is provided. The returned function stops waiting.
 */
export function await_(name: string, waiter: Waiter): () => void {
  const { entries, waiters } = registry();
  const existing = entries.get(name);
  if (existing) {
    waiter(existing);
    return () => {};
  }

  let waiting = waiters.get(name);
  if (!waiting) waiters.set(name, (waiting = new Set()));
  const queue = waiting;
  queue.add(waiter);

  return () => {
    queue.delete(waiter);
    if (queue.size === 0 && waiters.get(name) === queue) waiters.delete(name);
  };
}
