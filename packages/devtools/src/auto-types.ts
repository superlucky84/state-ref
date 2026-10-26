import type { Watch } from 'state-ref';
import type { ObserveOptions } from 'state-ref/devtools';
import type { InspectableSyncClient } from './sync';
import type { PanelOptions } from './panel';

/** Structural subset of Vite's hot context; no Vite runtime dependency. */
export interface DevtoolsHotContext {
  dispose(callback: () => void): void;
}

export interface AutoOptions {
  readonly name?: string;
  readonly enabled?: boolean;
  readonly hot?: DevtoolsHotContext;
  /** First registration configures the shared panel. */
  readonly panel?: PanelOptions;
}

export interface AutoStoreOptions extends AutoOptions, ObserveOptions {}
export type AutoTarget = Watch<any> | InspectableSyncClient;
