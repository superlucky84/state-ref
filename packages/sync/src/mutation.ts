import { create } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import type { QueryHandle } from './index';
import type { ResourceSubmission } from './resource';
import { guardRef, guardedWatch } from './ref-guard';

export class MutationRejectedError extends Error {
  constructor(message: string, readonly reason?: unknown) {
    super(message);
    this.name = 'MutationRejectedError';
  }
}

export type MutationResult<T> =
  | Readonly<{
      kind: 'success';
      operationId: number;
      data: T;
      callbackError?: unknown;
    }>
  | Readonly<{
      kind: 'sync-error';
      operationId: number;
      data: T;
      error: unknown;
      callbackError?: unknown;
    }>
  | Readonly<{
      kind: 'rejected' | 'unknown';
      operationId: number;
      error: unknown;
      recoveryError?: unknown;
      callbackError?: unknown;
    }>;

export type MutationStatus = Readonly<{
  phase: 'idle' | 'pending' | MutationResult<unknown>['kind'];
  pending: number;
  operationId: number | null;
  error: unknown | null;
}>;

export type MutationLink<T> = Readonly<{
  query: QueryHandle<any>;
  submission?: ResourceSubmission<any>;
  accept?:
    | Readonly<{ kind: 'none' | 'refetch' | 'submitted' }>
    | Readonly<{ kind: 'response'; select: (data: T) => any }>;
  /** Only a confirmed rejection may remove unchanged submitted edits. */
  onReject?: 'keep' | 'remove';
}>;

export type MutationRunOptions<T> = Readonly<{
  links?: readonly MutationLink<T>[];
  /** Operations with the same scope run in start order. */
  scope?: string;
  signal?: AbortSignal;
  /** Retry is opt-in and requires server-supported idempotency for this key. */
  retry?: number;
  idempotencyKey?: string;
  retryDelay?: (attempt: number) => number;
}>;

export type MutationOptions<I, T> = Readonly<{
  mutationFn: (
    input: I,
    context: {
      signal: AbortSignal;
      operationId: number;
      attempt: number;
      idempotencyKey?: string;
    }
  ) => Promise<T> | T;
  onSuccess?: (data: T, input: I, operationId: number) => void | Promise<void>;
  onError?: (
    error: unknown,
    input: I,
    operationId: number
  ) => void | Promise<void>;
  onSettled?: (result: MutationResult<T>, input: I) => void | Promise<void>;
}>;

export type MutationOperation<T> = Readonly<{
  id: number;
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  result: Promise<MutationResult<T>>;
  abort: () => void;
  dispose: () => void;
}>;

export type MutationHandle<I, T> = Readonly<{
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  start: (input: I, options?: MutationRunOptions<T>) => MutationOperation<T>;
  run: (
    input: I,
    options?: MutationRunOptions<T>
  ) => Promise<MutationResult<T>>;
  dispose: () => void;
}>;

export type PreparedLink<T> = {
  begin: () => void;
  success: (data: T) => Promise<void>;
  reject: () => void;
  uncertain: () => void;
  end: () => void;
};

const idle: MutationStatus = Object.freeze({
  phase: 'idle',
  pending: 0,
  operationId: null,
  error: null,
});

function statusStore() {
  const store = create<MutationStatus>(idle);
  const controller = new AbortController();
  const controllers = new Set<AbortController>();
  const refs = new WeakMap<object, object>();
  const snapshots = new WeakMap<object, object>();
  let active = true;
  const assertActive = () => {
    if (!active) throw new Error('This mutation status has been disposed.');
  };
  const raw = store.watch(() => controller.signal, { editable: false });
  const guard = (ref: StateRefStore<MutationStatus>) =>
    guardRef(ref, assertActive, refs, snapshots);
  return {
    status: guard(raw),
    watchStatus: guardedWatch(
      store.watch,
      raw,
      guard,
      assertActive,
      controllers,
      true
    ),
    set(value: MutationStatus) {
      store.updateRef.value = Object.freeze(value);
    },
    dispose() {
      if (!active) return;
      active = false;
      controller.abort();
      controllers.forEach(item => item.abort());
      controllers.clear();
    },
  };
}

function wait(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, delay);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, { once: true });
  });
}

