/** Optional integration surface for draft and sync packages. */
export { connectRef, observeRef } from '@/internal/ref-connection';
export type { RefConnection } from '@/internal/ref-connection';
export {
  createWriteJournal,
  guardWriteObserver,
} from '@/internal/write-journal';
export type { JournalEntry, WriteOrigin } from '@/internal/write-journal';
