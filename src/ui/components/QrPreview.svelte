<script lang="ts">
  /**
   * White card with the SVG core rendered. The three `.eye` cores unfurl the first time a
   * code appears and regrow briefly whenever it changes.
   */
  let {
    svg,
    label,
    sample = false,
    caption,
  }: { svg: string | null; label: string; sample?: boolean; caption?: string } = $props();

  let motion = $state<'still' | 'unfurl' | 'regrow'>('still');
  let seen = false;
  $effect.pre(() => {
    if (!svg || sample) {
      motion = 'still';
      return;
    }
    motion = seen ? 'regrow' : 'unfurl';
    seen = true;
  });
</script>

<figure class="code-card">
  <div class="qr" class:sample role="img" aria-label={label}>
    {#if svg}
      {#key svg}
        <div class="svg {motion}">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG built by core from escaped input -->
          {@html svg}
        </div>
      {/key}
    {/if}
  </div>
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>

<style>
  .code-card {
    margin: 0;
    background: var(--code-card);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 14px;
    display: grid;
    gap: 8px;
    box-shadow: 0 24px 48px -32px var(--shadow-code);
  }
  .qr {
    aspect-ratio: 1;
    /* Checkerboard shows through transparent codes. */
    background: repeating-conic-gradient(var(--code-checker) 0 25%, var(--code-card) 0 50%) 0 0 / 16px 16px;
    border-radius: 6px;
    overflow: hidden;
  }
  .qr.sample {
    opacity: 0.35;
    filter: grayscale(1);
  }
  .svg,
  .svg :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
  figcaption {
    font: 400 0.75rem/1.3 var(--f-mono);
    color: var(--code-card-text);
    padding: 0 4px;
    text-align: center;
  }
  @media (prefers-reduced-motion: no-preference) {
    .svg :global(.eye) {
      transform-box: fill-box;
      transform-origin: center;
    }
    .unfurl :global(.eye) {
      animation: unfurl 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .regrow :global(.eye) {
      animation: regrow 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .svg :global(.eye:nth-of-type(4)) {
      animation-delay: 0.12s;
    }
    .svg :global(.eye:nth-of-type(5)) {
      animation-delay: 0.24s;
    }
    .regrow :global(.eye:nth-of-type(4)) {
      animation-delay: 0.05s;
    }
    .regrow :global(.eye:nth-of-type(5)) {
      animation-delay: 0.1s;
    }
  }
  @keyframes unfurl {
    from {
      transform: scale(0.7) rotate(-18deg);
    }
    to {
      transform: none;
    }
  }
  @keyframes regrow {
    from {
      transform: scale(0.88) rotate(-6deg);
    }
    to {
      transform: none;
    }
  }
</style>
