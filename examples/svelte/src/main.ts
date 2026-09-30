import { mount } from 'svelte';
import App from './App.svelte';

/** Step 1 skeleton; the panels arrive with step 4 of PHASE8_5.md. */
// Svelte 5 mounts with a function; components are no longer classes.
mount(App, { target: document.getElementById('app') as HTMLElement });
