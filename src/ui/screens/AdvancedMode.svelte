<script lang="ts">
  import { formatNumber, t } from '../../i18n';
  import ChoiceChips from '../components/ChoiceChips.svelte';
  import ContentFields from '../components/ContentFields.svelte';
  import ExportButtons from '../components/ExportButtons.svelte';
  import LogoDrop from '../components/LogoDrop.svelte';
  import QrPreview from '../components/QrPreview.svelte';
  import ScanCheck from '../components/ScanCheck.svelte';
  import Segmented from '../components/Segmented.svelte';
  import StatusBox from '../components/StatusBox.svelte';
  import StyleIcon from '../components/StyleIcon.svelte';
  import {
    BRAND_STYLE,
    MAX_LOGO_SCALE,
    MIN_QUIET_ZONE,
    generate,
    isGenerateError,
    type Ecc,
    type EyeStyle,
    type GenerateInput,
    type ModuleStyle,
    type PayloadKind,
    type PdfPage,
  } from '../lib/core';
  import {
    DEFAULT_LOGO_SCALE,
    DEFAULT_PLATE_PADDING,
    applyPreset,
    buildPayload,
    fields,
    isPristine,
    look,
    output,
  } from '../lib/code-state.svelte';
  import { defaultFileName, resolveFileName } from '../lib/filename';
  import { errorMessage, warningMessage } from '../lib/messages';
  import { MIN_MODULE_MM, MIN_MODULE_PX, moduleMm, modulePx, printPx, toMm } from '../lib/sizing';

  const KINDS: PayloadKind[] = ['url', 'text', 'wifi', 'vcard', 'email', 'sms', 'phone', 'geo'];
  const ECCS: Ecc[] = ['L', 'M', 'Q', 'H'];
  const MAX_QUIET_ZONE = 20;

  function clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  }

  const quietZone = $derived(clampInt(look.style.quietZone, MIN_QUIET_ZONE, MAX_QUIET_ZONE, MIN_QUIET_ZONE));
  const pristine = $derived(isPristine());
  const payload = $derived(buildPayload());

  const input = $derived<GenerateInput>({
    payload,
    ecc: look.ecc,
    style: { ...look.style, quietZone },
    logo: look.logo
      ? {
          image: look.logo.image,
          scale: look.logo.scale,
          plate: look.logo.plate,
          platePadding: look.logo.platePadding,
        }
      : undefined,
  });

  const outcome = $derived(pristine ? null : generate(input));
  const result = $derived(outcome && !isGenerateError(outcome) ? outcome : null);
  const error = $derived(outcome && isGenerateError(outcome) ? errorMessage(outcome, 'advanced') : null);
  const errorField = $derived(
    outcome && isGenerateError(outcome) && outcome.code === 'invalid-payload' ? outcome.field : null,
  );
  const colourWarnings = $derived(
    (result?.warnings ?? []).filter(
      (w): w is 'low-contrast' | 'inverted' => w === 'low-contrast' || w === 'inverted',
    ),
  );
  const eccRaised = $derived(result?.warnings.includes('ecc-raised-for-logo') ?? false);

  // Size & export
  const printMm = $derived(toMm(Number(output.printValue) || 0, output.printUnit));
  const dpi = $derived(clampInt(output.dpi, 72, 2400, 300));
  const pngPx = $derived(
    output.sizeMode === 'px'
      ? clampInt(output.px, 64, 8192, 1024)
      : clampInt(printPx(printMm, dpi), 64, 20000, 1024),
  );
  const total = $derived(result ? result.size + 2 * quietZone : null);
  const perModulePx = $derived(total ? modulePx(pngPx, total) : null);
  const perModuleMm = $derived(total ? moduleMm(printMm, total) : null);
  const sizeWarning = $derived.by(() => {
    if (perModulePx !== null && perModulePx < MIN_MODULE_PX)
      return warningMessage('low-module-px', `${MIN_MODULE_PX} px`);
    if (perModuleMm !== null && perModuleMm < MIN_MODULE_MM)
      return warningMessage('low-module-px', `${formatNumber(MIN_MODULE_MM, 1)} mm`);
    return null;
  });
  const fileBase = $derived(resolveFileName(output.fileName, payload));

  function setTransparent(on: boolean): void {
    if (on) {
      if (look.style.bg !== 'transparent') look.solidBg = look.style.bg;
      look.style.bg = 'transparent';
    } else {
      look.style.bg = look.solidBg;
    }
  }

  function setBg(color: string): void {
    look.solidBg = color;
    look.style.bg = color;
  }
