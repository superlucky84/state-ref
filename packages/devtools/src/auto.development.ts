import type { Watch } from 'state-ref';
import type { InspectableSyncClient } from './sync';
import type { Devtools } from './types';
import type { PanelOptions } from './panel';
import { isButtonPosition } from './button-position';
import type {
  AutoOptions,
  AutoStoreOptions,
  AutoTarget,
  DevtoolsHotContext,
} from './auto-types';
import { createDevtools } from './index';
export type {
  AutoOptions,
  AutoStoreOptions,
  AutoTarget,
  DevtoolsHotContext,
} from './auto-types';

const SLOT = Symbol.for('@stateref/devtools/auto/v1');
const PERSISTENT = Symbol('persistent registration');
type Lease = { stop?: () => void };
type Owner = DevtoolsHotContext | typeof PERSISTENT;
type Entry = {
  target?: AutoTarget;
  detach?: () => void;
  name?: string;
  redact: readonly (readonly (string | symbol)[])[];
  leases: Map<Owner, Lease>;
};
type Settings = AutoStoreOptions & {
  redact: readonly (readonly (string | symbol)[])[];
  maskProvided: boolean;
};
interface Service {
  readonly protocol: 1;
  register(target: AutoTarget, options: Settings): void;
  stop(target?: AutoTarget): void;
}
type Host = Document & { [SLOT]?: Service };

// A retained HMR callback closes only over a revocable slot, not the target.
function hotCallback(lease: Lease) {
  return () => lease.stop?.();
}

function settings(options: AutoStoreOptions): Settings {
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    (options.enabled !== undefined && typeof options.enabled !== 'boolean') ||
    (options.name !== undefined &&
      (typeof options.name !== 'string' ||
        !options.name.trim() ||
        options.name.length > 200)) ||
    (options.hot !== undefined &&
      (!options.hot || typeof options.hot.dispose !== 'function'))
  )
    throw new TypeError('@stateref/devtools/auto: invalid options.');
  const redact = options.redact ?? [];
  if (
    !Array.isArray(redact) ||
    redact.length > 1000 ||
    redact.some(
      path =>
        !Array.isArray(path) ||
        path.length > 64 ||
        path.some(key => typeof key !== 'string' && typeof key !== 'symbol')
    )
  )
    throw new TypeError('@stateref/devtools/auto: invalid redact paths.');
  const panel = options.panel;
  if (
    panel !== undefined &&
    (!panel ||
      typeof panel !== 'object' ||
      (panel.layout !== undefined &&
        panel.layout !== 'floating' &&
        panel.layout !== 'inline') ||
      (panel.buttonPosition !== undefined &&
        !isButtonPosition(panel.buttonPosition)) ||
      (panel.target !== undefined &&
        (!panel.target.ownerDocument?.defaultView ||
          !(
            panel.target instanceof
            panel.target.ownerDocument.defaultView.HTMLElement
          ))))
  )
    throw new TypeError('@stateref/devtools/auto: invalid panel options.');
  return {
    name: options.name,
    hot: options.hot,
    panel: panel && {
      target: panel.target,
      layout: panel.layout,
      buttonPosition: panel.buttonPosition,
    },
    redact: redact.map(path => [...path]),
    maskProvided: options.redact !== undefined,
  };
}

function sameMask(a: Entry['redact'], b: Entry['redact']) {
  return (
    a.length === b.length &&
    a.every(
      (path, i) =>
        path.length === b[i].length && path.every((key, j) => key === b[i][j])
    )
  );
}

