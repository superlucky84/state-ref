import { customRef, onScopeDispose, reactive, readonly, shallowRef } from 'vue';
import type { Reactive, Ref, ShallowRef } from 'vue';
import type { Renew, StateRefStore, Watch } from 'state-ref';

export type ViewWatch<R> = (
  renew?: Renew<R>,
  option?: { cache?: boolean }
) => R;

/**
 * What a component sees of a selected value. Objects and arrays come back
 * wrapped in Vue's `readonly`: writing a field of them is refused (with a
 * warning in development) and the store is untouched, the same rule the core
 * and the other connectors follow - write through `.value` of a selection
 * instead (DC-CN-04).
 */
function shown<V>(value: V): V {
  return value !== null && typeof value === 'object'
    ? (readonly(value as object) as V)
    : value;
}

/**
 * Ends `abort` with whatever scope the connector was called in - a component's
 * setup, or an `effectScope` a composable runs in. `onUnmounted` only knew the
 * first (F-V2).
 */
function releaseWithScope(controller: AbortController) {
  onScopeDispose(() => controller.abort());
}

/** One-way Vue value for a readonly query view. */
export function connectVueView<R>(viewWatch: ViewWatch<R>) {
  return <V>(select: (ref: R) => V): Readonly<Ref<V>> => {
    // A server render never disposes its scope, so a subscription made there
    // could outlive the request. It reads without making one.
    if (typeof window === 'undefined') {
      const serverRef = viewWatch();
      // A custom getter avoids caching a value read before server prefetch.
      return readonly(
        customRef<V>(() => ({
          get: () => select(serverRef),
          set: () => {},
        }))
      ) as Readonly<Ref<V>>;
    }
    const controller = new AbortController();
    let valueRef!: ShallowRef<V>;
    releaseWithScope(controller);
    viewWatch((ref, first) => {
      const value = select(ref);
      if (valueRef) valueRef.value = value;
      else valueRef = shallowRef(value) as ShallowRef<V>;
      if (first) return controller.signal;
      return undefined;
    });
    return readonly(valueRef) as Readonly<Ref<V>>;
  };
}

/**
 * Vue 3.
 *
 * Reads go through the subscribed state-ref reference, so state-ref collects
 * exactly the paths the component reads, and a store change triggers Vue
 * through `customRef`. A write to `.value` goes straight to the store and
 * reaches it synchronously. There is no copy of the value on the Vue side,
 * so nothing has to be copied back and no echo guard is needed (F-V1, and
 * the `CI-25`, `CI-26`, `CI-29` guard defects with it).
 */
export function connectVue<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    type J = Reactive<{ value: V }>;
    // See `connectVueView`: a server render reads without subscribing.
    if (typeof window === 'undefined') {
      const serverRef = refWatch();
      return {
        get value() {
          return shown(callback(serverRef).value);
        },
        set value(value: V) {
          callback(serverRef).value = value;
        },
      } as J;
    }
    const controller = new AbortController();
    let stateRef!: StateRefStore<V>;
    let notify = () => {};
    releaseWithScope(controller);

    refWatch(inner => {
      stateRef = callback(inner);
      notify();
      return controller.signal;
    });

    const bridge = customRef<V>((track, trigger) => {
      notify = trigger;
      return {
        get: () => {
          track();
          return shown(stateRef.value as V);
        },
        set: value => {
          // Once the scope is gone the selection writes nowhere, the same
          // contract the other connectors keep after unmount.
          if (controller.signal.aborted) return;
          stateRef.value = value;
        },
      };
    });

    // `reactive` unwraps the ref, so `x.value` reads and writes the bridge,
    // and the result stays a reactive source for Vue's own `watch`.
    return reactive({ value: bridge }) as unknown as J;
  };
}
