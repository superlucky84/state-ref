/** Shared across the core and optional entry points, including separate UMDs. */
export const REF_CONNECTION = Symbol.for('state-ref.ref-link');

/** Identity only: helpers and pending shared refs have no core connection. */
export const REF_IDENTITY = Symbol.for('state-ref.ref');
