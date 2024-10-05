//@ts-ignore
import App from '@/tests/svelte/App.svelte';

const app = new App({
  target: document.getElementById('app') as HTMLElement,
});

export default app;
