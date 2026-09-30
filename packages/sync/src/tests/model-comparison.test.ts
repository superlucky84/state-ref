import { describe, expect, it } from 'vitest';
import { createSyncClient, MutationRejectedError } from '../index';

type Row = { city: string; street: string };
type Accept = 'none' | 'submitted' | 'refetch';
type Outcome = 'success' | 'rejected' | 'unknown' | 'sync-error';
type Recovery = 'none' | 'refetch' | 'acceptServer';

const KEYS: (keyof Row)[] = ['city', 'street'];

/**
 * An independent model of one editable resource, written from the contract
 * rather than from the implementation: it shares no normalization, merge or
 * change-tracking code with the library.
 */
class Model {
  server: Row;
  local: Row;
  unconfirmed = false;

  constructor(server: Row) {
    this.server = { ...server };
    this.local = { ...server };
  }

  edit(key: keyof Row, value: string) {
    this.local = { ...this.local, [key]: value };
  }

  /** Residual intent: the fields whose local value still differs. */
  changedKeys(): (keyof Row)[] {
    return KEYS.filter(key => this.server[key] !== this.local[key]);
  }

  dirty() {
    return this.changedKeys().length > 0;
  }

  settle(
    accept: Accept,
    outcome: Outcome,
    submitted: Row,
    onReject: 'keep' | 'remove',
    refetched: Row
  ) {
    if (outcome === 'unknown' || outcome === 'sync-error') {
      // Either the WRITE may not have landed, or it landed and the baseline
      // could not be reconciled. Both keep the intent and stay uncertain.
      this.unconfirmed = true;
      return;
    }
    if (outcome === 'rejected') {
      if (onReject === 'remove')
        for (const key of KEYS)
          if (submitted[key] !== this.server[key])
            this.local = { ...this.local, [key]: this.server[key] };
      return;
    }
    if (accept === 'submitted') {
      // Only the submitted fields become the new confirmed baseline.
      for (const key of KEYS)
        if (submitted[key] !== this.server[key])
          this.server = { ...this.server, [key]: submitted[key] };
      return;
    }
    if (accept === 'refetch') {
      // A refetch consumes the submitted edits, because the server already
      // has them. Only edits that were never submitted outrank the baseline.
      const outstanding = this.changedKeys().filter(
        key => submitted[key] === this.server[key]
      );
      this.server = { ...refetched };
      const next = { ...refetched };
      for (const key of outstanding) next[key] = this.local[key];
      this.local = next;
      return;
    }
    this.unconfirmed = true; // accept 'none' confirms nothing.
  }

  recover(value: Row) {
    // A confirmed baseline resolves the uncertainty; intent that was never
    // consumed stays as a local edit over the new baseline.
    const outstanding = this.changedKeys();
    this.server = { ...value };
    const next = { ...value };
    for (const key of outstanding) next[key] = this.local[key];
    this.local = next;
    this.unconfirmed = false;
  }
}

async function runCase(
  accept: Accept,
  outcome: Outcome,
  onReject: 'keep' | 'remove',
  followUp: boolean,
  recovery: Recovery
) {
  const client = createSyncClient({ ssr: true });
  let served: Row = { city: '서울', street: '중앙로' };
  const query = client.query({
    queryKey: ['row'],
    queryFn: () => ({ ...served }),
  });
  await query.load();
  const model = new Model(served);

  query.ref.city.value = '부산';
  model.edit('city', '부산');
  const submission = query.capture();
  const submitted: Row = { ...model.local };

  const refetched: Row = { city: '광주', street: '새길' };
  let release!: () => void;
  const pending = new Promise<{ ok: boolean }>(resolve => {
    release = () => resolve({ ok: true });
  });
  const operation = client
    .mutation({
      mutationFn: () => {
        if (outcome === 'rejected') throw new MutationRejectedError('no');
        if (outcome === 'unknown') throw new Error('timeout');
        return pending;
      },
    })
    .start(null, {
      links: [
        outcome === 'sync-error'
          ? {
              query,
              submission,
              accept: {
                kind: 'response' as const,
                select: () => {
                  throw new Error('mapping failed');
                },
              },
              onReject,
            }
          : { query, submission, accept: { kind: accept }, onReject },
      ],
    });

  if (followUp) {
    query.ref.street.value = '뒷길';
    model.edit('street', '뒷길');
  }
  served = refetched;
  release();
  const result = await operation.result;
  model.settle(accept, outcome, submitted, onReject, refetched);

  const recovered: Row = { city: '인천', street: '앞길' };
  if (recovery === 'refetch') {
    served = recovered;
    await query.refetch();
    model.recover(recovered);
  } else if (recovery === 'acceptServer') {
    query.acceptServer(recovered);
    model.recover(recovered);
  }

  const actual = {
    local: { ...query.ref.value },
    dirty: query.isDirty(),
    unconfirmed: query.status.unconfirmed.value,
  };
  const expected = {
    local: model.local,
    dirty: model.dirty(),
    unconfirmed: model.unconfirmed,
  };
  operation.dispose();
  query.dispose();
  return { actual, expected, kind: result.kind };
}

describe('resource behaviour against an independent model', () => {
  it('agrees on residual intent and both baselines after every outcome', async () => {
    const accepts: Accept[] = ['none', 'submitted', 'refetch'];
    const outcomes: Outcome[] = [
      'success',
      'rejected',
      'unknown',
      'sync-error',
    ];
    const rejects: ('keep' | 'remove')[] = ['keep', 'remove'];
    const recoveries: Recovery[] = ['none', 'refetch', 'acceptServer'];
    const disagreements: string[] = [];
    let cases = 0;

    for (const accept of accepts)
      for (const outcome of outcomes)
        for (const onReject of rejects)
          for (const followUp of [false, true])
            for (const recovery of recoveries) {
              cases += 1;
              const { actual, expected, kind } = await runCase(
                accept,
                outcome,
                onReject,
                followUp,
                recovery
              );
              const label = `${accept}/${outcome}/${onReject}/follow=${followUp}/recover=${recovery}`;
              if (JSON.stringify(actual) !== JSON.stringify(expected))
                disagreements.push(
                  `${label} kind=${kind}\n  actual=${JSON.stringify(
                    actual
                  )}\n  model =${JSON.stringify(expected)}`
                );
            }

    expect(cases).toBe(144);
    expect(disagreements).toEqual([]);
  });

  it('shows the comparison is live by rejecting a wrong model rule', async () => {
    // A refetch consumes the submitted edits. A model that instead kept every
    // local edit over the arriving baseline must disagree with the library.
    const { actual } = await runCase(
      'refetch',
      'success',
      'keep',
      false,
      'none'
    );
    const naive = new Model({ city: '서울', street: '중앙로' });
    naive.edit('city', '부산');
    const outstanding = naive.changedKeys();
    naive.server = { city: '광주', street: '새길' };
    const next = { ...naive.server };
    for (const key of outstanding) next[key] = naive.local[key];
    naive.local = next;

    expect(naive.local).toEqual({ city: '부산', street: '새길' });
    expect(actual.local).toEqual({ city: '광주', street: '새길' });
    expect(actual.local).not.toEqual(naive.local);
  });
});
