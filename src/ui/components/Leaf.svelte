<script lang="ts">
  /** The leaf glyph from the brand board; `vein` adds the light centre line. */
  let {
    vein = false,
    size = 14,
    outline = false,
  }: { vein?: boolean; size?: number; outline?: boolean } = $props();
</script>

<svg
  class="leaf"
  class:outline
  viewBox="0 0 12 12"
  width={size}
  height={size}
  aria-hidden="true"
  focusable="false"
>
  <path d="M6 0h5.4a.6.6 0 0 1 .6.6V6a6 6 0 0 1-6 6H.6a.6.6 0 0 1-.6-.6V6a6 6 0 0 1 6-6z" />
  {#if vein}
    <path class="vein" fill="none" stroke-width=".9" stroke-linecap="round" d="M2.4 9.6 8.6 3.4" />
  {/if}
</svg>

<style>
  .leaf {
    flex: none;
    display: block;
    fill: currentColor;
  }
  .leaf.outline {
    fill: transparent;
    stroke: currentColor;
    stroke-width: 0.7;
    stroke-dasharray: 1.4 1.2;
  }
  .vein {
    stroke: var(--vein);
  }
</style>
