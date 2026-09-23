/**
 * A promise the demo settles by hand.
 *
 * Every mock request hands one of these back, so a person can leave a READ or
 * a WRITE in flight for as long as it takes to read the panels. This is the
 * only timing the fixture genuinely controls - sync's own staleness and
 * polling run on real time (DC8-5-12 in docs/server-sync/PHASE8_5.md).
 */
export type Deferred<T> = {
  readonly promise: Promise<T>;
  readonly settled: boolean;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  // `settled` is a plain flag rather than promise introspection: the demos
  // render it, and a pending `unknown` request must read as unsettled without
  // anyone awaiting it.
  const state = { settled: false };
  return {
    promise,
    get settled() {
      return state.settled;
    },
    resolve(value) {
      if (state.settled) return;
      state.settled = true;
      resolve(value);
    },
    reject(reason) {
      if (state.settled) return;
      state.settled = true;
      reject(reason);
    },
  };
}
