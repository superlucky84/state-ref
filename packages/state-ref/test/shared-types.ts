import { createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import {
  ensureShared,
  getShared,
  isProvided,
  isReady,
  onShared,
  pendingShared,
  provideShared,
  sharedWatch,
  whenReady,
} from 'state-ref/shared';
import type { SharedRef } from 'state-ref/shared';

type Sub = { id: number };
type Subs = { loaded: boolean; error: string | null; mySubs: Sub[] | null };
type LoadedSubs = { loaded: true; error: null; mySubs: Sub[] };

declare module 'state-ref/shared' {
  interface SharedStores {
    'subs.ready': boolean;
    listed: { count: number };
  }
}

// --- provider ---------------------------------------------------------------
const subsStore = createStore<Subs>({
  loaded: false,
  error: null,
  mySubs: null,
});
const provided: Watch<Subs> = provideShared('subs', subsStore, {
  ready: ref => ref.loaded.value,
});
provideShared('subs.ready', createStore(false), { ready: ref => ref.value });
// @ts-expect-error a listed name rejects a store of another type
provideShared('subs.ready', createStore('no'));
// @ts-expect-error ready sees the provided store's ref, which has no such path
provideShared('other', createStore({ a: 1 }), { ready: ref => ref.missing });
// A value that is not a watch is shared as it is.
const client = provideShared('client', { query: (key: string) => key.length });
const size: number = client.query('a');

// --- a value nobody owns ----------------------------------------------------
const ensured = ensureShared('sync', () => ({
  query: (key: string) => key.length,
}));
const ensuredSize: number = ensured.query('a');
const modal: Watch<{ open: boolean }> = ensureShared('ui.modal', () =>
  createStore({ open: false })
);
const counter: Watch<{ count: number }> = ensureShared('listed', () =>
  createStore({ count: 0 })
);
// @ts-expect-error a listed name rejects a store of another type
ensureShared('listed', () => createStore('no'));
// @ts-expect-error it takes a function that creates the value, not the value
ensureShared('sync', { query: () => 1 });
void [ensuredSize, modal, counter];

// --- consumer: guards -------------------------------------------------------
const subsWatch = sharedWatch<Subs, LoadedSubs>('subs');
subsWatch(ref => {
  // @ts-expect-error a shared ref has no paths until a guard has run
  ref.mySubs;
  if (!isProvided(ref)) return;
  const maybe: Sub[] | null = ref.mySubs.value;
  const failed: string | null = ref.error.value;
  // @ts-expect-error provided is not ready: the data may still be missing
  const early: number = ref.mySubs.value.length;
  if (!isReady(ref)) return;
  const length: number = ref.mySubs.value.length;
  const loaded: true = ref.loaded.value;
  ref.mySubs.value = [];
  void [maybe, failed, early, length, loaded];
});

// isReady alone is enough for the common path.
subsWatch(ref => {
  if (!isReady(ref)) return;
  const length: number = ref.mySubs.value.length;
  void length;
});

// Without a ready type, isReady narrows to the store's own type.
const plain = sharedWatch<Subs>('subs');
const plainRef: SharedRef<Subs> = plain();
if (isReady(plainRef)) {
  const list: Sub[] | null = plainRef.mySubs.value;
  // @ts-expect-error no ready type was given, so it is still nullable
  const n: number = plainRef.mySubs.value.length;
  void [list, n];
}

// A listed name needs no type argument.
sharedWatch('listed')(ref => {
  if (!isProvided(ref)) return;
  const count: number = ref.count.value;
  // @ts-expect-error a listed store has no such path
  ref.missing;
  void count;
});
const name: string = subsWatch.shared;

// --- consumer: whenReady ----------------------------------------------------
whenReady(subsWatch, ref => {
  const length: number = ref.mySubs.value.length;
  void length;
});
whenReady(subsWatch, ref => void ref.loaded.value, {
  select: ref => ref.mySubs.value.length > 0,
  signal: new AbortController().signal,
});
whenReady('listed', ref => {
  const count: number = ref.count.value;
  void count;
});
whenReady<Subs>('subs', ref => void ref.loaded.value);
whenReady(createStore({ done: false }), ref => void ref.done.value, {
  select: ref => ref.done.value,
});
whenReady(subsStore, ref => {
  const store: StateRefStore<Subs> = ref;
  void store;
});

// --- values that are not watches ---------------------------------------------
type Client = { query: (key: string) => number };
const found: Client | undefined = getShared<Client>('client');
const listed: Watch<{ count: number }> | undefined = getShared('listed');
const loose: unknown = getShared('anything');
onShared<Client>('client', value => void value.query('a'));
onShared('listed', watch => void watch().count.value);
const names: string[] = pendingShared();

void [provided, size, name, found, listed, loose, names];
