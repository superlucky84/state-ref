import { STORE_DIAGNOSTICS } from '@/internal/devtools-key';
import type { Watch } from '@/types';
import type { ObserveOptions, StoreEvent, StoreObservation } from './types';

export type {
  Path,
  Preview,
  SubscriptionSnapshot,
  ObserveOptions,
  StoreEvent,
  StoreObservation,
} from './types';

/** Read-only observation of a root watch created by a development build. */
export function observeStore(
  watch: Watch<any>,
  listener: (event: StoreEvent) => void,
  options?: ObserveOptions
): StoreObservation {
  const capability =
    typeof watch === 'function' &&
    (watch as unknown as Record<symbol, unknown>)[STORE_DIAGNOSTICS];
  const source = capability as
    | { version?: number; observe?: typeof observeStore }
    | undefined;
  if (!source || source.version !== 1 || typeof source.observe !== 'function') {
    throw new TypeError(
      'state-ref/devtools: expected a root watch with diagnostics protocol 1. Use a compatible state-ref development build (Node: --conditions=development; Vite: development mode). For computed/combined/shared wrappers, register the original root watch.'
    );
  }
  // A foreign copy owns its capture, not this adapter's internal structures.
  return (
    source.observe as unknown as (
      listener: (event: StoreEvent) => void,
      options?: ObserveOptions
    ) => StoreObservation
  )(listener, options);
}
