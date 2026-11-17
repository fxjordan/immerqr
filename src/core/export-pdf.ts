import type { jsPDF as JsPdf } from 'jspdf';
import { totalModules } from './raster';
import type { GenerateResult } from './types';

export type PdfPage = 'A4' | 'Letter' | 'fit';

const PAGE_MM: Record<Exclude<PdfPage, 'fit'>, [number, number]> = {
  A4: [210, 297],
  Letter: [215.9, 279.4],
};

type Point = [number, number];
type Segment =
  { op: 'M'; p: Point } | { op: 'L'; p: Point } | { op: 'C'; c1: Point; c2: Point; p: Point } | { op: 'Z' };

/** Circular arc from `from` to `to` (SVG endpoint form, rx = ry, no rotation) as ≤ 90° cubic Béziers. */
function arcToCubics(from: Point, r: number, large: boolean, sweep: boolean, to: Point): Segment[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const hx = (x1 - x2) / 2;
  const hy = (y1 - y2) / 2;
  const radius = Math.max(r, Math.hypot(hx, hy));
  const d2 = hx * hx + hy * hy;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (radius * radius - d2) / d2));
  const cx = coef * hy + (x1 + x2) / 2;
  const cy = -coef * hx + (y1 + y2) / 2;
  const start = Math.atan2(y1 - cy, x1 - cx);
  let delta = Math.atan2(y2 - cy, x2 - cx) - start;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  const count = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9));
  const step = delta / count;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: Segment[] = [];
  for (let i = 0; i < count; i++) {
    const a = start + i * step;
    const b = a + step;
    const p0: Point = [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
    const p3: Point = i === count - 1 ? to : [cx + radius * Math.cos(b), cy + radius * Math.sin(b)];
    out.push({
      op: 'C',
      c1: [p0[0] - k * radius * Math.sin(a), p0[1] + k * radius * Math.cos(a)],
      c2: [p3[0] + k * radius * Math.sin(b), p3[1] - k * radius * Math.cos(b)],
      p: p3,
    });
  }
  return out;
}

/** Parses the path subset the SVG renderer emits: absolute `M`, relative `h v a`, and `z`. */
export function parsePath(d: string): Segment[] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
  const out: Segment[] = [];
  let i = 0;
  let cur: Point = [0, 0];
  let startOfSub: Point = [0, 0];
  const num = () => {
    const t = tokens[i++];
    if (t === undefined || /[a-zA-Z]/.test(t)) throw new Error(`malformed path near token ${i}`);
    return Number(t);
  };
  let cmd = '';
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i]!)) cmd = tokens[i++]!;
    switch (cmd) {
      case 'M':
        cur = [num(), num()];
        startOfSub = cur;
        out.push({ op: 'M', p: cur });
        cmd = 'L';
        break;
      case 'h':
        cur = [cur[0] + num(), cur[1]];
        out.push({ op: 'L', p: cur });
        break;
      case 'v':
        cur = [cur[0], cur[1] + num()];
        out.push({ op: 'L', p: cur });
        break;
      case 'a': {
        const rx = num();
        num(); // ry equals rx in every arc the renderer draws
        num(); // no rotation
        const large = num() === 1;
        const sweep = num() === 1;
        const to: Point = [cur[0] + num(), cur[1] + num()];
        out.push(...arcToCubics(cur, rx, large, sweep, to));
        cur = to;
        break;
      }
      case 'z':
      case 'Z':
        out.push({ op: 'Z' });
        cur = startOfSub;
        cmd = '';
        break;
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return out;
}

function attr(el: Element, name: string): number {
  return Number(el.getAttribute(name) ?? 0);
}

/** jsPDF embeds PNG and JPEG directly; any other format is rasterised to PNG first. */
async function pdfImage(
  dataUrl: string,
  w: number,
  h: number,
): Promise<{ data: string; format: 'PNG' | 'JPEG' }> {
  if (dataUrl.startsWith('data:image/png')) return { data: dataUrl, format: 'PNG' };
  if (dataUrl.startsWith('data:image/jpeg')) return { data: dataUrl, format: 'JPEG' };
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = 1024 / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { data: canvas.toDataURL('image/png'), format: 'PNG' };
}

function drawPath(doc: JsPdf, segments: Segment[], map: (p: Point) => Point): void {
  for (const s of segments) {
    if (s.op === 'Z') {
      doc.close();
      continue;
    }
    const [x, y] = map(s.p);
    if (s.op === 'M') doc.moveTo(x, y);
    else if (s.op === 'L') doc.lineTo(x, y);
    else doc.curveTo(...map(s.c1), ...map(s.c2), x, y);
  }
}

/**
 * Vector PDF with the code `sizeMm` wide (quiet zone included), centred on an A4 or Letter page,
 * or on a page of exactly the code's size. Modules are filled paths; only a logo is a raster image.
 */
export async function exportPdf(
  result: GenerateResult,
  opts: { page: PdfPage; sizeMm: number },
): Promise<Blob> {
  const [pageW, pageH] = opts.page === 'fit' ? [opts.sizeMm, opts.sizeMm] : PAGE_MM[opts.page];
  if (!(opts.sizeMm > 0) || opts.sizeMm > Math.min(pageW, pageH)) {
    throw new RangeError(`code size must be between 0 and ${Math.min(pageW, pageH)} mm`);
  }
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    unit: 'mm',
    format: [pageW, pageH],
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    compress: true,
  });
  doc.setProperties({ title: 'QR code', creator: 'ImmerQR' });

  const total = totalModules(result);
  const scale = opts.sizeMm / total;
  const ox = (pageW - opts.sizeMm) / 2;
  const oy = (pageH - opts.sizeMm) / 2;
  const map = ([x, y]: Point): Point => [ox + x * scale, oy + y * scale];

  const svg = new DOMParser().parseFromString(result.svg, 'image/svg+xml').documentElement;
  for (const el of Array.from(svg.children)) {
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none') doc.setFillColor(fill);
    switch (el.tagName) {
      case 'rect': {
        const [x, y] = map([attr(el, 'x'), attr(el, 'y')]);
        doc.rect(x, y, attr(el, 'width') * scale, attr(el, 'height') * scale, 'F');
        break;
      }
      case 'path':
        drawPath(doc, parsePath(el.getAttribute('d') ?? ''), map);
        if (el.getAttribute('fill-rule') === 'evenodd') doc.fillEvenOdd();
        else doc.fill();
        break;
      case 'image': {
        const w = attr(el, 'width');
        const h = attr(el, 'height');
        const [x, y] = map([attr(el, 'x'), attr(el, 'y')]);
        const img = await pdfImage(el.getAttribute('href') ?? '', w, h);
        doc.addImage(img.data, img.format, x, y, w * scale, h * scale);
        break;
      }
      default:
        throw new Error(`unexpected SVG element ${el.tagName}`);
    }
  }
  return doc.output('blob');
}
