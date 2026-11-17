import de from './de.json';
import en from './en.json';

export type Locale = 'de' | 'en';
export type MessageKey = keyof typeof de;
export type MessageParams = Record<string, string | number>;

export const LOCALES: readonly Locale[] = ['de', 'en'];

const dictionaries: Record<Locale, Record<MessageKey, string>> = { de, en };

const STORAGE_KEY = 'immerqr.locale';

function stored(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'de' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

const state = $state<{ locale: Locale }>({ locale: stored() ?? 'de' });

function applyLang(locale: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}
applyLang(state.locale);

export function getLocale(): Locale {
  return state.locale;
}

export function setLocale(locale: Locale): void {
  state.locale = locale;
  applyLang(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit.
  }
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
