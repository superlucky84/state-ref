/** The record every demo edits. */
export type Contact = Readonly<{ id: string; name: string; phone: string }>;

export type Office = Readonly<{ floor: number; room: string }>;

export type Profile = Readonly<{
  /** The representative flow edits this: 서울 → 부산 → 대전, or 광주. */
  city: string;
  zip: string;
  /** An unrelated field, so a demo can show a change that never overlaps. */
  memo: string;
  /** Reordering this array is what makes `draft.apply()` refuse (Phase 7.1). */
  contacts: readonly Contact[];
  /** Null here is the "parent disappeared" fixture. */
  office: Office | null;
}>;

/**
 * The WRITE input. It deliberately does NOT look like `Profile`: M2-06 and
 * Phase 8.3 both turn on the query shape and the mutation DTO being separate.
 */
export type SaveAddressDto = Readonly<{
  addressLine: string;
  postalCode: string;
  submittedRevision: number;
}>;

/** What the server answers with on a successful WRITE. */
export type SaveAddressResponse = Readonly<{
  revision: number;
  /** The server may normalise what it stored; the demo shows the correction. */
  storedCity: string;
  storedZip: string;
  /**
   * The whole record as the server now holds it.
   *
   * `accept: { kind: 'response' }` hands `select(data)`'s return value to the
   * query as its new baseline, so the app needs the full record - not just
   * the fields it submitted. Rebuilding one from the locally edited value
   * would repeat B8-7-03 and claim unsent edits were saved.
   */
  stored: Profile;
}>;

/**
 * How the mock should end the next request of a kind.
 *
 * `unknown` never settles - that is the point. Phase 7.2 and 8.3 keep
 * `unknown` apart from both success and confirmed rejection, and the demo has
 * to be able to sit in that state while a person looks at the screen.
 */
export type ReadOutcome = 'success' | 'error' | 'unknown';
export type WriteOutcome =
  | 'success'
  | 'rejected'
  | 'unknown'
  /** The WRITE lands but the baseline recovery READ fails: `sync-error`. */
  | 'success-then-read-failure'
  /** The WRITE lands and the server normalises what it stored (M2-07/M2-08). */
  | 'success-corrected';

export type RequestKind = 'READ' | 'WRITE';

/** One line of the request panel the manual checklist asks for. */
export type RequestRecord = Readonly<{
  /** `READ-1`, `WRITE-3`, ... - the request ID shown on screen. */
  id: string;
  kind: RequestKind;
  key: string;
  /** Server revision at the moment the request was accepted. */
  revision: number;
  /** Real wall clock; the fixture cannot move sync's timers (DC8-5-12). */
  startedAt: number;
  settledAt: number | null;
  outcome: ReadOutcome | WriteOutcome | 'in-flight' | 'aborted';
}>;
