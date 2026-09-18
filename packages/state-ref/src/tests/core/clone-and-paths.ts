/**
 * Phase 6 - the lens write path (CI-04) and cloneDeep fidelity (CI-08).
 *
 * Both are about not failing quietly. A write through a path that does not
 * exist says which segment is missing instead of letting the engine raise
 * "Cannot set properties of undefined", and a clone carries across what the
 * store actually supports - symbol keys included - rather than dropping it.
 *
 * See: docs/core-improvement/IMPLEMENT.md (Phase 6)
 */
import {
  createStore,
  createStoreManualSync,
  copyable,
  cloneDeep,
  lens,
} from '@/index';

const noop = (_?: unknown) => {};

/**
 * A shape the type system cannot express a *missing* path for, which is the
 * whole point of these tests - the writes below are cast at the call site.
 */
type Nested = { kept?: number; a?: { b?: { c?: { d?: number } } } };

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('writing through a missing path (CI-04 / DC-01)', () => {
    it('still assigns a key the parent does not have', () => {
      /**
       * The boundary: a missing *target* is an ordinary write. Only a missing
       * *parent* is an error, so this one keeps working.
       */
      const watch = createStore<{ a: number }>({} as { a: number });
      const ref = watch();

      ref.a.value = 1;

      expect(ref.value).toEqual({ a: 1 });
    });

    it('names the path and the missing segment', () => {
      const watch = createStore<Nested>({});
      const ref = watch() as any;

      expect(() => {
        ref.a.b.value = 1;
      }).toThrow(
        'Cannot write to "root.a.b": "root.a" is undefined, not an object. state-ref does not create missing intermediate paths.'
      );
    });

    it('reports the first segment that is not an object, not the last', () => {
      const watch = createStore<Nested>({});
      const ref = watch() as any;

      expect(() => {
        ref.a.b.c.d.value = 1;
      }).toThrow('Cannot write to "root.a.b.c.d": "root.a" is undefined');
    });

    it('distinguishes null from undefined', () => {
      const watch = createStore<{ a: null }>({ a: null });
      const ref = watch();

      expect(() => {
        (ref.a as any).b.value = 1;
      }).toThrow('"root.a" is null');
    });

    it('refuses to walk into a primitive rather than replacing it', () => {
      /**
       * Deciding to overwrite the 5 would lose data with no way to notice.
       */
      const watch = createStore<{ a: number }>({ a: 5 });
      const ref = watch();

      expect(() => {
        (ref.a as any).b.value = 1;
      }).toThrow('"root.a" is a number');
      expect(ref.a.value).toBe(5);
    });

    it('leaves the store untouched when it throws', () => {
      const watch = createStore<Nested>({ kept: 1 });
      const ref = watch() as any;
      const before = ref.value;

      expect(() => {
        ref.a.b.value = 1;
      }).toThrow();

      expect(ref.value).toBe(before);
      expect(ref.value).toEqual({ kept: 1 });
    });

    it('does not notify subscribers when it throws', () => {
      const watch = createStore<Nested>({ kept: 1 });
      let calls = 0;
      const ref = watch(store => {
        calls += 1;
        noop((store as any).kept.value);
      }) as any;

      calls = 0;
      expect(() => {
        ref.a.b.value = 1;
      }).toThrow();

      expect(calls).toBe(0);
    });

    it('keeps reads forgiving', () => {
      /**
       * Reads mirror optional chaining; only writes commit intent. The
       * asymmetry is deliberate.
       */
      const watch = createStore<Nested>({});

      expect((watch() as any).a.b.value).toBeUndefined();
    });

    it('applies to a manual-sync store too', () => {
      const { updateRef } = createStoreManualSync<Nested>({});
      const ref = updateRef as any;

      expect(() => {
        ref.a.b.value = 1;
      }).toThrow('"root.a" is undefined');
    });

    it('applies to copyable().writeCopy, which shares the same lens', () => {
      expect(() => {
        (copyable({ a: 1 }) as any).x.y.writeCopy(2);
      }).toThrow('"x" is undefined');
    });

    it('names a bare lens path without a phantom root', () => {
      expect(() =>
        lens<Record<string, any>>().chain('a').chain('b').set(1)({})
      ).toThrow('Cannot write to "a.b": "a" is undefined');
    });

    it('reports symbol segments readably', () => {
      const key = Symbol('gate');
      const watch = createStore<Nested>({});
      const ref = watch() as any;

      expect(() => {
        ref[key].inner.value = 1;
      }).toThrow('Symbol(gate)');
    });
  });

  describe('cloneDeep fidelity (CI-08 / DC-07)', () => {
    it('carries symbol keys across at every depth', () => {
      const outer = Symbol('outer');
      const inner = Symbol('inner');
      const cloned = cloneDeep({
        [outer]: 1,
        nested: { [inner]: 2, plain: 3 },
      });

      expect(cloned[outer]).toBe(1);
      expect((cloned.nested as any)[inner]).toBe(2);
      expect(cloned.nested.plain).toBe(3);
    });

    it('keeps Date, RegExp, Map and Set as themselves', () => {
      const source = {
        d: new Date(1234567890),
        r: /ab+c/gi,
        m: new Map<string, { n: number }>([['k', { n: 1 }]]),
        s: new Set([1, 2]),
      };
      const cloned = cloneDeep(source);

      expect(cloned.d).toBeInstanceOf(Date);
      expect(cloned.d.getTime()).toBe(1234567890);
      expect(cloned.d).not.toBe(source.d);

      expect(cloned.r).toBeInstanceOf(RegExp);
      expect(cloned.r.source).toBe('ab+c');
      expect(cloned.r.flags).toBe('gi');

      expect(cloned.m).toBeInstanceOf(Map);
      expect(cloned.m.get('k')).toEqual({ n: 1 });
      expect(cloned.m.get('k')).not.toBe(source.m.get('k'));

      expect(cloned.s).toBeInstanceOf(Set);
      expect([...cloned.s]).toEqual([1, 2]);
    });

    it('clones Map keys that are objects', () => {
      const key = { id: 1 };
      const cloned = cloneDeep(new Map([[key, 'v']]));
      const [clonedKey] = [...cloned.keys()];

      expect(clonedKey).toEqual({ id: 1 });
      expect(clonedKey).not.toBe(key);
    });

    it('clones a circular reference into a circular clone', () => {
      const source: Record<string, unknown> = { n: 1 };
      source.self = source;

      const cloned = cloneDeep(source);

      expect(cloned.self).toBe(cloned);
      expect(cloned).not.toBe(source);
    });

    it('keeps a shared subtree shared', () => {
      const shared = { v: 1 };
      const cloned = cloneDeep({ left: shared, right: shared });

      expect(cloned.left).toBe(cloned.right);
      expect(cloned.left).not.toBe(shared);
    });

    it('survives a cycle that runs through an array and a Map', () => {
      const source: any = { list: [] as unknown[], map: new Map() };
      source.list.push(source);
      source.map.set('back', source);

      const cloned = cloneDeep(source);

      expect(cloned.list[0]).toBe(cloned);
      expect(cloned.map.get('back')).toBe(cloned);
    });

    it('preserves array holes and length', () => {
      const source: number[] = [1];
      source[3] = 4;
      const cloned = cloneDeep(source);

      expect(cloned.length).toBe(4);
      expect(1 in cloned).toBe(false);
      expect(cloned[3]).toBe(4);
    });

    it('preserves the length of an array ending in a hole', () => {
      const source = [1, 2];
      source.length = 5;

      expect(cloneDeep(source).length).toBe(5);
    });

    it('does not copy an array length as if it were state', () => {
      const cloned = cloneDeep([1, 2, 3]);

      expect(Array.isArray(cloned)).toBe(true);
      expect(
        Object.getOwnPropertyDescriptor(cloned, 'length')?.enumerable
      ).toBe(false);
    });

    it('skips non-enumerable properties', () => {
      const source = { visible: 1 };
      Object.defineProperty(source, 'hidden', {
        value: 2,
        enumerable: false,
      });

      expect(Reflect.ownKeys(cloneDeep(source))).toEqual(['visible']);
    });

    it('passes functions and symbols through by reference', () => {
      const fn = () => 1;
      const sym = Symbol('v');
      const cloned = cloneDeep({ fn, sym });

      expect(cloned.fn).toBe(fn);
      expect(cloned.sym).toBe(sym);
    });

    it('keeps undefined values as present keys', () => {
      const cloned = cloneDeep({ u: undefined });

      expect('u' in cloned).toBe(true);
    });

    it('leaves the source untouched', () => {
      const source = { nested: { n: 1 }, list: [1, 2] };
      const cloned = cloneDeep(source);

      cloned.nested.n = 99;
      cloned.list.push(3);

      expect(source.nested.n).toBe(1);
      expect(source.list).toEqual([1, 2]);
    });

    it('returns primitives as they are', () => {
      expect(cloneDeep(1)).toBe(1);
      expect(cloneDeep('s')).toBe('s');
      expect(cloneDeep(null)).toBeNull();
      expect(cloneDeep(undefined)).toBeUndefined();
    });
  });
}
