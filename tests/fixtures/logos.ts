import { Resvg } from '@resvg/resvg-js';
import type { LogoImage } from '../../src/core';

function png(svg: string, width: number, height: number): LogoImage {
  const data = new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
  return { dataUrl: `data:image/png;base64,${Buffer.from(data).toString('base64')}`, width, height };
}

/** Worst case: opaque, dark and filling its whole box, with a pattern that could confuse a finder search. */
export const SOLID_LOGO = png(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#10201a"/><rect x="40" y="40" width="120" height="120" fill="#ffffff"/><rect x="70" y="70" width="60" height="60" fill="#10201a"/></svg>',
  200,
  200,
);

/** Wide logo with a transparent background. */
export const WIDE_LOGO = png(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect x="10" y="20" width="380" height="120" rx="60" fill="#B3261E"/></svg>',
  400,
  160,
);
