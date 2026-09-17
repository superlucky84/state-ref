import type {
  Copyable,
  Watch,
  StateRefStore,
  Renew,
  StateRefsTuple,
  CombinedValue,
} from '@/types';
import type { Lens } from '@/lens';
import { lens } from '@/lens';

/**
 * Defaults for `watch(renew, userOption)`.
 *
 * Resolution order is DEFAULT_WATCH_OPTION < store mode < userOption, so
 * `editable` follows the store's `autoSync` flag unless the caller states it
 * explicitly. `editable: true` here is only the fallback for a store that
 * never declares a mode.
 */
export const DEFAULT_WATCH_OPTION = { cache: true, editable: true };
export const DEFAULT_CREATE_OPTION = { autoSync: true, trackDeps: false };

/**
 * Debug handles on a stateRef, readable as `ref.a.b[NAVI]` / `ref.a.b[TYPE]`.
 *
 * They are symbols rather than the string keys they replaced ("_navi", "_type",
 * "_value"): a string key would shadow state that happens to own a property of
 * the same name, and it would surface in `ownKeys`. Registered symbols
 * (`Symbol.for`) so the same handles resolve across bundle boundaries -
 * `Symbol.for('state-ref.navi')` works without importing anything.
 */
export const NAVI = Symbol.for('state-ref.navi');
export const TYPE = Symbol.for('state-ref.type');

/**
 * Node's util.inspect reads a proxy's target directly instead of running its
 * traps, so an empty target would print as "{}". This hook gives console.log
 * something to show. Browsers ignore it and render via the traps instead.
 */
export const NODE_INSPECT = Symbol.for('nodejs.util.inspect.custom');

export function getType(value: unknown) {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object') {
    return 'object';
  } else {
    return typeof value;
  }
}

/**
 * We provide a convenience utility to make it easy to create data when "copyOnWrite" is required.
 */
export function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T> {
  let lensIns = lensInit || lens<T>();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T | 'writeCopy') {
      if (prop === 'writeCopy') {
        return <V>(value: V) => {
          return lensIns.set(value)(target as unknown as T);
        };
      }

      return copyable(origObj, lensIns.chain(prop as keyof T));
    },
    set() {
      throw new Error(
        'Property modification is not supported on a copyable object. Use "writeCopy" for state updates.'
      );
    },
  });
}

/**
 * Provides a convenience utility to make deep copying easier in special cases.
 */
export function cloneDeep<T>(value: T): T {
  if (value == null) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const isArray = Array.isArray(value);
  const Ctor = isArray ? Array : Object;

  const result = new Ctor() as T; // 새로운 객체 또는 배열 생성

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = cloneDeep(value[key]); // 재귀적으로 깊은 복사
    }
  }

  return result;
}
/**
 * Combines multiple state watchers to produce a derived (computed) value,
 * and invokes the provided callback whenever the computed value changes.
 */
/**
 * Wires a helper's own subscriptions to whatever teardown the user's callback
 * asked for.
 *
 * The core honours an `AbortSignal` only on a subscription's *first* run
 * (`firstRunner`); `runner` only understands `false`. A helper that fans one
 * user callback out over N stores cannot use that channel directly - its
 * callback has to run after all N subscriptions exist, otherwise the paths it
 * reads are collected against throwaway proxies and nothing ever wakes it. So
 * the first run of each inner subscription hands the core a controller of our
 * own, and the user's teardown is chained onto those controllers here.
 *
 * The channel mirrors a plain `watch` callback exactly, which is why `isFirst`
 * matters. The core registers an `AbortSignal` only on a first run
 * (`firstRunner`) and honours only `false` afterwards (`runner`), so that is
 * all a helper may honour either. Being stricter would kill callbacks that
 * survive a plain `watch`; being more permissive would mean two teardown rules
 * for the library to explain, which is the same reason `dispose()` was turned
 * down (DC-06).
 *
 * `false` from a later pass also removes that one inner subscription through
 * the core, which is harmless - `removeRun` is idempotent and the other N-1
 * come down with the controllers.
 */
function relayTeardown(
  result: boolean | AbortSignal | void,
  controllers: AbortController[],
  isFirst: boolean
) {
  const stop = () => controllers.forEach(controller => controller.abort());

  if (isFirst) {
    if (result instanceof AbortSignal) {
      if (result.aborted) {
        stop();
      } else {
        result.addEventListener('abort', stop, { once: true });
      }
    }
  } else if (result === false) {
    stop();
  }

  return result;
}

