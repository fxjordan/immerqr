import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, CLASSIC_STYLE, generate, isGenerateError } from '../../src/core';
import type { CodeStyle, GenerateInput } from '../../src/core';
import { CORPUS } from '../fixtures/corpus';
import { EYE_STYLES, MODULE_STYLES } from '../helpers/roundtrip';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

function svgFor(input: GenerateInput): string {
  const r = generate(input);
  if (isGenerateError(r)) throw new Error(r.code);
  return r.svg;
}

describe('SVG output', () => {
  const styles: CodeStyle[] = MODULE_STYLES.flatMap((modules) =>
    EYE_STYLES.map((eye) => ({ ...BRAND_STYLE, modules, eye })),
  );
  styles.push({ ...BRAND_STYLE, bg: 'transparent' });

  it.each(styles.map((s) => [`${s.modules}/${s.eye}/${s.bg}`, s] as const))(
    '%s is self-contained',
    (_n, style) => {
      const svg = svgFor({ payload: CORPUS.url[3]!, ecc: 'M', style });
      expect(XMLValidator.validate(svg)).toBe(true);
      const root = parser.parse(svg).svg;
      expect(root.viewBox).toMatch(/^0 0 \d+ \d+$/);
      expect(root.xmlns).toBe('http://www.w3.org/2000/svg');
      const withoutNs = svg.replace(' xmlns="http://www.w3.org/2000/svg"', '');
      expect(withoutNs).not.toMatch(/https?:/);
      expect(withoutNs).not.toMatch(/href|@import|url\(|<text|<style|<script|font/i);
    },
  );

  it('omits the background rect when transparent', () => {
    expect(
      svgFor({ payload: CORPUS.url[0]!, ecc: 'M', style: { ...BRAND_STYLE, bg: 'transparent' } }),
    ).not.toContain('<rect');
  });

  it('marks the three eyes for the unfurl animation', () => {
    const svg = svgFor({ payload: CORPUS.url[0]!, ecc: 'M', style: BRAND_STYLE });
    expect(svg.match(/class="eye"/g)).toHaveLength(3);
  });
});

describe('determinism', () => {
  const cases: Array<[string, GenerateInput]> = [
    ['brand url', { payload: CORPUS.url[2]!, ecc: 'Q', style: BRAND_STYLE }],
    ['classic url', { payload: CORPUS.url[2]!, ecc: 'Q', style: CLASSIC_STYLE }],
    [
      'rounded dot text',
      { payload: CORPUS.text[0]!, ecc: 'H', style: { ...BRAND_STYLE, modules: 'rounded', eye: 'dot' } },
    ],
    [
      'square leaf wifi transparent',
      { payload: CORPUS.wifi[0]!, ecc: 'L', style: { ...BRAND_STYLE, modules: 'square', bg: 'transparent' } },
    ],
    [
      'dots square geo uppercase colours',
      {
        payload: CORPUS.geo[1]!,
        ecc: 'M',
        style: { ...BRAND_STYLE, eye: 'square', fg: '#ABC', eyeColor: '#1A2B3C' },
      },
    ],
  ];

  it.each(cases)('%s matches its snapshot', (_name, input) => {
    const svg = svgFor(input);
    expect(svgFor(input)).toBe(svg);
    expect(svg).toMatchSnapshot();
  });
});
