export const MISSIONS = [
  { name: 'React', pkg: 'stateref-example-react', port: 4381 },
  { name: 'Preact', pkg: 'stateref-example-preact', port: 4382 },
  { name: 'Vue', pkg: 'stateref-example-vue', port: 4383 },
  { name: 'Svelte', pkg: 'stateref-example-svelte', port: 4384 },
  { name: 'Solid', pkg: 'stateref-example-solid', port: 4385 },
  { name: 'Lithent', pkg: 'stateref-example-lithent', port: 4386 },
  {
    name: 'Lithent concurrent',
    pkg: 'stateref-example-lithent',
    port: 4387,
    concurrent: true,
  },
  {
    name: 'React StrictMode dev',
    pkg: 'stateref-example-react',
    port: 4481,
    dev: true,
  },
] as const;
export const missionOrigin = (port: number) => `http://127.0.0.1:${port}`;
export const MISSION_SSR_PORT = 4491;