/**
 * Derives a read-only value from several watches.
 *
 * The callback re-runs whenever a source changes, but subscribers are told only
 * when the derived value actually moves - `max(a, b)` does not notify because
 * `a` changed below `b`. Comparison is `Object.is`; pass `equals` for a
 * computed that returns a fresh object each time.
 *
 * The subscriber may return `false` or an `AbortSignal` to unsubscribe, the
 * same as a plain `watch` callback.
 */
export function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (a: StateRefsTuple<W>) => R,
  option?: { equals?: (next: R, previous: R) => boolean }
) {
  const equals = option?.equals ?? Object.is;
  let result: R;
  const proxy: { value: R } = {
    get value(): R {
      return result;
    },
    set value(_setter) {
      console.warn('Can not setting');
    },
  };

  return (
    computedCallback?: (
      proxy: { value: R },
      isFirst: boolean
    ) => boolean | AbortSignal | void
  ) => {
    /**
     * Filled by each inner subscription's first run. The initial
     * `watch(() => false)` this used to do is gone: it created a subscription
     * per source that nothing ever released, and `false` is the core's signal
     * for "drop this subscription", so returning it from an initialiser was a
     * collision waiting to happen.
     */
    const refs = [] as unknown as StateRefsTuple<W>;
    const controllers = watches.map(() => new AbortController());

    watches.forEach((watch, index) => {
      watch((ref, isFirst) => {
        (refs as any)[index] = ref;

        /**
         * During setup the other refs are not in place yet, so the derived
         * value cannot be computed here - it is computed once below, after
         * every source is wired. The controller handed back is what makes the
         * user's teardown reachable (see relayTeardown).
         */
        if (isFirst) {
          return controllers[index].signal;
        }

        const next = callback(refs);

        if (equals(next, result)) {
          return;
        }

        result = next;

        return computedCallback
          ? relayTeardown(computedCallback(proxy, false), controllers, false)
          : undefined;
      });
    });

    /**
     * Reading through `refs` collects against each source's real subscription,
     * because a proxy carries the run it belongs to - it does not matter that
     * this happens outside a run.
     */
    result = callback(refs);

    if (computedCallback) {
      relayTeardown(computedCallback(proxy, true), controllers, true);
    }

    return proxy;
  };
}

/**
 * Observes multiple Watch instances together and triggers a callback
 * whenever any of them changes. The callback receives the current
 * StateRefStore values of all watches and a boolean indicating
 * whether this is the first invocation.
 */
export function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>> {
  type R = CombinedValue<W>;
  type RefsTuple = StateRefsTuple<W>;

  return (
    callback?: Renew<StateRefStore<R>>,
    userOption?: { cache?: boolean }
  ): StateRefStore<R> => {
    /**
     * Filled by each inner subscription's first run, below. Mapping the
     * watches here used to create an extra subscription per source whose only
     * job was to hand back a ref, and nothing released them.
     */
    const refs = [] as unknown as RefsTuple;
    const controllers = watches.map(() => new AbortController());

    const combinedStore: StateRefStore<R> = new Proxy({} as StateRefStore<R>, {
      get(_, prop) {
        if (prop === 'value') {
          console.warn(
            `You cannot directly access the nested 'value' of a store created by combineWatch.`
          );

          return refs.map(s => s.value) as R;
        }

        return Reflect.get(refs, prop);
      },
      set(_, prop) {
        if (prop === 'value') {
          console.warn(
            "You cannot directly assign to '.value' of a store created by combineWatch. Use an individual store instead (e.g., store[0].value)."
          );
        } else {
          console.warn(
            `You cannot directly assign to the property '${String(
              prop
            )}' of a store created by combineWatch.`
          );
        }
        return false;
      },
    });

    watches.forEach((watch, i) => {
      const index = i as keyof RefsTuple;
      watch((ref, isFirst) => {
        refs[index] = ref as RefsTuple[number];

        /**
         * The user callback cannot run here on a first pass: the other refs
         * are not wired yet, so the paths it reads would be collected against
         * proxies that are about to be replaced. It runs once below instead,
         * which is why teardown has to be relayed through a controller of ours
         * rather than returned to the core (see relayTeardown).
         */
        if (isFirst) {
          return controllers[i].signal;
        }

        return callback
          ? relayTeardown(callback(combinedStore, false), controllers, false)
          : undefined;
      }, userOption);
    });

    if (callback) {
      relayTeardown(callback(combinedStore, true), controllers, true);
    }

    return combinedStore;
  };
}
