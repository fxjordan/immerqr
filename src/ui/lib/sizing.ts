/** Size arithmetic for the export settings, in the units the controls show. */

export const MIN_MODULE_PX = 4;
export const MIN_MODULE_MM = 0.4;
const MM_PER_INCH = 25.4;

export type PrintUnit = 'mm' | 'cm';

export function toMm(value: number, unit: PrintUnit): number {
  return unit === 'cm' ? value * 10 : value;
}

export function printPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** Whole pixels per module for a PNG of `px`, as core's exportPng computes it. */
export function modulePx(px: number, totalModules: number): number {
  return Math.floor(px / totalModules);
}

export function moduleMm(mm: number, totalModules: number): number {
  return mm / totalModules;
}
