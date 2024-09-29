/* @refresh reload */
import { render } from 'solid-js/web';

import App from '@/tests/solidApp';

const root = document.getElementById('app');

const element = document.createElement('div');
element.className = 'my-class';
element.textContent = 'Hello, world!';

document.getElementById('root')!.appendChild(element);

render(() => App(), root!);
