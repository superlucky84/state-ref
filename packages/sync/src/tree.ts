type RefPathCursor = {
  readonly segment: string | symbol;
  readonly parent: RefPathCursor | null;
};

export type DataPath = readonly (string | symbol)[];
export type Located = Readonly<{ exists: boolean; value: unknown }>;

const own = (value: object, key: string | symbol) =>
  Object.prototype.hasOwnProperty.call(value, key);

const reserved = new Set<string | symbol>([
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

/** Editable resources are plain acyclic data; readonly queries are unrestricted. */
export function assertEditable(value: unknown, seen = new WeakSet<object>()) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return;
  }
  if (typeof value !== 'object' || seen.has(value)) {
    throw new TypeError('Editable resources require plain, acyclic data.');
  }
  const proto = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    proto !== null &&
    Object.getPrototypeOf(proto) !== null
  ) {
    throw new TypeError('Editable resources require plain, acyclic data.');
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      if (!own(value, String(i))) {
        throw new TypeError('Editable arrays cannot contain holes.');
      }
      assertEditable(value[i], seen);
    }
    if (Reflect.ownKeys(value).length !== value.length + 1) {
      throw new TypeError('Editable arrays cannot have extra properties.');
    }
  } else {
    for (const key of Reflect.ownKeys(value)) {
      if (reserved.has(key)) {
        throw new TypeError(`Resource payload key ${String(key)} is reserved.`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!descriptor.enumerable || !('value' in descriptor)) {
        throw new TypeError('Editable fields must be data properties.');
      }
      assertEditable(descriptor.value, seen);
    }
  }
  seen.delete(value);
}

export function readPath(value: unknown, path: DataPath): Located {
  for (const key of path) {
    if (value === null || typeof value !== 'object' || !own(value, key)) {
      return { exists: false, value: undefined };
    }
    value = (value as Record<string | symbol, unknown>)[key];
  }
  return { exists: true, value };
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
  const keys = Reflect.ownKeys(left);
  return (
    keys.length === Reflect.ownKeys(right).length &&
    keys.every(
      key =>
        own(right, key) &&
        equalTree(
          (left as Record<string | symbol, unknown>)[key],
          (right as Record<string | symbol, unknown>)[key]
        )
    )
  );
}

export function sameValue(a: Located, b: Located) {
  return a.exists === b.exists && (!a.exists || equalTree(a.value, b.value));
}

export function startsWith(path: DataPath, prefix: DataPath) {
  return (
    path.length >= prefix.length &&
    prefix.every((part, index) => part === path[index])
  );
}

export function replacePath(
  value: unknown,
  path: DataPath,
  after: unknown
): unknown {
  if (path.length === 0) return after;
  if (value === null || typeof value !== 'object') {
    throw new TypeError('Cannot write through a missing resource parent.');
  }
  const [key, ...rest] = path;
  if (rest.length > 0 && !own(value, key)) {
    throw new TypeError('Cannot write through a missing resource parent.');
  }
  const copy: any = Array.isArray(value) ? [...value] : { ...value };
  const next = replacePath((value as any)[key], rest, after);
  if (Array.isArray(copy) && key === 'length') copy.length = next as number;
  else copy[key] = next;
  return copy;
}

export function atomicPath(root: unknown, path: DataPath): DataPath {
  let value = root;
  for (let index = 0; index < path.length; index += 1) {
    if (Array.isArray(value)) return path.slice(0, index);
    value = readPath(value, [path[index]]).value;
  }
  return path;
}

export function pathFromWrite(write: {
  parent: RefPathCursor;
  segment: string | symbol | null;
}): DataPath {
  const path: Array<string | symbol> = [];
  if (write.segment !== null) path.unshift(write.segment);
  for (let node = write.parent; node.parent; node = node.parent) {
    path.unshift(node.segment);
  }
  if (path.shift() !== 'root') {
    throw new TypeError('Expected a resource store write.');
  }
  return path;
}

export function frozenCopy(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const copy: any = Array.isArray(value) ? [] : {};
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    copy[key] = frozenCopy((value as any)[key]);
  }
  return Object.freeze(copy);
}