export function createMutation<I, T>(
  options: MutationOptions<I, T>,
  nextId: () => number,
  prepare: (links: readonly MutationLink<T>[]) => PreparedLink<T>[],
  schedule: <R>(scope: string, task: () => Promise<R>) => Promise<R>
): MutationHandle<I, T> {
  const shared = statusStore();
  let pending = 0;
  let disposed = false;
  const start = (
    input: I,
    run: MutationRunOptions<T> = {}
  ): MutationOperation<T> => {
    if (disposed) throw new Error('This mutation handle has been disposed.');
    const retry = run.retry ?? 0;
    if (!Number.isInteger(retry) || retry < 0)
      throw new RangeError('retry must be a nonnegative integer.');
    if (retry > 0 && !run.idempotencyKey) {
      throw new TypeError('Mutation retry requires an idempotencyKey.');
    }
    if (run.scope !== undefined && !run.scope) {
      throw new TypeError('Mutation scope must be nonempty.');
    }
    const frozenInput = structuredClone(input) as I;
    const links = prepare(run.links ?? []);
    const id = nextId();
    const own = statusStore();
    const controller = new AbortController();
    const abort = () =>
      controller.abort(
        new DOMException('Mutation was cancelled.', 'AbortError')
      );
    if (run.signal?.aborted) abort();
    else run.signal?.addEventListener('abort', abort, { once: true });
    const publish = (
      phase: MutationStatus['phase'],
      error: unknown | null = null
    ) => {
      own.set({
        phase,
        pending: phase === 'pending' ? 1 : 0,
        operationId: id,
        error,
      });
      shared.set({ phase, pending, operationId: id, error });
    };
    const begun: PreparedLink<T>[] = [];
    try {
      for (const link of links) {
        link.begin();
        begun.push(link);
      }
    } catch (error) {
      begun.reverse().forEach(link => link.end());
      own.dispose();
      run.signal?.removeEventListener('abort', abort);
      throw error;
    }
    pending += 1;
    publish('pending');
    const execute = async (): Promise<MutationResult<T>> => {
      let outcome: MutationResult<T>;
      try {
        let data!: T;
        let writeError: unknown;
        let succeeded = false;
        for (let attempt = 0; attempt <= retry; attempt += 1) {
          try {
            if (controller.signal.aborted) throw controller.signal.reason;
            data = await options.mutationFn(frozenInput, {
              signal: controller.signal,
              operationId: id,
              attempt,
              idempotencyKey: run.idempotencyKey,
            });
            succeeded = true;
            break;
          } catch (error) {
            writeError = error;
            if (
              error instanceof MutationRejectedError ||
              controller.signal.aborted ||
              attempt === retry
            )
              break;
            const delay =
              run.retryDelay?.(attempt) ??
              Math.min(1000 * 2 ** attempt, 30_000);
            if (delay < 0 || !Number.isFinite(delay))
              throw new RangeError(
                'retryDelay must be finite and nonnegative.'
              );
            try {
              await wait(delay, controller.signal);
            } catch (error) {
              writeError = error;
              break;
            }
          }
        }
        if (succeeded) {
          try {
            for (const link of links) await link.success(data);
            outcome = { kind: 'success', operationId: id, data };
          } catch (error) {
            links.forEach(link => link.uncertain());
            outcome = { kind: 'sync-error', operationId: id, data, error };
          }
        } else {
          const rejected = writeError instanceof MutationRejectedError;
          let recoveryError: unknown;
          if (rejected) {
            for (const link of links) {
              try {
                link.reject();
              } catch (error) {
                recoveryError ??= error;
              }
            }
          } else links.forEach(link => link.uncertain());
          outcome = {
            kind: rejected ? 'rejected' : 'unknown',
            operationId: id,
            error: writeError,
            ...(recoveryError === undefined ? {} : { recoveryError }),
          };
        }
      } catch (error) {
        links.forEach(link => link.uncertain());
        outcome = { kind: 'unknown', operationId: id, error };
      } finally {
        links.forEach(link => link.end());
      }
      let callbackError: unknown;
      try {
        if (outcome.kind === 'success' || outcome.kind === 'sync-error') {
          await options.onSuccess?.(outcome.data, frozenInput, id);
        } else await options.onError?.(outcome.error, frozenInput, id);
      } catch (error) {
        callbackError = error;
      }
      try {
        await options.onSettled?.(outcome, frozenInput);
      } catch (error) {
        callbackError ??= error;
      }
      if (callbackError !== undefined) outcome = { ...outcome, callbackError };
      pending -= 1;
      publish(outcome.kind, 'error' in outcome ? outcome.error : null);
      run.signal?.removeEventListener('abort', abort);
      return Object.freeze(outcome);
    };
    const result = run.scope ? schedule(run.scope, execute) : execute();
    return Object.freeze({
      id,
      status: own.status,
      watchStatus: own.watchStatus,
      result,
      abort,
      dispose: own.dispose,
    });
  };
  return Object.freeze({
    status: shared.status,
    watchStatus: shared.watchStatus,
    start,
    run: (input: I, run?: MutationRunOptions<T>) => start(input, run).result,
    dispose: () => {
      disposed = true;
      shared.dispose();
    },
  });
}
