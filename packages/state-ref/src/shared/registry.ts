import type { Watch } from '@/types';

export type Waiter = (watch: Watch<any>) => void;

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
  stores: Map<string, Watch<any>>;
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
      stores: new Map(),
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
