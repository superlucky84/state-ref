import { relative, resolve } from 'node:path';
import { GRAPH_FILE } from '../boundary.config.mjs';

/**
 * Record the resolved module graph rollup walked for one entry point.
 *
 * This is the evidence DC8-5-08 asks for. Each combination is built on its
 * own, so there is no shared-chunk attribution to argue about: what this
 * records is exactly what that entry point pulled in.
 *
 * The plugin only records. The assertions live in
 * `scripts/check-example-bundles.mjs`, so a boundary violation and a bug in
 * the recording stay distinguishable - a missing entry fails here, a
 * forbidden module fails there.
 */
export function recordModuleGraph({ name, entry, repoRoot }) {
  const entryId = resolve(entry);
  const toRepoPath = id =>
    id.startsWith('\0') ? id : relative(repoRoot, id).split('\\').join('/');

  return {
    name: 'record-module-graph',
    generateBundle() {
      if (!this.getModuleInfo(entryId)) {
        this.error(
          `record-module-graph: ${entryId} is not in the graph. The entry ` +
            'path in boundary.config.mjs no longer matches what vite built.'
        );
      }

      const seen = new Set();
      const stack = [entryId];
      while (stack.length > 0) {
        const id = stack.pop();
        if (seen.has(id)) {
          continue;
        }
        seen.add(id);
        const info = this.getModuleInfo(id);
        if (!info) {
          continue;
        }
        stack.push(...info.importedIds, ...info.dynamicallyImportedIds);
      }

      // Virtual modules (vite's preload helper) keep their `\0` ids; a real
      // file becomes a repo-relative posix path so the recorded graph reads
      // the same on any machine.
      const modules = [...seen].map(toRepoPath).sort();

      this.emitFile({
        type: 'asset',
        fileName: GRAPH_FILE,
        source: JSON.stringify(
          {
            combination: name,
            entry: toRepoPath(entryId),
            modules,
          },
          null,
          2
        ),
      });
    },
  };
}
