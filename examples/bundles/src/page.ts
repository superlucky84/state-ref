/**
 * The little bit of DOM plumbing the four combination pages share.
 *
 * It imports nothing from state-ref, so it never moves the boundary these
 * pages exist to show: whatever a page's recorded module graph contains
 * beyond this file and vite's own helpers, the page asked for.
 */

const need = (id: string): HTMLElement => {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`page: #${id} is missing from the HTML.`);
  }
  return node;
};

export type Page = Readonly<{
  /** Add a button to the action row. */
  action: (label: string, run: () => void) => void;
  /** Declare a panel row and how to read its current value. */
  row: (label: string, read: () => string) => void;
  /** Repaint every declared row. */
  paint: () => void;
  /** Append a line to the page log and repaint. */
  log: (text: string) => void;
}>;

export function createPage(): Page {
  const actions = need('actions');
  const panel = need('panel');
  const logList = need('log');
  const rows: { value: HTMLElement; read: () => string }[] = [];

  const paint = () => {
    for (const row of rows) {
      let text: string;
      try {
        text = row.read();
      } catch (error) {
        // A throw is a result too - `query.ref` before `load()` is exactly
        // this, and a blank panel would hide it (DC8-5-16).
        text = `예외: ${String(error)}`;
      }
      row.value.textContent = text;
    }
  };

  return {
    action(label, run) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        try {
          run();
        } catch (error) {
          this.log(`예외: ${String(error)}`);
        }
        paint();
      });
      actions.append(button);
    },

    row(label, read) {
      const term = document.createElement('dt');
      term.textContent = label;
      const value = document.createElement('dd');
      panel.append(term, value);
      rows.push({ value, read });
    },

    paint,

    log(text) {
      const item = document.createElement('li');
      item.textContent = text;
      logList.prepend(item);
      paint();
    },
  };
}

/**
 * Count real network calls made by the page.
 *
 * M2-01 asks whether a core-only or draft-only page reaches the network. The
 * module graph answers that for the code that was bundled; this answers it
 * for the page that actually ran, and it is what a person reads on screen.
 * It counts attempts through `fetch` and `XMLHttpRequest`; it cannot see a
 * navigation or an `<img>` load, and nothing here makes either.
 */
export function installNetworkProbe(): () => number {
  let calls = 0;
  const realFetch = window.fetch;
  window.fetch = function countedFetch(...args: Parameters<typeof fetch>) {
    calls += 1;
    return realFetch.apply(window, args);
  };
  const realOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function countedOpen(
    this: XMLHttpRequest,
    ...args: Parameters<XMLHttpRequest['open']>
  ) {
    calls += 1;
    return realOpen.apply(this, args);
  } as XMLHttpRequest['open'];
  return () => calls;
}
