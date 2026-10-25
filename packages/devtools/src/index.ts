import type { Watch } from 'state-ref';
import { observeStore } from 'state-ref/devtools';
import { cacheView, mutationView, inspectSync as readSync } from './sync';
import type { InspectableSyncClient, SyncInspection } from './sync';
export type {
  InspectableSyncClient,
  SyncInspection,
  CacheView,
  MutationView,
  CacheEventView,
  MutationEventView,
} from './sync';
import type {
  StoreObservation,
  SubscriptionSnapshot,
} from 'state-ref/devtools';
import type {
  Devtools,
  DevtoolsOptions,
  DevtoolsSnapshot,
  DevtoolsRecord,
  AttachStoreOptions,
  StoreInspection,
} from './types';
export type {
  Devtools,
  DevtoolsOptions,
  DevtoolsSnapshot,
  DevtoolsRecord,
  StoreSource,
  StoreInspection,
  AttachStoreOptions,
} from './types';

type Source = {
  kind: 'store' | 'sync';
  client?: InspectableSyncClient;
  syncStop?: () => void;
  metadataBytes: number;
  id: number;
  name: string;
  watch?: Watch<any>;
  options?: AttachStoreOptions;
  observation?: StoreObservation;
  generation: number;
  resnapshots: number;
  lastGap?: 'overflow' | 'capture-error' | 'pause';
};
type RecordPayload = DevtoolsRecord extends infer Record
  ? Record extends DevtoolsRecord
    ? Omit<
        Record,
        'sequence' | 'timestamp' | 'sourceId' | 'sourceName' | 'generation'
      >
    : never
  : never;
const freeze = Object.freeze;
const COUNTER_BYTES = '{"sequence":0,"timestamp":0}'.length - 4;

// JSON has already escaped unpaired surrogates. Count UTF-8 without allocating
// a second byte buffer for every timeline record.
function jsonBytes(value: unknown) {
  const json = JSON.stringify(value);
  let bytes = json.length;
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    if (code > 127) {
      if (code >= 0xd800 && code <= 0xdbff) {
        bytes += 2;
        i++;
      } else bytes += code > 2047 ? 2 : 1;
    }
  }
  return bytes;
}

function once(task: () => void): () => void {
  let current: (() => void) | undefined = task;
  return () => {
    const stop = current;
    current = undefined;
    stop?.();
  };
}
function limit(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
  name: string
) {
  const result = value === undefined ? fallback : value;
  if (!Number.isInteger(result) || result < min || result > max)
    throw new RangeError(
      `@stateref/devtools: ${name} must be an integer from ${min} to ${max}.`
    );
  return result;
}

class Session {
  private sources = new Map<number, Source>();
  private byWatch = new Map<object, number>();
  private listeners = new Set<() => void>();
  private history: { record: DevtoolsRecord; bytes: number }[] = [];
  private nextSource = 0;
  private sequence = 0;
  private bytes = 0;
  private evicted = 0;
  private oversized = 0;
  private paused = false;
  private disposed = false;
  private queued = false;
  private cached?: DevtoolsSnapshot;
  private maxEvents: number;
  private maxBytes: number;
  private maxSources: number;

