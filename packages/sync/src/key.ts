export type QueryKey = readonly unknown[];

const REF_LINK = Symbol.for('state-ref.ref-link');
const REF_IDENTITY = Symbol.for('state-ref.ref');

/** Stable JSON key; object order is ignored, array order is significant. */
export function hashQueryKey(key: QueryKey): string {
  if (!Array.isArray(key)) throw new TypeError('Query key must be an array.');
  const seen = new Set<object>();
  const normalize = (value: unknown): unknown => {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      return value;
    }
    if (typeof value !== 'object' || seen.has(value)) {
      throw new TypeError('Query key must be an acyclic JSON-compatible tree.');
    }
    /**
     * A state-ref ref is a proxy over a plain object, so it passes the plain
     * check below, and a ref to a primitive has no keys and hashes to `{}`.
     * `['user', idRef]` - a forgotten `.value` - would then share one entry
     * across every id (docs/sync-query-hooks DC-QH-13). Identity also covers
     * helpers and pending shared refs, which have no core connection. Keep
     * the link check for core refs from older state-ref copies.
     */
    if (
      Reflect.get(value, REF_IDENTITY) === true ||
      Reflect.get(value, REF_LINK) !== undefined
    ) {
      throw new TypeError(
        'Query key must be an acyclic JSON-compatible tree; read a ref with `.value`.'
      );
    }
    const plain =
      Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
    if (!plain) {
      throw new TypeError('Query key must be an acyclic JSON-compatible tree.');
    }
    if (Array.isArray(value)) {
      if (Reflect.ownKeys(value).length !== value.length + 1) {
        throw new TypeError(
          'Query key must be an acyclic JSON-compatible tree.'
        );
      }
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) {
          throw new TypeError(
            'Query key must be an acyclic JSON-compatible tree.'
          );
        }
      }
    } else {
      for (const property of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, property)!;
        if (
          typeof property !== 'string' ||
          !descriptor.enumerable ||
          !('value' in descriptor)
        ) {
          throw new TypeError(
            'Query key must be an acyclic JSON-compatible tree.'
          );
        }
      }
    }
    seen.add(value);
    const result = Array.isArray(value)
      ? value.map(normalize)
      : Object.fromEntries(
          Object.keys(value)
            .sort()
            .map(name => [
              name,
              normalize((value as Record<string, unknown>)[name]),
            ])
        );
    seen.delete(value);
    return result;
  };
  return JSON.stringify(normalize(key));
}
