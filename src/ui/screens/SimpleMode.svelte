<script lang="ts">
  import { t } from '../../i18n';
  import ExportButtons from '../components/ExportButtons.svelte';
  import LogoDrop from '../components/LogoDrop.svelte';
  import QrPreview from '../components/QrPreview.svelte';
  import ScanCheck from '../components/ScanCheck.svelte';
  import StatusBox from '../components/StatusBox.svelte';
  import { BRAND_STYLE, generate, isGenerateError, type GenerateInput } from '../lib/core';
  import {
    DEFAULT_ECC,
    DEFAULT_LOGO_SCALE,
    DEFAULT_PLATE_PADDING,
    fields,
    look,
  } from '../lib/code-state.svelte';
  import { defaultFileName } from '../lib/filename';
  import { errorMessage } from '../lib/messages';

  const SAMPLE_URL = 'https://immerqr.de';
  const SIMPLE_PNG_PX = 1024;

  const pristine = $derived(fields.url.trim() === '');

  function inputFor(url: string): GenerateInput {
    const logo = look.logo;
    return {
      payload: { kind: 'url', url },
      ecc: DEFAULT_ECC,
      style: { ...BRAND_STYLE },
      logo: logo
        ? { image: logo.image, scale: DEFAULT_LOGO_SCALE, plate: true, platePadding: DEFAULT_PLATE_PADDING }
        : undefined,
    };
  }

  const outcome = $derived(pristine ? null : generate(inputFor(fields.url)));
  const result = $derived(outcome && !isGenerateError(outcome) ? outcome : null);
  const error = $derived(outcome && isGenerateError(outcome) ? errorMessage(outcome, 'simple') : null);
  const sample = $derived.by(() => {
    if (!pristine) return null;
    const r = generate(inputFor(SAMPLE_URL));
    return isGenerateError(r) ? null : r;
  });
  const shown = $derived(result ?? sample);
  const eccRaised = $derived(result?.warnings.includes('ecc-raised-for-logo') ?? false);
  let logoOpen = $state(look.logo !== null);
</script>

<div class="simple">
  <div class="form">
    <h1>{t('simple.heading')}</h1>
    <div class="field">
      <label for="simple-url">{t('simple.url.label')}</label>
      <input
        id="simple-url"
        class="input mono"
        type="url"
        inputmode="url"
        autocomplete="url"
        spellcheck="false"
        placeholder={t('simple.url.placeholder')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby="simple-check"
        bind:value={fields.url}
      />
    </div>
    <div id="simple-check" class="after">
      <ScanCheck {result} {error} prompt={t('simple.empty')} />
    </div>
    <div class="after">
      <ExportButtons
        {result}
        fileBase={defaultFileName({ kind: 'url', url: fields.url })}
        pngPx={SIMPLE_PNG_PX}
        pdf={{ page: 'A4', sizeMm: 50 }}
      />
    </div>
    <details class="logo after" bind:open={logoOpen}>
      <summary>{t('logo.toggle')}</summary>
      <div class="logo-body">
        <LogoDrop
          current={look.logo}
          onpick={(image, name) =>
            (look.logo = {
              image,
              name,
              scale: DEFAULT_LOGO_SCALE,
              plate: true,
              platePadding: DEFAULT_PLATE_PADDING,
            })}
          onremove={() => (look.logo = null)}
        />
        {#if eccRaised}
          <StatusBox tone="ok">{t('logo.eccRaised')}</StatusBox>
        {/if}
      </div>
    </details>
  </div>
  <div class="preview">
    <QrPreview
      svg={shown?.svg ?? null}
      sample={!result}
      label={result ? t('preview.label', { text: result.text }) : t('preview.sample')}
      caption={result
        ? t('preview.meta', { version: result.version, ecc: result.ecc, size: result.size })
        : undefined}
    />
  </div>
</div>

<style>
  .simple {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 40px;
    align-items: start;
  }
  .form {
    display: grid;
    gap: 18px;
    align-content: start;
  }
  h1 {
    margin-bottom: 4px;
  }
  .logo {
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    width: fit-content;
    padding: 4px 0;
    color: var(--ink);
  }
  .logo-body {
    display: grid;
    gap: 10px;
    padding-top: 12px;
  }
  @media (max-width: 820px) {
    .simple {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 18px;
    }
    .form {
      display: contents;
    }
    .preview {
      order: 1;
      max-width: 300px;
      width: 100%;
      align-self: center;
    }
    .after {
      order: 2;
    }
  }
</style>