  constructor(options: DevtoolsOptions) {
    this.maxEvents = limit(options.maxEvents, 200, 1, 10000, 'maxEvents');
    this.maxBytes = limit(
      options.maxHistoryBytes,
      1048576,
      256,
      16777216,
      'maxHistoryBytes'
    );
    this.maxSources = limit(options.maxSources, 100, 1, 1000, 'maxSources');
  }
  private active() {
    if (this.disposed)
      throw new Error('@stateref/devtools: session is disposed.');
  }
  private emit() {
    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue;
      try {
        listener();
      } catch {
        /* One view cannot stop another. */
      }
    }
  }
  private changed() {
    this.cached = undefined;
    if (this.queued || this.disposed) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (!this.disposed) this.emit();
    });
  }
  private record(source: Source, payload: RecordPayload) {
    const record = freeze(
      Object.assign(
        {
          sequence: ++this.sequence,
          timestamp: Date.now(),
          sourceId: source.id,
          sourceName: source.name,
          generation: source.generation,
        },
        payload
      )
    ) as DevtoolsRecord;
    const bytes =
      jsonBytes(payload) +
      source.metadataBytes +
      COUNTER_BYTES +
      String(record.sequence).length +
      String(record.timestamp).length +
      2;
    if (bytes > this.maxBytes) this.oversized += 1;
    else {
      while (
        this.history.length >= this.maxEvents ||
        this.bytes + bytes > this.maxBytes
      ) {
        this.bytes -= this.history.shift()!.bytes;
        this.evicted += 1;
      }
      this.history.push({ record, bytes });
      this.bytes += bytes;
    }
    this.changed();
  }
  private connect(source: Source) {
    const generation = ++source.generation;
    source.metadataBytes =
      jsonBytes({ sourceId: source.id, sourceName: source.name, generation }) -
      2;
    if (source.client) {
      const valid = () =>
        !this.disposed &&
        !this.paused &&
        this.sources.has(source.id) &&
        generation === source.generation;
      const stopCache = source.client.subscribeCache(event => {
        if (valid())
          this.record(source, {
            kind: 'sync-cache',
            event: freeze({ type: event.type, entry: cacheView(event.entry) }),
          });
      });
      try {
        const stopMutations = source.client.subscribeMutations(event => {
          if (valid())
            this.record(source, {
              kind: 'sync-mutation',
              event: freeze({
                type: event.type,
                entry: mutationView(event.entry),
              }),
            });
        });
        source.syncStop = once(() => {
          stopCache();
          stopMutations();
        });
      } catch (error) {
        stopCache();
        throw error;
      }
      return;
    }
    source.observation = observeStore(
      source.watch!,
      event => {
        if (
          this.disposed ||
          this.paused ||
          !this.sources.has(source.id) ||
          generation !== source.generation
        )
          return;
        this.record(source, { kind: 'store-event', event });
        if (event.type === 'gap') this.recover(source, event.reason);
      },
      source.options
    );
  }
  private inspect(source: Source): StoreInspection {
    const temporary = !source.observation;
    const observation =
      source.observation ??
      observeStore(source.watch!, () => {}, source.options);
    try {
      const value = observation.snapshot();
      const all = observation.subscriptions();
      const subscriptions: SubscriptionSnapshot[] = [];
      let bytes = 2;
      for (const item of all) {
        const cost = jsonBytes(item) + 1;
        if (subscriptions.length >= 1000 || bytes + cost > 65536) break;
        subscriptions.push(item);
        bytes += cost;
      }
      return freeze({
        sourceId: source.id,
        generation: temporary ? null : source.generation,
        value,
        subscriptions: freeze(subscriptions),
        subscriptionCount: all.length,
        subscriptionsTruncated: subscriptions.length !== all.length,
      });
    } finally {
      if (temporary) observation.disconnect();
    }
  }
  private recover(
    source: Source,
    reason: 'overflow' | 'capture-error' | 'pause'
  ) {
    source.lastGap = reason;
    try {
      if (source.client)
        readSync(
          source.client,
          source.id,
          this.paused ? null : source.generation
        );
      else this.inspect(source);
      source.resnapshots += 1;
    } catch {
      this.record(source, {
        kind: 'gap',
        reason: 'inspection-error',
        dropped: null,
      });
    }
    this.changed();
  }

  attachStore(watch: Watch<any>, options: AttachStoreOptions = {}): () => void {
    this.active();
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new TypeError(
        '@stateref/devtools: attach options must be an object.'
      );
    if (this.byWatch.has(watch))
      throw new Error(
        '@stateref/devtools: watch is already attached to this session.'
      );
    if (this.sources.size >= this.maxSources)
      throw new RangeError('@stateref/devtools: maxSources reached.');
    const id = ++this.nextSource;
    const name = options.name === undefined ? `Store ${id}` : options.name;
    if (typeof name !== 'string' || !name.trim() || name.length > 200)
      throw new TypeError(
        '@stateref/devtools: name must contain 1–200 characters.'
      );
    const redact = options.redact;
    if (
      redact &&
      (!Array.isArray(redact) ||
        redact.length > 1000 ||
        redact.some(
          path =>
            !Array.isArray(path) ||
            path.length > 64 ||
            path.some(key => typeof key !== 'string' && typeof key !== 'symbol')
        ))
    )
      throw new TypeError('@stateref/devtools: invalid redact paths.');
    const source: Source = {
      kind: 'store',
      metadataBytes: 0,
      id,
      name,
      watch,
      options: { redact: redact?.map(path => [...path]) },
      generation: 0,
      resnapshots: 0,
    };
    try {
      this.connect(source);
      this.inspect(source); // Initial boundary without subscribing to application state.
      if (this.paused) {
        this.disconnectSource(source);
      }
    } catch (error) {
      source.observation?.disconnect();
      throw error;
    }
    this.sources.set(id, source);
    this.byWatch.set(watch, id);
    this.record(source, { kind: 'source-attached' });
    return once(() => this.detach(id));
  }
  attachSync(
    client: InspectableSyncClient,
    options: { readonly name?: string } = {}
  ): () => void {
    this.active();
    if (
      !client ||
      [
        'inspectCache',
        'subscribeCache',
        'inspectMutations',
        'subscribeMutations',
      ].some(
        method =>
          typeof (client as unknown as Record<string, unknown>)[method] !==
          'function'
      )
    )
      throw new TypeError(
        '@stateref/devtools: expected a Sync client with the four public observation methods.'
      );
    if (this.byWatch.has(client))
      throw new Error(
        '@stateref/devtools: client is already attached to this session.'
      );
    if (this.sources.size >= this.maxSources)
      throw new RangeError('@stateref/devtools: maxSources reached.');
    const id = ++this.nextSource;
    const name = options.name === undefined ? `Sync ${id}` : options.name;
    if (typeof name !== 'string' || !name.trim() || name.length > 200)
      throw new TypeError(
        '@stateref/devtools: name must contain 1–200 characters.'
      );
    const source: Source = {
      id,
      name,
      kind: 'sync',
      client,
      metadataBytes: 0,
      generation: 0,
      resnapshots: 0,
    };
    try {
      this.connect(source);
      readSync(client, id, source.generation);
      if (this.paused) this.disconnectSource(source);
    } catch (error) {
      this.disconnectSource(source);
      throw error;
    }
    this.sources.set(id, source);
    this.byWatch.set(client, id);
    this.record(source, { kind: 'source-attached' });
    return once(() => this.detach(id));
  }
  private disconnectSource(source: Source) {
    source.observation?.disconnect();
    source.observation = undefined;
    source.syncStop?.();
    source.syncStop = undefined;
  }
  private unlink(source: Source) {
    this.disconnectSource(source);
    this.byWatch.delete(source.watch ?? source.client!);
    this.sources.delete(source.id);
    source.watch = undefined;
    source.client = undefined;
    source.options = undefined;
  }
  private detach(id: number) {
    const source = this.sources.get(id);
    if (!source) return;
    this.unlink(source);
    this.record(source, { kind: 'source-detached' });
  }
  getSnapshot(): DevtoolsSnapshot {
    return (this.cached ??= freeze({
      paused: this.paused,
      disposed: this.disposed,
      sources: freeze(
        [...this.sources.values()].map(source =>
          freeze({
            id: source.id,
            name: source.name,
            kind: source.kind,
            generation: source.generation,
            status: this.paused ? ('paused' as const) : ('recording' as const),
            resnapshots: source.resnapshots,
            lastGap: source.lastGap,
          })
        )
      ),
      history: freeze(this.history.map(item => item.record)),
      historyBytes: this.bytes,
      evicted: this.evicted,
      oversized: this.oversized,
    }));
  }
  inspectStore(id: number): StoreInspection {
    this.active();
    const source = this.sources.get(id);
    if (!source) throw new RangeError('@stateref/devtools: unknown source ID.');
    if (!source.watch)
      throw new TypeError('@stateref/devtools: source is a Sync client.');
    return this.inspect(source);
  }
  inspectSync(id: number): SyncInspection {
    this.active();
    const source = this.sources.get(id);
    if (!source?.client)
      throw new RangeError('@stateref/devtools: unknown Sync source ID.');
    return readSync(source.client, id, this.paused ? null : source.generation);
  }
  subscribe(listener: () => void): () => void {
    this.active();
    if (typeof listener !== 'function')
      throw new TypeError('@stateref/devtools: listener must be a function.');
    const subscription = () => listener();
    this.listeners.add(subscription);
    return once(() => this.listeners.delete(subscription));
  }
  pause() {
    this.active();
    if (this.paused) return;
    this.paused = true;
    for (const source of this.sources.values()) {
      this.disconnectSource(source);
    }
    this.changed();
  }
  resume() {
    this.active();
    if (!this.paused) return;
    this.paused = false;
    for (const source of this.sources.values()) {
      this.connect(source);
      this.recover(source, 'pause');
      this.record(source, { kind: 'gap', reason: 'pause', dropped: null });
    }
    this.changed();
  }
  clear() {
    this.active();
    this.history = [];
    this.bytes = 0;
    this.evicted = 0;
    this.oversized = 0;
    this.changed();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const source of this.sources.values()) this.unlink(source);
    this.history = [];
    this.bytes = 0;
    this.evicted = 0;
    this.oversized = 0;
    this.paused = false;
    this.cached = undefined;
    this.emit();
    this.listeners.clear();
  }
}

/** A framework-independent, bounded, read-only debugging session. */
export function createDevtools(options: DevtoolsOptions = {}): Devtools {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new TypeError('@stateref/devtools: options must be an object.');
  const session = new Session(options);
  return freeze({
    attachStore: (watch: Watch<any>, settings?: AttachStoreOptions) =>
      session.attachStore(watch, settings),
    attachSync: (
      client: InspectableSyncClient,
      settings?: { readonly name?: string }
    ) => session.attachSync(client, settings),
    getSnapshot: () => session.getSnapshot(),
    inspectStore: (id: number) => session.inspectStore(id),
    inspectSync: (id: number) => session.inspectSync(id),
    subscribe: (listener: () => void) => session.subscribe(listener),
    pause: () => session.pause(),
    resume: () => session.resume(),
    clear: () => session.clear(),
    dispose: () => session.dispose(),
  });
}
