<script lang="ts">
  import { t, type MessageKey } from '../../i18n';
  import Leaf from '../components/Leaf.svelte';
  import Promises from '../components/Promises.svelte';
  import { hrefFor, navigate } from '../lib/router.svelte';

  const steps = [1, 2, 3, 4] as const;
  const key = (lane: 'them' | 'us', i: number, part: 'when' | 'what') =>
    `why.${lane}.${i}.${part}` as MessageKey;
</script>

<article class="why">
  <header class="head">
    <h1>{t('why.title')}</h1>
    <p class="lede">{t('why.lede')}</p>
  </header>

  <section aria-labelledby="why-timeline" class="life">
    <h2 id="why-timeline" class="visually-hidden">{t('why.timeline')}</h2>
    <div class="lane card them">
      <div class="who">
        <h3>{t('why.them.title')}</h3>
        <span class="note">{t('why.them.note')}</span>
      </div>
      <ol class="steps">
        {#each steps as i (i)}
          <li class="step wilt-{i}">
            <Leaf size={30} outline={i === 4} />
            <b>{t(key('them', i, 'when'))}</b>
            <span>{t(key('them', i, 'what'))}</span>
          </li>
        {/each}
      </ol>
    </div>
    <div class="lane card">
      <div class="who">
        <h3>{t('why.us.title')}</h3>
        <span class="note">{t('why.us.note')}</span>
      </div>
      <ol class="steps us">
        {#each steps as i (i)}
          <li class="step">
            <Leaf size={30} vein />
            <b>{t(key('us', i, 'when'))}</b>
            <span>{t(key('us', i, 'what'))}</span>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section aria-labelledby="why-promises" class="block">
    <h2 id="why-promises">{t('why.promises')}</h2>
    <div class="card"><Promises /></div>
  </section>

  <section aria-labelledby="why-static" class="block">
    <h2 id="why-static">{t('why.static.title')}</h2>
    <p>{t('why.static.p1')}</p>
    <p>{t('why.static.p2')}</p>
    <p>{t('why.static.p3')}</p>
  </section>

  <p><a class="btn primary" href={hrefFor('home')} onclick={navigate}>{t('why.cta')}</a></p>
</article>

<style>
  .why {
    display: grid;
    gap: 48px;
    padding-bottom: 24px;
  }
  .head {
    display: grid;
    gap: 12px;
  }
  .lede {
    color: var(--muted);
    font-size: 1.05rem;
  }
  .life {
    display: grid;
    gap: 12px;
  }
  .lane {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 16px;
    align-items: center;
    padding: 18px 20px;
  }
  .lane.them {
    background: transparent;
    border-style: dashed;
  }
  .who {
    display: grid;
    gap: 2px;
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .step {
    display: grid;
    gap: 6px;
    justify-items: start;
    font-size: 0.84rem;
    align-content: start;
  }
  .step b {
    font: 600 0.72rem/1 var(--f-mono);
    letter-spacing: 0.04em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .step span {
    line-height: 1.35;
  }
  .them .step span {
    color: var(--muted);
  }
  .wilt-1 :global(.leaf) {
    color: var(--wilt-1);
  }
  .wilt-2 :global(.leaf) {
    color: var(--wilt-2);
  }
  .wilt-3 :global(.leaf) {
    color: var(--wilt-3);
  }
  .wilt-4 :global(.leaf) {
    color: var(--wilt-4);
  }
  .us :global(.leaf) {
    color: var(--link);
  }
  .block {
    display: grid;
    gap: 14px;
  }
  @media (max-width: 820px) {
    .lane {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 460px) {
    .steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 16px;
    }
  }
</style>
