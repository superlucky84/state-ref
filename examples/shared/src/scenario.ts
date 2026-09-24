import type { Profile, SaveAddressDto } from './types';

/**
 * The fixed values the manual checklist names.
 *
 * Phase 8.1~8.3 already drive 서울 → 부산 → 대전 and the overlapping 광주
 * change in the connector suites. The demos reuse the same words so a person
 * running M2-12~16 by hand is looking at the same flow the automated tests
 * pinned, and a mismatch on screen is a connector difference rather than a
 * fixture difference (DC8-5-02).
 */
export const CITY = {
  /** What the server holds at the start. */
  server: '서울',
  /** The shared resource edit. */
  resource: '부산',
  /** The draft edit, applied to the source later. */
  draft: '대전',
  /** The change that overlaps the draft and turns into a conflict. */
  overlap: '광주',
} as const;

export const INITIAL_PROFILE: Profile = {
  city: CITY.server,
  zip: '01',
  memo: '최초 메모',
  contacts: [
    { id: 'c1', name: '김', phone: '010-0001' },
    { id: 'c2', name: '이', phone: '010-0002' },
    { id: 'c3', name: '박', phone: '010-0003' },
  ],
  office: { floor: 3, room: '301' },
};

/** The unrelated field change: it must never overlap a city edit. */
export function withMemo(profile: Profile, memo: string): Profile {
  return { ...profile, memo };
}

/**
 * Reverses the contact list.
 *
 * Phase 7.1 fixed the boundary this exercises: when the same path points at a
 * different element, `draft.apply()` refuses rather than writing the wrong
 * contact. The demo needs a one-click way to reach that state.
 */
export function reorderContacts(profile: Profile): Profile {
  return { ...profile, contacts: [...profile.contacts].reverse() };
}

/** The parent-disappeared fixture: a draft holding `office.room` loses its parent. */
export function removeOffice(profile: Profile): Profile {
  return { ...profile, office: null };
}

/**
 * Builds the WRITE input from a profile.
 *
 * The field names differ from `Profile` on purpose - M2-06 asks for a DTO
 * that does not mirror the query shape.
 */
/**
 * The query paths `toSaveDto` actually carries.
 *
 * `accept: { kind: 'submitted' }` moves the baseline for every change in the
 * submission, on the app's word that the server took those values. sync does
 * not read the DTO and will not infer which fields reached the server
 * (docs/server-sync/PHASE4.md). So a capture must select the changes this DTO
 * carries - capturing everything would mark an unsent edit as saved and hide
 * the divergence behind `dirty=false` (B8-7-03).
 */
export const SAVED_PATHS: readonly string[] = ['city', 'zip'];

export function toSaveDto(profile: Profile, revision: number): SaveAddressDto {
  return {
    addressLine: profile.city,
    postalCode: profile.zip,
    submittedRevision: revision,
  };
}
