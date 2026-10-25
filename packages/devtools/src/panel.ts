import type { Devtools, DevtoolsRecord } from './types';
import type { Preview, Path } from 'state-ref/devtools';

export interface PanelOptions {
  readonly target?: HTMLElement;
  readonly layout?: 'floating' | 'inline';
}
const css = `
:host([data-layout=inline]){position:static;display:block;z-index:auto}:host([data-layout=inline]) .shell{width:100%;height:clamp(280px,45vh,440px)}
:host{all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483646;color-scheme:dark;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:#e2e8f0}
*{box-sizing:border-box}button,input,select{font:inherit;color:inherit}button,select{cursor:pointer}button{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:5px 9px}button:hover{background:#334155}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}button[aria-selected=true],button[aria-pressed=true]{border-color:#38bdf8;color:#7dd3fc} .shell{width:min(740px,calc(100vw - 32px));height:min(500px,calc(100vh - 32px));background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 16px 60px #0008;display:flex;flex-direction:column;overflow:hidden}header,.controls,nav{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #253247}header strong{font-size:14px;letter-spacing:-.5px}header .status{color:#4ade80;margin-right:auto;font-size:11px}.controls select{min-width:0;max-width:45%;background:#1e293b;border:1px solid #334155;padding:5px;border-radius:5px}.controls input{min-width:0;flex:1;background:#020617;border:1px solid #334155;padding:6px;border-radius:5px}nav{padding:6px 12px;overflow-x:auto;flex-shrink:0}nav button{flex-shrink:0;border-color:transparent;background:transparent}.content{overflow:auto;flex:1;padding:12px;min-height:0}.hint{color:#94a3b8;margin:8px 0}.line{display:flex;gap:12px;padding:5px 2px;border-bottom:1px solid #1e293b;overflow-wrap:anywhere}.path{color:#7dd3fc;min-width:35%;max-width:55%;word-break:break-all}.value{color:#e2e8f0;word-break:break-all}.record{display:block;text-align:left;width:100%;margin:4px 0;overflow-wrap:anywhere}.meta{color:#94a3b8;font-size:11px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#020617;padding:10px;border-radius:6px;max-height:180px;overflow:auto}footer{padding:6px 12px;color:#94a3b8;border-top:1px solid #253247;font-size:11px}.launcher{box-shadow:0 6px 24px #0006;background:#0f172a;color:#7dd3fc;padding:8px 13px}[hidden]{display:none!important}
`;
function cleanupHandle(slot: { current?: () => void }) {
  return () => slot.current?.();
}
function clipText(text: string, limit = 512) {
  return text.length > limit
    ? text.slice(0, limit) + '… [display truncated]'
    : text;
}
function pathText(path: Path) {
  return (
    '$' +
    path
      .map(key =>
        key.kind === 'key'
          ? `[${JSON.stringify(key.value)}]`
          : key.kind === 'symbol'
          ? `[Symbol(${key.description ?? ''})#${key.id}]`
          : '[…]'
      )
      .join('')
  );
}
function valueText(value: Preview): string {
  if (value.kind === 'scalar') return JSON.stringify(value.value);
  if (value.kind === 'special') return `${value.type}: ${value.display}`;
  if (value.kind === 'marker') return `[${value.reason}]`;
  return `${value.kind} (${value.entries.length}${
    value.truncated ? ', truncated' : ''
  })`;
}
function recordText(record: DevtoolsRecord): string {
  if (record.kind === 'store-event') {
    const event = record.event;
    if (event.type === 'write')
      return `${pathText(event.path)} ${valueText(event.before)} → ${valueText(
        event.after
      )}${event.batchId ? ` · batch ${event.batchId}` : ''}`;
    if (event.type === 'subscription-run')
      return `subscription #${event.id} ${
        event.initial ? 'initial' : 'update'
      } · ${event.cause.kind}`;
    if (event.type === 'subscription-changed')
      return `subscription #${event.subscription.id} dependencies`;
    if (event.type === 'subscription-ended')
      return `subscription #${event.id} ended`;
    return `gap: ${event.reason} (${event.dropped} omitted)`;
  }
  if (record.kind === 'sync-cache')
    return `cache ${record.event.type} · ${record.event.entry.queryKey}`;
  if (record.kind === 'sync-mutation')
    return `mutation #${record.event.entry.operationId} · ${record.event.entry.phase}`;
  if (record.kind === 'gap')
    return `gap: ${record.reason} · missing count unknown`;
  return record.kind;
}

