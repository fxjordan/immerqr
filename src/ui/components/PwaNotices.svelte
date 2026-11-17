<script lang="ts">
  import { t } from '../../i18n';
  import { pwa } from '../lib/pwa.svelte';
  import Icon from './Icon.svelte';
</script>

<div class="notices" role="status" aria-live="polite">
  {#if !pwa.online}
    <div class="notice offline">
      <Icon name="offline" />
      <span>{t('pwa.offline')}</span>
    </div>
  {/if}
  {#if pwa.updateReady}
    <div class="notice">
      <span>{t('pwa.update.text')}</span>
      <button class="btn small primary" type="button" onclick={() => pwa.applyUpdate()}>
        {t('pwa.update.action')}
      </button>
    </div>
  {/if}
  {#if pwa.canInstall}
    <div class="notice">
      <span>{t('pwa.install.text')}</span>
      <span class="actions">
        <button class="btn small primary" type="button" onclick={() => pwa.install()}>
          {t('pwa.install.action')}
        </button>
        <button class="btn small" type="button" onclick={() => pwa.dismissInstall()}>
          {t('pwa.install.dismiss')}
        </button>
      </span>
    </div>
  {/if}
</div>

<style>
  .notices {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: grid;
    gap: 8px;
    justify-items: center;
    pointer-events: none;
    z-index: 20;
  }
  .notice {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    max-width: 520px;
    width: fit-content;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 10px 14px;
    box-shadow: 0 16px 32px -20px var(--shadow-code);
    font-size: 0.9rem;
  }
  .offline {
    color: var(--muted);
  }
  .actions {
    display: flex;
    gap: 8px;
  }
</style>
