<script lang="ts">
  /** Drop zone and file picker for the logo. The file is read locally into a data URL. */
  import { t } from '../../i18n';
  import { LogoReadError, readLogo } from '../lib/logo-file';
  import type { LogoImage } from '../lib/core';
  import Icon from './Icon.svelte';

  let {
    current,
    onpick,
    onremove,
  }: {
    current: { name: string; image: LogoImage } | null;
    onpick: (image: LogoImage, name: string) => void;
    onremove: () => void;
  } = $props();

  const inputId = `logo-${Math.random().toString(36).slice(2, 8)}`;
  let dragging = $state(false);
  let error = $state<string | null>(null);
  let input: HTMLInputElement | undefined = $state();

  async function take(file: File | undefined): Promise<void> {
    if (!file) return;
    error = null;
    try {
      onpick(await readLogo(file), file.name);
    } catch (e) {
      if (e instanceof LogoReadError) error = t('logo.badFile');
      else throw e;
    }
  }

  function drop(e: DragEvent): void {
    e.preventDefault();
    dragging = false;
    void take(e.dataTransfer?.files[0]);
  }
</script>

{#if current}
  <div class="current">
    <img src={current.image.dataUrl} alt="" width="40" height="40" />
    <span class="name">{t('logo.current', { name: current.name })}</span>
    <button class="btn small" type="button" onclick={onremove}>{t('logo.remove')}</button>
  </div>
{:else}
  <div
    class="zone"
    class:dragging
    role="presentation"
    ondragover={(e) => {
      e.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={drop}
  >
    <Icon name="upload" size={22} />
    <p>
      {t('logo.drop')}
      <label class="pick" for={inputId}>{t('logo.pick')}</label>
    </p>
    <input
      bind:this={input}
      id={inputId}
      class="visually-hidden"
      type="file"
      accept="image/*"
      onchange={() => take(input?.files?.[0])}
    />
  </div>
{/if}
<p class="hint">{t('logo.local')}</p>
{#if error}
  <p class="error-text" role="alert">{error}</p>
{/if}

<style>
  .zone {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 20px 16px;
    border: 2px dashed var(--line);
    border-radius: var(--r-sm);
    background: var(--snow);
    color: var(--muted);
    text-align: center;
  }
  .zone.dragging {
    border-color: var(--link);
    background: var(--ok-bg);
  }
  .zone p {
    font-size: 0.9rem;
    max-width: none;
  }
  .pick {
    color: var(--link);
    text-decoration: underline;
    text-underline-offset: 0.18em;
    cursor: pointer;
    font-weight: 600;
  }
  .zone:has(input:focus-visible) .pick {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .current {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--snow);
  }
  .current img {
    width: 40px;
    height: 40px;
    object-fit: contain;
    background: var(--code-card);
    border-radius: 6px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.9rem;
  }
  .hint {
    margin-top: 6px;
  }
</style>
