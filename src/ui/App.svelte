<script lang="ts">
  const tagline = 'Codes, die nie verwelken.';
</script>

<main>
  <img src="/mark.svg" alt="" width="96" height="96" />
  <h1>ImmerQR – bald.</h1>
  <p>{tagline}</p>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #f4f8f3;
    color: #10201a;
    font-family: system-ui, sans-serif;
  }
  main {
    min-height: 100vh;
    display: grid;
    place-content: center;
    justify-items: center;
    text-align: center;
    padding: 16px;
  }
  @media (prefers-color-scheme: dark) {
    :global(body) {
      background: #0a1712;
      color: #e5efe8;
    }
  }
</style>
