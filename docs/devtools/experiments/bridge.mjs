// A deliberately small observation prototype, NOT the planned recorder.
// No byte budget/redaction/UI here; those remain production acceptance gates.
export const protocol = Symbol.for('state-ref.phase0.protocol');

function pathOf(node, segment) {
  const path = segment == null ? [] : [segment];
  for (let current = node; current?.parent; current = current.parent)
    path.unshift(current.segment);
  return Object.freeze(path.slice(1)); // Drop the library's root wrapper.
}

function preview(value, seen = new WeakSet(), depth = 0) {
  if (typeof value === 'function') return '[Function]';
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  if (depth >= 6) return '[Truncated]';
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null && !Array.isArray(value))
    return '[Opaque]';
  seen.add(value);
  const result = Array.isArray(value) ? [] : {};
  const keys = Reflect.ownKeys(value).filter(key => key !== 'length');
  for (const key of keys.slice(0, 1000)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    Object.defineProperty(result, key, {
      enumerable: true,
      value:
        descriptor && 'value' in descriptor
          ? preview(descriptor.value, seen, depth + 1)
          : '[Accessor]',
    });
  }
  seen.delete(value);
  return Object.freeze(result);
}

function engine(read, subscriptions, release) {
  const listeners = new Set();
  const ids = new WeakMap();
  let nextId = 0;
  let sequence = 0;
  let queue = [];
  let pendingCauses = [];
  let queued = false;
  let dropped = 0;
  let maxPending = 0;
  const idOf = run => {
    if (!ids.has(run)) ids.set(run, ++nextId);
    return ids.get(run);
  };
  const post = event => {
    if (queue.length === 1000) {
      queue.shift();
      dropped += 1;
    }
    queue.push(Object.freeze(event));
    maxPending = Math.max(maxPending, queue.length);
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      const batch = queue;
      queue = [];
      for (const record of batch)
        for (const listener of [...listeners]) {
          if (!listeners.has(listener)) continue;
          try {
            listener(record);
          } catch {
            /* isolate each listener */
          }
        }
    });
  };
  const snapshot = () => preview(read());
  const dependencies = () =>
    Object.freeze(
      [...subscriptions].map(([run, paths]) =>
        Object.freeze({
          id: idOf(run),
          paths: Object.freeze([...paths.keys()].map(node => pathOf(node))),
        })
      )
    );
  return {
    emit(type, args, batchId) {
      if (type === 'begin') {
        const frame = {
          causes: Object.freeze(pendingCauses),
          changed: new Map(),
        };
        pendingCauses = [];
        return frame;
      }
      if (type === 'changed') {
        const [frame, run, info] = args;
        if (!frame) return;
        for (const [node, candidate] of subscriptions.get(run) ?? []) {
          if (candidate !== info) continue;
          const paths = frame.changed.get(run) ?? [];
          paths.push(pathOf(node));
          frame.changed.set(run, paths);
          break;
        }
        return;
      }
      if (type === 'write') {
        const [parent, segment, before, after] = args;
        const id = ++sequence;
        // Manual sync may be delayed indefinitely, so cause metadata is bounded too.
        if (pendingCauses.length === 1000) pendingCauses.shift();
        pendingCauses.push(id);
        post({
          type,
          id,
          path: pathOf(parent, segment),
          before: preview(before),
          after: preview(after),
          batchId,
        });
      } else if (type === 'run') {
        const [frame, run, initial = false] = args;
        post({
          type,
          subscription: idOf(run),
          initial,
          causes: frame?.causes ?? Object.freeze([]),
          paths: Object.freeze(frame?.changed.get(run) ?? []),
          batchId,
        });
      } else if (type === 'ended') {
        post({ type, subscription: idOf(args[0]) });
      }
    },
    attach(listener) {
      listeners.add(listener);
      let active = true;
      return Object.freeze({
        snapshot,
        subscriptions: dependencies,
        stats: () => ({ pending: queue.length, dropped, maxPending }),
        disconnect() {
          if (!active) return;
          active = false;
          listeners.delete(listener);
          if (!listeners.size) {
            queue = [];
            pendingCauses = [];
            release();
          }
        },
      });
    },
  };
}

export function observeStore(watch, listener) {
  const source = typeof watch === 'function' && watch[protocol];
  if (!source || source.version !== 1 || typeof source.open !== 'function')
    throw new TypeError(
      'Expected a development state-ref store with protocol 1.'
    );
  return source.open(engine).attach(listener);
}
