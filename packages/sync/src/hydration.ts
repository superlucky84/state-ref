import { hashQueryKey } from './key';
import type { QueryKey } from './key';
import { assertEditable } from './tree';

export type HydratedQuery = Readonly<{
  queryKey: QueryKey;
  data: unknown;
  updatedAt: number;
  invalidated: boolean;
  editable: boolean;
}>;

/** Only settled, clean server baselines are transferable in schema 1. */
export type SyncSnapshot = Readonly<{
  schemaVersion: 1;
  capturedAt: number;
  queries: readonly HydratedQuery[];
}>;

function time(value: unknown, name: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite nonnegative timestamp.`);
  }
  return value;
}

export function copyJson(value: unknown): unknown {
  try {
    return JSON.parse(hashQueryKey([value]))[0];
  } catch {
    throw new TypeError(
      'Hydrated data must be an acyclic JSON-compatible tree.'
    );
  }
}

export function parseSnapshot(input: SyncSnapshot): HydratedQuery[] {
  if (!input || typeof input !== 'object' || input.schemaVersion !== 1) {
    throw new TypeError('Unsupported sync snapshot schema version.');
  }
  time(input.capturedAt, 'capturedAt');
  if (!Array.isArray(input.queries)) {
    throw new TypeError('Sync snapshot queries must be an array.');
  }
  const seen = new Set<string>();
  return input.queries.map(query => {
    if (!query || typeof query !== 'object') {
      throw new TypeError('Invalid hydrated query.');
    }
    const hash = hashQueryKey(query.queryKey);
    if (seen.has(hash)) throw new TypeError('Repeated hydrated query key.');
    seen.add(hash);
    if (
      typeof query.editable !== 'boolean' ||
      typeof query.invalidated !== 'boolean'
    ) {
      throw new TypeError('Invalid hydrated query flags.');
    }
    const data = copyJson(query.data);
    if (query.editable) assertEditable(data);
    return Object.freeze({
      queryKey: JSON.parse(hash) as QueryKey,
      data,
      updatedAt: time(query.updatedAt, 'updatedAt'),
      invalidated: query.invalidated,
      editable: query.editable,
    });
  });
}
