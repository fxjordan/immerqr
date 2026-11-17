import type { CodeStyle, StyleWarning } from './types';

export const MIN_QUIET_ZONE = 4;
export const MIN_CONTRAST = 4.5;

const FIR = '#0F3B2C';
const MOSS = '#2F7D4F';

/** "Blatt im Auge": the brand style simple mode uses. */
export const BRAND_STYLE: Readonly<CodeStyle> = Object.freeze({
  modules: 'dots',
  eye: 'leaf',
  fg: FIR,
  eyeColor: MOSS,
  bg: '#FFFFFF',
  quietZone: MIN_QUIET_ZONE,
});

/** "Klassisch": plain black squares on white. */
export const CLASSIC_STYLE: Readonly<CodeStyle> = Object.freeze({
  modules: 'square',
  eye: 'square',
  fg: '#000000',
  eyeColor: '#000000',
  bg: '#FFFFFF',
  quietZone: MIN_QUIET_ZONE,
});

type Rgb = readonly [number, number, number];

/** Parses `#rgb` or `#rrggbb`; throws on anything else, since colour inputs never produce other forms. */
export function parseHex(color: string): Rgb {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!m?.[1]) throw new TypeError(`unsupported colour: ${color}`);
  const hex =
    m[1].length === 3
      ? m[1]
          .split('')
          .map((c) => c + c)
          .join('')
      : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;
}

/** Normalised lower-case `#rrggbb`, so equal colours serialise identically. */
export function normalizeHex(color: string): string {
  return `#${parseHex(color)
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** WCAG 2 relative luminance. */
export function luminance(color: string): number {
  const [r, g, b] = parseHex(color).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Throws for a style no control can produce: unknown colours or a quiet zone under 4 modules. */
export function assertValidStyle(style: CodeStyle): void {
  if (!Number.isInteger(style.quietZone) || style.quietZone < MIN_QUIET_ZONE) {
    throw new RangeError(`quiet zone must be an integer ≥ ${MIN_QUIET_ZONE}`);
  }
  parseHex(style.fg);
  parseHex(style.eyeColor);
  if (style.bg !== 'transparent') parseHex(style.bg);
}

/**
 * Colour warnings. A transparent background is judged as white, the surface most codes end up on.
 * `inverted`: modules lighter than the background, which many scanners do not read.
 */
export function styleWarnings(style: CodeStyle): StyleWarning[] {
  const bg = style.bg === 'transparent' ? '#FFFFFF' : style.bg;
  const warnings: StyleWarning[] = [];
  const inks = [style.fg, style.eyeColor];
  if (inks.some((ink) => contrastRatio(ink, bg) < MIN_CONTRAST)) warnings.push('low-contrast');
  if (inks.some((ink) => luminance(ink) > luminance(bg))) warnings.push('inverted');
  return warnings;
}
