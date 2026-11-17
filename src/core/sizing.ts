import { totalModules } from './raster';
import type { GenerateResult, StyleWarning } from './types';

/** Below these, phone cameras struggle to resolve single modules. */
export const MIN_MODULE_PX = 4;
export const MIN_MODULE_MM = 0.4;

export const MM_PER_INCH = 25.4;

/** Pixels needed to print `mm` at `dpi`, rounded to the nearest pixel. */
export function printPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** Warnings for a chosen output size: pixels for a PNG, millimetres for print or PDF. */
export function exportWarnings(result: GenerateResult, size: { px?: number; mm?: number }): StyleWarning[] {
  const total = totalModules(result);
  const tooSmallPx = size.px !== undefined && Math.floor(size.px / total) < MIN_MODULE_PX;
  const tooSmallMm = size.mm !== undefined && size.mm / total < MIN_MODULE_MM;
  return tooSmallPx || tooSmallMm ? ['low-module-px'] : [];
}
