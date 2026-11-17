export type Locale = 'de' | 'en';

export const LOCALES: readonly Locale[] = ['de', 'en'];

const STORAGE_KEY = 'immerqr.locale';

/** German for any `de*` browser language that comes before an English one, English otherwise. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    const primary = lang.toLowerCase().split('-')[0];
    if (primary === 'de' || primary === 'en') return primary;
  }
  return 'en';
}

function isLocale(value: unknown): value is Locale {
  return value === 'de' || value === 'en';
}

/** The saved choice, else the browser languages. Storage can be blocked; that falls back to detection. */
export function initialLocale(
  storage: Pick<Storage, 'getItem'> | undefined,
  languages: readonly string[],
): Locale {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Private mode or blocked site data.
  }
  return detectLocale(languages);
}

export function saveLocale(storage: Pick<Storage, 'setItem'> | undefined, locale: Locale): void {
  try {
    storage?.setItem(STORAGE_KEY, locale);
  } catch {
    // The choice then lasts for this page view only.
  }
}

/** Keeps `<html lang>` in step with the UI language for screen readers and hyphenation. */
export function applyLocale(doc: Pick<Document, 'documentElement'>, locale: Locale): void {
  doc.documentElement.lang = locale;
}
