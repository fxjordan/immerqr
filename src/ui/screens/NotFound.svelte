<script lang="ts">
  import { t } from '../../i18n';
  import Leaf from '../components/Leaf.svelte';
  import { hrefFor, navigate } from '../lib/router.svelte';
</script>

<section class="lost">
  <div class="leaves" aria-hidden="true">
    <span class="fallen"><Leaf size={44} outline /></span>
    <Leaf size={56} vein />
  </div>
  <h1>{t('notFound.title')}</h1>
  <p>{t('notFound.text')}</p>
  <a class="btn primary" href={hrefFor('home')} onclick={navigate}>{t('notFound.home')}</a>
</section>

<style>
  .lost {
    display: grid;
    gap: 16px;
    justify-items: start;
    padding: 24px 0 48px;
    max-width: 640px;
  }
  .leaves {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    color: var(--link);
  }
  .fallen {
    color: var(--wilt-4);
    transform: rotate(-35deg) translateY(6px);
  }
  p {
    color: var(--muted);
    font-size: 1.02rem;
  }
</style>
