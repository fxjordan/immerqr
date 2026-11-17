import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, CLASSIC_STYLE, generate, isGenerateError } from '../../src/core';
import type { CodeStyle, Ecc, GenerateResult, Logo } from '../../src/core';
import { URLS } from '../fixtures/corpus';
import { SOLID_LOGO, WIDE_LOGO } from '../fixtures/logos';
import { decodeAll, EYE_STYLES, MODULE_STYLES } from '../helpers/roundtrip';

const logo = (over: Partial<Logo> = {}): Logo => ({
  image: SOLID_LOGO,
  scale: 0.25,
  plate: true,
  platePadding: 0.5,
  ...over,
});

function run(url: string, l: Logo, style: CodeStyle = BRAND_STYLE, ecc: Ecc = 'H'): GenerateResult {
  const r = generate({ payload: { kind: 'url', url }, ecc, style, logo: l });
  if (isGenerateError(r)) throw new Error(r.code);
  return r;
}

describe('logo decodes at ECC H', () => {
  for (const [name, style] of [
    ['brand', BRAND_STYLE],
    ['classic', CLASSIC_STYLE],
  ] as const) {
    for (const padding of [0.5, 1]) {
      it.concurrent.each(URLS)(`${name}, padding ${padding}: %s`, async (url) => {
        const r = run(url, logo({ platePadding: padding }), style);
        const { decoded } = await decodeAll(r.svg, r.size + 8);
        for (const d of decoded) {
          expect(d.jsqr, `v${r.version} jsqr ${d.px}px`).toBe(r.text);
          expect(d.zxing, `v${r.version} zxing ${d.px}px`).toBe(r.text);
        }
      });
    }
  }
});

describe('logo on the smallest codes, every style', () => {
  const short = ['a', 'http://a.de', 'https://x.io', 'HTTPS://X.IO/A'];
  it.concurrent.each(MODULE_STYLES.flatMap((modules) => EYE_STYLES.map((eye) => [modules, eye] as const)))(
    '%s/%s',
    async (modules, eye) => {
      for (const url of short) {
        const r = run(url, logo(), { ...BRAND_STYLE, modules, eye });
        const { decoded } = await decodeAll(r.svg, r.size + 8);
        for (const d of decoded) {
          expect(d.jsqr, `${url} v${r.version} jsqr ${d.px}px`).toBe(r.text);
          expect(d.zxing, `${url} v${r.version} zxing ${d.px}px`).toBe(r.text);
        }
      }
    },
  );
});

describe('logo rules', () => {
  it('rejects a scale above 0.25', () => {
    expect(
      generate({
        payload: { kind: 'url', url: URLS[0]! },
        ecc: 'H',
        style: BRAND_STYLE,
        logo: logo({ scale: 0.26 }),
      }),
    ).toEqual({ code: 'logo-too-large', maxScale: 0.25 });
  });

  it('forces ECC H and says so', () => {
    for (const ecc of ['L', 'M', 'Q'] as const) {
      const r = run(URLS[0]!, logo(), BRAND_STYLE, ecc);
      expect(r.ecc).toBe('H');
      expect(r.warnings).toContain('ecc-raised-for-logo');
    }
    expect(run(URLS[0]!, logo(), BRAND_STYLE, 'H').warnings).not.toContain('ecc-raised-for-logo');
  });

  it('snaps the plate to whole modules centred on the grid', () => {
    const r = run(URLS[2]!, logo());
    const plate = /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="#ffffff"\/>/.exec(r.svg);
    expect(plate).not.toBeNull();
    const [x, y, w, h] = plate!.slice(1).map(Number) as [number, number, number, number];
    expect(w).toBe(h);
    expect(w).toBeGreaterThanOrEqual(0.25 * r.size + 1);
    expect(x - 4 + w / 2).toBe(r.size / 2);
    expect(y).toBe(x);
  });

  it('keeps a wide logo inside its box without a plate', () => {
    const r = run(URLS[2]!, logo({ image: WIDE_LOGO, plate: false }));
    expect(r.svg).not.toContain('fill="#ffffff"/><image');
    const img =
      /<image href="data:image\/png;base64,[^"]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(
        r.svg,
      );
    const [, , , w, h] = img!.map(Number);
    expect(w).toBeCloseTo(0.25 * r.size, 2);
    expect(h).toBeCloseTo((0.25 * r.size * 160) / 400, 2);
  });

  it('embeds the logo only as a data URL', () => {
    expect(() =>
      generate({
        payload: { kind: 'url', url: URLS[0]! },
        ecc: 'H',
        style: BRAND_STYLE,
        logo: logo({ image: { dataUrl: 'https://evil.example/logo.png', width: 1, height: 1 } }),
      }),
    ).toThrow(TypeError);
  });
});
