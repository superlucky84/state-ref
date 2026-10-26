// Structural metadata contract: core-only users need no Sync installation,
// including when TypeScript checks this package's declaration files.
interface SyncCacheEntry {
  readonly queryKey: readonly unknown[];
  readonly kind: 'query' | 'infinite';
  readonly owners: number;
  readonly status: Readonly<{
    status: 'pending' | 'success' | 'error';
    fetchStatus: 'idle' | 'fetching' | 'paused';
    loaded: boolean;
    updatedAt: number | null;
    invalidated: boolean;
    dirty: boolean;
    conflicts: number;
    version: number;
    pending: number;
    unconfirmed: boolean;
  }>;
}
interface SyncMutationEntry {
  readonly operationId: number;
  readonly phase:
    | 'queued'
    | 'pending'
    | 'success'
    | 'sync-error'
    | 'rejected'
    | 'unknown';
  readonly scope: string | null;
  readonly attempt: number;
  readonly idempotent: boolean;
  readonly linkedKeys: readonly (readonly unknown[])[];
  readonly startedAt: number;
  readonly settledAt: number | null;
}
interface SyncCacheEvent {
  readonly type: 'added' | 'updated' | 'removed';
  readonly entry: SyncCacheEntry;
}
interface SyncMutationEvent {
  readonly type: 'started' | 'updated' | 'settled';
  readonly entry: SyncMutationEntry;
}
export interface InspectableSyncClient {
  inspectCache(): readonly SyncCacheEntry[];
  inspectMutations(): readonly SyncMutationEntry[];
  subscribeCache(listener: (event: SyncCacheEvent) => void): () => void;
  subscribeMutations(listener: (event: SyncMutationEvent) => void): () => void;
}
export type CacheView = Readonly<{
  queryKey: string;
  keyTruncated: boolean;
  kind: SyncCacheEntry['kind'];
  owners: number;
  status: SyncCacheEntry['status'];
}>;
export type MutationView = Readonly<{
  operationId: number;
  phase: SyncMutationEntry['phase'];
  scope: string | null;
  attempt: number;
  idempotent: boolean;
  linkedKeys: readonly string[];
  startedAt: number;
  settledAt: number | null;
  truncated: boolean;
}>;
export type CacheEventView = Readonly<{
  type: SyncCacheEvent['type'];
  entry: CacheView;
}>;
export type MutationEventView = Readonly<{
  type: SyncMutationEvent['type'];
  entry: MutationView;
}>;
export interface SyncInspection {
  readonly sourceId: number;
  readonly generation: number | null;
  readonly cache: readonly CacheView[];
  readonly mutations: readonly MutationView[];
  readonly truncated: boolean;
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  // Copy the prefix so a short label cannot retain a large serialized key.
  return (
    new TextDecoder().decode(new TextEncoder().encode(text.slice(0, max))) +
    '… [truncated]'
  );
}
function key(value: readonly unknown[]) {
  try {
    const text = JSON.stringify(value);
    return { text: clip(text, 512), truncated: text.length > 512 };
  } catch {
    return { text: '[unavailable key]', truncated: true };
  }
}
export function cacheView(entry: SyncCacheEntry): CacheView {
  const label = key(entry.queryKey);
  const s = entry.status;
  return Object.freeze({
    queryKey: label.text,
    keyTruncated: label.truncated,
    kind: entry.kind,
    owners: entry.owners,
    status: Object.freeze({
      status: s.status,
      fetchStatus: s.fetchStatus,
      loaded: s.loaded,
      updatedAt: s.updatedAt,
      invalidated: s.invalidated,
      dirty: s.dirty,
      conflicts: s.conflicts,
      version: s.version,
      pending: s.pending,
      unconfirmed: s.unconfirmed,
    }),
  });
}
export function mutationView(entry: SyncMutationEntry): MutationView {
  const keys = entry.linkedKeys.slice(0, 32).map(key);
  return Object.freeze({
    operationId: entry.operationId,
    phase: entry.phase,
    scope: entry.scope === null ? null : clip(entry.scope, 256),
    attempt: entry.attempt,
    idempotent: entry.idempotent,
    linkedKeys: Object.freeze(keys.map(item => item.text)),
    startedAt: entry.startedAt,
    settledAt: entry.settledAt,
    truncated:
      entry.linkedKeys.length > 32 ||
      keys.some(item => item.truncated) ||
      (entry.scope?.length ?? 0) > 256,
  });
}
function bounded<T>(items: readonly T[]) {
  const output: T[] = [];
  let bytes = 2;
  for (const item of items) {
    const size = new TextEncoder().encode(JSON.stringify(item)).length + 1;
    if (output.length === 1000 || bytes + size > 65536) break;
    output.push(item);
    bytes += size;
  }
  return Object.freeze(output);
}
export function inspectSync(
  client: InspectableSyncClient,
  sourceId: number,
  generation: number | null
): SyncInspection {
  const cache = client.inspectCache();
  const mutations = client.inspectMutations();
  const cacheRows = bounded(cache.slice(0, 1000).map(cacheView));
  const mutationRows = bounded(mutations.slice(0, 1000).map(mutationView));
  return Object.freeze({
    sourceId,
    generation,
    cache: cacheRows,
    mutations: mutationRows,
    truncated:
      cacheRows.length !== cache.length ||
      mutationRows.length !== mutations.length,
  });
}
