import * as core from 'state-ref';
import type { Renew, StateRefStore, Watch } from 'state-ref';
import { connectRef, observeRef } from '@/internal/ref-connection';
import { createWriteJournal } from '@/internal/write-journal';
import { guardDraftRef } from '@/draft/guard';
import {
  assertDraftValue,
  atomicPath,
  equalTree,
  frozenCopy,
  pathFromWrite,
  readPath,
  replacePath,
  sameValue,
  startsWith,
} from '@/draft/tree';
import type { DraftPath, LocatedValue } from '@/draft/tree';
import type { RefWrite } from '@/types';

export type DraftValue = Readonly<{ exists: boolean; value: unknown }>;

export type DraftChange = Readonly<{
  /** Opaque identity; a change from another draft is never accepted here. */
  owner: object;
  id: number;
  version: number;
  path: DraftPath;
  before: DraftValue;
  after: DraftValue;
  source: DraftValue;
  conflict: boolean;
}>;

export type DraftApplyResult =
  | Readonly<{ ok: true; applied: number }>
  | Readonly<{
      ok: false;
      reason: 'readonly' | 'missing-source' | 'invalid-source' | 'conflict';
    }>;

export type DraftResolveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'stale' | 'missing-source' | 'boundary' }>;

export type DraftStatus = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
}>;

export type Draft<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<DraftStatus>;
  watchStatus: Watch<DraftStatus>;
  isDirty: () => boolean;
  changes: () => readonly DraftChange[];
  version: () => number;
  apply: () => DraftApplyResult;
  resolve: (
    change: DraftChange,
    choice: 'source' | 'draft'
  ) => DraftResolveResult;
  reset: () => void;
  discard: () => void;
}>;

type Edit = {
  id: number;
  path: DraftPath;
  before: LocatedValue;
  after: unknown;
  conflict: boolean;
  revision: number;
};

function preserveBranch(
  next: unknown,
  previous: unknown,
  path: DraftPath
): unknown {
  for (let length = path.length - 1; length >= 0; length -= 1) {
    const prefix = path.slice(0, length);
    const old = readPath(previous, prefix);
    if (!old.exists) continue;
    try {
      return replacePath(next, prefix, old.value);
    } catch {
      // Try the next existing ancestor; root always works.
    }
  }
  return previous;
}

function guardedWatch<T>(
  rawWatch: Watch<T>,
  fallback: StateRefStore<T>,
  guard: (ref: StateRefStore<T>) => StateRefStore<T>,
  assertOpen: () => void,
  controllers: Set<AbortController>,
  readonly = false
): Watch<T> {
  const renewCache = new WeakMap<
    Renew<StateRefStore<T>>,
    { controller: AbortController; wrapped: Renew<StateRefStore<T>> }
  >();

  return ((renew, option) => {
    assertOpen();
    if (!renew) return guard(fallback);

    let record = renewCache.get(renew);
    if (!record || record.controller.signal.aborted) {
      const controller = new AbortController();
      controllers.add(controller);
      controller.signal.addEventListener(
        'abort',
        () => controllers.delete(controller),
        { once: true }
      );
      const wrapped: Renew<StateRefStore<T>> = (ref, isFirst) => {
        const result = renew(guard(ref), isFirst);
        if (isFirst) {
          if (result instanceof AbortSignal) {
            if (result.aborted) {
              queueMicrotask(() => controller.abort());
            } else {
              result.addEventListener('abort', () => controller.abort(), {
                once: true,
              });
            }
          }
          return controller.signal;
        }
        if (result === false) controller.abort();
        return result;
      };
      record = { controller, wrapped };
      renewCache.set(renew, record);
    }
    return guard(
      rawWatch(
        record.wrapped,
        readonly ? { ...option, editable: false } : option
      )
    );
  }) as Watch<T>;
}

/**
 * A local edit session over any existing core ref, including a child ref.
 * Source subscription is only a wake-up signal: merge decisions compare the
 * latest source value with each draft-owned edit's accepted baseline.
 */
