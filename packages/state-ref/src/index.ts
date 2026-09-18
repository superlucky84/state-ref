export { createStore, createStoreManualSync } from '@/core';
/**
 * Internal seam for the bench and tests - how many path nodes a store has is
 * otherwise unobservable, and `DC-14` needs it gated. Not documented as API.
 */
export { create } from '@/core';
export { lens } from '@/lens';
export { copyable, cloneDeep, createComputed, combineWatch } from '@/helper';
/**
 * The debug handles, readable as `ref.a.b[NAVI]` / `ref.a.b[TYPE]`.
 *
 * They are registered symbols, so `Symbol.for('state-ref.navi')` reaches the
 * same handle without an import - but a name to import is what makes them a
 * documented surface rather than a magic string.
 */
export { NAVI, TYPE } from '@/helper';
export type {
  StateRefStore,
  Renew,
  Watch,
  ManualSyncStore,
  CreateStoreOption,
} from '@/types';
