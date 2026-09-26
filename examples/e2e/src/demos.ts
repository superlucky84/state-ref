/**
 * The five demos this harness drives, and where it reaches them.
 *
 * One table, used by both `playwright.config.ts` (to start the servers) and
 * the specs (to visit them), so a port cannot be right in one place and wrong
 * in the other.
 *
 * The ports are deliberately NOT the demos' dev ports (5181~5186, 5191~5192):
 * a `vite dev` left running from a manual session would otherwise be served to
 * the harness instead of the built `dist` it means to test.
 */
export type Demo = Readonly<{
  /** How a failure names this demo. */
  name: string;
  /** The workspace package `pnpm --filter` selects. */
  pkg: string;
  port: number;
}>;

export const DEMOS: readonly Demo[] = [
  { name: 'react', pkg: 'stateref-example-react', port: 4181 },
  { name: 'preact', pkg: 'stateref-example-preact', port: 4182 },
  { name: 'vue', pkg: 'stateref-example-vue', port: 4183 },
  { name: 'svelte', pkg: 'stateref-example-svelte', port: 4184 },
  { name: 'solid', pkg: 'stateref-example-solid', port: 4185 },
];

export const urlOf = (demo: Demo) => `http://localhost:${demo.port}/`;
