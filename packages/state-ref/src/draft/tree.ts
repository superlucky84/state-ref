import type { RefWrite } from '@/types';

export type DraftPath = readonly (string | symbol)[];
export type LocatedValue = Readonly<{ exists: boolean; value: unknown }>;

const own = (value: object, key: string | symbol) =>
  Object.prototype.hasOwnProperty.call(value, key);

const RESERVED_KEYS = new Set<string | symbol>([
  'value',
  'toJSON',
  '__proto__',
  Symbol.iterator,
  Symbol.toPrimitive,
  Symbol.toStringTag,
  Symbol.for('state-ref.navi'),
  Symbol.for('state-ref.type'),
  Symbol.for('state-ref.ref-link'),
  Symbol.for('nodejs.util.inspect.custom'),
]);

/** The editable model is an acyclic tree of plain data, not a class graph. */
export function assertDraftValue(value: unknown, seen = new WeakSet<object>()) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === undefined ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return;
  }

  if (typeof value !== 'object') {
    throw new TypeError('Draft values must be plain, acyclic data.');
  }

  const prototype = Object.getPrototypeOf(value);
  if (
    (!Array.isArray(value) &&
      prototype !== null &&
      Object.getPrototypeOf(prototype) !== null) ||
    seen.has(value)
  ) {
    throw new TypeError('Draft values must be plain, acyclic data.');
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!own(value, String(index))) {
        throw new TypeError('Draft arrays cannot contain holes.');
      }
      assertDraftValue(value[index], seen);
    }
    if (Reflect.ownKeys(value).length !== value.length + 1) {
      throw new TypeError('Draft arrays cannot have extra properties.');
    }
    seen.delete(value);
    return;
  }

  for (const key of Reflect.ownKeys(value)) {
    if (RESERVED_KEYS.has(key)) {
      throw new TypeError(`Draft payload key ${String(key)} is reserved.`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError('Draft fields must be enumerable data properties.');
    }
    assertDraftValue(descriptor.value, seen);
  }
  seen.delete(value);
}

export function readPath(value: unknown, path: DraftPath): LocatedValue {
  for (const key of path) {
    if (value === null || typeof value !== 'object' || !own(value, key)) {
      return { exists: false, value: undefined };
    }
    value = (value as Record<string | symbol, unknown>)[key];
  }
  return { exists: true, value };
}

export function sameValue(left: LocatedValue, right: LocatedValue) {
  return (
    left.exists === right.exists &&
    (!left.exists || equalTree(left.value, right.value))
  );
}

export function equalTree(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    return false;
  }

  const leftKeys = Reflect.ownKeys(left);
  const rightKeys = Reflect.ownKeys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      key =>
        own(right, key) &&
        equalTree(
          (left as Record<string | symbol, unknown>)[key],
          (right as Record<string | symbol, unknown>)[key]
        )
    )
  );
}

export function startsWith(path: DraftPath, prefix: DraftPath) {
  return (
    path.length >= prefix.length &&
    prefix.every((segment, index) => segment === path[index])
  );
}

/** Copy just the edited spine. Missing intermediate branches are never made. */
export function replacePath(
  value: unknown,
  path: DraftPath,
  next: unknown
): unknown {
  if (path.length === 0) return next;
  if (value === null || typeof value !== 'object') {
    throw new TypeError('Cannot apply a draft through a missing parent.');
  }

  const [key, ...rest] = path;
  if (rest.length > 0 && !own(value, key)) {
    throw new TypeError('Cannot apply a draft through a missing parent.');
  }

  const copy: any = Array.isArray(value) ? [...value] : { ...value };
  const replaced = replacePath((value as any)[key], rest, next);
  if (Array.isArray(copy) && key === 'length') {
    copy.length = replaced as number;
    return copy;
  }
  Object.defineProperty(copy, key, {
    configurable: true,
    enumerable: key !== 'length',
    writable: true,
    value: replaced,
  });
  return copy;
}

/** Array elements are one atomic edit; an index is never an entity ID. */
export function atomicPath(root: unknown, path: DraftPath): DraftPath {
  let value = root;
  for (let index = 0; index < path.length; index += 1) {
    if (Array.isArray(value)) return path.slice(0, index);
    value = readPath(value, [path[index]]).value;
  }
  return path;
}

/** A core write path starts with the store's internal `root` wrapper. */
export function pathFromWrite(write: RefWrite): DraftPath {
  const path: Array<string | symbol> = [];
  if (write.segment !== null) path.unshift(write.segment);
  for (let node = write.parent; node.parent; node = node.parent) {
    path.unshift(node.segment);
  }
  if (path.shift() !== 'root') {
    throw new TypeError('Expected a draft store write.');
  }
  return path;
}

export function frozenCopy(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const copy: any = Array.isArray(value) ? [] : {};
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    Object.defineProperty(copy, key, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: frozenCopy((value as any)[key]),
    });
  }
  return Object.freeze(copy);
}
