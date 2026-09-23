/**
 * A pull cache owned by one unbound computed ref. Source stores never retain
 * it: only the refs passed to this calculation are wrapped, and no core read
 * hook or subscription is installed.
 */
export function memoRefs<A extends readonly unknown[], R>(
  refs: A,
  calculate: (refs: A) => R,
  equals: (next: R, previous: R) => boolean
): () => R {
  type Ref = { value: unknown };
  let dependencies = new Map<Ref, unknown>();
  let collecting: Map<Ref, unknown> | undefined;
  const wrappers = new WeakMap<object, object>();

  const wrap = (ref: any): any => {
    if (!ref || typeof ref !== 'object') return ref;
    let wrapped = wrappers.get(ref);
    if (!wrapped) {
      wrapped = new Proxy(ref, {
        get(target, key) {
          const value = Reflect.get(target, key);
          if (key === 'value') {
            collecting?.set(target, value);
            return value;
          }
          if (key === Symbol.iterator && typeof value === 'function') {
            return function* () {
              // An empty array still depends on its collection, so appending
              // the first element must invalidate a cached iteration.
              if ('value' in target) collecting?.set(target, target.value);
              for (const item of target) yield wrap(item);
            };
          }
          return wrap(value);
        },
      }) as object;
      wrappers.set(ref, wrapped);
    }
    return wrapped;
  };

  const inputs = refs.map(wrap) as unknown as A;
  let result: R;
  let initialized = false;

  return () => {
    let valid = initialized;
    for (const [ref, value] of dependencies) {
      if (!Object.is(ref.value, value)) {
        valid = false;
        break;
      }
    }
    if (!valid) {
      const nextDependencies = new Map<Ref, unknown>();
      collecting = nextDependencies;
      try {
        const next = calculate(inputs);
        if (!initialized || !equals(next, result)) result = next;
        dependencies = nextDependencies;
        initialized = true;
      } finally {
        // Failed calculations/comparisons keep the last successful cache and
        // dependency values. The next read can retry instead of going stale.
        collecting = undefined;
      }
    }
    return result;
  };
}
