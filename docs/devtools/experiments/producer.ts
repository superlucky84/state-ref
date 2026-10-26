// Phase 0 only. Injected into a temporary copy, never a published entry.
const channel = Symbol.for('state-ref.phase0.channel');
const protocol = Symbol.for('state-ref.phase0.protocol');
let depth = 0;
let nextBatch = 0;
let currentBatch: number | null = null;

export function install(watch: object, root: any, subscriptions: any) {
  Object.defineProperty(watch, protocol, {
    value: {
      version: 1,
      // Private adapter handshake. Public consumers only get detached views
      // from bridge.mjs, never this table or a live application reference.
      open(factory: any) {
        return (subscriptions[channel] ??= factory(
          () => root.root,
          subscriptions,
          () => delete subscriptions[channel]
        ));
      },
    },
  });
}

export function diagnostic(
  subscriptions: any,
  type: string,
  a?: any,
  b?: any,
  c?: any,
  d?: any
) {
  const sink = subscriptions[channel];
  if (!sink) return;
  try {
    return sink.emit(type, [a, b, c, d], currentBatch);
  } catch {
    // The experiment deliberately tests a failing capture path too.
  }
}

export function beginBatch() {
  if (depth++ === 0) currentBatch = ++nextBatch;
}

export function endBatch() {
  if (--depth === 0) currentBatch = null;
}
