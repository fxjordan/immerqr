<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let { tone, children }: { tone: 'ok' | 'warn' | 'neutral'; children: Snippet } = $props();
</script>

<div class="status {tone}">
  {#if tone === 'ok'}
    <Icon name="check" />
  {:else if tone === 'warn'}
    <Icon name="alert" />
  {/if}
  <div class="body">{@render children()}</div>
</div>

<style>
  .status {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border-radius: var(--r-sm);
    padding: 12px 14px;
    font-size: 0.9rem;
    line-height: 1.45;
  }
  .status :global(.icon) {
    margin-top: 1px;
  }
  .ok {
    background: var(--ok-bg);
    color: var(--ok-fg);
    --icon-knock: var(--ok-bg);
  }
  .warn {
    background: var(--warn-bg);
    color: var(--warn);
    --icon-knock: var(--warn-bg);
  }
  .neutral {
    background: var(--surface);
    border: 1px dashed var(--line);
    color: var(--muted);
  }
  .body {
    min-width: 0;
  }
</style>
