import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, CLASSIC_STYLE, contrastRatio, generate, isGenerateError } from '../../src/core';
import type { CodeStyle, GenerateResult } from '../../src/core';
import { EYE_STYLES, MODULE_STYLES } from '../helpers/roundtrip';

const payload = { kind: 'url', url: 'https://example.com' } as const;

function run(style: Partial<CodeStyle>): GenerateResult {
  const r = generate({ payload, ecc: 'Q', style: { ...BRAND_STYLE, ...style } });
  if (isGenerateError(r)) throw new Error(r.code);
  return r;
}

describe('colour warnings', () => {
  it('brand and classic styles are clean', () => {
    expect(run({}).warnings).toEqual([]);
    expect(run(CLASSIC_STYLE).warnings).toEqual([]);
  });

  it('flags contrast below 4.5 : 1 for modules or eyes', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(run({ fg: '#767676' }).warnings).toEqual([]);
    expect(run({ fg: '#777777' }).warnings).toEqual(['low-contrast']);
    expect(run({ eyeColor: '#A6DB6B' }).warnings).toEqual(['low-contrast']);
  });

  it('flags light modules on a dark background as inverted', () => {
    expect(run({ fg: '#ffffff', eyeColor: '#ffffff', bg: '#0F3B2C' }).warnings).toEqual(['inverted']);
  });

  it('judges a transparent background as white', () => {
    expect(run({ bg: 'transparent' }).warnings).toEqual([]);
    expect(run({ bg: 'transparent', fg: '#eeeeee' }).warnings).toEqual(['low-contrast']);
  });
});

describe('impossible styles', () => {
  it.each([0, 3, 3.5, -4, Number.NaN])('rejects quiet zone %s', (quietZone) => {
    expect(() => run({ quietZone })).toThrow(RangeError);
  });

  it('accepts a wider quiet zone', () => {
    const r = run({ quietZone: 6 });
    expect(r.svg).toContain(`viewBox="0 0 ${r.size + 12} ${r.size + 12}"`);
  });

  it('rejects colours no colour input produces', () => {
    expect(() => run({ fg: 'red' })).toThrow(TypeError);
  });

  it('always draws a square outer finder ring', () => {
    for (const modules of MODULE_STYLES) {
      for (const eye of EYE_STYLES) {
        const { svg, size } = run({ modules, eye });
        const far = size - 7 + 4;
        expect(svg).toContain(
          `<path fill="#0f3b2c" fill-rule="evenodd" d="M4 4h7v7h-7zM5 5v5h5v-5zM${far} 4h7v7h-7zM${far + 1} 5v5h5v-5zM4 ${far}h7v7h-7zM5 ${far + 1}v5h5v-5z"/>`,
        );
      }
    }
  });
});
