/**
 * The server-rendered demos this harness opens, and where it reaches them.
 *
 * Only React and Vue: they are the two demos that have an SSR entry at all.
 * Preact, Svelte and Solid would need a server render written first, which is
 * three new demos rather than a runner, so this spec says nothing about them
 * and the checklist records that.
 *
 * The ports are not the demos' own dev ports (5191/5192) for the same reason
 * the five built demos avoid theirs: a `dev:ssr` left running from a manual
 * session would otherwise be served to the harness instead of the one it
 * started.
 */
export type SsrDemo = Readonly<{
  name: string;
  /** The workspace package `pnpm --filter` selects. */
  pkg: string;
  port: number;
}>;

export const SSR_DEMOS: readonly SsrDemo[] = [
  { name: 'react-ssr', pkg: 'stateref-example-react', port: 4191 },
  { name: 'vue-ssr', pkg: 'stateref-example-vue', port: 4192 },
];

export const ssrUrlOf = (demo: SsrDemo) => `http://localhost:${demo.port}/`;

/**
 * The rows both server-rendered pages carry.
 *
 * These pages exist in one copy each and are not compared against five
 * screens, so they keep their own `data-testid` contract rather than the
 * `fields.ts` one (the same split DC8-8-21 made for the bundle pages).
 */
export const SSR_ROWS = ['city', 'zip', 'derived', 'combined'] as const;
export type SsrRow = (typeof SSR_ROWS)[number];
