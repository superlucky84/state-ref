import { BUNDLE_COMBINATIONS } from 'stateref-example-shared';
import type { BundleCombination } from 'stateref-example-shared';

/**
 * What each combination is allowed to pull in. Step 6 of
 * docs/server-sync/PHASE8_5.md turns this into assertions over the resolved
 * module graph that `vite build` records for every entry point.
 */
export const FORBIDDEN_MODULES: Record<BundleCombination, string[]> = {
  'core-only': ['state-ref.draft', 'state-ref.batch', 'stateref-sync'],
  'draft-only': ['stateref-sync'],
  'sync-only': ['state-ref.draft'],
  combined: [],
};

export const COMBINATIONS = BUNDLE_COMBINATIONS;
