<script lang="ts">
  import { t, type MessageKey } from '../../i18n';
  import Leaf from './Leaf.svelte';

  let { heading = 'h3' }: { heading?: 'h2' | 'h3' } = $props();

  const items: Array<{ title: MessageKey; text: MessageKey }> = [
    { title: 'promise.direct.title', text: 'promise.direct.text' },
    { title: 'promise.forever.title', text: 'promise.forever.text' },
    { title: 'promise.local.title', text: 'promise.local.text' },
  ];
</script>

<ul class="promises">
  {#each items as item (item.title)}
    <li>
      <svelte:element this={heading} class="title"><Leaf size={14} />{t(item.title)}</svelte:element>
      <p>{t(item.text)}</p>
    </li>
  {/each}
</ul>

<style>
  .promises {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  li {
    padding: 16px 20px;
    font-size: 0.86rem;
    color: var(--muted);
    border-right: 1px solid var(--line);
    display: grid;
    gap: 4px;
    align-content: start;
  }
  li:last-child {
    border-right: 0;
  }
  .title {
    color: var(--ink);
    font: 700 0.98rem/1.25 var(--f-display);
    letter-spacing: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .title :global(.leaf) {
    color: var(--moss);
  }
  @media (max-width: 720px) {
    .promises {
      grid-template-columns: 1fr;
    }
    li {
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    li:last-child {
      border-bottom: 0;
    }
  }
</style>
