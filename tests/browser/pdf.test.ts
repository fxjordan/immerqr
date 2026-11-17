import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, CLASSIC_STYLE, exportPdf, generate, isGenerateError } from '../../src/core';
import type { CodeStyle, GenerateResult, PdfPage } from '../../src/core';
import { decodeBoth } from './decode';
import { darkBoxMm, renderPdf } from './pdf';

function code(style: CodeStyle = CLASSIC_STYLE): GenerateResult {
  const r = generate({
    payload: { kind: 'url', url: 'https://example.com/speisekarte?tisch=12' },
    ecc: 'Q',
    style,
  });
  if (isGenerateError(r)) throw new Error(r.code);
  return r;
}

const PAGES: Array<[PdfPage, number, [number, number]]> = [
  ['A4', 50, [210, 297]],
  ['Letter', 80, [215.9, 279.4]],
  ['fit', 20, [20, 20]],
  ['fit', 37.5, [37.5, 37.5]],
];

describe('exportPdf', () => {
  it.each(PAGES)('%s with a %s mm code: page and code size match', async (page, sizeMm, pageMm) => {
    const r = code();
    const pdf = await renderPdf(await exportPdf(r, { page, sizeMm }));
    expect(pdf.pageMm[0]).toBeCloseTo(pageMm[0], 1);
    expect(pdf.pageMm[1]).toBeCloseTo(pageMm[1], 1);
    const total = r.size + 8;
    const symbolMm = (sizeMm * r.size) / total;
    const box = darkBoxMm(pdf);
    expect(Math.abs(box.w - symbolMm)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(box.h - symbolMm)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(box.x - ((pageMm[0] - sizeMm) / 2 + (4 * sizeMm) / total))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(box.y - ((pageMm[1] - sizeMm) / 2 + (4 * sizeMm) / total))).toBeLessThanOrEqual(0.1);
  });

  it.each([
    ['brand', BRAND_STYLE],
    ['classic', CLASSIC_STYLE],
    ['rounded/dot', { ...BRAND_STYLE, modules: 'rounded', eye: 'dot' }],
  ] as Array<[string, CodeStyle]>)('%s: modules are vector paths and decode', async (_name, style) => {
    const r = code(style);
    const pdf = await renderPdf(await exportPdf(r, { page: 'fit', sizeMm: 40 }), 25);
    expect(pdf.images).toBe(0);
    expect(pdf.fills).toBeGreaterThan(0);
    expect(await decodeBoth(pdf.image)).toEqual({ jsqr: r.text, zxing: r.text });
  });

  it('embeds a logo as the only image', async () => {
    const c = new OffscreenCanvas(64, 64);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#b3261e';
    ctx.fillRect(0, 0, 64, 64);
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      void c.convertToBlob({ type: 'image/png' }).then((b) => reader.readAsDataURL(b));
    });
    const r = generate({
      payload: { kind: 'url', url: 'https://example.com/speisekarte?tisch=12' },
      ecc: 'H',
      style: BRAND_STYLE,
      logo: { image: { dataUrl, width: 64, height: 64 }, scale: 0.25, plate: true, platePadding: 0.5 },
    });
    if (isGenerateError(r)) throw new Error(r.code);
    const pdf = await renderPdf(await exportPdf(r, { page: 'A4', sizeMm: 60 }), 10);
    expect(pdf.images).toBe(1);
    expect(await decodeBoth(pdf.image)).toEqual({ jsqr: r.text, zxing: r.text });
  });

  it('rejects a code larger than the page', async () => {
    await expect(exportPdf(code(), { page: 'A4', sizeMm: 211 })).rejects.toThrow(RangeError);
    await expect(exportPdf(code(), { page: 'fit', sizeMm: 0 })).rejects.toThrow(RangeError);
  });
});
