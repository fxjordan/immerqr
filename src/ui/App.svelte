<script lang="ts">
  import './fonts';
  import './tokens.css';
  import './styles/base.css';
  import { t, type MessageKey } from '../i18n';
  import Footer from './components/Footer.svelte';
  import Header from './components/Header.svelte';
  import PwaNotices from './components/PwaNotices.svelte';
  import { getMode } from './lib/prefs.svelte';
  import { currentRoute, type Route } from './lib/router.svelte';
  import AdvancedMode from './screens/AdvancedMode.svelte';
  import Imprint from './screens/Imprint.svelte';
  import NotFound from './screens/NotFound.svelte';
  import Privacy from './screens/Privacy.svelte';
  import SimpleMode from './screens/SimpleMode.svelte';
  import Why from './screens/Why.svelte';

  const TITLES: Record<Route, MessageKey> = {
    home: 'meta.title.home',
    why: 'meta.title.why',
    privacy: 'meta.title.privacy',
    imprint: 'meta.title.imprint',
    notFound: 'meta.title.notFound',
  };

  $effect(() => {
    document.title = t(TITLES[currentRoute()]);
  });
</script>

<a class="skip" href="#main">{t('nav.skip')}</a>
<div class="wrap">
  <Header />
  <main id="main" tabindex="-1">
    {#if currentRoute() === 'home'}
      {#if getMode() === 'advanced'}
        <AdvancedMode />
      {:else}
        <SimpleMode />
      {/if}
    {:else if currentRoute() === 'why'}
      <Why />
    {:else if currentRoute() === 'privacy'}
      <Privacy />
    {:else if currentRoute() === 'imprint'}
      <Imprint />
    {:else}
      <NotFound />
    {/if}
  </main>
  <Footer promises={currentRoute() !== 'why'} />
</div>
<PwaNotices />

<style>
  .wrap {
    max-width: 1080px;
    margin: 0 auto;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  main {
    padding-top: 36px;
    outline: none;
  }
  .skip {
    position: absolute;
    left: 16px;
    top: -60px;
    z-index: 10;
    background: var(--brand);
    color: var(--on-brand);
    padding: 10px 14px;
    border-radius: var(--r-sm);
    font-weight: 600;
  }
  .skip:focus {
    top: 12px;
  }
</style>
