<script lang="ts">
  import { t } from '../../i18n';
  import { SOURCE_URL } from '../lib/links';
  import { hrefFor, navigate } from '../lib/router.svelte';
  import Promises from './Promises.svelte';

  let { promises = true }: { promises?: boolean } = $props();
</script>

<footer class="foot">
  {#if promises}
    <section class="card" aria-label={t('footer.promises')}>
      <Promises heading="h2" />
    </section>
  {/if}
  <nav aria-label={t('footer.nav')}>
    <ul>
      <li><a href={hrefFor('why')} onclick={navigate}>{t('footer.why')}</a></li>
      <li><a href={hrefFor('privacy')} onclick={navigate}>{t('footer.privacy')}</a></li>
      <li><a href={hrefFor('imprint')} onclick={navigate}>{t('footer.imprint')}</a></li>
      <li><a href={SOURCE_URL} rel="noopener noreferrer">{t('footer.source')}</a></li>
    </ul>
  </nav>
  <p class="note">ImmerQR · immerqr.de · {t('footer.line')}</p>
</footer>

<style>
  .foot {
    display: grid;
    gap: 18px;
    padding: 32px 0 40px;
  }
  .card :global(.promises) {
    border-radius: var(--r);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    font-size: 0.9rem;
  }
  a {
    display: inline-block;
    padding: 4px 0;
  }
</style>
