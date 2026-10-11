import type { QueryDisplayRef } from '@stateref/sync';

/** Keep each display path stable while its peek/subscribed ref changes. */
export function followDisplayRef<S>(
  read: () => QueryDisplayRef<S>
): QueryDisplayRef<S> {
  const readonly = () => {
    throw new TypeError('Query displays are readonly.');
  };
  const follow = (readNode: () => object): object => {
    const children = new Map<PropertyKey, object>();
    const child = (key: PropertyKey): object => {
      let ref = children.get(key);
      if (!ref) {
        ref = follow(() => Reflect.get(readNode(), key) as object);
        children.set(key, ref);
      }
      return ref;
    };
    const ref: object = new Proxy(
      {},
      {
        get(_, key) {
          // Identification must not resolve options or read a display value.
          if (key === Symbol.for('state-ref.ref')) return true;
          const node = readNode();
          const value = Reflect.get(node, key);
          // Snapshots and connection metadata are values, not child refs.
          if (key === 'value' || key === Symbol.for('state-ref.ref-link'))
            return value;
          if (key === Symbol.iterator && typeof value === 'function') {
            return function* () {
              const current = readNode();
              let index = 0;
              for (const item of Reflect.get(current, key).call(current)) {
                void item;
                yield child(String(index++));
              }
            };
          }
          if (typeof value === 'function') {
            return (...args: unknown[]) => {
              const current = readNode();
              return Reflect.get(current, key).apply(current, args);
            };
          }
          return value !== null && typeof value === 'object'
            ? child(key)
            : value;
        },
        has(_, key) {
          return Reflect.has(readNode(), key);
        },
        ownKeys() {
          return Reflect.ownKeys(readNode());
        },
        getOwnPropertyDescriptor(_, key) {
          const descriptor = Reflect.getOwnPropertyDescriptor(readNode(), key);
          return descriptor
            ? {
                configurable: true,
                enumerable: descriptor.enumerable,
                writable: false,
                value: Reflect.get(ref, key),
              }
            : undefined;
        },
        set: readonly,
        deleteProperty: readonly,
        defineProperty: readonly,
        setPrototypeOf: readonly,
        preventExtensions: readonly,
      }
    );
    return ref;
  };
  return follow(() => read() as object) as QueryDisplayRef<S>;
}
