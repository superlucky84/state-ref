import type { PeekOptions, PeekReader } from './peek';

/**
 * What a client keeps for this package's own use, out of the public API.
 *
 * The symbol is created here and never exported from the package entry, so
 * only modules of this copy of `@stateref/sync` - its tests and the coming
 * observer (IMPLEMENT 단계 2) - can reach it.
 */
const INTERNALS = Symbol('stateref.sync.internals');

export type SyncInternals = Readonly<{
  /** A cache read that creates nothing and owns nothing (DC-QH-12). */
  peek: <T, S = T>(readOptions: () => PeekOptions<T, S>) => PeekReader<S>;
}>;

/** Attach `internals` to a client object before it is frozen. */
export function withInternals<C extends object>(
  client: C,
  internals: SyncInternals
): C {
  Object.defineProperty(client, INTERNALS, { value: internals });
  return client;
}

export function internalsOf(client: object): SyncInternals {
  const internals = (client as { [INTERNALS]?: SyncInternals })[INTERNALS];
  if (!internals) throw new TypeError('Not a client of this sync copy.');
  return internals;
}
