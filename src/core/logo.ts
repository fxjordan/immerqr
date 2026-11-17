import type { LogoPlacement } from './render-svg';
import type { Logo } from './types';

export const MAX_LOGO_SCALE = 0.25;

/**
 * Smallest QR version used with a logo. Version 2 fails decode tests because the plate hides too much;
 * version 3 passes them, 4 leaves a margin for real cameras.
 */
export const LOGO_MIN_VERSION = 4;

/** Smallest whole number ≥ `min` that centres on a `size`-module grid (same parity as `size`). */
function snapToGrid(min: number, size: number): number {
  let n = Math.ceil(min - 1e-9);
  if ((size - n) % 2 !== 0) n++;
  return n;
}

/** Throws for logo settings no control can produce. */
export function assertValidLogo(logo: Logo): void {
  const { width, height } = logo.image;
  if (!(width > 0 && height > 0)) throw new RangeError('logo image needs a positive size');
  if (!(logo.scale > 0)) throw new RangeError('logo scale must be positive');
  if (!(logo.platePadding >= 0)) throw new RangeError('plate padding must be ≥ 0');
  if (!logo.image.dataUrl.startsWith('data:image/')) throw new TypeError('logo must be an image data URL');
}

/**
 * Centres the logo on a `size`-module symbol. Its longer side is `scale × size` modules;
 * the plate adds `platePadding` on every side and grows to whole modules so no module is cut.
 */
export function placeLogo(logo: Logo, size: number): LogoPlacement {
  const side = logo.scale * size;
  const aspect = logo.image.width / logo.image.height;
  const width = aspect >= 1 ? side : side * aspect;
  const height = aspect >= 1 ? side / aspect : side;
  let plate: LogoPlacement['plate'] = null;
  if (logo.plate) {
    const pw = snapToGrid(width + 2 * logo.platePadding, size);
    const ph = snapToGrid(height + 2 * logo.platePadding, size);
    plate = { x: (size - pw) / 2, y: (size - ph) / 2, width: pw, height: ph };
  }
  return { dataUrl: logo.image.dataUrl, x: (size - width) / 2, y: (size - height) / 2, width, height, plate };
}
