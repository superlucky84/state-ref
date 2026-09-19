import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';
import { createDraft } from 'state-ref/draft';
import type {
  DraftChange,
  DraftApplyResult,
  DraftStatus,
} from 'state-ref/draft';

const source = createStore({ address: { city: '서울', zip: 100 } })();
const draft = createDraft(source.address);
const city: string = draft.ref.city.value;
draft.ref.city.value = city;
const review: readonly DraftChange[] = draft.changes();
const result: DraftApplyResult = draft.apply();
const payloadWatch: Watch<{ city: string; zip: number }> = draft.watch;
const statusWatch: Watch<DraftStatus> = draft.watchStatus;
void payloadWatch;
void statusWatch;

// @ts-expect-error The draft keeps the source branch's field type.
draft.ref.city.value = 123;
// @ts-expect-error A draft review is readonly.
review[0].path.push('invalid');
// @ts-expect-error The result is a discriminated union.
result.reason;
