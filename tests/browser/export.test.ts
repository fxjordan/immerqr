import { describe, expect, it } from 'vitest';
import {
  BRAND_STYLE,
  CLASSIC_STYLE,
  exportPng,
  exportSvg,
  generate,
  isGenerateError,
  scanCheck,
} from '../../src/core';
import type { CodeStyle, EyeStyle, GenerateResult, ModuleStyle } from '../../src/core';
import { decodeBoth, pixels } from './decode';

function code(style: CodeStyle = BRAND_STYLE, url = 'https://example.com/größe?a=1&b=2#x'): GenerateResult {
  const r = generate({ payload: { kind: 'url', url }, ecc: 'Q', style });
  if (isGenerateError(r)) throw new Error(r.code);
  return r;
}

describe('exportPng', () => {
  it.each([300, 512, 1000, 1024, 2048])('is exactly %i px and decodes', async (sizePx) => {
    const r = code();
    const total = r.size + 8;
    const { blob, modulePx } = await exportPng(r, { sizePx });
    expect(blob.type).toBe('image/png');
    expect(modulePx).toBe(Math.floor(sizePx / total));
    const img = await pixels(blob);
    expect([img.width, img.height]).toEqual([sizePx, sizePx]);
    expect(await decodeBoth(img)).toEqual({ jsqr: r.text, zxing: r.text });
  });

  it('pads the remainder with the background colour', async () => {
    const r = code({ ...BRAND_STYLE, bg: '#fafad2' });
    const { blob } = await exportPng(r, { sizePx: 1000 });
    const img = await pixels(blob);
    expect(Array.from(img.data.slice(0, 4))).toEqual([0xfa, 0xfa, 0xd2, 255]);
    const last = (img.width * img.height - 1) * 4;
    expect(Array.from(img.data.slice(last, last + 4))).toEqual([0xfa, 0xfa, 0xd2, 255]);
  });

  it('keeps the padding transparent for a transparent code', async () => {
    const { blob } = await exportPng(code({ ...BRAND_STYLE, bg: 'transparent' }), { sizePx: 1000 });
    const bmp = await createImageBitmap(blob);
    const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    expect(ctx.getImageData(0, 0, 1, 1).data[3]).toBe(0);
  });

  it('draws module edges on whole pixels', async () => {
    const r = code(CLASSIC_STYLE);
    const { blob, modulePx } = await exportPng(r, { sizePx: 1000 });
    const img = await pixels(blob);
    const offset = Math.floor((1000 - (r.size + 8) * modulePx) / 2);
    // The top-left finder ring starts after the 4-module quiet zone; no grey anti-aliasing at its edge.
    const at = (x: number, y: number) => img.data[(y * img.width + x) * 4]!;
    const edge = offset + 4 * modulePx;
    expect(at(edge - 1, edge + 2)).toBe(255);
    expect(at(edge, edge + 2)).toBe(0);
  });

  it('rejects sizes below one pixel per module', async () => {
    await expect(exportPng(code(), { sizePx: 20 })).rejects.toThrow(RangeError);
  });
});

describe('exportSvg', () => {
  it('is an SVG file that decodes', async () => {
    const r = code();
    const blob = exportSvg(r);
    expect(blob.type).toBe('image/svg+xml');
    const text = await blob.text();
    expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<svg')).toBe(true);
    expect(await decodeBoth(await pixels(new Blob([text], { type: 'image/svg+xml' })))).toEqual({
      jsqr: r.text,
      zxing: r.text,
    });
  });
});

describe('scanCheck', () => {
  const modules: ModuleStyle[] = ['dots', 'square', 'rounded'];
  const eyes: EyeStyle[] = ['leaf', 'square', 'dot'];

  it.each(modules.flatMap((m) => eyes.map((e) => [m, e] as const)))('reads %s/%s', async (m, e) => {
    const r = code({ ...BRAND_STYLE, modules: m, eye: e });
    expect(await scanCheck(r.svg)).toEqual({ ok: true, text: r.text });
  });

  it('reads a transparent code', async () => {
    const r = code({ ...BRAND_STYLE, bg: 'transparent' });
    expect(await scanCheck(r.svg)).toEqual({ ok: true, text: r.text });
  });

  it('reports failure for an unreadable code', async () => {
    const r = code({ ...BRAND_STYLE, fg: '#ffffff', eyeColor: '#ffffff' });
    expect(await scanCheck(r.svg)).toEqual({ ok: false });
  });
});

describe('logo in exports', () => {
  async function logoDataUrl(): Promise<string> {
    const c = new OffscreenCanvas(100, 100);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#b3261e';
    ctx.fillRect(0, 0, 100, 100);
    const blob = await c.convertToBlob({ type: 'image/png' });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  it('renders the logo into the PNG and still decodes', async () => {
    const dataUrl = await logoDataUrl();
    const r = generate({
      payload: { kind: 'url', url: 'https://example.com/speisekarte?tisch=12' },
      ecc: 'Q',
      style: BRAND_STYLE,
      logo: { image: { dataUrl, width: 100, height: 100 }, scale: 0.25, plate: true, platePadding: 0.5 },
    });
    if (isGenerateError(r)) throw new Error(r.code);
    const { blob } = await exportPng(r, { sizePx: 1000 });
    const img = await pixels(blob);
    const centre = (500 * 1000 + 500) * 4;
    expect(Array.from(img.data.slice(centre, centre + 3))).toEqual([0xb3, 0x26, 0x1e]);
    expect(await decodeBoth(img)).toEqual({ jsqr: r.text, zxing: r.text });
    expect(await scanCheck(r.svg)).toEqual({ ok: true, text: r.text });
  });
});
