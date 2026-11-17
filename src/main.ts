import { mount } from 'svelte';
import App from './ui/App.svelte';
import { offerUpdate } from './ui/lib/pwa.svelte';
import { applyUpdate, onPwaChange, startPwa } from './pwa';

const target = document.getElementById('app');
if (!target) throw new Error('#app missing');

export default mount(App, { target });

onPwaChange(({ updateReady }) => {
  if (updateReady) offerUpdate(() => void applyUpdate());
});
startPwa();
