/** Size arithmetic for the export settings, in the units the controls show. */

export { MIN_MODULE_MM, MIN_MODULE_PX, printPx } from './core';

export type PrintUnit = 'mm' | 'cm';

export function toMm(value: number, unit: PrintUnit): number {
  return unit === 'cm' ? value * 10 : value;
}

/** Whole pixels per module for a PNG of `px`, as core's exportPng computes it. */
export function modulePx(px: number, totalModules: number): number {
  return Math.floor(px / totalModules);
}

export function moduleMm(mm: number, totalModules: number): number {
  return mm / totalModules;
}