function createService(doc: Host): Service {
  const entries = new Map<AutoTarget, Entry>();
  let tools: Devtools | undefined;
  let panel: PanelOptions | undefined;
  let unmount: (() => void) | undefined;
  let cancelReady: (() => void) | undefined;
  let pending = false;
  let generation = 0;

  const finish = () => {
    if (entries.size) return;
    generation++;
    cancelReady?.();
    cancelReady = undefined;
    pending = false;
    unmount?.();
    unmount = undefined;
    tools?.dispose();
    tools = undefined;
    panel = undefined;
    if (doc[SLOT] === service) delete doc[SLOT];
  };
  const remove = (entry: Entry) => {
    const target = entry.target;
    entry.target = undefined;
    if (target && entries.get(target) === entry) entries.delete(target);
    for (const lease of entry.leases.values()) lease.stop = undefined;
    entry.leases.clear();
    const detach = entry.detach;
    entry.detach = undefined;
    detach?.();
    finish();
  };
  const addLease = (entry: Entry, hot?: DevtoolsHotContext) => {
    const owner = hot ?? PERSISTENT;
    if (entry.leases.has(owner)) return;
    const lease: Lease = {};
    entry.leases.set(owner, lease);
    lease.stop = () => {
      if (entry.leases.get(owner) !== lease) return;
      lease.stop = undefined;
      entry.leases.delete(owner);
      if (!entry.leases.size) remove(entry);
    };
    try {
      hot?.dispose(hotCallback(lease));
    } catch (error) {
      lease.stop?.();
      throw error;
    }
  };
  const show = () => {
    if (pending || unmount || !tools || !entries.size) return;
    pending = true;
    const current = generation;
    const start = async () => {
      cancelReady = undefined;
      try {
        const { mountPanel } = await import('./panel');
        if (current !== generation || !entries.size || !tools) return;
        unmount = mountPanel(tools, {
          ...panel,
          target: panel?.target ?? doc.body,
        });
      } catch {
        if (current === generation) {
          // Never report application values or a user-owned error payload.
          try {
            console.warn(
              '@stateref/devtools/auto: panel could not be mounted.'
            );
          } catch {
            /* Isolated diagnostic. */
          }
        }
      } finally {
        if (current === generation) pending = false;
      }
    };
    if (panel?.target || doc.body) void start();
    else {
      const ready = () => {
        void start();
      };
      doc.addEventListener('DOMContentLoaded', ready, { once: true });
      cancelReady = () => doc.removeEventListener('DOMContentLoaded', ready);
    }
  };
  const service: Service = Object.freeze({
    protocol: 1 as const,
    register(target: AutoTarget, options: Settings) {
      if (
        options.panel &&
        panel &&
        ((options.panel.target ?? doc.body) !== (panel.target ?? doc.body) ||
          (options.panel.layout ?? 'floating') !==
            (panel.layout ?? 'floating') ||
          (options.panel.buttonPosition ?? 'bottom-right') !==
            (panel.buttonPosition ?? 'bottom-right'))
      )
        throw new Error(
          '@stateref/devtools/auto: panel already configured; stop auto tools before changing it.'
        );
      const existing = entries.get(target);
      if (existing) {
        if (
          (options.name !== undefined && options.name !== existing.name) ||
          (options.maskProvided && !sameMask(existing.redact, options.redact))
        )
          throw new Error(
            '@stateref/devtools/auto: target already registered with different options; stop it before reconfiguring.'
          );
        addLease(existing, options.hot);
        show();
        return;
      }
      const session = (tools ??= createDevtools());
      let detach: (() => void) | undefined;
      try {
        detach =
          typeof target === 'function'
            ? session.attachStore(target, {
                name: options.name,
                redact: options.redact,
              })
            : session.attachSync(target, { name: options.name });
      } catch (error) {
        finish();
        throw error;
      }
      panel ??= options.panel ?? {};
      const entry: Entry = {
        target,
        detach,
        name: options.name,
        redact: options.redact,
        leases: new Map(),
      };
      entries.set(target, entry);
      addLease(entry, options.hot);
      show();
    },
    stop(target?: AutoTarget) {
      if (target !== undefined) {
        const entry = entries.get(target);
        if (entry) remove(entry);
      } else {
        for (const entry of entries.values()) remove(entry);
        finish();
      }
    },
  });
  return service;
}

function service(doc: Host) {
  const previous = doc[SLOT];
  if (previous) {
    if (
      previous.protocol !== 1 ||
      typeof previous.register !== 'function' ||
      typeof previous.stop !== 'function'
    )
      throw new Error('@stateref/devtools/auto: incompatible auto manager.');
    return previous;
  }
  const next = createService(doc);
  Object.defineProperty(doc, SLOT, { value: next, configurable: true });
  return next;
}

/** Register once in a browser development build; preserve the exact target. */
export function devtools<T extends Watch<any>>(
  target: T,
  options?: AutoStoreOptions
): T;
export function devtools<T extends InspectableSyncClient>(
  target: T,
  options?: AutoOptions
): T;
export function devtools(target: AutoTarget, options: AutoStoreOptions = {}) {
  if (
    typeof document === 'undefined' ||
    !document.defaultView ||
    options?.enabled === false
  )
    return target;
  const config = settings(options);
  if (typeof target !== 'function' && config.redact.length)
    throw new TypeError(
      '@stateref/devtools/auto: redact applies to root stores, not Sync metadata.'
    );
  service(document).register(target, config);
  return target;
}

export function stopDevtools(target?: AutoTarget): void {
  if (typeof document !== 'undefined') (document as Host)[SLOT]?.stop(target);
}

const hot = (import.meta as ImportMeta & { hot?: DevtoolsHotContext }).hot;
hot?.dispose(() => stopDevtools());
