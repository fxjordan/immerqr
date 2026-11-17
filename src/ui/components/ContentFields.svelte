<script lang="ts">
  /** One form per payload kind, bound to the shared field state. */
  import { t } from '../../i18n';
  import { fields } from '../lib/code-state.svelte';
  import ChoiceChips from './ChoiceChips.svelte';
  import TextField from './TextField.svelte';

  let { errorField, error }: { errorField: string | null; error: string | null } = $props();

  const err = (...names: string[]) => (errorField && names.includes(errorField) ? error : null);
</script>

<div class="fields">
  {#if fields.kind === 'url'}
    <TextField
      id="f-url"
      label={t('form.url')}
      type="url"
      inputmode="url"
      mono
      bind:value={fields.url}
      error={err('url')}
    />
  {:else if fields.kind === 'text'}
    <TextField id="f-text" label={t('form.text')} multiline bind:value={fields.text} error={err('text')} />
  {:else if fields.kind === 'wifi'}
    <TextField id="f-ssid" label={t('form.wifi.ssid')} bind:value={fields.wifi.ssid} error={err('ssid')} />
    <ChoiceChips
      legend={t('form.wifi.security')}
      name="wifi-security"
      value={fields.wifi.security}
      onchange={(v) => (fields.wifi.security = v)}
      options={[
        { value: 'WPA', label: t('form.wifi.sec.WPA') },
        { value: 'WEP', label: t('form.wifi.sec.WEP') },
        { value: 'nopass', label: t('form.wifi.sec.nopass') },
      ]}
    />
    {#if fields.wifi.security !== 'nopass'}
      <TextField
        id="f-password"
        label={t('form.wifi.password')}
        autocomplete="off"
        bind:value={fields.wifi.password}
        error={err('password')}
      />
    {/if}
    <label class="check-row">
      <input type="checkbox" bind:checked={fields.wifi.hidden} />
      {t('form.wifi.hidden')}
    </label>
  {:else if fields.kind === 'vcard'}
    <div class="pair">
      <TextField
        id="f-first"
        label={t('form.vcard.firstName')}
        autocomplete="given-name"
        bind:value={fields.vcard.firstName}
        error={err('name')}
      />
      <TextField
        id="f-last"
        label={t('form.vcard.lastName')}
        autocomplete="family-name"
        bind:value={fields.vcard.lastName}
      />
    </div>
    <TextField
      id="f-org"
      label={t('form.vcard.org')}
      optional
      autocomplete="organization"
      bind:value={fields.vcard.org}
    />
    <div class="pair">
      <TextField
        id="f-vphone"
        label={t('form.vcard.phone')}
        optional
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        bind:value={fields.vcard.phone}
        error={err('phone')}
      />
      <TextField
        id="f-vemail"
        label={t('form.vcard.email')}
        optional
        type="email"
        inputmode="email"
        autocomplete="email"
        bind:value={fields.vcard.email}
        error={err('email')}
      />
    </div>
    <TextField
      id="f-vurl"
      label={t('form.vcard.url')}
      optional
      type="url"
      inputmode="url"
      bind:value={fields.vcard.url}
      error={err('url')}
    />
    <TextField
      id="f-vaddr"
      label={t('form.vcard.address')}
      optional
      autocomplete="street-address"
      bind:value={fields.vcard.address}
    />
  {:else if fields.kind === 'email'}
    <TextField
      id="f-to"
      label={t('form.email.to')}
      type="email"
      inputmode="email"
      autocomplete="email"
      bind:value={fields.email.to}
      error={err('to')}
    />
    <TextField id="f-subject" label={t('form.email.subject')} optional bind:value={fields.email.subject} />
    <TextField id="f-body" label={t('form.email.body')} optional multiline bind:value={fields.email.body} />
  {:else if fields.kind === 'sms'}
    <TextField
      id="f-smsnr"
      label={t('form.sms.number')}
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      bind:value={fields.sms.number}
      error={err('number')}
    />
    <TextField
      id="f-smsmsg"
      label={t('form.sms.message')}
      optional
      multiline
      bind:value={fields.sms.message}
    />
  {:else if fields.kind === 'phone'}
    <TextField
      id="f-phone"
      label={t('form.phone.number')}
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      bind:value={fields.phone.number}
      error={err('number')}
    />
  {:else if fields.kind === 'geo'}
    <div class="pair">
      <TextField
        id="f-lat"
        label={t('form.geo.lat')}
        inputmode="decimal"
        mono
        bind:value={fields.geo.lat}
        error={err('lat')}
      />
      <TextField
        id="f-lng"
        label={t('form.geo.lng')}
        inputmode="decimal"
        mono
        bind:value={fields.geo.lng}
        error={err('lng')}
      />
    </div>
    <p class="hint">{t('form.geo.hint')}</p>
  {/if}
</div>

<style>
  .fields {
    display: grid;
    gap: 16px;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 560px) {
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
