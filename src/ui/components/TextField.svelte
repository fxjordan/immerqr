<script lang="ts">
  import { t } from '../../i18n';

  let {
    id,
    label,
    value = $bindable(),
    error = null,
    optional = false,
    multiline = false,
    mono = false,
    hint,
    type = 'text',
    inputmode,
    autocomplete,
  }: {
    id: string;
    label: string;
    value: string;
    error?: string | null;
    optional?: boolean;
    multiline?: boolean;
    mono?: boolean;
    hint?: string;
    type?: 'text' | 'url' | 'email' | 'tel' | 'password';
    inputmode?: 'text' | 'url' | 'email' | 'tel' | 'decimal';
    autocomplete?: HTMLInputElement['autocomplete'];
  } = $props();

  const describedby = $derived(
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined,
  );
</script>

<div class="field">
  <label for={id}>
    {label}
    {#if optional}<span class="opt">({t('form.optional')})</span>{/if}
  </label>
  {#if multiline}
    <textarea
      {id}
      class="input"
      class:mono
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedby}
      bind:value></textarea>
  {:else}
    <input
      {id}
      {type}
      class="input"
      class:mono
      {inputmode}
      {autocomplete}
      spellcheck="false"
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedby}
      bind:value
    />
  {/if}
  {#if hint}<p class="hint" id="{id}-hint">{hint}</p>{/if}
  {#if error}<p class="error-text" id="{id}-error">{error}</p>{/if}
</div>

<style>
  .opt {
    font-weight: 400;
    color: var(--muted);
    margin-left: 4px;
  }
</style>
