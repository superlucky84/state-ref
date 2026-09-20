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

type Edit = {
  id: number;
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
    this.baseline = initial;
    const store = core.create(initial, {
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
            path: atomic,
            original: readPath(this.baseline, atomic),
            after: readPath(next, atomic).value,
            conflict: false,
          };
          this.edits.push(edit);
        }
        this.revision += 1;
        if (
          sameValue(readPath(this.baseline, edit.path), {
            exists: true,
            value: edit.after,
          })
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

  isDirty() {
    return this.edits.length > 0;
  }

  conflicts() {
    return this.edits.filter(edit => edit.conflict).length;
  }

  changes(): readonly ResourceChange[] {
    const located = (value: Located): ResourceValue =>
      Object.freeze({
        exists: value.exists,
        value: value.exists ? frozenCopy(value.value) : undefined,
      });
    return Object.freeze(
      this.edits.map(edit =>
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

  /** Accept a READ as server baseline, retaining local edits and their origin. */
  accept(server: T) {
    if (this.editable) assertEditable(server);
    const previous = this.value();
    this.baseline = server;
    let next: unknown = server;
    const remaining: Edit[] = [];
    for (const edit of this.edits) {
      const current = readPath(server, edit.path);
      if (sameValue(current, { exists: true, value: edit.after })) continue;
      edit.conflict = !sameValue(edit.original, current);
      try {
        next = replacePath(next, edit.path, edit.after);
      } catch {
        edit.conflict = true;
        next = preserveBranch(next, previous, edit.path);
      }
      remaining.push(edit);
    }
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
