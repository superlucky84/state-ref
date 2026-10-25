import type {
  Path,
  ObserveOptions,
  StoreEvent,
  StoreObservation,
  SubscriptionSnapshot,
} from '@/devtools/types';
import type { Run, RunInfo, StoreRenderList } from '@/types';
import type { PathNode } from '@/path';
import { STORE_DIAGNOSTICS } from './devtools-key';
import { createPreview, rawPath } from './devtools-preview';

type Frame = {
  writes: readonly number[];
  unknown: boolean;
  changed: Map<Run, Path[]>;
};
type Pass = Map<Observation, Frame>;
type Payload = StoreEvent extends infer Event
  ? Event extends StoreEvent
    ? Omit<Event, 'sequence'>
    : never
  : never;
const observers = new WeakMap<StoreRenderList<any>, Set<Observation>>();
let batchDepth = 0;
let nextBatch = 0;
let batchId: number | null = null;

export function beginDiagnosticBatch() {
  if (batchDepth++ === 0) batchId = ++nextBatch;
}
export function endDiagnosticBatch() {
  if (--batchDepth === 0) batchId = null;
}

class Observation {
  private read?: () => unknown;
  private subscriptions?: StoreRenderList<any>;
  private listener?: (event: StoreEvent) => void;
  private preview: ReturnType<typeof createPreview>;
  private ids = new WeakMap<NonNullable<Run>, { id: number; runs: number }>();
  private nextId = 0;
  private sequence = 0;
  private writeId = 0;
  private queue: StoreEvent[] = [];
  private queued = false;
  private lost = 0;
  private lostSequence = 0;
  private causes: number[] = [];
  private unknown = true;

  constructor(
    read: () => unknown,
    subscriptions: StoreRenderList<any>,
    listener: (event: StoreEvent) => void,
    options?: ObserveOptions
  ) {
    if (typeof listener !== 'function')
      throw new TypeError('state-ref/devtools: listener must be a function.');
    this.preview = createPreview(options);
    this.read = read;
    this.subscriptions = subscriptions;
    this.listener = listener;
  }

  private identity(run: Run) {
    let identity = run && this.ids.get(run);
    if (!identity) {
      identity = { id: ++this.nextId, runs: 0 };
      if (run) this.ids.set(run, identity);
    }
    return identity;
  }

  private post(payload: Payload) {
    if (!this.listener) return;
    this.queue.push(
      Object.freeze({ ...payload, sequence: ++this.sequence }) as StoreEvent
    );
    if (this.queue.length > 1000) {
      this.lostSequence = this.queue.shift()!.sequence;
      this.lost += 1;
      this.unknown = true;
    }
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      const events = this.queue;
      this.queue = [];
      if (this.lost)
        events.unshift(
          Object.freeze({
            type: 'gap',
            sequence: this.lostSequence,
            reason: 'overflow',
            dropped: this.lost,
          })
        );
      this.lost = 0;
      for (const event of events) {
        if (!this.listener) break;
        try {
          this.listener(event);
        } catch {
          /* A diagnostic listener cannot affect the application. */
        }
      }
    });
  }

  write(
    parent: PathNode,
    segment: string | symbol | null,
    before: unknown,
    after: unknown
  ) {
    const keys = rawPath(parent, segment);
    const previous = this.preview.capture(before, keys);
    const current = this.preview.capture(after, keys);
    const id = ++this.writeId;
    if (this.causes.length >= 1000) {
      this.causes.shift();
      this.unknown = true;
    }
    this.causes.push(id);
    this.post({
      type: 'write',
      id,
      path: this.preview.path(keys),
      before: previous.value,
      after: current.value,
      batchId,
    });
    if (previous.failed || current.failed)
      this.post({ type: 'gap', reason: 'capture-error', dropped: 1 });
  }

  begin(): Frame {
    const frame = {
      writes: Object.freeze(this.causes),
      unknown: this.unknown,
      changed: new Map<Run, Path[]>(),
    };
    this.causes = [];
    this.unknown = false;
    return frame;
  }

  changed(frame: Frame, run: Run, info: RunInfo<any>) {
    for (const [node, item] of this.subscriptions?.get(run) ?? []) {
      if (item !== info) continue;
      const paths = frame.changed.get(run) ?? [];
      paths.push(this.preview.path(rawPath(node)));
      frame.changed.set(run, paths);
      break;
    }
  }

  ran(frame: Frame | undefined, run: Run, initial: boolean) {
    const identity = this.identity(run);
    identity.runs += 1;
    this.post({
      type: 'subscription-run',
      id: identity.id,
      initial,
      changedPaths: Object.freeze(frame?.changed.get(run) ?? []),
      cause:
        !frame || frame.unknown || frame.writes.length === 0
          ? Object.freeze({ kind: 'unknown' })
          : Object.freeze({ kind: 'flush-group', writes: frame.writes }),
    });
  }

  ended(run: Run) {
    this.post({ type: 'subscription-ended', id: this.identity(run).id });
  }

  snapshot() {
    if (!this.read)
      throw new Error('state-ref/devtools: observation is disconnected.');
    const captured = this.preview.capture(this.read());
    // A read failure is already represented by the Preview marker. Emitting
    // another gap here would loop when a consumer resnapshots after a gap.
    return captured.value;
  }

  inspectSubscriptions(): readonly SubscriptionSnapshot[] {
    if (!this.subscriptions)
      throw new Error('state-ref/devtools: observation is disconnected.');
    return Object.freeze(
      [...this.subscriptions].map(([run, paths]) => {
        const identity = this.identity(run);
        return Object.freeze({
          id: identity.id,
          observedRuns: identity.runs,
          paths: Object.freeze(
            [...paths.keys()].map(node => this.preview.path(rawPath(node)))
          ),
        });
      })
    );
  }

  disconnect() {
    if (this.subscriptions) {
      const set = observers.get(this.subscriptions);
      set?.delete(this);
      if (!set?.size) observers.delete(this.subscriptions);
    }
    this.read = undefined;
    this.subscriptions = undefined;
    this.listener = undefined;
    this.queue = [];
    this.causes = [];
    this.lost = 0;
    this.preview.clear();
    this.ids = new WeakMap();
  }
}

