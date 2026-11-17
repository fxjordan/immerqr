import { describe, expect, it } from 'vitest';
import de from '../../src/i18n/de.json';
import en from '../../src/i18n/en.json';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('locale files', () => {
  it('have identical key sets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  it('use the same placeholders per key', () => {
    for (const key of Object.keys(de) as Array<keyof typeof de>) {
      expect(placeholders(en[key]), key).toEqual(placeholders(de[key]));
    }
  });

  it('have no empty strings', () => {
    for (const [key, value] of [...Object.entries(de), ...Object.entries(en)])
      expect(value.trim(), key).not.toBe('');
  });
});