</script>

{#snippet moduleIcon(v: ModuleStyle)}<StyleIcon kind={v} />{/snippet}
{#snippet eyeIcon(v: EyeStyle)}<StyleIcon kind={v === 'square' ? 'eye-square' : v} />{/snippet}

<div class="advanced">
  <h1>{t('adv.heading')}</h1>

  <aside class="preview">
    <QrPreview
      svg={result?.svg ?? null}
      label={result ? t('preview.label', { text: result.text }) : t('preview.sample')}
      caption={result
        ? t('preview.meta', { version: result.version, ecc: result.ecc, size: result.size })
        : undefined}
    />
    <ScanCheck {result} {error} prompt={t('simple.empty')} />
    <ExportButtons {result} {fileBase} {pngPx} pdf={{ page: output.pdfPage, sizeMm: printMm }} />
  </aside>

  <div class="settings">
    <section class="card group" aria-labelledby="adv-content">
      <h2 id="adv-content">{t('adv.content')}</h2>
      <ChoiceChips
        legend={t('kind.legend')}
        name="kind"
        value={fields.kind}
        onchange={(k) => (fields.kind = k)}
        options={KINDS.map((k) => ({ value: k, label: t(`kind.${k}`) }))}
      />
      <ContentFields {errorField} error={pristine ? null : error} />
    </section>

    <section class="card group" aria-labelledby="adv-look">
      <h2 id="adv-look">{t('adv.look')}</h2>
      <ChoiceChips
        legend={t('look.modules')}
        name="modules"
        value={look.style.modules}
        onchange={(v) => (look.style.modules = v)}
        icon={moduleIcon}
        options={[
          { value: 'dots', label: t('look.modules.dots') },
          { value: 'square', label: t('look.modules.square') },
          { value: 'rounded', label: t('look.modules.rounded') },
        ]}
      />
      <ChoiceChips
        legend={t('look.eye')}
        name="eye"
        value={look.style.eye}
        onchange={(v) => (look.style.eye = v)}
        icon={eyeIcon}
        options={[
          { value: 'leaf', label: t('look.eye.leaf') },
          { value: 'square', label: t('look.eye.square') },
          { value: 'dot', label: t('look.eye.dot') },
        ]}
      />
      <fieldset class="colours" aria-describedby={colourWarnings.length ? 'colour-warnings' : undefined}>
        <legend class="label">{t('look.colors')}</legend>
        <div class="swatches">
          <label class="swatch">
            <input type="color" bind:value={look.style.fg} />
            <span>{t('look.color.fg')}</span>
          </label>
          <label class="swatch">
            <input type="color" bind:value={look.style.eyeColor} />
            <span>{t('look.color.eye')}</span>
          </label>
          <label class="swatch">
            <input
              type="color"
              value={look.solidBg === 'transparent' ? BRAND_STYLE.bg : look.solidBg}
              disabled={look.style.bg === 'transparent'}
              oninput={(e) => setBg(e.currentTarget.value)}
            />
            <span>{t('look.color.bg')}</span>
          </label>
        </div>
        <label class="check-row">
          <input
            type="checkbox"
            checked={look.style.bg === 'transparent'}
            onchange={(e) => setTransparent(e.currentTarget.checked)}
          />
          {t('look.transparent')}
        </label>
        {#if colourWarnings.length}
          <div id="colour-warnings" class="warnings">
            {#each colourWarnings as w (w)}
              <StatusBox tone="warn">{warningMessage(w)}</StatusBox>
            {/each}
          </div>
        {/if}
      </fieldset>
      <div class="presets" role="group" aria-label={t('look.presets')}>
        <button class="btn small" type="button" onclick={() => applyPreset('brand')}
          >{t('look.preset.brand')}</button
        >
        <button
          class="btn small"
          type="button"
          onclick={() => applyPreset('classic')}
          aria-describedby="classic-hint"
        >
          {t('look.preset.classic')}
        </button>
        <p class="hint" id="classic-hint">{t('look.preset.hint')}</p>
      </div>
    </section>

    <section class="card group" aria-labelledby="adv-logo">
      <h2 id="adv-logo">{t('logo.title')}</h2>
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
      {#if look.logo}
        <div class="field">
          <label for="logo-scale">{t('logo.scale')}</label>
          <input
            id="logo-scale"
            type="range"
            min="0.05"
            max={MAX_LOGO_SCALE}
            step="0.01"
            bind:value={look.logo.scale}
            aria-valuetext={t('logo.scaleValue', { value: formatNumber(look.logo.scale * 100) })}
          />
          <p class="hint">{t('logo.scaleValue', { value: formatNumber(look.logo.scale * 100) })}</p>
        </div>
        <label class="check-row">
          <input type="checkbox" bind:checked={look.logo.plate} />
          {t('logo.plate')}
        </label>
        {#if look.logo.plate}
          <div class="field">
            <label for="logo-padding">{t('logo.padding')}</label>
            <input
              id="logo-padding"
              type="range"
              min="0"
              max="3"
              step="0.5"
              bind:value={look.logo.platePadding}
              aria-valuetext={t('logo.paddingValue', { value: formatNumber(look.logo.platePadding, 1) })}
            />
            <p class="hint">{t('logo.paddingValue', { value: formatNumber(look.logo.platePadding, 1) })}</p>
          </div>
        {/if}
        {#if eccRaised}
          <StatusBox tone="ok">{t('logo.eccRaised')}</StatusBox>
        {/if}
      {/if}
    </section>

    <section class="card group" aria-labelledby="adv-export">
      <h2 id="adv-export">{t('adv.export')}</h2>

      <div class="row">
        <div class="field grow">
          <label for="print-width">{t('size.print')}</label>
          <input
            id="print-width"
            class="input"
            type="number"
            min="1"
            step="any"
            inputmode="decimal"
            bind:value={output.printValue}
          />
        </div>
        <div class="field">
          <label for="print-unit">{t('size.unit')}</label>
          <select id="print-unit" class="input" bind:value={output.printUnit}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>
      {#if perModuleMm !== null}
        <p class="hint">
          {t('size.summaryPrint', { mm: formatNumber(printMm, 1), moduleMm: formatNumber(perModuleMm, 2) })}
        </p>
      {/if}

      <div class="field">
        <span class="label" aria-hidden="true">{t('size.png')}</span>
        <Segmented
          legend={t('size.png')}
          name="size-mode"
          value={output.sizeMode}
          onchange={(v) => (output.sizeMode = v)}
          options={[
            { value: 'px', label: t('size.mode.px') },
            { value: 'print', label: t('size.mode.print') },
          ]}
        />
      </div>
      {#if output.sizeMode === 'px'}
        <div class="field">
          <label for="png-px">{t('size.px')}</label>
          <input
            id="png-px"
            class="input"
            type="number"
            min="64"
            max="8192"
            step="1"
            bind:value={output.px}
          />
        </div>
      {:else}
        <div class="field">
          <label for="png-dpi">{t('size.dpi')}</label>
          <input
            id="png-dpi"
            class="input"
            type="number"
            min="72"
            max="2400"
            step="1"
            bind:value={output.dpi}
          />
        </div>
      {/if}
      {#if perModulePx !== null}
        <p class="hint">{t('size.summaryPx', { px: pngPx, modulePx: perModulePx })}</p>
      {/if}
      {#if sizeWarning}
        <StatusBox tone="warn">{sizeWarning}</StatusBox>
      {/if}

      <div class="field">
        <label for="quiet-zone">{t('quiet.label')}</label>
        <input
          id="quiet-zone"
          class="input narrow"
          type="number"
          min={MIN_QUIET_ZONE}
          max={MAX_QUIET_ZONE}
          step="1"
          aria-describedby="quiet-hint"
          bind:value={look.style.quietZone}
        />
        <p class="hint" id="quiet-hint">{t('quiet.hint')}</p>
      </div>

      <fieldset
        class="ecc"
        disabled={look.logo !== null}
        aria-describedby={look.logo ? 'ecc-locked' : undefined}
      >
        <legend class="label">{t('ecc.legend')}</legend>
        {#each ECCS as level (level)}
          <label class="ecc-row">
            <input
              type="radio"
              name="ecc"
              value={level}
              checked={(look.logo ? 'H' : look.ecc) === level}
              onchange={() => (look.ecc = level)}
            />
            <b>{level}</b>
            <span>{t(`ecc.${level}`)}</span>
          </label>
        {/each}
        {#if look.logo}<p class="hint" id="ecc-locked">{t('ecc.locked')}</p>{/if}
      </fieldset>

      <div class="field">
        <label for="pdf-page">{t('pdf.page')}</label>
        <select id="pdf-page" class="input" aria-describedby="pdf-hint" bind:value={output.pdfPage}>
          {#each ['A4', 'Letter', 'fit'] as const as page (page)}
            <option value={page as PdfPage}>{t(`pdf.${page}`)}</option>
          {/each}
        </select>
        <p class="hint" id="pdf-hint">{t('pdf.hint')}</p>
      </div>

      <div class="field">
        <label for="file-name">{t('file.name')}</label>
        <input
          id="file-name"
          class="input mono"
          type="text"
          spellcheck="false"
          autocomplete="off"
          placeholder={defaultFileName(payload)}
          aria-describedby="file-hint"
          bind:value={output.fileName}
        />
        <p class="hint" id="file-hint">{t('file.hint')}</p>
      </div>
    </section>
  </div>
</div>

<style>
  .advanced {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    grid-template-areas:
      'title title'
      'settings preview';
    gap: 24px 40px;
    align-items: start;
  }
  h1 {
    grid-area: title;
  }
  .preview {
    grid-area: preview;
    position: sticky;
    top: 16px;
    display: grid;
    gap: 14px;
  }
  .settings {
    grid-area: settings;
    display: grid;
    gap: 16px;
  }
  .group {
    padding: 20px;
    display: grid;
    gap: 18px;
  }
  .colours,
  .ecc {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .colours legend,
  .ecc legend {
    padding: 0;
    margin-bottom: 8px;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .swatch {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    padding: 6px 12px 6px 6px;
    border: 2px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
  }
  .swatch input {
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }
  .swatch input::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  .swatch input::-webkit-color-swatch {
    border: 0;
    border-radius: 50%;
  }
  .swatch input::-moz-color-swatch {
    border: 0;
    border-radius: 50%;
  }
  .swatch:has(input:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .swatch:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .swatch input:focus-visible {
    outline: none;
  }
  .warnings {
    display: grid;
    gap: 8px;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .presets .hint {
    flex-basis: 100%;
  }
  .row {
    display: flex;
    gap: 12px;
    align-items: end;
  }
  .grow {
    flex: 1;
  }
  .narrow {
    max-width: 120px;
  }
  .ecc-row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    gap: 10px;
    align-items: baseline;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .ecc-row input {
    accent-color: var(--moss);
    margin: 0;
    width: 16px;
    height: 16px;
    align-self: center;
  }
  .ecc-row b {
    font-family: var(--f-mono);
  }
  .ecc:disabled .ecc-row {
    cursor: not-allowed;
  }
  .ecc:disabled .ecc-row span,
  .ecc:disabled .ecc-row b {
    color: var(--muted);
  }
  @media (max-width: 900px) {
    .advanced {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'title' 'preview' 'settings';
    }
    .preview {
      position: static;
    }
    .preview :global(.code-card) {
      max-width: 320px;
      width: 100%;
      justify-self: center;
    }
  }
</style>
