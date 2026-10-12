import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { createSyncClient, hashQueryKey } from '../index';

describe('ref keys from an independently evaluated state-ref copy', () => {
  it('identifies foreign core, pending, combined and computed refs without reading them', () => {
    const read = (file: string) =>
      readFileSync(
        new URL(`../../../state-ref/dist/${file}`, import.meta.url),
        'utf8'
      );
    const fixture = runInNewContext(
      `${read('state-ref.umd.js')}\n${read('state-ref.shared.umd.js')}\n` +
        `(() => {
          const watch = stateRef.createStore(7);
          const core = watch();
          const pending = stateRefShared.sharedWatch('foreign.pending')();
          const combined = stateRef.combineWatch([watch])();
          let calculations = 0;
          const computed = stateRef.createComputed([watch], ([ref]) => {
            calculations += 1;
            return ref.value + 1;
          })();
          return {
            refs: { core, pending, combined, computed },
            calculations: () => calculations,
          };
        })()`,
      { console, AbortController, AbortSignal }
    ) as { refs: Record<string, unknown>; calculations: () => number };
    const { refs } = fixture;
    expect(fixture.calculations()).toBe(1);
    (refs.core as { value: number }).value = 9;
    const client = createSyncClient({ ssr: true });
    const hint = 'read a ref with `.value`';
    for (const ref of Object.values(refs)) {
      expect(() => hashQueryKey(['user', ref])).toThrow(hint);
      expect(() =>
        client.query({ queryKey: ['user', { nested: ref }], queryFn: () => 1 })
      ).toThrow(hint);
    }
    expect(fixture.calculations()).toBe(1);
    expect(client.size()).toBe(0);
    expect(() => (refs.pending as { value: unknown }).value).toThrow(
      'not provided yet'
    );
    expect(hashQueryKey(['user', (refs.core as { value: number }).value])).toBe(
      '["user",9]'
    );
    expect(
      hashQueryKey(['user', (refs.computed as { value: number }).value])
    ).toBe('["user",10]');
    expect(fixture.calculations()).toBe(2);
  });
});
