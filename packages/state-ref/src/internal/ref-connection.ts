import { REF_CONNECTION } from '@/internal/ref-connection-key';
import type { PathNode } from '@/path';
import type {
  RefPathCursor,
  Run,
  StateRefStore,
  StoreRenderList,
} from '@/types';

/** An internal, opt-in view of a ref. It is not part of the package root API. */
export type RefConnection<T> = {
  readonly owner: object;
  readonly parent: RefPathCursor;
  readonly segment: string | symbol | null;
  readonly editable: boolean;
  readonly read: () => T | undefined;
  readonly exists: () => boolean;
};

type RawRefConnection<T> = readonly [
  owner: object,
  lens: { get: (root: object) => T },
  node: PathNode,
  editable: boolean,
  subscriptions: StoreRenderList<any>
];

const MISSING = Symbol('missing ref path');

function rawRef<T>(source: StateRefStore<T>): RawRefConnection<T> {
  const connection = (source as any)?.[REF_CONNECTION] as
    | RawRefConnection<T>
    | undefined;

  if (
    !Array.isArray(connection) ||
    typeof connection[1]?.get !== 'function' ||
    !connection[2] ||
    typeof connection[3] !== 'boolean' ||
    !(connection[4] instanceof Map)
  ) {
    throw new TypeError('Expected a state-ref reference.');
  }

  return connection;
}

export function connectRef<T>(source: StateRefStore<T>): RefConnection<T> {
  const connection = rawRef(source);
  const path: Array<string | symbol> = [];
  let owner = connection[2];
  for (
    let current: PathNode = owner;
    current.parent;
    current = current.parent
  ) {
    path.unshift(current.segment);
    owner = current.parent;
  }

  return {
    owner,
    parent: connection[2].parent ?? connection[2],
    segment: connection[2].parent ? connection[2].segment : null,
    editable: connection[3],
    read: () => connection[1].get(connection[0]),
    exists: () => {
      let value: any = connection[0];
      for (const key of path) {
        if (value == null || !(key in Object(value))) return false;
        value = value[key];
      }
      return true;
    },
  };
}

/**
 * Listen only to the source path. The ordinary runner still decides whether
 * its value changed, including when an ancestor replaces the whole branch.
 */
export function observeRef<T>(
  source: StateRefStore<T>,
  callback: (value: T | undefined) => void
): () => void {
  const connection = rawRef(source);
  const node = connection[2];
  const ref = connectRef(source);
  const current = () => (ref.exists() ? ref.read() : MISSING);
  const run: Run = () => callback(ref.read());
  const subscriptions = connection[4];

  subscriptions.set(
    run,
    new Map([[node, { value: current(), getNextValue: current }]])
  );
  (node.subs ??= new Set()).add(run);

  return () => {
    node.subs?.delete(run);
    subscriptions.delete(run);
  };
}
