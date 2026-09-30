import { runBatch } from 'state-ref';
import { forEachAffected } from '@/path';
import type { PathNode } from '@/path';
import type { StoreRenderList } from '@/types';

let depth = 0;
let pending = new Map<StoreRenderList<any>, Set<PathNode>>();
let finalizers = new Set<() => void>();

/**
 * Coalesce notifications in an explicit synchronous scope. Values and write
 * observers still update at each setter; the outer scope flushes on return.
 */
export function batch<T>(callback: () => T): T {
  depth += 1;
  try {
    const result = callback();
    if (result && typeof (result as any).then === 'function') {
      throw new TypeError('state-ref: batch callback must be synchronous.');
    }
    return result;
  } finally {
    depth -= 1;
    if (depth === 0) {
      const writes = pending;
      const callbacks = finalizers;
      pending = new Map();
      finalizers = new Set();

      try {
        writes.forEach((nodes, subscriptions) => {
          runBatch(subscriptions, undefined, undefined, nodes);
        });
      } finally {
        callbacks.forEach(settle => settle());
      }
    }
  }
}

runBatch.batch = {
  write: (subscriptions, parent, segment) => {
    if (depth === 0) return false;
    let nodes = pending.get(subscriptions);
    if (!nodes) pending.set(subscriptions, (nodes = new Set()));
    forEachAffected(parent, segment, node => nodes!.add(node));
    return true;
  },
  end: callback => {
    if (depth === 0) return false;
    finalizers.add(callback);
    return true;
  },
};
