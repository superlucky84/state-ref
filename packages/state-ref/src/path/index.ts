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
 * replaces, so `affectedRuns` walks parents and children instead of matching
 * string prefixes.
 */
export type PathNode = {
  readonly segment: string | symbol;
  readonly parent: PathNode | null;
  readonly children: Map<string | symbol, PathNode>;
  readonly subs: Set<Run>;
};

function makeNode(segment: string | symbol, parent: PathNode | null): PathNode {
  return { segment, parent, children: new Map(), subs: new Set() };
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
  let child = node.children.get(key);

  if (!child) {
    child = makeNode(key, node);
    node.children.set(key, child);
  }

  return child;
}

/**
 * Every subscription that a write at `node` can possibly have invalidated:
 * the ancestors whose references were rewritten, the node itself, and the
 * subtree that was replaced wholesale.
 *
 * This only narrows the candidates. Whether a subscriber actually re-runs is
 * still decided by comparing values in the runner, so an over-broad answer
 * costs a comparison and an under-broad one is impossible by copy-on-write.
 */
export function affectedRuns(node: PathNode): Set<Run> {
  const runs = new Set<Run>();

  for (let current: PathNode | null = node; current; current = current.parent) {
    current.subs.forEach(run => runs.add(run));
  }

  const pending: PathNode[] = [...node.children.values()];
  while (pending.length > 0) {
    const current = pending.pop()!;
    current.subs.forEach(run => runs.add(run));
    current.children.forEach(child => pending.push(child));
  }

  return runs;
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
