import { describe, expect, it } from 'vitest';
import { createSyncClient } from '../index';
import { hashQueryKey } from '../key';

/**
 * Two things the public types allow but the contract forbids. The runtime
 * refusal is the contract, so it is pinned here; `test/negative-types.ts`
 * records why each one is not expressed in the type instead.
 */
describe('refusals that the types cannot express', () => {
  it('refuses a query key that cannot be hashed as JSON', () => {
    const client = createSyncClient({ ssr: true });
    expect(() => hashQueryKey(['account', () => 1])).toThrow(
      'Query key must be an acyclic JSON-compatible tree.'
    );
    expect(() =>
      client.query({
        queryKey: ['account', () => 1],
        queryFn: () => ({ n: 1 }),
      })
    ).toThrow('acyclic JSON-compatible tree');
    expect(client.size()).toBe(0); // A refused key opens no cache entry.

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => hashQueryKey(['account', cyclic])).toThrow();
    expect(() => hashQueryKey(['account', undefined])).toThrow();
  });

  it('refuses a write to the reactive status of a query', async () => {
    const client = createSyncClient({ ssr: true });
    const query = client.query({
      queryKey: ['account'],
      queryFn: () => ({ city: '서울' }),
    });
    await query.load();

    expect(() => {
      (query.status.dirty as { value: boolean }).value = true;
    }).toThrow();
    expect(query.isDirty()).toBe(false); // The refusal changed nothing.

    const mutation = client.mutation({ mutationFn: () => 1 });
    expect(() => {
      (mutation.status.pending as { value: number }).value = 5;
    }).toThrow();
    expect(mutation.status.pending.value).toBe(0);
    mutation.dispose();
    query.dispose();
  });
});
