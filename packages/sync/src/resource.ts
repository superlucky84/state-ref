import * as core from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectRef, createWriteJournal, observeRef } from 'state-ref/plugin';
import {
  assertEditable,
  atomicPath,
  equalTree,
  frozenCopy,
  pathFromWrite,
  readPath,
  replacePath,
  sameValue,
  startsWith,
} from './tree';
import type { DataPath, Located } from './tree';
import { copyJson } from './hydration';

export type ResourceValue = Readonly<{ exists: boolean; value: unknown }>;
export type ResourceChange = Readonly<{
  owner: object;
  id: number;
  version: number;
  path: DataPath;
  before: ResourceValue;
  after: ResourceValue;
  conflict: boolean;
}>;

export type ResourceSubmission<T> = Readonly<{
  owner: object;
  version: number;
  value: T;
  changes: readonly ResourceChange[];
}>;

export type ResourceRecoveryEdit = Readonly<{
  id: number;
  version: number;
  path: readonly string[];
  original: Readonly<{ exists: boolean; value?: unknown }>;
  after: unknown;
  conflict: boolean;
}>;

export type ResourceRecoveryState = Readonly<{
  current: unknown;
  revision: number;
  nextId: number;
  edits: readonly ResourceRecoveryEdit[];
}>;

type Edit = {
  id: number;
  version: number;
  path: DataPath;
  original: Located;
  after: unknown;
  conflict: boolean;
};

function preserveBranch(next: unknown, previous: unknown, path: DataPath) {
  for (let length = path.length - 1; length >= 0; length -= 1) {
    const prefix = path.slice(0, length);
    const old = readPath(previous, prefix);
    if (!old.exists) continue;
    try {
      return replacePath(next, prefix, old.value);
    } catch {
      // Continue to the next existing ancestor.
    }
  }
  return previous;
}

export class ResourceStore<T> {
  readonly watch: Watch<T>;
  readonly ref: StateRefStore<T>;
  private readonly link: ReturnType<typeof connectRef<T>>;
  private readonly journal = createWriteJournal();
  private readonly owner = Object.freeze({});
  private readonly submissions = new WeakSet<object>();
  private readonly activeSubmissions = new Set<ResourceSubmission<T>>();
  private readonly stopObserve: () => void;
  private readonly subscriptionAbort = new AbortController();
  private edits: Edit[] = [];
  private baseline: T;
  private nextId = 1;
  private revision = 0;
  private pendingStatus = false;
  private internalWrite = false;
  private disposed = false;

  constructor(
    initial: T,
    readonly editable: boolean,
    private readonly stageStatus: () => void,
    private readonly flushStatus: () => void
  ) {
    if (editable) assertEditable(initial);
    this.baseline = editable ? (frozenCopy(initial) as T) : initial;
    const store = core.create(this.baseline, {
      onWrite: write => {
        if (this.disposed) throw new Error('This resource has expired.');
        if (this.internalWrite) {
          this.journal.onWrite(write);
          return;
        }
        if (!this.editable) throw new TypeError('This query is readonly.');
        assertEditable(write.after);
        const path = pathFromWrite(write);
        const previous = this.link.read();
        const next = replacePath(previous, path, write.after);
        const atomic = atomicPath(previous, path);
        assertEditable(readPath(next, atomic).value);
        this.journal.onWrite(write);
        this.journal.clearEntries();

        const ancestor = this.edits.find(edit => startsWith(atomic, edit.path));
        let edit: Edit;
        if (ancestor) {
          edit = ancestor;
          edit.after = readPath(next, edit.path).value;
        } else {
          this.edits = this.edits.filter(
            item => !startsWith(item.path, atomic)
          );
          edit = {
            id: this.nextId++,
            version: this.revision + 1,
            path: atomic,
            original: readPath(this.baseline, atomic),
            after: readPath(next, atomic).value,
            conflict: false,
          };
          this.edits.push(edit);
        }
        this.revision += 1;
        edit.version = this.revision;
        if (
          sameValue(readPath(this.baseline, edit.path), {
            exists: true,
            value: edit.after,
          }) &&
          !this.activeSubmissions.size
        ) {
          this.edits = this.edits.filter(item => item !== edit);
        } else {
          edit.conflict = !sameValue(
            edit.original,
            readPath(this.baseline, edit.path)
          );
        }
        this.pendingStatus = true;
        this.stageStatus();
        // A net-zero batch may have no observeRef notification. Its status
        // still needs to settle synchronously before batch returns.
        if (!core.runBatch?.batch?.end(this.publishStatus)) {
          queueMicrotask(this.publishStatus);
        }
      },
    });
    this.watch = store.watch;
    this.ref = store.watch(() => this.subscriptionAbort.signal);
    this.link = connectRef(this.ref);
    this.stopObserve = observeRef(this.ref, this.publishStatus);
  }

