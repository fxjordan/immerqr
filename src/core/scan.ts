import { drawCode, totalModules } from './raster';

/** Pixels per module for the scan check; jsQR reads every whole-number ratio from 5 on. */
const SCAN_MODULE_PX = 6;

/** Decodes the SVG the way a simple scanner would; a transparent code is judged on white. */
export async function scanCheck(svg: string): Promise<{ ok: true; text: string } | { ok: false }> {
  const total = totalModules({ svg });
  const px = total * SCAN_MODULE_PX;
  const canvas = await drawCode(svg, total, SCAN_MODULE_PX, px, '#ffffff');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false };
  const { data } = ctx.getImageData(0, 0, px, px);
  const { default: jsQR } = await import('jsqr');
  const found = jsQR(data, px, px, { inversionAttempts: 'dontInvert' });
  return found ? { ok: true, text: found.data } : { ok: false };
}
