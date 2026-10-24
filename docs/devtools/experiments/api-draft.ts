// Design contract only: no published exports or runtime implementation yet.
import type { Watch } from '../../../packages/state-ref/dist/index';

export type Path = readonly (
  | { readonly kind: 'key'; readonly value: string }
  | {
      readonly kind: 'symbol';
      readonly id: number;
      readonly description?: string;
    }
)[];

export type Preview =
  | {
      readonly kind: 'scalar';
      readonly value: string | number | boolean | null;
    }
  | {
      readonly kind: 'special';
      readonly type: 'undefined' | 'nan' | 'infinity' | 'bigint' | 'symbol';
      readonly display: string;
    }
  | {
      readonly kind: 'object' | 'array';
      readonly entries: readonly {
        readonly key: Path[number];
        readonly value: Preview;
      }[];
    }
  | {
      readonly kind: 'marker';
      readonly reason:
        | 'opaque'
        | 'accessor'
        | 'circular'
        | 'truncated'
        | 'masked'
        | 'capture-error';
    };

export interface SubscriptionSnapshot {
  readonly id: number;
  readonly paths: readonly Path[];
  // Attach does not reconstruct activity that happened before observation.
  readonly observedRuns: number;
}

export type StoreEvent = { readonly sequence: number } & (
  | {
      readonly type: 'write';
      readonly id: number;
      readonly path: Path;
      readonly before: Preview;
      readonly after: Preview;
      readonly batchId: number | null;
    }
  | {
      readonly type: 'subscription-run';
      readonly id: number;
      readonly initial: boolean;
      readonly changedPaths: readonly Path[];
      readonly cause:
        | { readonly kind: 'flush-group'; readonly writes: readonly number[] }
        | { readonly kind: 'unknown' };
    }
  | {
      readonly type: 'subscription-changed';
      readonly subscription: SubscriptionSnapshot;
    }
  | { readonly type: 'subscription-ended'; readonly id: number }
  | {
      readonly type: 'gap';
      readonly reason: 'overflow' | 'capture-error';
      readonly dropped: number;
    }
);

export interface StoreObservation {
  readonly protocolVersion: 1;
  snapshot(): Preview;
  subscriptions(): readonly SubscriptionSnapshot[];
  disconnect(): void;
}

export interface ObserveOptions {
  // Static path masks: no application callback executes during a commit.
  readonly redact?: readonly (readonly (string | symbol)[])[];
}

export declare function observeStore<T>(
  watch: Watch<T>,
  listener: (event: StoreEvent) => void,
  options?: ObserveOptions
): StoreObservation;
