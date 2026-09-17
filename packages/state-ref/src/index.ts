export { createStore, createStoreManualSync } from '@/core';
/**
 * Internal seam for the bench and tests - how many path nodes a store has is
 * otherwise unobservable, and `DC-14` needs it gated. Not documented as API.
 */
export { create } from '@/core';
export { lens } from '@/lens';
export { copyable, cloneDeep, createComputed, combineWatch } from '@/helper';
export type {
  StateRefStore,
  Renew,
  Watch,
  ManualSyncStore,
  CreateStoreOption,
} from '@/types';
