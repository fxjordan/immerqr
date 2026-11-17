<script lang="ts" generics="T extends string">
  import type { Snippet } from 'svelte';

  interface Option {
    value: T;
    label: string;
  }
  let {
    legend,
    name,
    options,
    value,
    disabled = false,
    onchange,
    icon,
    describedby,
  }: {
    legend: string;
    name: string;
    options: Option[];
    value: T;
    disabled?: boolean;
    onchange: (v: T) => void;
    icon?: Snippet<[T]>;
    describedby?: string;
  } = $props();
</script>

<fieldset class="chips" aria-describedby={describedby}>
  <legend>{legend}</legend>
  {#each options as option (option.value)}
    <label>
      <input
        type="radio"
        {name}
        value={option.value}
        checked={value === option.value}
        {disabled}
        onchange={() => onchange(option.value)}
      />
      <span>
        {#if icon}{@render icon(option.value)}{/if}
        {option.label}
      </span>
    </label>
  {/each}
</fieldset>
