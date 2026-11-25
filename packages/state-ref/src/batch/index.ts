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
  if (__STATE_REF_DEVTOOLS__) runBatch.diagnostics?.begin();
  try {
    return runScope(callback);
  } finally {
    if (__STATE_REF_DEVTOOLS__) runBatch.diagnostics?.end();
  }
}

function runScope<T>(callback: () => T): T {
  depth += 1;
  let primaryFailed = false;
  try {
    const result = callback();
    if (result && typeof (result as any).then === 'function') {
      throw new TypeError('state-ref: batch callback must be synchronous.');
    }
    return result;
  } catch (error) {
    primaryFailed = true;
    throw error;
  } finally {
    depth -= 1;
    if (depth === 0) {
      const writes = pending;
      const callbacks = finalizers;
      pending = new Map();
      finalizers = new Set();

      let writeError: unknown;
      let hasWriteError = false;
      try {
        writes.forEach((nodes, subscriptions) => {
          runBatch(subscriptions, undefined, undefined, nodes);
        });
      } catch (error) {
        writeError = error;
        hasWriteError = true;
      }

      const finalizerErrors: unknown[] = [];
      callbacks.forEach(settle => {
        try {
          settle();
        } catch (error) {
          finalizerErrors.push(error);
        }
      });

      if (primaryFailed || hasWriteError) {
        if (finalizerErrors.length > 0) {
          console.error(
            new AggregateError(
              finalizerErrors,
              `state-ref/batch: ${finalizerErrors.length} error(s) thrown in batch finalizers.`
            )
          );
        }
        if (hasWriteError) {
          // eslint-disable-next-line no-unsafe-finally
          throw writeError;
        }
      } else if (finalizerErrors.length === 1) {
        // eslint-disable-next-line no-unsafe-finally
        throw finalizerErrors[0];
      } else if (finalizerErrors.length > 1) {
        // eslint-disable-next-line no-unsafe-finally
        throw new AggregateError(
          finalizerErrors,
          `state-ref/batch: ${finalizerErrors.length} error(s) thrown in batch finalizers.`
        );
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
