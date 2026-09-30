import { copyJson, parseSnapshot } from './hydration';
import type { HydratedQuery } from './hydration';
import type { ResourceRecoveryEdit, ResourceRecoveryState } from './resource';
import {
  assertEditable,
  equalTree,
  readPath,
  sameValue,
  startsWith,
  atomicPath,
  replacePath,
} from './tree';

export type LocalHydratedQuery = HydratedQuery &
  Readonly<{
    unconfirmed: boolean;
    local?: ResourceRecoveryState;
  }>;

/** Separate from schema 1 clean SSR snapshots. */
export type LocalSyncSnapshot = Readonly<{
  schemaVersion: 2;
  capturedAt: number;
  queries: readonly LocalHydratedQuery[];
}>;

function integer(value: unknown, name: string, minimum: number) {
  if (!Number.isSafeInteger(value) || (value as number) < minimum)
    throw new TypeError(`${name} must be an integer at least ${minimum}.`);
  return value as number;
}

function parseEdit(value: unknown, current: unknown): ResourceRecoveryEdit {
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid local recovery edit.');
  const edit = value as Partial<ResourceRecoveryEdit>;
  const id = integer(edit.id, 'local edit id', 1);
  const version = integer(edit.version, 'local edit version', 1);
  if (
    !Array.isArray(edit.path) ||
    !edit.path.every(
      part =>
        typeof part === 'string' &&
        part !== '__proto__' &&
        part !== 'value' &&
        part !== 'toJSON'
    )
  )
    throw new TypeError('Invalid local edit path.');
  const path = Object.freeze([...edit.path]) as readonly string[];
  if (atomicPath(current, path).length !== path.length)
    throw new TypeError('Local edit path crosses an array boundary.');
  if (!edit.original || typeof edit.original !== 'object')
    throw new TypeError('Invalid local edit origin.');
  if (typeof edit.original.exists !== 'boolean')
    throw new TypeError('Invalid local edit origin flag.');
  const original = Object.freeze(
    edit.original.exists
      ? { exists: true, value: copyJson(edit.original.value) }
      : { exists: false }
  );
  const after = copyJson(edit.after);
  assertEditable(after);
  const displayed = readPath(current, path);
  if (!displayed.exists || !equalTree(displayed.value, after))
    throw new TypeError('Local edit differs from the displayed value.');
  if (typeof edit.conflict !== 'boolean')
    throw new TypeError('Invalid local edit conflict flag.');
  return Object.freeze({
    id,
    version,
    path,
    original,
    after,
    conflict: edit.conflict,
  });
}

function parseLocalState(
  value: unknown,
  baseline: unknown
): ResourceRecoveryState {
  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid local recovery state.');
  const state = value as Partial<ResourceRecoveryState>;
  const revision = integer(state.revision, 'local revision', 0);
  const nextId = integer(state.nextId, 'local nextId', 1);
  const current = copyJson(state.current);
  assertEditable(current);
  if (!Array.isArray(state.edits))
    throw new TypeError('Local edits must be an array.');
  const edits = state.edits.map(edit => parseEdit(edit, current));
  for (const edit of edits) {
    const server = readPath(baseline, edit.path);
    if (sameValue(server, { exists: true, value: edit.after }))
      throw new TypeError('A local edit is already equal to its baseline.');
    if (
      edit.conflict !==
      !sameValue(
        { exists: edit.original.exists, value: edit.original.value },
        server
      )
    )
      throw new TypeError('Local edit conflict flag differs from its origin.');
  }
  const ids = new Set(edits.map(edit => edit.id));
  if (ids.size !== edits.length) throw new TypeError('Repeated local edit ID.');
  if (edits.some(edit => edit.id >= nextId || edit.version > revision))
    throw new TypeError('Local edit ID or version exceeds its counter.');
  for (let index = 0; index < edits.length; index += 1) {
    for (let other = index + 1; other < edits.length; other += 1) {
      if (
        startsWith(edits[index].path, edits[other].path) ||
        startsWith(edits[other].path, edits[index].path)
      )
        throw new TypeError('Overlapping local edit paths.');
    }
  }
  if (!edits.length && !equalTree(current, baseline))
    throw new TypeError('Clean local value differs from its server baseline.');
  if (edits.length) {
    let reconstructed = baseline;
    let applicable = true;
    for (const edit of edits) {
      try {
        reconstructed = replacePath(reconstructed, edit.path, edit.after);
      } catch {
        applicable = false;
        break;
      }
    }
    if (applicable && !equalTree(reconstructed, current))
      throw new TypeError('Local value differs from its recorded edits.');
  }
  return Object.freeze({
    current,
    revision,
    nextId,
    edits: Object.freeze(edits),
  });
}

export function parseLocalSnapshot(
  input: LocalSyncSnapshot
): LocalHydratedQuery[] {
  if (!input || typeof input !== 'object' || input.schemaVersion !== 2)
    throw new TypeError('Unsupported local sync snapshot schema version.');
  const baselines = parseSnapshot({
    schemaVersion: 1,
    capturedAt: input.capturedAt,
    queries: input.queries,
  });
  return baselines.map((baseline, index) => {
    const raw = input.queries[index];
    if (typeof raw.unconfirmed !== 'boolean')
      throw new TypeError('Invalid local unconfirmed flag.');
    if (!baseline.editable && raw.local !== undefined)
      throw new TypeError('Readonly query cannot have local edits.');
    if (baseline.editable && raw.local === undefined)
      throw new TypeError('Editable recovery query requires local state.');
    const local =
      raw.local === undefined
        ? undefined
        : parseLocalState(raw.local, baseline.data);
    return Object.freeze({
      ...baseline,
      invalidated: baseline.invalidated || raw.unconfirmed,
      unconfirmed: raw.unconfirmed,
      ...(local ? { local } : {}),
    });
  });
}