// A retained, disconnected public handle must not retain the source closure.
function handle(observation: Observation): StoreObservation {
  let current: Observation | undefined = observation;
  const active = () => {
    if (!current)
      throw new Error('state-ref/devtools: observation is disconnected.');
    return current;
  };
  return Object.freeze({
    protocolVersion: 1 as const,
    snapshot: () => active().snapshot(),
    subscriptions: () => active().inspectSubscriptions(),
    disconnect() {
      current?.disconnect();
      current = undefined;
    },
  });
}

export function installDiagnostics(
  watch: object,
  root: { root: unknown },
  subscriptions: StoreRenderList<any>
) {
  Object.defineProperty(watch, STORE_DIAGNOSTICS, {
    value: Object.freeze({
      version: 1,
      observe(listener: (event: StoreEvent) => void, options?: ObserveOptions) {
        const observation = new Observation(
          () => root.root,
          subscriptions,
          listener,
          options
        );
        let set = observers.get(subscriptions);
        if (!set) observers.set(subscriptions, (set = new Set()));
        set.add(observation);
        return handle(observation);
      },
    }),
  });
}

function safely(task: () => void) {
  try {
    task();
  } catch {
    /* Diagnostics never reject committed writes. */
  }
}

export function diagnosticWrite(
  subscriptions: StoreRenderList<any>,
  parent: PathNode,
  segment: string | symbol | null,
  before: unknown,
  after: unknown
) {
  const set = observers.get(subscriptions);
  if (set)
    for (const observer of set)
      safely(() => observer.write(parent, segment, before, after));
}

export function diagnosticBegin(
  subscriptions: StoreRenderList<any>
): Pass | undefined {
  const set = observers.get(subscriptions);
  if (!set) return;
  const frames: Pass = new Map();
  for (const observer of set)
    safely(() => frames.set(observer, observer.begin()));
  return frames;
}

export function diagnosticChanged(
  pass: Pass | undefined,
  run: Run,
  info: RunInfo<any>
) {
  pass?.forEach((frame, observer) =>
    safely(() => observer.changed(frame, run, info))
  );
}

export function diagnosticRun(
  subscriptions: StoreRenderList<any>,
  pass: Pass | undefined,
  run: Run,
  initial = false
) {
  const set = observers.get(subscriptions);
  if (set)
    for (const observer of set)
      safely(() => observer.ran(pass?.get(observer), run, initial));
}

export function diagnosticEnd(subscriptions: StoreRenderList<any>, run: Run) {
  const set = observers.get(subscriptions);
  if (set) for (const observer of set) safely(() => observer.ended(run));
}