export function createDraft<T>(source: StateRefStore<T>): Draft<T> {
  if (!core || typeof core.create !== 'function') {
    throw new Error('state-ref/draft requires the stateRef core bundle.');
  }

  const sourceLink = connectRef(source);
  if (!sourceLink.exists()) {
    throw new TypeError('Cannot create a draft from a missing source path.');
  }
  const initial = sourceLink.read() as T;
  assertDraftValue(initial);

  const owner = Object.freeze({});
  const journal = createWriteJournal();
  let edits: Edit[] = [];
  let acceptedSource: unknown = initial;
  let sourceReason: 'missing-source' | 'invalid-source' | null = null;
  let open = true;
  let nextId = 1;
  let version = 0;
  let pendingRebase = false;
  let draftLink: ReturnType<typeof connectRef<T>>;
  const guardCache = new WeakMap<object, object>();
  const snapshotCache = new WeakMap<object, object>();
  const subscriptionAbort = new AbortController();
  const statusAbort = new AbortController();
  const externalControllers = new Set<AbortController>();
  const statusStore = core.create<DraftStatus>(
    { dirty: false, conflicts: 0, version: 0 },
    { autoSync: false }
  );
  const rawStatus = statusStore.watch(() => statusAbort.signal);
  let pendingStatusSync = false;

  const assertOpen = () => {
    if (!open) throw new Error('This draft has been discarded.');
  };

  const stageStatus = () => {
    statusStore.updateRef.value = {
      dirty: edits.length > 0,
      conflicts: edits.filter(edit => edit.conflict).length,
      version,
    };
    pendingStatusSync = true;
  };

  const flushStatus = () => {
    if (!pendingStatusSync) return;
    pendingStatusSync = false;
    statusStore.sync();
  };

  const sourceAt = (path: DraftPath): LocatedValue =>
    sourceReason
      ? { exists: false, value: undefined }
      : readPath(acceptedSource, path);

  const onWrite = (write: RefWrite) => {
    assertOpen();
    assertDraftValue(write.after);
    const path = pathFromWrite(write);
    const current = draftLink.read();
    const next = replacePath(current, path, write.after);
    const atomic = atomicPath(current, path);
    const after = readPath(next, atomic);
    assertDraftValue(after.value);

    journal.onWrite(write);
    const origin = journal.lastOrigin();
    journal.clearEntries();
    if (origin !== 'user') return;

    const ancestor = edits.find(edit => startsWith(atomic, edit.path));
    let edit: Edit;
    if (ancestor) {
      edit = ancestor;
      edit.after = readPath(next, edit.path).value;
    } else {
      edits = edits.filter(existing => !startsWith(existing.path, atomic));
      edit = {
        id: nextId++,
        path: atomic,
        before: sourceAt(atomic),
        after: after.value,
        conflict: false,
        revision: 0,
      };
      edits.push(edit);
    }

    version += 1;
    edit.revision = version;
    const currentSource = sourceAt(edit.path);
    if (
      sameValue(edit.before, { exists: true, value: edit.after }) ||
      sameValue(currentSource, { exists: true, value: edit.after })
    ) {
      edits = edits.filter(item => item !== edit);
      pendingRebase = true;
    } else {
      edit.conflict =
        sourceReason !== null || !sameValue(edit.before, currentSource);
    }
    stageStatus();
  };

  const { watch: rawWatch } = core.create(initial, { onWrite });
  const rawRef = rawWatch(() => subscriptionAbort.signal);
  draftLink = connectRef(rawRef);
  const guard = (ref: StateRefStore<T>) =>
    guardDraftRef(ref, assertOpen, guardCache, snapshotCache);
  const guardStatus = (ref: StateRefStore<DraftStatus>) =>
    guardDraftRef(ref, assertOpen, guardCache, snapshotCache);

  const sourceNow = () => {
    if (!sourceLink.exists()) {
      sourceReason = 'missing-source' as const;
      return undefined;
    }
    try {
      const value = sourceLink.read();
      assertDraftValue(value);
      sourceReason = null;
      acceptedSource = value;
      return value;
    } catch {
      sourceReason = 'invalid-source' as const;
      return undefined;
    }
  };

  const rebase = () => {
    const sourceValue = sourceNow();
    version += 1;
    if (sourceReason) {
      edits.forEach(edit => {
        edit.conflict = true;
      });
      stageStatus();
      flushStatus();
      return;
    }

    let next: unknown = sourceValue;
    const previous = draftLink.read();
    const remaining: Edit[] = [];
    for (const edit of edits) {
      const current = readPath(sourceValue, edit.path);
      if (sameValue(current, { exists: true, value: edit.after })) {
        continue;
      }
      edit.conflict = !sameValue(edit.before, current);
      try {
        next = replacePath(next, edit.path, edit.after);
      } catch {
        edit.conflict = true;
        next = preserveBranch(next, previous, edit.path);
      }
      remaining.push(edit);
    }
    edits = remaining;
    stageStatus();

    if (!equalTree(previous, next)) {
      journal.runAs('source-refresh', () => {
        rawRef.value = next as T;
      });
    } else {
      flushStatus();
    }
  };

  // Registered before the draft ref is handed out, so a caller inspecting
  // changes from its subscriber sees the edit log for the published value.
  const stopDraft = observeRef(rawRef, () => {
    if (pendingRebase) {
      pendingRebase = false;
      rebase();
    }
    flushStatus();
  });
  const stopSource = observeRef(source, () => rebase());

  const snapshotValue = (located: LocatedValue): DraftValue =>
    Object.freeze({
      exists: located.exists,
      value: located.exists ? frozenCopy(located.value) : undefined,
    });

  const changes = (): readonly DraftChange[] => {
    assertOpen();
    return Object.freeze(
      edits.map(edit =>
        Object.freeze({
          owner,
          id: edit.id,
          version,
          path: Object.freeze([...edit.path]),
          before: snapshotValue(edit.before),
          after: snapshotValue({ exists: true, value: edit.after }),
          source: snapshotValue(sourceAt(edit.path)),
          conflict: edit.conflict,
        })
      )
    );
  };

  const apply = (): DraftApplyResult => {
    assertOpen();
    const currentSource = sourceNow();
    if (sourceReason) return { ok: false, reason: sourceReason };
    if (!sourceLink.editable) return { ok: false, reason: 'readonly' };
    if (edits.some(edit => edit.conflict)) {
      return { ok: false, reason: 'conflict' };
    }

    let next: unknown = currentSource;
    for (const edit of edits) {
      if (!sameValue(readPath(currentSource, edit.path), edit.before)) {
        edit.conflict = true;
        version += 1;
        stageStatus();
        flushStatus();
        return { ok: false, reason: 'conflict' };
      }
      try {
        next = replacePath(next, edit.path, edit.after);
      } catch {
        edit.conflict = true;
        version += 1;
        stageStatus();
        flushStatus();
        return { ok: false, reason: 'conflict' };
      }
    }

    const submitted = edits.map(edit => ({
      id: edit.id,
      revision: edit.revision,
    }));
    const applied = submitted.length;
    if (applied > 0) {
      source.value = next as T;
    }
    // Auto-sync sources already called rebase from their runner. Manual-sync
    // sources have not, so also settle only the edits frozen at apply entry.
    edits = edits.filter(
      edit =>
        !submitted.some(
          item => item.id === edit.id && item.revision === edit.revision
        )
    );
    rebase();
    return { ok: true, applied };
  };

  const resolve = (
    change: DraftChange,
    choice: 'source' | 'draft'
  ): DraftResolveResult => {
    assertOpen();
    const edit = edits.find(item => item.id === change.id);
    if (change.owner !== owner || change.version !== version || !edit) {
      return { ok: false, reason: 'stale' };
    }
    const currentSource = sourceNow();
    if (sourceReason) return { ok: false, reason: 'missing-source' };

    if (choice === 'draft') {
      try {
        replacePath(currentSource, edit.path, edit.after);
      } catch {
        return { ok: false, reason: 'boundary' };
      }
      edit.before = readPath(currentSource, edit.path);
      edit.conflict = false;
      edit.revision = version + 1;
    } else {
      edits = edits.filter(item => item !== edit);
    }
    version += 1;
    rebase();
    return { ok: true };
  };

  const reset = () => {
    assertOpen();
    const currentSource = sourceNow();
    if (sourceReason) {
      throw new Error('Cannot reset a draft without a valid source.');
    }
    edits = [];
    pendingRebase = false;
    version += 1;
    stageStatus();
    if (!equalTree(draftLink.read(), currentSource)) {
      journal.runAs('rollback', () => {
        rawRef.value = currentSource as T;
      });
    } else {
      flushStatus();
    }
  };

  return Object.freeze({
    ref: guard(rawRef),
    watch: guardedWatch(
      rawWatch,
      rawRef,
      guard,
      assertOpen,
      externalControllers
    ),
    status: guardStatus(rawStatus),
    watchStatus: guardedWatch(
      statusStore.watch,
      rawStatus,
      guardStatus,
      assertOpen,
      externalControllers,
      true
    ),
    isDirty: () => {
      assertOpen();
      return edits.length > 0;
    },
    changes,
    version: () => {
      assertOpen();
      return version;
    },
    apply,
    resolve,
    reset,
    discard: () => {
      if (!open) return;
      open = false;
      stopSource();
      stopDraft();
      subscriptionAbort.abort();
      statusAbort.abort();
      externalControllers.forEach(controller => controller.abort());
      externalControllers.clear();
      edits = [];
    },
  });
}
