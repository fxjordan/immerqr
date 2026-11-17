<script lang="ts">
  type Name = 'check' | 'alert' | 'upload' | 'close' | 'download' | 'offline';
  let { name, size = 18 }: { name: Name; size?: number } = $props();
</script>

<svg
  class="icon"
  viewBox="0 0 18 18"
  width={size}
  height={size}
  aria-hidden="true"
  focusable="false"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if name === 'check'}
    <circle cx="9" cy="9" r="9" fill="currentColor" stroke="none" />
    <path class="knock" d="M5 9.2l2.6 2.6L13 6.4" stroke-width="2" />
  {:else if name === 'alert'}
    <circle cx="9" cy="9" r="9" fill="currentColor" stroke="none" />
    <path class="knock" d="M9 4.6v5.2M9 12.9v.1" stroke-width="2" />
  {:else if name === 'upload'}
    <path d="M9 12V3M5 6.5 9 2.5l4 4M3 12.5v2h12v-2" />
  {:else if name === 'download'}
    <path d="M9 2.5v9M5 8l4 4 4-4M3 14.5h12" />
  {:else if name === 'close'}
    <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
  {:else if name === 'offline'}
    <path d="M2.5 6.5a10 10 0 0 1 13 0M5 9.5a6 6 0 0 1 8 0M7.5 12.5a2 2 0 0 1 3 0M3 3l12 12" />
  {/if}
</svg>

<style>
  .icon {
    flex: none;
    display: block;
  }
  .knock {
    stroke: var(--icon-knock, var(--surface));
  }
</style>
