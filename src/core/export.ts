import { drawCode, totalModules } from './raster';
import type { GenerateResult } from './types';

export function exportSvg(result: GenerateResult): Blob {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${result.svg}`], { type: 'image/svg+xml' });
}

function background(svg: string): string | null {
  return /^<svg[^>]*><rect width="\d+" height="\d+" fill="(#[0-9a-f]{6})"\/>/.exec(svg)?.[1] ?? null;
}

/**
 * PNG of exactly `sizePx` square. Modules get a whole number of pixels so every edge stays crisp;
 * the remainder is padded with the background colour (transparent for a transparent code).
 * Throws a RangeError when `sizePx` gives less than one pixel per module.
 */
export async function exportPng(
  result: GenerateResult,
  opts: { sizePx: number },
): Promise<{ blob: Blob; modulePx: number }> {
  const total = totalModules(result);
  const modulePx = Math.floor(opts.sizePx / total);
  if (!Number.isInteger(opts.sizePx) || modulePx < 1) {
    throw new RangeError(`PNG needs at least ${total} px for this code`);
  }
  const canvas = await drawCode(result.svg, total, modulePx, opts.sizePx, background(result.svg));
  return { blob: await canvas.convertToBlob({ type: 'image/png' }), modulePx };
}
