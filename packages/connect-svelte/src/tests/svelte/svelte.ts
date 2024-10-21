import App from '@/tests/svelte/AppWithAction.svelte';

const app = new App({
  target: document.getElementById('app') as HTMLElement,
});

export default app;
