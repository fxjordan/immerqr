<script lang="ts">
  /**
   * Live region under the form: shows the error for the current input, a prompt while empty,
   * or the result of decoding the rendered code next to its exact payload.
   */
  import { t } from '../../i18n';
  import { scanCheck, type GenerateResult } from '../lib/core';
  import StatusBox from './StatusBox.svelte';

  let {
    result,
    error,
    prompt,
  }: { result: GenerateResult | null; error: string | null; prompt: string | null } = $props();

  type Scan =
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'ok' }
    | { state: 'mismatch'; read: string }
    | { state: 'failed' };

  let scan = $state<Scan>({ state: 'idle' });
  let run = 0;

  $effect(() => {
    const current = result;
    const id = ++run;
    if (!current) {
      scan = { state: 'idle' };
      return;
    }
    scan = { state: 'checking' };
    const timer = setTimeout(async () => {
      let next: Scan;
      try {
        const r = await scanCheck(current.svg);
        next = !r.ok
          ? { state: 'failed' }
          : r.text === current.text
            ? { state: 'ok' }
            : { state: 'mismatch', read: r.text };
      } catch {
        next = { state: 'failed' };
      }
      if (id === run) scan = next;
    }, 200);
    return () => clearTimeout(timer);
  });
</script>

<div class="scan" role="status" aria-live="polite" aria-busy={scan.state === 'checking'}>
  {#if error}
    <StatusBox tone="warn">{error}</StatusBox>
  {:else if !result && prompt}
    <StatusBox tone="neutral">{prompt}</StatusBox>
  {:else if result}
    {#if scan.state === 'ok'}
      <StatusBox tone="ok">
        {t('scan.ok')}
        <span class="payload mono">{result.text}</span>
      </StatusBox>
    {:else if scan.state === 'checking' || scan.state === 'idle'}
      <StatusBox tone="neutral">
        {t('scan.checking')}
        <span class="payload mono">{result.text}</span>
      </StatusBox>
    {:else if scan.state === 'mismatch'}
      <StatusBox tone="warn">
        {t('scan.mismatch')}
        <span class="payload mono">{scan.read}</span>
      </StatusBox>
    {:else}
      <StatusBox tone="warn">
        {t('scan.failed')}
        <span class="payload mono">{result.text}</span>
      </StatusBox>
    {/if}
  {/if}
</div>

<style>
  .payload {
    display: block;
    color: var(--ink);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    margin-top: 2px;
  }
</style>
