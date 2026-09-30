import { createDemoModel } from 'stateref-example-shared';

/** One model per page load, shared by every component in the Svelte demo. */
export const model = createDemoModel();
