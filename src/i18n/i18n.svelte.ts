import de from './de.json';
import en from './en.json';

import { applyLocale, initialLocale, LOCALES, saveLocale, type Locale } from './locale';

export { LOCALES, type Locale };
export type MessageKey = keyof typeof de;
export type MessageParams = Record<string, string | number>;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { de, en };

function storage(): Storage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

const state = $state<{ locale: Locale }>({ locale: initialLocale(storage(), navigator.languages) });
applyLocale(document, state.locale);

export function getLocale(): Locale {
  return state.locale;
}

export function setLocale(locale: Locale): void {
  state.locale = locale;
  applyLocale(document, locale);
  saveLocale(storage(), locale);
}

/** Looks up `key` in the current locale and fills `{name}` placeholders from `params`. */
export function t(key: MessageKey, params?: MessageParams): string {
  const template = dictionaries[state.locale][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Locale-aware number formatting for values shown next to translated text. */
export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(state.locale, { maximumFractionDigits: maxFractionDigits }).format(value);
}
