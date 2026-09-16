import type { Run, Renew, StateRefStore, StoreRenderList } from '@/types';

/**
 * Reports the errors user code threw during a single propagation pass.
 *
 * The new state is already committed by the time subscribers run, so
 * rethrowing would leave the store updated with its notifications only half
 * delivered - and it would surface at the assignment site, which is never
 * where the faulty code lives.
 */
function reportPassErrors(errors: unknown[]) {
  if (errors.length === 0) {
    return;
  }

  console.error(
    new AggregateError(
      errors,
      `state-ref: ${errors.length} error(s) thrown while propagating a store change.`
    )
  );
}

/**
 * Based on the information gathered by the “collector”,
 * this code identifies and executes a callback function for store changes.
 */
export function runner(storeRenderList: StoreRenderList<any>) {
  const runableRenewList: Set<Run> = new Set();
  const errors: unknown[] = [];

  storeRenderList.forEach((defs, run) => {
    defs.forEach(item => {
      const { value, getNextValue } = item;

      try {
        const nextValue = getNextValue();

        if (value !== nextValue) {
          runableRenewList.add(run);
          item.value = nextValue;
        }
      } catch (error) {
        /**
         * Reading a subscribed path only throws when the user's state exposes a
         * throwing accessor somewhere along it. A value that was merely removed
         * yields "undefined" instead, because the lens walks with optional
         * chaining. Either way, one bad path must not abort the scan for every
         * other subscriber.
         */
        errors.push(error);
      }
    });
  });

  runableRenewList.forEach(run => {
    if (!run) {
      return;
    }

    try {
      if (run() === false) {
        storeRenderList.delete(run);
      }
    } catch (error) {
      /**
       * A subscriber that throws must not swallow the subscribers queued
       * behind it.
       */
      errors.push(error);
    }
  });

  runableRenewList.clear();
  reportPassErrors(errors);
}

export function firstRunner<V>(
  run: Run,
  storeRenderList: StoreRenderList<any>,
  cacheMap: WeakMap<Renew<StateRefStore<V>>, StateRefStore<V>>,
  renew: Renew<StateRefStore<V>>
) {
  const renewResult = run!(true);

  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener('abort', () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
}
