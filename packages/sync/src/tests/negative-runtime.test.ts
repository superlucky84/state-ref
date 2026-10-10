import { describe, expect, it } from 'vitest';
import { createSyncClient } from '../index';
import { hashQueryKey } from '../key';
import { combineWatch, createComputed, createStore } from 'state-ref';
import { isProvided, provideShared, sharedWatch } from 'state-ref/shared';
import { connectRef } from 'state-ref/plugin';

/**
 * Two things the public types allow but the contract forbids. The runtime
 * refusal is the contract, so it is pinned here; `test/negative-types.ts`
 * records why each one is not expressed in the type instead.
 */
describe('refusals that the types cannot express', () => {
  const REF_HINT =
    'Query key must be an acyclic JSON-compatible tree; read a ref with `.value`.';

  it('refuses different pending shared refs before they can collide as {}', () => {
    const client = createSyncClient({ ssr: true });
    const first = sharedWatch<number>('sync-key.pending-first')();
    const second = sharedWatch<number>('sync-key.pending-second')();
    for (const ref of [first, second]) {
      expect(isProvided(ref)).toBe(false);
      expect(() => hashQueryKey(['user', ref])).toThrow(REF_HINT);
      expect(() =>
        client.query({ queryKey: ['user', ref], queryFn: () => 1 })
      ).toThrow(REF_HINT);
      // Identity is not a fabricated core connection.
      expect(() => connectRef(ref as never)).toThrow(
        'Expected a state-ref reference.'
      );
      expect(isProvided(ref)).toBe(false);
    }
    expect(client.size()).toBe(0);
    provideShared('sync-key.pending-first', createStore(7));
    expect(isProvided(first)).toBe(true);
    expect(() => hashQueryKey(['user', first])).toThrow(REF_HINT);
    if (isProvided(first)) {
      expect(hashQueryKey(['user', first.value])).toBe('["user",7]');
    }
  });

  it('refuses combined and computed refs, including nested key values', async () => {
    const watch = createStore(7);
    const combined = combineWatch([watch])();
    const computed = createComputed([watch], ([ref]) => ref.value + 1)();
    const client = createSyncClient({ ssr: true });
    for (const ref of [watch(), combined, computed]) {
      for (const value of [ref, { nested: [ref] }]) {
        const queryKey = ['user', value];
        expect(() => hashQueryKey(queryKey)).toThrow(REF_HINT);
        expect(() => client.query({ queryKey, queryFn: () => 1 })).toThrow(
          REF_HINT
        );
        await expect(
          client.fetch({ queryKey, queryFn: () => 1 })
        ).rejects.toThrow(REF_HINT);
      }
    }
    expect(client.size()).toBe(0);
    expect(hashQueryKey(['user', combined[0].value, computed.value])).toBe(
      '["user",7,8]'
    );
    expect(Object.keys(computed)).toEqual(['value']);
    expect(() => connectRef(computed as never)).toThrow(
      'Expected a state-ref reference.'
    );
    expect(() => connectRef(combined)).toThrow(
      'Expected a state-ref reference.'
    );
  });

  it('still refuses core refs from copies without the identity symbol', () => {
    const legacy = new Proxy(createStore(7)(), {
      get(target, property, receiver) {
        return property === Symbol.for('state-ref.ref')
          ? undefined
          : Reflect.get(target, property, receiver);
      },
    });
    expect(() => hashQueryKey(['user', legacy])).toThrow(REF_HINT);
  });

  it('refuses the identity symbol in editable data before it can shadow a field', async () => {
    const identity = Symbol.for('state-ref.ref');
    const message = 'Resource payload key Symbol(state-ref.ref) is reserved.';
    const client = createSyncClient({ ssr: true });
    expect(() =>
      client.query({
        queryKey: ['identity-in-initial-data'],
        initialData: { [identity]: 'hidden' },
        queryFn: () => ({ [identity]: 'hidden' }),
      })
    ).toThrow(message);
    expect(client.size()).toBe(0);

    const invalidRead = client.query({
      queryKey: ['identity-in-server-data'],
      queryFn: () => ({ nested: { [identity]: 'hidden' } }),
    });
    await expect(invalidRead.load()).rejects.toThrow(message);
    expect(invalidRead.status.loaded.value).toBe(false);
    invalidRead.dispose();

    const query = client.query<Record<string | symbol, unknown>>({
      queryKey: ['identity-in-local-data'],
      queryFn: () => ({ name: 'before' }),
    });
    await query.load();
    expect(() => {
      query.ref.value = { nested: { [identity]: 'hidden' } };
    }).toThrow(message);
    expect(query.ref.value).toEqual({ name: 'before' });
    expect(query.isDirty()).toBe(false);
    query.dispose();
  });

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
