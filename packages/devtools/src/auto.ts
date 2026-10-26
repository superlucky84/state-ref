import type { Watch } from 'state-ref';
import type { InspectableSyncClient } from './sync';
import type { AutoOptions, AutoStoreOptions, AutoTarget } from './auto-types';
export type {
  AutoOptions,
  AutoStoreOptions,
  AutoTarget,
  DevtoolsHotContext,
} from './auto-types';

/** Production/default entry: no imports, inspection, registration or DOM work. */
export function devtools<T extends Watch<any>>(
  target: T,
  options?: AutoStoreOptions
): T;
export function devtools<T extends InspectableSyncClient>(
  target: T,
  options?: AutoOptions
): T;
export function devtools(target: AutoTarget, _options?: AutoStoreOptions) {
  return target;
}

export function stopDevtools(_target?: AutoTarget): void {}
