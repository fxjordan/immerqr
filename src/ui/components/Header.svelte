<script lang="ts">
  import { getLocale, setLocale, t, type Locale } from '../../i18n';
  import { getMode, setMode, type Mode } from '../lib/prefs.svelte';
  import { currentRoute, hrefFor, navigate } from '../lib/router.svelte';
  import Mark from './Mark.svelte';
  import Segmented from './Segmented.svelte';

  const onHome = $derived(currentRoute() === 'home');

  function chooseMode(mode: Mode): void {
    setMode(mode);
  }
</script>

<header class="bar">
  <a class="lockup" href={hrefFor('home')} onclick={navigate} aria-label={t('header.home')}>
    <Mark size={28} />
    <span class="wm" aria-hidden="true">Immer<b>QR</b></span>
  </a>
  <div class="switches">
    {#if onHome}
      <Segmented
        legend={t('header.mode')}
        name="mode"
        value={getMode()}
        onchange={chooseMode}
        options={[
          { value: 'simple', label: t('header.mode.simple') },
          { value: 'advanced', label: t('header.mode.advanced') },
        ]}
      />
    {/if}
    <Segmented
      legend={t('header.lang')}
      name="lang"
      value={getLocale()}
      onchange={(l: Locale) => setLocale(l)}
      options={[
        { value: 'de', label: 'DE', title: t('header.lang.de'), lang: 'de' },
        { value: 'en', label: 'EN', title: t('header.lang.en'), lang: 'en' },
      ]}
    />
  </div>
</header>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--line);
  }
  .lockup {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    border-radius: 6px;
  }
  .wm {
    font: 800 1.4rem/1 var(--f-display);
    letter-spacing: -0.045em;
    color: var(--wm-a);
  }
  .wm b {
    color: var(--wm-b);
    font-weight: 800;
  }
  .switches {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>
