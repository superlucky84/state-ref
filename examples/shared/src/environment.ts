import type { SyncEnvironment, SyncEnvironmentEvent } from '@stateref/sync';

/**
 * A `SyncEnvironment` the demo drives by hand.
 *
 * `createSyncClient({ environment })` takes exactly three things - a
 * subscription, `isFocused()` and `isOnline()` - so focus, reconnect and
 * offline are fully controllable even though time is not. Automatic refetch
 * on focus/reconnect is therefore deterministic in the demos; `staleTime` and
 * `refetchInterval` still run on the real clock (DC8-5-12).
 */
export type ControlledEnvironment = SyncEnvironment &
  Readonly<{
    setFocused: (focused: boolean) => void;
    setOnline: (online: boolean) => void;
    /** Emit without changing state, to show an event with nothing stale. */
    emit: (event: SyncEnvironmentEvent) => void;
    /** Every event delivered so far, for the timeline panel. */
    readonly events: readonly SyncEnvironmentEvent[];
  }>;

export function createControlledEnvironment(
  initial: { focused?: boolean; online?: boolean } = {}
): ControlledEnvironment {
  const listeners = new Set<(event: SyncEnvironmentEvent) => void>();
  const log: SyncEnvironmentEvent[] = [];
  let focused = initial.focused ?? true;
  let online = initial.online ?? true;

  const emit = (event: SyncEnvironmentEvent) => {
    log.push(event);
    // Copy first: a listener that unsubscribes during delivery must not
    // disturb the iteration, which is the same rule sync's own observers use.
    for (const listener of [...listeners]) listener(event);
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isFocused: () => focused,
    isOnline: () => online,
    setFocused(next) {
      focused = next;
      if (next) emit('focus');
    },
    setOnline(next) {
      online = next;
      if (next) emit('reconnect');
    },
    emit,
    get events() {
      return log;
    },
  };
}
