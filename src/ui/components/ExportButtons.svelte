<script lang="ts">
  import { t } from '../../i18n';
  import { exportPdf, exportPng, exportSvg, type GenerateResult, type PdfPage } from '../lib/core';
  import { saveBlob } from '../lib/download';
  import Icon from './Icon.svelte';

  let {
    result,
    fileBase,
    pngPx,
    pdf,
  }: {
    result: GenerateResult | null;
    fileBase: string;
    pngPx: number;
    pdf: { page: PdfPage; sizeMm: number };
  } = $props();

  type Format = 'png' | 'svg' | 'pdf';
  let busy = $state<Format | null>(null);
  let message = $state<{ tone: 'info' | 'warn'; text: string } | null>(null);

  async function run(format: Format): Promise<void> {
    if (!result || busy) return;
    busy = format;
    message = null;
    const file = `${fileBase}.${format}`;
    try {
      const blob =
        format === 'svg'
          ? exportSvg(result)
          : format === 'png'
            ? (await exportPng(result, { sizePx: pngPx })).blob
            : await exportPdf(result, pdf);
      saveBlob(blob, file);
      message = { tone: 'info', text: t('export.started', { file }) };
    } catch (e) {
      if (e instanceof RangeError && format === 'png') {
        const min = /(\d+) px/.exec(e.message)?.[1] ?? '';
        message = { tone: 'warn', text: t('export.pngTooSmall', { min }) };
      } else message = { tone: 'warn', text: t('export.failed') };
    } finally {
      busy = null;
    }
  }
</script>

<div class="exports" role="group" aria-label={t('export.group')}>
  <div class="btns">
    <button
      class="btn primary"
      type="button"
      disabled={!result}
      aria-busy={busy === 'png'}
      onclick={() => run('png')}
    >
      <Icon name="download" />{t('export.png')}
    </button>
    <button
      class="btn"
      type="button"
      disabled={!result}
      aria-busy={busy === 'svg'}
      onclick={() => run('svg')}
    >
      {t('export.svg')}
    </button>
    <button
      class="btn"
      type="button"
      disabled={!result}
      aria-busy={busy === 'pdf'}
      onclick={() => run('pdf')}
    >
      {t('export.pdf')}
    </button>
  </div>
  <p class="msg" class:warn={message?.tone === 'warn'} role="status" aria-live="polite">
    {message?.text ?? ''}
  </p>
</div>

<style>
  .exports {
    display: grid;
    gap: 8px;
  }
  .btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .msg {
    font-size: 0.84rem;
    color: var(--muted);
    min-height: 1.3em;
  }
  .msg.warn {
    color: var(--warn);
  }
</style>
