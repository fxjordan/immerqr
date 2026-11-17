<script lang="ts">
  let { title, paragraphs }: { title: string; paragraphs: string[] } = $props();
</script>

<article class="legal">
  <h1>{title}</h1>
  {#each paragraphs as text, i (i)}
    <p class:placeholder={text.startsWith('[')}>{text}</p>
  {/each}
</article>

<style>
  .legal {
    display: grid;
    gap: 16px;
    max-width: 680px;
    padding-bottom: 32px;
  }
  .placeholder {
    border-left: 4px solid var(--shoot);
    background: var(--surface);
    padding: 12px 14px;
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
  }
</style>
