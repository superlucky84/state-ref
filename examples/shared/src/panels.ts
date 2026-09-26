import type { QueryStatus, ResourceChange } from '@stateref/sync';
import type { DraftChange, DraftStatus } from 'state-ref/draft';
import type { MockServer } from './mock-server';
import type { RequestRecord } from './types';

/**
 * Framework-independent projections for the panels the manual checklist
 * asks for. Each demo feeds in the value its own connector produced and
 * renders the result, so the five screens show the same fields under the
 * same names (step 4 of docs/server-sync/PHASE8_5.md).
 */

/** One row of a changes table. */
export type ChangeLine = Readonly<{
  id: number;
  path: string;
  before: string;
  after: string;
  conflict: boolean;
  /**
   * What the source holds now. Drafts only - a resource change has no such
   * third party.
   *
   * `DraftChange` carries it and this projection used to drop it, so a draft
   * conflict showed the baseline and the draft's own input but not the value it
   * was conflicting with. M2-13 asks for all three (B8-7-16).
   */
  source?: string;
}>;

const formatPath = (path: readonly (string | symbol)[]) =>
  path.length === 0 ? '(root)' : path.map(String).join('.');

const formatValue = (present: boolean, value: unknown) =>
  present ? JSON.stringify(value) : '(없음)';

export function resourceChangeLines(
  changes: readonly ResourceChange[]
): readonly ChangeLine[] {
  return changes.map(change => ({
    id: change.id,
    path: formatPath(change.path),
    before: formatValue(change.before.exists, change.before.value),
    after: formatValue(change.after.exists, change.after.value),
    conflict: change.conflict,
  }));
}

export function draftChangeLines(
  changes: readonly DraftChange[]
): readonly ChangeLine[] {
  return changes.map(change => ({
    id: change.id,
    path: formatPath(change.path),
    before: formatValue(change.before.exists, change.before.value),
    after: formatValue(change.after.exists, change.after.value),
    conflict: change.conflict,
    source: formatValue(change.source.exists, change.source.value),
  }));
}

export type ResourcePanel = Readonly<{
  loaded: boolean;
  /** `pending` and the mutation phase are the only signs of a server WRITE. */
  serverBusy: boolean;
  /** Local divergence. A local `draft.apply()` sets this too (Phase 8.3). */
  dirty: boolean;
  /** Separate axis from success/failure: `unknown` and `sync-error` land here. */
  unconfirmed: boolean;
  invalidated: boolean;
  version: number;
  conflicts: number;
  fetchStatus: QueryStatus['fetchStatus'];
  status: QueryStatus['status'];
  errorText: string | null;
  changes: readonly ChangeLine[];
}>;

/**
 * The status half of a resource panel.
 *
 * It deliberately takes no value: `query.ref` throws before the first load,
 * so the value belongs to a component that mounts only once `loaded` is true
 * (M2-04). Status is readable from the start.
 */
export function resourcePanel(
  status: QueryStatus,
  changes: readonly ResourceChange[]
): ResourcePanel {
  return {
    loaded: status.loaded,
    serverBusy: status.pending > 0,
    dirty: status.dirty,
    unconfirmed: status.unconfirmed,
    invalidated: status.invalidated,
    version: status.version,
    conflicts: status.conflicts,
    fetchStatus: status.fetchStatus,
    status: status.status,
    errorText: status.error == null ? null : String(status.error),
    changes: resourceChangeLines(changes),
  };
}

export type DraftPanel = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
  changes: readonly ChangeLine[];
}>;

export function draftPanel(
  status: DraftStatus,
  changes: readonly DraftChange[]
): DraftPanel {
  return {
    dirty: status.dirty,
    conflicts: status.conflicts,
    version: status.version,
    changes: draftChangeLines(changes),
  };
}

export type RequestPanel = Readonly<{
  readCount: number;
  writeCount: number;
  inFlight: number;
  serverCity: string;
  serverRevision: number;
  rows: readonly RequestRecord[];
}>;

export function requestPanel(server: MockServer): RequestPanel {
  const counts = server.counts();
  return {
    readCount: counts.read,
    writeCount: counts.write,
    inFlight: server.inFlight().length,
    serverCity: server.value().city,
    serverRevision: server.revision(),
    rows: server.requests(),
  };
}