  private readonly publishStatus = () => {
    if (this.disposed) return;
    if (!this.pendingStatus) return;
    this.pendingStatus = false;
    this.flushStatus();
  };

  value(): T {
    return this.link.read() as T;
  }

  serverValue(): T {
    return this.baseline;
  }

  version() {
    return this.revision;
  }

  recoveryState(): ResourceRecoveryState {
    if (!this.editable)
      throw new TypeError('Readonly query has no editable recovery state.');
    return Object.freeze({
      current: copyJson(this.value()),
      revision: this.revision,
      nextId: this.nextId,
      edits: Object.freeze(
        this.edits.map(edit =>
          Object.freeze({
            id: edit.id,
            version: edit.version,
            path: Object.freeze(copyJson(edit.path) as string[]),
            original: Object.freeze(
              edit.original.exists
                ? { exists: true, value: copyJson(edit.original.value) }
                : { exists: false }
            ),
            after: copyJson(edit.after),
            conflict: edit.conflict,
          })
        )
      ),
    });
  }

  restoreRecovery(state: ResourceRecoveryState) {
    if (!this.editable || this.revision || this.edits.length)
      throw new Error('Recovery requires a new editable resource.');
    this.revision = state.revision;
    this.nextId = state.nextId;
    this.edits = state.edits.map(edit => ({
      id: edit.id,
      version: edit.version,
      path: [...edit.path],
      original: {
        exists: edit.original.exists,
        value: edit.original.value,
      },
      after: edit.after,
      conflict: edit.conflict,
    }));
    this.pendingStatus = true;
    this.stageStatus();
    this.internalWrite = true;
    try {
      this.journal.runAs('accepted-server-result', () => {
        this.ref.value = state.current as T;
      });
    } finally {
      this.internalWrite = false;
    }
    this.publishStatus();
  }

  isDirty() {
    return this.edits.some(
      edit =>
        !sameValue(readPath(this.baseline, edit.path), {
          exists: true,
          value: edit.after,
        })
    );
  }

  conflicts() {
    return this.edits.filter(
      edit =>
        edit.conflict &&
        !sameValue(readPath(this.baseline, edit.path), {
          exists: true,
          value: edit.after,
        })
    ).length;
  }

  changes(): readonly ResourceChange[] {
    const located = (value: Located): ResourceValue =>
      Object.freeze({
        exists: value.exists,
        value: value.exists ? frozenCopy(value.value) : undefined,
      });
    return Object.freeze(
      this.edits
        .filter(
          edit =>
            !sameValue(readPath(this.baseline, edit.path), {
              exists: true,
              value: edit.after,
            })
        )
        .map(edit =>
          Object.freeze({
            owner: this.owner,
            id: edit.id,
            version: this.revision,
            path: Object.freeze([...edit.path]),
            before: located(readPath(this.baseline, edit.path)),
            after: located({ exists: true, value: edit.after }),
            conflict: edit.conflict,
          })
        )
    );
  }

