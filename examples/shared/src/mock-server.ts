import { MutationRejectedError } from '@stateref/sync';
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

  /**
   * Queue the outcome of the next READ, or of the next `repeat` READs.
   *
   * A query retries a failed READ (DC8-5-29), so a single queued failure is
   * swallowed by the retry chain and never reaches `status: 'error'`. Pass a
   * repeat count to cover the whole chain (DC8-5-30).
   */
  nextRead: (outcome: ReadOutcome, repeat?: number) => void;
  /**
   * Queue the outcome of the next WRITE. Defaults to `success`.
   *
   * `readFailures` applies to `success-then-read-failure` only: the baseline
   * recovery READ is an ordinary query load and retries like one, so a single
   * failure is swallowed and the screen shows a plain success (DC8-5-43).
   * Pass the whole chain length to reach `sync-error`.
   */
  nextWrite: (outcome: WriteOutcome, readFailures?: number) => void;

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

/** The server's own postal-code format: five digits, zero padded. */
const normaliseZip = (zip: string) => zip.padStart(5, '0');

/**
 * `notify` is called whenever the request log, the in-flight list or the
 * server value changes.
 *
 * The demos render this server through a plain (non-reactive) read, so they
 * only repainted when an operation ran. A retry issues its request with no
 * button press behind it, which left `진행 중` showing 0 while a READ was
 * actually open and hid the row from the request table (B8-7-13). Anything
 * that changes what the request panel shows has to say so.
 */
export function createMockServer(
  initial: Profile,
  notify: () => void = () => {}
): MockServer {
  let value = initial;
  let revision = 1;
  let readCount = 0;
  let writeCount = 0;
  let nextRead: ReadOutcome = 'success';
  let nextReadRepeat = 1;
  let nextWrite: WriteOutcome = 'success';
  let nextWriteReadFailures = 1;
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
    notify();
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
      notify();
    },
    counts: () => ({ read: readCount, write: writeCount }),
    requests: () => records,
    inFlight: () => pending.map(entry => entry.record),

    nextRead(outcome, repeat = 1) {
      if (!Number.isInteger(repeat) || repeat < 1) {
        throw new RangeError('repeat must be a positive integer.');
      }
      nextRead = outcome;
      nextReadRepeat = repeat;
    },
    nextWrite(outcome, readFailures = 1) {
      if (!Number.isInteger(readFailures) || readFailures < 1) {
        throw new RangeError('readFailures must be a positive integer.');
      }
      nextWrite = outcome;
      nextWriteReadFailures = readFailures;
    },

    read({ signal }) {
      readCount += 1;
      const outcome = nextRead;
      // The queue is consumed here, at call time, so a retry issued later
      // gets the next queued outcome rather than the one this call used.
      if (nextReadRepeat > 1) nextReadRepeat -= 1;
      else {
        nextRead = 'success';
        nextReadRepeat = 1;
      }
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
      // A retry issues this with no operation behind it, so the panels have to
      // be told (B8-7-13).
      notify();
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
      const readFailures = nextWriteReadFailures;
      nextWrite = 'success';
      nextWriteReadFailures = 1;
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
          if (outcome === 'transport-failure') {
            // Deliberately NOT a MutationRejectedError: this is the failure
            // that cannot say whether the server stored the write, so sync
            // has to call it `unknown` and mark the baseline unconfirmed
            // (DC8-5-44). The server value is left untouched on purpose -
            // "unknown" means the demo does not claim either way.
            deferred.reject(new Error(`${entry.id} transport failure`));
            return;
          }
          if (outcome === 'rejected') {
            // A confirmed rejection has to be *typed* as one. sync classifies
            // any other failure as `unknown`, because a plain transport error
            // cannot tell the client whether the server stored the write
            // (`packages/sync/src/mutation.ts`). Rejecting with a plain Error
            // here made the reject button produce `unknown` and put the whole
            // rejected/unknown distinction out of reach (B8-7-05).
            deferred.reject(
              new MutationRejectedError(`${entry.id} rejected`, 'validation')
            );
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
            // A real server that normalises does it to what it was sent, not
            // to what the client currently shows.
            zip:
              outcome === 'success-corrected'
                ? normaliseZip(input.postalCode)
                : input.postalCode,
          };
          if (outcome === 'success-then-read-failure') {
            nextRead = 'error';
            // The recovery READ retries like any other load, so one failure
            // would be absorbed and the operation would report a plain
            // success (B8-7-10). The caller states the whole chain.
            nextReadRepeat = readFailures;
          }
          deferred.resolve({
            revision,
            storedCity: value.city,
            storedZip: value.zip,
            stored: value,
          });
        },
      };
      pending.push(item);
      notify();
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
