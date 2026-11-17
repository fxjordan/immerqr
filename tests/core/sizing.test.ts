import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, exportWarnings, fileName, generate, isGenerateError, printPx } from '../../src/core';

const r = (() => {
  const g = generate({ payload: { kind: 'url', url: 'https://example.com' }, ecc: 'Q', style: BRAND_STYLE });
  if (isGenerateError(g)) throw new Error(g.code);
  return g;
})();
const total = r.size + 8;

describe('print size', () => {
  it('converts mm and DPI to pixels', () => {
    expect(printPx(25.4, 300)).toBe(300);
    expect(printPx(20, 300)).toBe(236);
    expect(printPx(50, 600)).toBe(1181);
  });
});

describe('exportWarnings', () => {
  it('warns under 4 px per module', () => {
    expect(exportWarnings(r, { px: total * 4 })).toEqual([]);
    expect(exportWarnings(r, { px: total * 4 - 1 })).toEqual(['low-module-px']);
  });

  it('warns under 0.4 mm per module', () => {
    expect(exportWarnings(r, { mm: total * 0.4 })).toEqual([]);
    expect(exportWarnings(r, { mm: total * 0.39 })).toEqual(['low-module-px']);
  });
});

describe('fileName', () => {
  const url = { kind: 'url', url: 'https://www.bäckerei-müller.de/karte' } as const;

  it('defaults to the host or the kind', () => {
    expect(fileName(url, 'png')).toBe('immerqr-backerei-muller-de.png');
    expect(fileName({ kind: 'url', url: 'example.com/x' }, 'svg')).toBe('immerqr-url.svg');
    expect(fileName({ kind: 'wifi', ssid: 'x', password: 'y', security: 'WPA', hidden: false }, 'pdf')).toBe(
      'immerqr-wifi.pdf',
    );
  });

  it.each([
    ['Speisekarte Tisch 12', 'Speisekarte Tisch 12.png'],
    ['menu.png', 'menu.png'],
    ['../../etc/passwd', 'etc-passwd.png'],
    ['a<b>c:d"e|f?g*h', 'a-b-c-d-e-f-g-h.png'],
    ['  Grüße  ', 'Grüße.png'],
    ['name.', 'name.png'],
    ['CON', 'immerqr-backerei-muller-de.png'],
    ['...', 'immerqr-backerei-muller-de.png'],
    ['x'.repeat(200), `${'x'.repeat(80)}.png`],
  ])('%j → %s', (custom, expected) => {
    expect(fileName(url, 'png', custom)).toBe(expected);
  });
});
