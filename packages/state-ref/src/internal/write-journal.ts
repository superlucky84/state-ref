import type { RefWrite } from '@/types';

export type JournalEntry = Readonly<{ version: number; write: RefWrite }>;
export type WriteOrigin =
  | 'user'
  | 'source-refresh'
  | 'accepted-server-result'
  | 'rollback';

/**
 * A store-specific observer guard. A write attempted from its own observer is
 * rejected before the nested setter publishes and overwrites the outer tree.
 */
export function guardWriteObserver(observer: (write: RefWrite) => void) {
  let active = false;

  return (write: RefWrite) => {
    if (active) {
      throw new Error('A write observer cannot write to its own store.');
    }

    active = true;
    try {
      observer(write);
    } finally {
      active = false;
    }
  };
}

/**
 * An opt-in edit log for one owner. Internal baseline acceptance and recovery
 * still advance the version but do not become user changes. The observer only
 * mutates its private array after all validation; it never calls user code.
 */
export function createWriteJournal() {
  const entries: JournalEntry[] = [];
  let version = 0;
  let origin: WriteOrigin = 'user';
  let lastOrigin: WriteOrigin = 'user';

  const onWrite = guardWriteObserver(write => {
    const next = version + 1;
    if (origin === 'user') entries.push({ version: next, write });
    lastOrigin = origin;
    version = next;
  });

  /** Wrap the synchronous ref setter, not an async request or Promise chain. */
  const runAs = <T>(
    nextOrigin: Exclude<WriteOrigin, 'user'>,
    action: () => T
  ): T => {
    const previous = origin;
    origin = nextOrigin;
    try {
      return action();
    } finally {
      origin = previous;
    }
  };

  return {
    onWrite,
    runAs,
    version: () => version,
    lastOrigin: () => lastOrigin,
    entries: () => entries.slice(),
  };
}
