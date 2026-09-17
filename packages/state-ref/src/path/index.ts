import type { Run } from '@/types';

/**
 * A node in the store's path tree.
 *
 * Subscriptions used to be identified by a string built from the path
 * ("s:root|s:a|s:b"). That string was only ever used to deduplicate entries,
 * and manufacturing it dragged in an escaping pass and a global symbol-to-id
 * registry that never released its keys. A node's own identity does the same
 * job: walking `root -> a -> b` twice returns the same object, so a Map keyed
 * by PathNode deduplicates for free, symbols are ordinary segments, and there
 * is nothing to escape.
 *
 * The tree doubles as the reverse index for change propagation. Copy-on-write
 * only rewrites references along the written path and inside the subtree it
 * replaces, so `forEachAffectedNode` walks parents and children instead of
 * matching string prefixes.
 */
export type PathNode = {
  readonly segment: string | symbol;
  readonly parent: PathNode | null;
  children?: Map<string | symbol, PathNode>;
  subs?: Set<Run>;
};

const LENGTH = 'length';
const INDEX = /^\d+$/;

/**
 * `children` and `subs` are allocated on first use rather than up front.
 *
 * An empty `Map` costs about 194 B and an empty `Set` about 160 B, which is 83%
 * of a node that has neither - and most nodes have neither: a path written
 * through but never subscribed used to get both for nothing. Deferring them
 * takes such a node from about 427 B to about 73 B.
 *
 * Nothing else changes: the tree has the same shape and the same contents, so
 * a reader only has to read "no container" as "empty". That is why the
 * differential oracle is a complete gate for this change.
 */
function makeNode(segment: string | symbol, parent: PathNode | null): PathNode {
  return { segment, parent };
}

export function createPathRoot(): PathNode {
  return makeNode('', null);
}

/**
 * Numeric segments are normalised to strings so that `ref.items[0]` and the
 * index handed out by iteration land on the same node. JS property keys are
 * strings anyway; only the iterator ever supplies a number.
 */
export function childOf(
  node: PathNode,
  segment: string | number | symbol
): PathNode {
  const key = typeof segment === 'number' ? String(segment) : segment;
  const children = (node.children ??= new Map());
  let child = children.get(key);

  if (!child) {
    child = makeNode(key, node);
    children.set(key, child);
  }

  return child;
}

/**
 * Visits every node whose value a write at `node` can possibly have changed:
 *
 *   1. the ancestors, whose objects copy-on-write rewrote to reach the target
 *   2. the node itself
 *   3. the subtree it replaced wholesale
 *   4. its siblings
 *
 * Everything else keeps its reference by structure sharing, so it cannot need
 * re-reading.
 *
 * Case 4 is the one that is easy to get wrong, and it is not decoration. A
 * shallow copy carries own data properties across by reference, which is why a
 * sibling of the written node is normally untouched - but the final
 * `parent[prop] = value` can still move a *derived* property of that parent,
 * and an array's `length` is one:
 *
 *   items[2] = x   on a two-element array  ->  length becomes 3
 *   items.length = 2   on a four-element array  ->  items[2], items[3] vanish
 *
 * `length` is a sibling of `items.2`, not an ancestor, self, or descendant of
 * it, so without case 4 a subscriber on `items.length` is never told. The
 * assignment lands in the written node's parent, so that parent's children are
 * the boundary - an ancestor's other children stay reference-identical.
 *
 * Which siblings are narrowed by the segment being written, because only an
 * array length can move a sibling at all:
 *
 *   an index ("0", "12")  ->  only `length` can change; the other indices are
 *                             carried across by the copy, and an index the
 *                             array does not reach reads undefined either way
 *   "length"              ->  every index may vanish or appear, so all of them
 *   anything else         ->  no sibling can move
 *
 * That keeps a write to `items[0]` from walking every index node of a long
 * array on every assignment.
 *
 * The runner walks nodes rather than subscriptions on purpose. A subscriber
 * that reads twenty paths is woken by a write to any one of them, but the other
 * nineteen are provably unchanged - visiting the affected nodes and looking at
 * `subs` checks each subscriber only on the paths that can have moved, instead
 * of re-reading all twenty.
 *
 * This only narrows what is examined. Whether a subscriber re-runs is still
 * decided by comparing values in the runner, so an over-broad walk costs a
 * comparison. An under-broad one drops a notification, which is why the set
 * above is pinned by a differential test against the full scan.
 */
export function forEachAffectedNode(
  node: PathNode,
  visit: (node: PathNode) => void
) {
  for (let current: PathNode | null = node; current; current = current.parent) {
    visit(current);
  }

  const { parent, segment } = node;

  if (parent && typeof segment === 'string') {
    if (segment === LENGTH) {
      parent.children?.forEach(sibling => {
        if (sibling !== node) {
          visit(sibling);
        }
      });
    } else if (INDEX.test(segment)) {
      const length = parent.children?.get(LENGTH);

      if (length) {
        visit(length);
      }
    }
  }

  const pending: PathNode[] = node.children ? [...node.children.values()] : [];
  while (pending.length > 0) {
    const current = pending.pop()!;
    visit(current);
    current.children?.forEach(child => pending.push(child));
  }
}

/**
 * Human-readable path, for the NAVI debug handle only. Never used for
 * identity, so ambiguity around a segment containing a dot does not matter.
 */
export function pathToString(node: PathNode): string {
  const parts: string[] = [];

  for (
    let current: PathNode | null = node;
    current && current.parent;
    current = current.parent
  ) {
    parts.push(String(current.segment));
  }

  return parts.reverse().join('.');
}