/** Mount the optional browser UI; importing this entry is safe without a DOM. */
export function mountPanel(
  tools: Devtools,
  options: PanelOptions = {}
): () => void {
  const target =
    options.target ??
    (typeof document === 'undefined' ? undefined : document.body);
  if (
    !target?.ownerDocument?.defaultView ||
    !(target instanceof target.ownerDocument.defaultView.HTMLElement)
  )
    throw new TypeError(
      '@stateref/devtools/panel: mount requires a browser HTMLElement target.'
    );
  if (tools.getSnapshot().disposed)
    throw new Error('@stateref/devtools/panel: session is disposed.');
  const doc = target.ownerDocument;
  const win = doc.defaultView!;
  const previousFocus = doc.activeElement as HTMLElement | null;
  const host = doc.createElement('div');
  host.setAttribute('data-stateref-devtools', '');
  host.setAttribute('data-layout', options.layout ?? 'floating');
  const shadow = host.attachShadow({ mode: 'open' });
  const make = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text = '',
    className = ''
  ) => {
    const node = doc.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  };
  const style = make('style', css);
  const shell = make('section', '', 'shell');
  shell.setAttribute('aria-label', 'state-ref DevTools');
  const launcher = make('button', 'state-ref DevTools', 'launcher');
  launcher.hidden = true;
  launcher.setAttribute('aria-expanded', 'false');
  const header = make('header');
  header.append(make('strong', 'state-ref'));
  const status = make('span', 'Recording', 'status');
  const pause = make('button', 'Pause');
  const clear = make('button', 'Clear');
  const hide = make('button', 'Hide');
  header.append(status, pause, clear, hide);
  const controls = make('div', '', 'controls');
  const select = make('select');
  select.setAttribute('aria-label', 'Debug source');
  const search = make('input');
  search.type = 'search';
  search.placeholder = 'Search paths and events';
  search.setAttribute('aria-label', 'Search paths and events');
  controls.append(select, search);
  const nav = make('nav');
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Inspector views');
  const tabs = ['State', 'Timeline', 'Subscriptions', 'Sync'] as const;
  let tab: (typeof tabs)[number] = 'State';
  const buttons = tabs.map(label => {
    const button = make('button', label);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'inspector-content');
    button.id = `tab-${label}`;
    nav.append(button);
    return button;
  });
  const content = make('div', '', 'content');
  content.id = 'inspector-content';
  content.setAttribute('role', 'tabpanel');
  content.tabIndex = -1;
  const footer = make('footer');
  shell.append(header, controls, nav, content, footer);
  shadow.append(style, launcher, shell);
  target.append(host);
  let closed = false;
  let collapsed = false;
  let pending = 0;
  let sourceId: number | undefined;
  let sourceKey = '';
  let selectedRecord: number | undefined;
  const cleanupSlot: { current?: () => void } = {};
  const listen = new win.AbortController();
  const on = (node: EventTarget, type: string, handler: EventListener) =>
    node.addEventListener(type, handler, { signal: listen.signal });
  // Keep inspector controls out of the host application's bubble handlers.
  for (const event of ['click', 'input', 'change', 'keydown', 'keyup']) {
    on(host, event, event => event.stopPropagation());
  }
  const unmount = () => {
    if (closed) return;
    closed = true;
    cleanupSlot.current = undefined;
    if (pending) win.cancelAnimationFrame(pending);
    stop();
    listen.abort();
    const focused = doc.activeElement === host;
    host.remove();
    if (focused && previousFocus?.isConnected) previousFocus.focus();
  };
  cleanupSlot.current = unmount;
  const schedule = () => {
    if (!closed && !pending)
      pending = win.requestAnimationFrame(() => {
        pending = 0;
        render();
      });
  };
  const stop = tools.subscribe(() => {
    if (tools.getSnapshot().disposed) unmount();
    else if (!collapsed) schedule();
  });
  const collapse = (value: boolean) => {
    if (value && pending) {
      win.cancelAnimationFrame(pending);
      pending = 0;
    }
    collapsed = value;
    shell.hidden = value;
    launcher.hidden = !value;
    launcher.setAttribute('aria-expanded', String(!value));
    if (value) launcher.focus();
    else {
      render();
      buttons[tabs.indexOf(tab)].focus();
    }
  };
  on(launcher, 'click', () => collapse(false));
  on(hide, 'click', () => collapse(true));
  on(host, 'keydown', event => {
    if ((event as KeyboardEvent).key === 'Escape') {
      collapse(true);
      event.preventDefault();
    }
  });
  on(pause, 'click', () => {
    if (tools.getSnapshot().paused) tools.resume();
    else tools.pause();
    schedule();
  });
  on(clear, 'click', () => {
    tools.clear();
    selectedRecord = undefined;
    schedule();
  });
  on(search, 'input', () => {
    selectedRecord = undefined;
    schedule();
  });
  on(select, 'change', () => {
    sourceId = Number(select.value);
    selectedRecord = undefined;
    schedule();
  });
  buttons.forEach((button, index) => {
    on(button, 'click', () => {
      tab = tabs[index];
      selectedRecord = undefined;
      schedule();
    });
    on(button, 'keydown', event => {
      const key = (event as KeyboardEvent).key;
      let next = index;
      if (key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (key === 'ArrowLeft')
        next = (index + tabs.length - 1) % tabs.length;
      else if (key === 'Home') next = 0;
      else if (key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tab = tabs[next];
      buttons[next].focus();
      schedule();
    });
  });
  function render() {
    if (closed || collapsed) return;
    const snapshot = tools.getSnapshot();
    if (snapshot.disposed) {
      unmount();
      return;
    }
    status.textContent = snapshot.paused
      ? 'Paused · history has a gap'
      : 'Recording';
    status.style.color = snapshot.paused ? '#fbbf24' : '#4ade80';
    pause.textContent = snapshot.paused ? 'Resume' : 'Pause';
    const key = snapshot.sources
      .map(source => `${source.id}:${source.name}`)
      .join('|');
    if (key !== sourceKey) {
      sourceKey = key;
      select.replaceChildren(
        ...snapshot.sources.map(source => {
          const option = make(
            'option',
            `${source.name} · ${source.kind} #${source.id}`
          );
          option.value = String(source.id);
          return option;
        })
      );
    }
    if (!snapshot.sources.some(source => source.id === sourceId))
      sourceId = snapshot.sources[0]?.id;
    select.value = String(sourceId ?? '');
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(tabs[i] === tab));
      button.tabIndex = tabs[i] === tab ? 0 : -1;
    });
    content.setAttribute('aria-labelledby', `tab-${tab}`);
    const focusedRow = shadow.activeElement?.getAttribute('data-focus');
    content.replaceChildren();
    const query = search.value.toLowerCase();
    let shown = 0;
    const hint = (text: string) => content.append(make('p', text, 'hint'));
    const line = (label: string, value: string) => {
      if (
        shown >= 100 ||
        (query && !`${label} ${value}`.toLowerCase().includes(query))
      )
        return;
      const row = make('div', '', 'line');
      row.append(
        make('span', clipText(label), 'path'),
        make('span', clipText(value), 'value')
      );
      content.append(row);
      shown++;
    };
    const source = snapshot.sources.find(source => source.id === sourceId);
    if (!source) hint('Attach a store or Sync client to begin inspecting.');
    else if (tab === 'Timeline') {
      const records = snapshot.history
        .filter(
          record =>
            record.sourceId === sourceId &&
            (!query ||
              `${record.sourceName} ${recordText(record)}`
                .toLowerCase()
                .includes(query))
        )
        .slice(-100)
        .reverse();
      for (const record of records) {
        const button = make('button', clipText(recordText(record)), 'record');
        button.dataset.focus = String(record.sequence);
        button.setAttribute(
          'aria-pressed',
          String(record.sequence === selectedRecord)
        );
        button.append(
          make(
            'div',
            `#${record.sequence} · generation ${record.generation} · ${new Date(
              record.timestamp
            ).toLocaleTimeString()}`,
            'meta'
          )
        );
        // This row and its listener share the same short-lived DOM lifetime.
        button.onclick = () => {
          selectedRecord = record.sequence;
          schedule();
        };
        content.append(button);
        shown++;
      }
      if (selectedRecord !== undefined) {
        const record = snapshot.history.find(
          record => record.sequence === selectedRecord
        );
        content.append(
          make(
            'pre',
            record
              ? clipText(JSON.stringify(record, null, 2), 8192)
              : 'Record no longer retained.'
          )
        );
      }
    } else {
      try {
        if (tab === 'Sync') {
          if (source.kind !== 'sync')
            hint('Choose a Sync client to inspect cache and operations.');
          else {
            const view = tools.inspectSync(source.id);
            for (const entry of view.cache)
              line(
                entry.queryKey,
                `${entry.kind} · ${entry.status.status}/${entry.status.fetchStatus} · owners ${entry.owners} · dirty ${entry.status.dirty} · conflicts ${entry.status.conflicts} · unconfirmed ${entry.status.unconfirmed}`
              );
            for (const entry of view.mutations)
              line(
                `mutation #${entry.operationId}`,
                `${entry.phase} · attempt ${
                  entry.attempt
                } · ${entry.linkedKeys.join(', ')}`
              );
            hint(
              'Metadata only. Query data, mutation input and error objects are not exposed.'
            );
            if (view.truncated) hint('Some metadata rows were omitted.');
          }
        } else if (source.kind !== 'store')
          hint('Choose a core store for state and subscriptions.');
        else if (tab === 'Subscriptions') {
          const view = tools.inspectStore(source.id);
          for (const subscription of view.subscriptions)
            line(
              `subscription #${subscription.id}`,
              `${
                subscription.observedRuns
              } observed calls · ${subscription.paths.map(pathText).join(', ')}`
            );
          hint(
            `Generation ${
              view.generation ?? 'temporary paused inspection'
            } · observed calls are not component renders.`
          );
          if (view.subscriptionsTruncated)
            hint('Some subscriptions were omitted.');
        } else {
          const view = tools.inspectStore(source.id);
          const walk = (value: Preview, path: string) => {
            if (shown >= 100) return;
            line(path, valueText(value));
            if (value.kind === 'object' || value.kind === 'array')
              for (const entry of value.entries) {
                walk(entry.value, path + pathText([entry.key]).slice(1));
                if (shown >= 100) break;
              }
          };
          walk(view.value, '$');
        }
      } catch {
        hint('This source is no longer available.');
      }
    }
    if (!shown && source && !content.childElementCount)
      hint('No matching records.');
    footer.textContent = `${
      snapshot.history.length
    } retained · ${snapshot.historyBytes.toLocaleString()} bytes · ${
      snapshot.evicted
    } evicted · ${snapshot.oversized} oversized${
      source?.lastGap ? ` · gap: ${source.lastGap}` : ''
    } · up to 100 matching rows`;
    if (focusedRow)
      (
        content.querySelector(
          `[data-focus="${focusedRow}"]`
        ) as HTMLElement | null
      )?.focus({ preventScroll: true });
  }
  render();
  return cleanupHandle(cleanupSlot);
}
