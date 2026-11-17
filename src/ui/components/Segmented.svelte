<script lang="ts" generics="T extends string">
  interface Option {
    value: T;
    label: string;
    title?: string;
    lang?: string;
  }
  let {
    legend,
    name,
    options,
    value,
    onchange,
  }: { legend: string; name: string; options: Option[]; value: T; onchange: (v: T) => void } = $props();
</script>

<fieldset class="seg">
  <legend>{legend}</legend>
  {#each options as option (option.value)}
    <label title={option.title}>
      <input
        type="radio"
        {name}
        value={option.value}
        checked={value === option.value}
        onchange={() => onchange(option.value)}
      />
      <span lang={option.lang}>{option.label}</span>
    </label>
  {/each}
</fieldset>
