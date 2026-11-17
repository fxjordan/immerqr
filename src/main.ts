import { mount } from 'svelte';
import App from './ui/App.svelte';
import { startPwa } from './pwa';

const target = document.getElementById('app');
if (!target) throw new Error('#app missing');

export default mount(App, { target });

startPwa();
