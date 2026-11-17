import { formatNumber, t, type MessageKey } from '../../i18n';
import type { GenerateError, StyleWarning } from './core';

const INVALID_FIELDS = new Set([
  'url',
  'text',
  'ssid',
  'password',
  'name',
  'phone',
  'number',
  'email',
  'to',
  'lat',
  'lng',
]);

/** User-facing text for a `GenerateError`. */
export function errorMessage(error: GenerateError, mode: 'simple' | 'advanced'): string {
  switch (error.code) {
    case 'too-long':
      return t(mode === 'simple' ? 'error.tooLong.simple' : 'error.tooLong.advanced', {
        length: formatNumber(error.length),
        maxChars: formatNumber(error.maxChars),
      });
    case 'invalid-payload':
      return INVALID_FIELDS.has(error.field)
        ? t(`error.invalid.${error.field}` as MessageKey)
        : t('error.invalid.generic');
    case 'logo-too-large':
      return t('error.logoTooLarge', { max: formatNumber(error.maxScale * 100) });
  }
}

export function warningMessage(warning: Exclude<StyleWarning, 'ecc-raised-for-logo'>, min = ''): string {
  switch (warning) {
    case 'low-contrast':
      return t('warn.lowContrast');
    case 'inverted':
      return t('warn.inverted');
    case 'low-module-px':
      return t('warn.lowModulePx', { min });
  }
}
