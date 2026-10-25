import type { Watch } from 'state-ref';
import type {
  InspectableSyncClient,
  SyncInspection,
  CacheEventView,
  MutationEventView,
} from './sync';
import type {
  ObserveOptions,
  Preview,
  StoreEvent,
  SubscriptionSnapshot,
} from 'state-ref/devtools';

export interface DevtoolsOptions {
  readonly maxEvents?: number;
  readonly maxHistoryBytes?: number;
  readonly maxSources?: number;
}
export interface AttachStoreOptions extends ObserveOptions {
  readonly name?: string;
}
export interface StoreSource {
  readonly id: number;
  readonly name: string;
  readonly kind: 'store' | 'sync';
  readonly generation: number;
  readonly status: 'recording' | 'paused';
  readonly resnapshots: number;
  readonly lastGap?: 'overflow' | 'capture-error' | 'pause';
}
export interface StoreInspection {
  readonly sourceId: number;
  readonly generation: number | null;
  readonly value: Preview;
  readonly subscriptions: readonly SubscriptionSnapshot[];
  readonly subscriptionCount: number;
  readonly subscriptionsTruncated: boolean;
}
export type DevtoolsRecord = {
  readonly sequence: number;
  readonly timestamp: number;
  readonly sourceId: number;
  readonly sourceName: string;
  readonly generation: number;
} & (
  | { readonly kind: 'store-event'; readonly event: StoreEvent }
  | { readonly kind: 'sync-cache'; readonly event: CacheEventView }
  | { readonly kind: 'sync-mutation'; readonly event: MutationEventView }
  | { readonly kind: 'source-attached' | 'source-detached' }
  | {
      readonly kind: 'gap';
      readonly reason: 'pause' | 'inspection-error';
      readonly dropped: null;
    }
);
export interface DevtoolsSnapshot {
  readonly paused: boolean;
  readonly disposed: boolean;
  readonly sources: readonly StoreSource[];
  readonly history: readonly DevtoolsRecord[];
  readonly historyBytes: number;
  readonly evicted: number;
  readonly oversized: number;
}
export interface Devtools {
  attachStore(watch: Watch<any>, options?: AttachStoreOptions): () => void;
  attachSync(
    client: InspectableSyncClient,
    options?: { readonly name?: string }
  ): () => void;
  getSnapshot(): DevtoolsSnapshot;
  inspectStore(sourceId: number): StoreInspection;
  inspectSync(sourceId: number): SyncInspection;
  subscribe(listener: () => void): () => void;
  pause(): void;
  resume(): void;
  clear(): void;
  dispose(): void;
}
