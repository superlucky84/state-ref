/* @refresh reload */
import { render } from 'solid-js/web';

import App from '@/tests/solid/solidApp';

const root = document.getElementById('app');

render(() => App(), root!);
