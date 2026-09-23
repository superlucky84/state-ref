import { createDeferred } from './deferred';
import type { Deferred } from './deferred';
import type {
  Profile,
  ReadOutcome,
  RequestKind,
  RequestRecord,
  SaveAddressDto,
  SaveAddressResponse,
  WriteOutcome,
} from './types';

/**
 * The in-memory server every demo talks to.
 *
 * It never reaches the network (DC8-5-07). A request returns a promise that
 * stays pending until the demo settles it, so a person can hold a READ or a
 * WRITE open while reading the panels. Each request is recorded with an ID, a
 * revision and a wall-clock stamp - that is the request panel the manual
 * checklist asks for.
 */
export type MockServer = Readonly<{
  /** The current server value. Editing a resource never changes this. */
  value: () => Profile;
  revision: () => number;
  /** Change the server behind the client's back, then let it refetch. */
  setValue: (next: Profile) => void;

  counts: () => Readonly<{ read: number; write: number }>;
  requests: () => readonly RequestRecord[];
  /** Requests that have not settled - `unknown` lives here forever. */
  inFlight: () => readonly RequestRecord[];

  /** Queue the outcome of the next READ. Defaults to `success`. */
  nextRead: (outcome: ReadOutcome) => void;
  /** Queue the outcome of the next WRITE. Defaults to `success`. */
  nextWrite: (outcome: WriteOutcome) => void;

  /** The `queryFn` a demo hands to `client.query`. */
  read: (context: { signal: AbortSignal }) => Promise<Profile>;
  /** The `mutationFn` a demo hands to `client.mutation`. */
  write: (input: SaveAddressDto) => Promise<SaveAddressResponse>;

  /** Settle the oldest unsettled request of this kind. */
  settle: (kind: RequestKind) => boolean;
  /** Settle every unsettled request that is allowed to settle. */
  settleAll: () => number;
}>;

type Pending = {
  record: RequestRecord;
  deferred: Deferred<never> | Deferred<Profile> | Deferred<SaveAddressResponse>;
  finish: () => void;
};

export function createMockServer(initial: Profile): MockServer {
  let value = initial;
  let revision = 1;
  let readCount = 0;
  let writeCount = 0;
  let nextRead: ReadOutcome = 'success';
  let nextWrite: WriteOutcome = 'success';
  const records: RequestRecord[] = [];
  const pending: Pending[] = [];

  const record = (kind: RequestKind, id: string): RequestRecord => ({
    id,
    kind,
    key: 'profile',
    revision,
    startedAt: Date.now(),
    settledAt: null,
    outcome: 'in-flight',
  });

  const replace = (
    entry: RequestRecord,
    outcome: RequestRecord['outcome'],
    settled: boolean
  ) => {
    const index = records.indexOf(entry);
    const next: RequestRecord = {
      ...entry,
      outcome,
      settledAt: settled ? Date.now() : null,
    };
    records[index] = next;
    return next;
  };

  const drop = (entry: Pending) => {
    const index = pending.indexOf(entry);
    if (index >= 0) pending.splice(index, 1);
  };

  return {
    value: () => value,
    revision: () => revision,
    setValue(next) {
      value = next;
      revision += 1;
    },
    counts: () => ({ read: readCount, write: writeCount }),
    requests: () => records,
    inFlight: () => pending.map(entry => entry.record),

    nextRead(outcome) {
      nextRead = outcome;
    },
    nextWrite(outcome) {
      nextWrite = outcome;
    },

    read({ signal }) {
      readCount += 1;
      const outcome = nextRead;
      nextRead = 'success';
      let entry = record('READ', `READ-${readCount}`);
      records.push(entry);
      const deferred = createDeferred<Profile>();
      const item: Pending = {
        record: entry,
        deferred,
        finish() {
          if (outcome === 'unknown') return;
          drop(item);
          entry = replace(entry, outcome, true);
          if (outcome === 'error') {
            deferred.reject(new Error(`${entry.id} failed`));
            return;
          }
          deferred.resolve(value);
        },
      };
      pending.push(item);
      // An aborted READ is reported as aborted rather than quietly dropped -
      // Phase 7.1 turns on a `queryFn` that ignores its signal, so the demo
      // has to make the difference visible.
      signal.addEventListener('abort', () => {
        if (deferred.settled) return;
        drop(item);
        entry = replace(entry, 'aborted', true);
        deferred.reject(signal.reason);
      });
      return deferred.promise;
    },

    write(input) {
      writeCount += 1;
      const outcome = nextWrite;
      nextWrite = 'success';
      let entry = record('WRITE', `WRITE-${writeCount}`);
      records.push(entry);
      const deferred = createDeferred<SaveAddressResponse>();
      const item: Pending = {
        record: entry,
        deferred,
        finish() {
          if (outcome === 'unknown') return;
          drop(item);
          entry = replace(entry, outcome, true);
          if (outcome === 'rejected') {
            deferred.reject(new Error(`${entry.id} rejected`));
            return;
          }
          // Both remaining outcomes mean the server accepted the WRITE. The
          // difference is what the follow-up READ does, which the demo
          // arranges by queueing a failing READ - `sync-error` is a WRITE
          // that succeeded, not a WRITE that failed (Phase 8.3).
          revision += 1;
          value = {
            ...value,
            city: input.addressLine,
            zip: input.postalCode,
          };
          if (outcome === 'success-then-read-failure') nextRead = 'error';
          deferred.resolve({
            revision,
            storedCity: value.city,
            storedZip: value.zip,
          });
        },
      };
      pending.push(item);
      return deferred.promise;
    },

    settle(kind) {
      const item = pending.find(entry => entry.record.kind === kind);
      if (!item) return false;
      const before = pending.length;
      item.finish();
      return pending.length < before;
    },
    settleAll() {
      let settled = 0;
      for (const item of [...pending]) {
        const before = pending.length;
        item.finish();
        if (pending.length < before) settled += 1;
      }
      return settled;
    },
  };
}
