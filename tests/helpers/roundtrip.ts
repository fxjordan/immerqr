import { expect, it } from 'vitest';
import { BRAND_STYLE, encodePayload, generate, isGenerateError } from '../../src/core';
import type { Ecc, EyeStyle, ModuleStyle, Payload } from '../../src/core';
import { decodeJsqr, decodeZxing, rasterise } from './decode';

export const ECCS: Ecc[] = ['L', 'M', 'Q', 'H'];
export const MODULE_STYLES: ModuleStyle[] = ['dots', 'square', 'rounded'];
export const EYE_STYLES: EyeStyle[] = ['leaf', 'square', 'dot'];
export const SIZES_PX = [300, 1000];

/** Below this a raster is too coarse for any decoder; such sizes are skipped and reported. */
export const MIN_PX_PER_MODULE = 2.5;

export interface Decoded {
  px: number;
  jsqr: string | null;
  zxing: string | null;
}

/**
 * Rasterises at every size with enough pixels per module and decodes with both decoders.
 * `snap` rounds each size to a whole number of pixels per module: jsQR misreads large versions at some
 * fractional ratios (v40 at 5.4 px per module) while reading every integer ratio from 5 px on.
 */
export async function decodeAll(
  svg: string,
  totalModules: number,
  opts: { snap?: boolean } = {},
): Promise<{ decoded: Decoded[]; skipped: number[] }> {
  const decoded: Decoded[] = [];
  const skipped: number[] = [];
  for (const target of SIZES_PX) {
    const px = opts.snap ? Math.round(target / totalModules) * totalModules : target;
    if (px / totalModules < MIN_PX_PER_MODULE) {
      skipped.push(target);
      continue;
    }
    const img = rasterise(svg, px);
    decoded.push({ px, jsqr: decodeJsqr(img), zxing: await decodeZxing(img) });
  }
  return { decoded, skipped };
}

function label(p: Payload): string {
  return JSON.stringify(p).slice(0, 60);
}

/** One test per payload × ECC: every module and eye style must decode to the exact `encodePayload` output. */
export function roundTripSuite(payloads: Payload[]): void {
  for (const payload of payloads) {
    for (const ecc of ECCS) {
      it.concurrent(`${ecc} ${label(payload)}`, async () => {
        const expected = encodePayload(payload);
        const failures: string[] = [];
        for (const modules of MODULE_STYLES) {
          for (const eye of EYE_STYLES) {
            const r = generate({ payload, ecc, style: { ...BRAND_STYLE, modules, eye } });
            if (isGenerateError(r)) throw new Error(`generate failed: ${r.code}`);
            expect(r.text).toBe(expected);
            const { decoded, skipped } = await decodeAll(r.svg, r.size + 2 * BRAND_STYLE.quietZone);
            if (skipped.length)
              console.info(`v${r.version} ${modules}/${eye}: skipped ${skipped.join(', ')} px`);
            for (const d of decoded) {
              if (d.jsqr !== expected)
                failures.push(`${modules}/${eye} ${d.px}px jsqr=${JSON.stringify(d.jsqr)}`);
              if (d.zxing !== expected)
                failures.push(`${modules}/${eye} ${d.px}px zxing=${JSON.stringify(d.zxing)}`);
            }
          }
        }
        expect(failures).toEqual([]);
      });
    }
  }
}
