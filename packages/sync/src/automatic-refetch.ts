export type SyncEnvironmentEvent = 'focus' | 'reconnect';

export type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: SyncEnvironmentEvent) => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;

export type AutomaticRefetchPolicy = boolean | 'always';

export type AutomaticRefetchOptions = Readonly<{
  /** Refetch a stale started query on focus. Defaults to true. */
  refetchOnFocus?: AutomaticRefetchPolicy;
  /** Refetch a stale started query on reconnect. Defaults to true. */
  refetchOnReconnect?: AutomaticRefetchPolicy;
  /** Opt-in polling interval in milliseconds. */
  refetchInterval?: number | false;
  /** Allow polling while the environment is not focused. */
  refetchIntervalInBackground?: boolean;
}>;

type Observer = {
  readonly identity: object;
  readonly options: AutomaticRefetchOptions;
  readonly isStale: () => boolean;
  readonly run: (force: boolean) => Promise<unknown>;
  started: boolean;
  disposed: boolean;
};

type PollGroup = {
  readonly observers: Set<Observer>;
  readonly timer: ReturnType<typeof setInterval>;
};

export type AutomaticRefetchObserver = Readonly<{
  start: () => void;
  dispose: () => void;
}>;

function checkPolicy(value: unknown, name: string) {
  if (value === undefined || value === true || value === false) return;
  if (value === 'always') return;
  throw new TypeError(`${name} must be a boolean or 'always'.`);
}

export function checkAutomaticRefetchOptions(options: AutomaticRefetchOptions) {
  checkPolicy(options.refetchOnFocus, 'refetchOnFocus');
  checkPolicy(options.refetchOnReconnect, 'refetchOnReconnect');
  const interval = options.refetchInterval;
  if (
    interval !== undefined &&
    interval !== false &&
    (!Number.isFinite(interval) || interval <= 0)
  ) {
    throw new RangeError('refetchInterval must be a positive finite duration.');
  }
  if (
    options.refetchIntervalInBackground !== undefined &&
    typeof options.refetchIntervalInBackground !== 'boolean'
  ) {
    throw new TypeError('refetchIntervalInBackground must be a boolean.');
  }
}

export function createAutomaticRefetchManager(
  environment: SyncEnvironment | undefined,
  ssr: boolean
) {
  if (
    environment &&
    (typeof environment.subscribe !== 'function' ||
      typeof environment.isFocused !== 'function' ||
      typeof environment.isOnline !== 'function')
  ) {
    throw new TypeError(
      'environment must implement the SyncEnvironment contract.'
    );
  }

  const active = new Set<Observer>();
  const polling = new Map<number, PollGroup>();
  let unsubscribe: (() => void) | null = null;

  const canRun = (background: boolean) =>
    (environment?.isOnline() ?? true) &&
    (background || (environment?.isFocused() ?? true));

  const run = (observer: Observer, force: boolean) => {
    if (!active.has(observer)) return;
    void observer.run(force).catch(() => {
      // Query status owns automatic READ failures.
    });
  };

  const onEnvironment = (event: SyncEnvironmentEvent) => {
    if (!canRun(false)) return;
    const selected = new Map<object, { observer: Observer; force: boolean }>();
    active.forEach(observer => {
      const policy =
        event === 'focus'
          ? observer.options.refetchOnFocus ?? true
          : observer.options.refetchOnReconnect ?? true;
      if (policy === false) return;
      const force = policy === 'always';
      if (!force && !observer.isStale()) return;
      const current = selected.get(observer.identity);
      if (!current || (force && !current.force)) {
        selected.set(observer.identity, { observer, force });
      }
    });
    selected.forEach(({ observer, force }) => run(observer, force));
  };

  const poll = (group: PollGroup) => {
    const selected = new Map<object, Observer>();
    group.observers.forEach(observer => {
      if (
        canRun(observer.options.refetchIntervalInBackground ?? false) &&
        !selected.has(observer.identity)
      ) {
        selected.set(observer.identity, observer);
      }
    });
    selected.forEach(observer => run(observer, true));
  };

  const startPolling = (observer: Observer, interval: number) => {
    let group = polling.get(interval);
    if (!group) {
      const observers = new Set<Observer>();
      group = {
        observers,
        timer: setInterval(() => poll(group!), interval),
      };
      polling.set(interval, group);
    }
    group.observers.add(observer);
  };

  const stopPolling = (observer: Observer) => {
    const interval = observer.options.refetchInterval;
    if (interval === undefined || interval === false) return;
    const group = polling.get(interval);
    if (!group) return;
    group.observers.delete(observer);
    if (group.observers.size > 0) return;
    clearInterval(group.timer);
    polling.delete(interval);
  };

  const subscribe = () => {
    if (!environment || unsubscribe) return;
    const release = environment.subscribe(onEnvironment);
    if (typeof release !== 'function') {
      throw new TypeError(
        'environment.subscribe must return an unsubscribe function.'
      );
    }
    unsubscribe = release;
  };

  const stop = (observer: Observer) => {
    stopPolling(observer);
    active.delete(observer);
    if (active.size === 0 && unsubscribe) {
      const release = unsubscribe;
      unsubscribe = null;
      release();
    }
  };

  return Object.freeze({
    observe(
      identity: object,
      options: AutomaticRefetchOptions,
      isStale: () => boolean,
      automaticLoad: (force: boolean) => Promise<unknown>
    ): AutomaticRefetchObserver {
      const observer: Observer = {
        identity,
        options: Object.freeze({
          refetchOnFocus: options.refetchOnFocus,
          refetchOnReconnect: options.refetchOnReconnect,
          refetchInterval: options.refetchInterval,
          refetchIntervalInBackground: options.refetchIntervalInBackground,
        }),
        isStale,
        run: automaticLoad,
        started: false,
        disposed: false,
      };
      return Object.freeze({
        start: () => {
          if (observer.started || observer.disposed) return;
          observer.started = true;
          if (ssr) return;
          if (active.size === 0) {
            try {
              subscribe();
            } catch (error) {
              observer.started = false;
              throw error;
            }
          }
          active.add(observer);
          const interval = observer.options.refetchInterval;
          if (interval !== undefined && interval !== false) {
            startPolling(observer, interval);
          }
        },
        dispose: () => {
          if (observer.disposed) return;
          observer.disposed = true;
          stop(observer);
        },
      });
    },
  });
}
