<script lang="ts">
  /** Tiny previews for module and eye style options, drawn in currentColor. */
  let { kind }: { kind: 'dots' | 'square' | 'rounded' | 'leaf' | 'eye-square' | 'dot' } = $props();
</script>

<svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true" focusable="false">
  {#if kind === 'dots'}
    <circle cx="3" cy="3" r="2.3" /><circle cx="9" cy="3" r="2.3" /><circle cx="3" cy="9" r="2.3" />
  {:else if kind === 'square'}
    <path d="M0 0h5.5v5.5H0zM6.5 0H12v5.5H6.5zM0 6.5h5.5V12H0z" />
  {:else if kind === 'rounded'}
    <path d="M3 0h6a3 3 0 0 1 3 3v3H6v6H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" />
  {:else if kind === 'leaf'}
    <path d="M1 0h5a6 6 0 0 1 6 6v5a1 1 0 0 1-1 1H6a6 6 0 0 1-6-6V1a1 1 0 0 1 1-1z" />
  {:else if kind === 'eye-square'}
    <path d="M0 0h12v12H0z" />
  {:else}
    <rect width="12" height="12" rx="2.4" />
  {/if}
</svg>

<style>
  svg {
    fill: currentColor;
    flex: none;
  }
</style>
