import type { ObserveOptions, Path, Preview } from '@/devtools/types';
import type { PathNode } from '@/path';

export type RawPath = readonly (string | symbol)[];
const freeze = Object.freeze;
const marker = (
  reason: Extract<Preview, { kind: 'marker' }>['reason']
): Preview => freeze({ kind: 'marker', reason });
const MAX_BYTES = 65536;

export function rawPath(
  node: PathNode,
  segment?: string | symbol | null
): RawPath {
  const result: (string | symbol)[] = segment == null ? [] : [segment];
  for (let cursor = node; cursor.parent; cursor = cursor.parent)
    result.unshift(cursor.segment);
  return result.slice(1);
}

export function createPreview(options?: ObserveOptions) {
  const encoder = new TextEncoder();
  if (
    options != null &&
    (typeof options !== 'object' || Array.isArray(options))
  )
    throw new TypeError('state-ref/devtools: options must be an object.');
  const input = options?.redact ?? [];
  if (
    !Array.isArray(input) ||
    input.length > 1000 ||
    input.some(
      path =>
        !Array.isArray(path) ||
        path.length > 64 ||
        path.some(key => typeof key !== 'string' && typeof key !== 'symbol')
    )
  ) {
    throw new TypeError(
      'state-ref/devtools: redact must contain at most 1000 paths of at most 64 string/symbol keys.'
    );
  }
  const masks = input.map(path => [...path]);
  const symbols = new Map<symbol, number>();
  const segment = (key: string | symbol): Path[number] => {
    if (typeof key === 'string')
      return key.length <= 1024
        ? freeze({ kind: 'key', value: key })
        : freeze({ kind: 'truncated' });
    if (!symbols.has(key)) {
      if (symbols.size >= 1000) return freeze({ kind: 'truncated' });
      symbols.set(key, symbols.size + 1);
    }
    return freeze({
      kind: 'symbol',
      id: symbols.get(key)!,
      description: key.description?.slice(0, 256),
    });
  };
  const path = (keys: RawPath): Path =>
    freeze([
      ...keys.slice(0, 64).map(segment),
      ...(keys.length > 64 ? [freeze({ kind: 'truncated' as const })] : []),
    ]);
  return {
    path,
    clear() {
      symbols.clear();
      masks.length = 0;
    },
    capture(value: unknown, at: RawPath = []) {
      if (
        masks.some(
          mask =>
            mask.length <= at.length && mask.every((key, i) => key === at[i])
        )
      ) {
        return { value: marker('masked'), failed: false };
      }
      // Scalar roots need neither a traversal budget nor cycle tracking.
      // A finite number/boolean/null is always below the byte bound; strings
      // still account for escaped JSON and UTF-8 bytes before being retained.
      if (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        (typeof value === 'number' && Number.isFinite(value))
      ) {
        if (typeof value === 'string' && value.length > MAX_BYTES)
          return { value: marker('truncated'), failed: false };
        const scalar = freeze({ kind: 'scalar' as const, value });
        return {
          value:
            typeof value === 'string' &&
            encoder.encode(JSON.stringify(scalar)).length > MAX_BYTES
              ? marker('truncated')
              : scalar,
          failed: false,
        };
      }
      let remaining = MAX_BYTES;
      let nodes = 1000;
      let failed = false;
      const seen = new WeakSet<object>();
      const charge = (item: unknown) => {
        remaining -= encoder.encode(JSON.stringify(item)).length;
        return remaining >= 0;
      };
      const walk = (item: unknown, keys: RawPath, depth: number): Preview => {
        if (--nodes < 0 || remaining < 128) return marker('truncated');
        if (
          masks.some(
            mask =>
              mask.length <= keys.length &&
              mask.every((key, i) => key === keys[i])
          )
        )
          return marker('masked');
        if (
          item === null ||
          typeof item === 'boolean' ||
          typeof item === 'string' ||
          (typeof item === 'number' && Number.isFinite(item))
        ) {
          if (typeof item === 'string' && item.length > remaining)
            return marker('truncated');
          const result = { kind: 'scalar' as const, value: item };
          return charge(result) ? freeze(result) : marker('truncated');
        }
        if (typeof item !== 'object') {
          if (typeof item === 'function') return marker('opaque');
          // BigInt conversion is bounded before building a decimal string.
          if (
            typeof item === 'bigint' &&
            (item > 1n << 4096n || item < -(1n << 4096n))
          )
            return marker('truncated');
          const type =
            typeof item === 'number'
              ? Number.isNaN(item)
                ? 'nan'
                : 'infinity'
              : typeof item;
          const display =
            typeof item === 'symbol'
              ? JSON.stringify(segment(item))
              : String(item);
          const result = {
            kind: 'special' as const,
            type: type as
              | 'undefined'
              | 'nan'
              | 'infinity'
              | 'bigint'
              | 'symbol',
            display,
          };
          return charge(result) ? freeze(result) : marker('truncated');
        }
        if (depth >= 6) return marker('truncated');
        if (seen.has(item)) return marker('circular');
        try {
          const array = Array.isArray(item);
          const prototype = Object.getPrototypeOf(item);
          if (!array && prototype !== null && prototype !== Object.prototype)
            return marker('opaque');
          seen.add(item);
          const entries: {
            readonly key: Path[number];
            readonly value: Preview;
          }[] = [];
          let truncated = false;
          remaining -= 32;
          for (const key of Reflect.ownKeys(item)) {
            if (array && key === 'length') continue;
            const label = segment(key);
            if (nodes <= 0 || remaining < 128 || !charge(label)) {
              truncated = true;
              break;
            }
            // Reserve entry syntax plus a marker before visiting its value.
            // This also accounts for masked/accessor values that skip walk().
            remaining -= 64;
            const childPath = [...keys, key];
            const masked = masks.some(
              mask =>
                mask.length <= childPath.length &&
                mask.every((part, i) => part === childPath[i])
            );
            const descriptor = masked
              ? undefined
              : Object.getOwnPropertyDescriptor(item, key);
            if (masked || !descriptor || !('value' in descriptor)) nodes -= 1;
            entries.push(
              freeze({
                key: label,
                value: masked
                  ? marker('masked')
                  : descriptor && 'value' in descriptor
                  ? walk(descriptor.value, childPath, depth + 1)
                  : marker('accessor'),
              })
            );
          }
          return freeze({
            kind: array ? 'array' : 'object',
            entries: freeze(entries),
            ...(truncated ? { truncated: true as const } : {}),
          });
        } catch {
          failed = true;
          return marker('capture-error');
        } finally {
          seen.delete(item);
        }
      };
      const result = walk(value, at, 0);
      // Account for structural JSON overhead as well as leaf/key charges.
      return {
        value:
          encoder.encode(JSON.stringify(result)).length <= MAX_BYTES
            ? result
            : marker('truncated'),
        failed,
      };
    },
  };
}
