import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';
import {
  getShared,
  onShared,
  pendingShared,
  provideShared,
  whenReady,
} from 'state-ref/shared';

declare module 'state-ref/shared' {
  interface SharedStores {
    'subs.ready': boolean;
    subs: { count: number; ready: boolean };
  }
}

// A listed name fixes the value type everywhere.
const ready: Watch<boolean> = provideShared('subs.ready', createStore(false));
const found: Watch<boolean> | undefined = getShared('subs.ready');
onShared('subs', watch => {
  const count: number = watch().count.value;
  void count;
});
whenReady('subs.ready', ref => {
  const value: boolean = ref.value;
  void value;
});
whenReady('subs', ref => void ref.count.value, {
  select: ref => ref.ready.value,
  signal: new AbortController().signal,
});

// @ts-expect-error a listed name rejects a store of another type
provideShared('subs.ready', createStore('no'));
// @ts-expect-error a listed store has no such path
onShared('subs', watch => watch().missing);

// An unlisted name takes its type from the watch or a type argument.
const other: Watch<string> = provideShared('other', createStore('a'));
const typed: Watch<number> | undefined = getShared<number>('n');
const loose: Watch<unknown> | undefined = getShared('anything');
whenReady(createStore({ done: false }), ref => void ref.done.value, {
  select: ref => ref.done.value,
});
const names: string[] = pendingShared();

void [ready, found, other, typed, loose, names];
