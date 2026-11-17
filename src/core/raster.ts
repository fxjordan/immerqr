import type { GenerateResult } from './types';

/** Width of the code in modules, quiet zone included, read from the SVG viewBox. */
export function totalModules(result: Pick<GenerateResult, 'svg'>): number {
  const m = /viewBox="0 0 (\d+) \d+"/.exec(result.svg);
  if (!m?.[1]) throw new Error('SVG without module viewBox');
  return Number(m[1]);
}

function loadSvg(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('SVG could not be loaded'));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Draws the code with a whole number of pixels per module, centred on a `canvasPx` square.
 * The remainder is filled with `fill`, or left transparent when `fill` is null.
 */
export async function drawCode(
  svg: string,
  total: number,
  modulePx: number,
  canvasPx: number,
  fill: string | null,
): Promise<OffscreenCanvas> {
  const canvas = new OffscreenCanvas(canvasPx, canvasPx);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvasPx, canvasPx);
  }
  const codePx = total * modulePx;
  const offset = Math.floor((canvasPx - codePx) / 2);
  ctx.drawImage(await loadSvg(svg), offset, offset, codePx, codePx);
  return canvas;
}
