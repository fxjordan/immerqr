<script lang="ts">
  let { size = 28 }: { size?: number } = $props();
</script>

<svg class="mark" viewBox="0 0 28 28" width={size} height={size} aria-hidden="true" focusable="false">
  <path
    class="ring"
    fill-rule="evenodd"
    d="M0 3.5A3.5 3.5 0 0 1 3.5 0h21A3.5 3.5 0 0 1 28 3.5v21a3.5 3.5 0 0 1-3.5 3.5h-21A3.5 3.5 0 0 1 0 24.5zM4 4v20h20V4z"
  />
  <path class="leaf" d="M14 8h5a1 1 0 0 1 1 1v5a6 6 0 0 1-6 6H9a1 1 0 0 1-1-1v-5a6 6 0 0 1 6-6z" />
  <path class="vein" fill="none" stroke-width="1.1" stroke-linecap="round" d="M10.2 17.8 16.6 11.4" />
</svg>

<style>
  .mark {
    flex: none;
    display: block;
  }
  .ring {
    fill: var(--mark-ring);
  }
  .leaf {
    fill: var(--mark-leaf);
  }
  .vein {
    stroke: var(--mark-vein);
  }
</style>