  capture(ids?: readonly number[]): ResourceSubmission<T> {
    if (!this.editable) throw new TypeError('This query is readonly.');
    const selected = this.changes().filter(change =>
      ids ? ids.includes(change.id) : true
    );
    if (
      ids &&
      (new Set(ids).size !== ids.length || selected.length !== ids.length)
    ) {
      throw new TypeError('Unknown or repeated resource change ID.');
    }
    const submission = Object.freeze({
      owner: this.owner,
      version: this.revision,
      value: frozenCopy(this.value()) as T,
      changes: Object.freeze(selected),
    });
    this.submissions.add(submission);
    return submission;
  }

  assertSubmission(submission: ResourceSubmission<T>) {
    if (!submission || !this.submissions.has(submission) || !this.editable) {
      throw new TypeError('Submission belongs to another resource.');
    }
  }

  beginSubmission(submission: ResourceSubmission<T>) {
    this.assertSubmission(submission);
    if (submission.version !== this.revision) {
      throw new Error('Submission is stale. Capture the current edits again.');
    }
    this.activeSubmissions.add(submission);
  }

  endSubmission(submission: ResourceSubmission<T>) {
    this.activeSubmissions.delete(submission);
    this.edits = this.edits.filter(
      edit =>
        !sameValue(readPath(this.baseline, edit.path), {
          exists: true,
          value: edit.after,
        })
    );
  }

  /** Accept a confirmed WRITE without treating newer input as submitted. */
  acceptSubmitted(submission: ResourceSubmission<T>) {
    this.assertSubmission(submission);
    let server: unknown = this.baseline;
    for (const change of submission.changes) {
      if (change.owner !== this.owner) {
        throw new TypeError('Submission contains a foreign change.');
      }
      const current = readPath(server, change.path);
      if (
        !sameValue(current, change.before) &&
        !sameValue(current, change.after)
      ) {
        throw new Error('Server baseline changed at a submitted path.');
      }
      server = replacePath(server, change.path, change.after.value);
    }
    this.accept(server as T, submission);
  }

  /** Remove only unchanged submitted edits after a confirmed rejection. */
  removeSubmission(submission: ResourceSubmission<T>) {
    this.assertSubmission(submission);
    this.accept(this.baseline, submission);
  }

  /** Accept a READ as server baseline, retaining local edits and their origin. */
  accept(server: T, submission?: ResourceSubmission<T>) {
    if (this.editable) {
      assertEditable(server);
      server = frozenCopy(server) as T;
    }
    if (submission) this.assertSubmission(submission);
    const previous = this.value();
    let next: unknown = server;
    const remaining: Edit[] = [];
    for (const edit of this.edits) {
      const submitted = submission?.changes.find(
        change =>
          change.id === edit.id &&
          change.path.length === edit.path.length &&
          change.path.every((part, index) => part === edit.path[index])
      );
      if (
        submitted &&
        edit.version <= submission!.version &&
        sameValue({ exists: true, value: edit.after }, submitted.after)
      ) {
        continue;
      }
      const current = readPath(server, edit.path);
      if (sameValue(current, { exists: true, value: edit.after })) continue;
      const continued = Boolean(submitted);
      const updated = {
        ...edit,
        original: continued ? current : edit.original,
        conflict: !continued && !sameValue(edit.original, current),
      };
      try {
        next = replacePath(next, edit.path, edit.after);
      } catch {
        updated.conflict = true;
        next = preserveBranch(next, previous, edit.path);
      }
      remaining.push(updated);
    }
    this.baseline = server;
    this.edits = remaining;
    this.revision += 1;
    this.pendingStatus = true;
    this.stageStatus();
    if (!this.editable || !equalTree(previous, next)) {
      this.internalWrite = true;
      try {
        this.journal.runAs('accepted-server-result', () => {
          this.ref.value = next as T;
        });
      } finally {
        this.internalWrite = false;
      }
    }
    this.publishStatus();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopObserve();
    this.subscriptionAbort.abort();
    this.edits = [];
  }
}
