import { describe, expect, it } from 'vitest';
import { applyLocale, detectLocale, initialLocale, saveLocale } from '../../src/i18n/locale';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe('detectLocale', () => {
  it.each([
    [['de-DE', 'en'], 'de'],
    [['de-AT'], 'de'],
    [['DE'], 'de'],
    [['en-US', 'de'], 'en'],
    [['fr-FR', 'de-CH', 'en'], 'de'],
    [['fr-FR', 'es'], 'en'],
    [[], 'en'],
  ])('%j → %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });
});

describe('persistence', () => {
  it('a saved choice wins over the browser language', () => {
    const storage = memoryStorage();
    saveLocale(storage, 'en');
    expect(initialLocale(storage, ['de-DE'])).toBe('en');
  });

  it('ignores garbage in storage', () => {
    const storage = memoryStorage();
    storage.setItem('immerqr.locale', 'fr');
    expect(initialLocale(storage, ['de'])).toBe('de');
  });

  it('survives blocked storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(initialLocale(blocked, ['de'])).toBe('de');
    expect(() => saveLocale(blocked, 'en')).not.toThrow();
    expect(initialLocale(undefined, ['en'])).toBe('en');
  });
});

it('applyLocale sets <html lang>', () => {
  const doc = { documentElement: { lang: 'de' } } as unknown as Document;
  applyLocale(doc, 'en');
  expect(doc.documentElement.lang).toBe('en');
});
