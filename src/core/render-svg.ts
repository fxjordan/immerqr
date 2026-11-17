import type { Matrix } from './matrix';
import { normalizeHex } from './style';
import type { CodeStyle, EyeStyle, ModuleStyle } from './types';

/** Area left free of modules and filled with the logo, in symbol module coordinates. */
export interface LogoPlacement {
  dataUrl: string;
  /** Logo box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** White plate in whole modules, or `null` when the logo sits directly on the modules. */
  plate: { x: number; y: number; width: number; height: number } | null;
}

const DOT_RADIUS = 0.45;
const ROUNDED_RADIUS = 0.5;

/** Fixed-precision number formatting, so the same input always yields the same bytes. */
function n(v: number): string {
  const s = (Math.round(v * 1000) / 1000).toString();
  return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? `-${s.slice(2)}` : s;
}

function finderOrigins(size: number): Array<[number, number]> {
  return [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
}

/** Centres of the 5×5 alignment patterns (ISO/IEC 18004, annex E), same formula as the vendored encoder. */
export function alignmentCentres(version: number, size: number): Array<[number, number]> {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const pos = [6];
  for (let p = size - 7; pos.length < count; p -= step) pos.splice(1, 0, p);
  const last = pos.length - 1;
  const out: Array<[number, number]> = [];
  pos.forEach((y, i) =>
    pos.forEach((x, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      out.push([x, y]);
    }),
  );
  return out;
}

function inFinder(x: number, y: number, size: number): boolean {
  return (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
}

function squarePath(x: number, y: number): string {
  return `M${n(x)} ${n(y)}h1v1h-1z`;
}

function dotPath(x: number, y: number): string {
  const d = n(DOT_RADIUS * 2);
  return `M${n(x + 0.5 - DOT_RADIUS)} ${n(y + 0.5)}a${n(DOT_RADIUS)} ${n(DOT_RADIUS)} 0 1 0 ${d} 0a${n(DOT_RADIUS)} ${n(DOT_RADIUS)} 0 1 0-${d} 0z`;
}

/** Rectangle `w×h` at `(x, y)` with per-corner radii, drawn clockwise from the top-left. */
function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
): string {
  const arc = (r: number, dx: number, dy: number) =>
    r > 0 ? `a${n(r)} ${n(r)} 0 0 1 ${n(dx)} ${n(dy)}` : '';
  return (
    `M${n(x + tl)} ${n(y)}h${n(w - tl - tr)}${arc(tr, tr, tr)}` +
    `v${n(h - tr - br)}${arc(br, -br, br)}` +
    `h${n(-(w - br - bl))}${arc(bl, -bl, -bl)}` +
    `v${n(-(h - bl - tl))}${arc(tl, tl, -tl)}z`
  );
}

function modulePaths(
  matrix: Matrix,
  style: ModuleStyle,
  qz: number,
  hidden: (x: number, y: number) => boolean,
) {
  const { size, dark } = matrix;
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && dark[y * size + x] === true && !inFinder(x, y, size);
  const parts: string[] = [];
  // Alignment patterns stay square in every style: dotted ones are not found by jsQR.
  const align = new Set<number>();
  if (style !== 'square') {
    for (const [cx, cy] of alignmentCentres(matrix.version, size)) {
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          align.add(y * size + x);
          if (on(x, y) && !hidden(x, y)) parts.push(squarePath(x + qz, y + qz));
        }
    }
  }
  for (let y = 0; y < size; y++) {
    if (style === 'square') {
      // Horizontal runs keep the path short.
      let x = 0;
      while (x < size) {
        if (!on(x, y) || hidden(x, y)) {
          x++;
          continue;
        }
        const start = x;
        while (x < size && on(x, y) && !hidden(x, y)) x++;
        parts.push(`M${start + qz} ${y + qz}h${x - start}v1h-${x - start}z`);
      }
      continue;
    }
    for (let x = 0; x < size; x++) {
      if (!on(x, y) || hidden(x, y) || align.has(y * size + x)) continue;
      if (style === 'dots') {
        parts.push(dotPath(x + qz, y + qz));
      } else {
        const free = (dx: number, dy: number) => !on(x + dx, y) && !on(x, y + dy);
        const r = (dx: number, dy: number) => (free(dx, dy) ? ROUNDED_RADIUS : 0);
        parts.push(roundedRect(x + qz, y + qz, 1, 1, r(-1, -1), r(1, -1), r(1, 1), r(-1, 1)));
      }
    }
  }
  return parts.join('');
}

function ringPath(x: number, y: number): string {
  return `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z`;
}

/**
 * 3×3 finder core. Leaf: top-right and bottom-left corners at full radius, the others nearly square.
 * Rounding the top-left/bottom-right diagonal instead breaks jsQR, which checks finder ratios along it.
 */
function eyePath(style: EyeStyle, x: number, y: number): string {
  switch (style) {
    case 'square':
      return `M${x} ${y}h3v3h-3z`;
    case 'dot':
      // A full circle (radius 1.5) fails jsQR; 0.75 still fails some codes.
      return roundedRect(x, y, 3, 3, 0.6, 0.6, 0.6, 0.6);
    case 'leaf':
      return roundedRect(x, y, 3, 3, 0.25, 1.5, 0.25, 1.5);
  }
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Renders the matrix as a self-contained SVG whose viewBox is in module units, quiet zone included. */
export function renderSvg(matrix: Matrix, style: CodeStyle, logo?: LogoPlacement): string {
  const qz = style.quietZone;
  const total = matrix.size + 2 * qz;
  const fg = normalizeHex(style.fg);
  const eye = normalizeHex(style.eyeColor);
  const plate = logo?.plate;
  const hidden = plate
    ? (x: number, y: number) =>
        x >= plate.x && x < plate.x + plate.width && y >= plate.y && y < plate.y + plate.height
    : () => false;

  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 10}" height="${total * 10}">`,
  ];
  if (style.bg !== 'transparent') {
    out.push(`<rect width="${total}" height="${total}" fill="${normalizeHex(style.bg)}"/>`);
  }
  out.push(`<path fill="${fg}" d="${modulePaths(matrix, style.modules, qz, hidden)}"/>`);
  const origins = finderOrigins(matrix.size);
  out.push(
    `<path fill="${fg}" fill-rule="evenodd" d="${origins.map(([x, y]) => ringPath(x + qz, y + qz)).join('')}"/>`,
  );
  for (const [x, y] of origins) {
    out.push(`<path class="eye" fill="${eye}" d="${eyePath(style.eye, x + qz + 2, y + qz + 2)}"/>`);
  }
  if (logo) {
    if (plate) {
      out.push(
        `<rect x="${plate.x + qz}" y="${plate.y + qz}" width="${plate.width}" height="${plate.height}" fill="#ffffff"/>`,
      );
    }
    out.push(
      `<image href="${escapeAttr(logo.dataUrl)}" x="${n(logo.x + qz)}" y="${n(logo.y + qz)}" width="${n(logo.width)}" height="${n(logo.height)}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }
  out.push('</svg>');
  return out.join('');
}
