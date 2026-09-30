// Things that must NOT type-check. Every @ts-expect-error here is itself
// checked: if the line starts compiling, tsc reports the unused directive.
import { createSyncClient } from '@stateref/sync';
import type { QueryKey, SyncCacheEntry, SyncMutationEntry } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const client = createSyncClient({ ssr: true });
const query = client.query({
  queryKey: ['account'],
  queryFn: () => ({ city: '서울', count: 1 }),
});

// Known gap: a status write type-checks and is refused only at run time.
// `negative-runtime.test.ts` pins that refusal.

// Diagnostic snapshots deliberately omit caller-owned values.
const entry: SyncCacheEntry = client.inspectCache()[0];
// @ts-expect-error cache entries carry no error object
entry.status.error;
// @ts-expect-error cache entries carry no query payload
entry.data;
const operation: SyncMutationEntry = client.inspectMutations()[0];
// @ts-expect-error mutation entries carry no input
operation.input;
// @ts-expect-error mutation entries carry no idempotency key value
operation.idempotencyKey;

// The editable ref keeps the query's own shape.
// @ts-expect-error a field outside the query shape is not writable
query.ref.missing.value = 1;
// @ts-expect-error the field type is enforced
query.ref.count.value = 'not a number';

// A draft result must be narrowed before reading its payload.
const draft = createDraft(query.ref);
const applied = draft.apply();
// @ts-expect-error `applied` exists only on the ok branch
applied.applied;
if (!applied.ok) {
  // @ts-expect-error `reason` is a closed set
  const reason: 'nope' = applied.reason;
  void reason;
}

// Acceptance policies are a closed set, and a serializable one needs no select.
void client.mutation({ mutationFn: () => 1 }).run(null, {
  links: [
    {
      query,
      // @ts-expect-error 'replace' is not an acceptance policy
      accept: { kind: 'replace' },
    },
  ],
});

// Known gap: QueryKey is `readonly unknown[]`, so a non-JSON member only
// fails when the key is hashed. Narrowing it would constrain the infinite
// query's page-parameter generic too, so the runtime check is the contract
// and `negative-runtime.test.ts` pins it.
const looseKey: QueryKey = ['account', () => 1];
void looseKey;

export const negative = true;
