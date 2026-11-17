import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { decodeJsqr, decodeZxing, rasterise, type Raster } from '../../helpers/decode';

export interface FileDecode {
  jsqr: string | null;
  zxing: string | null;
}

async function both(r: Raster): Promise<FileDecode> {
  return { jsqr: decodeJsqr(r), zxing: await decodeZxing(r) };
}

async function pngRaster(bytes: Buffer): Promise<Raster & { naturalWidth: number }> {
  const img = await loadImage(bytes);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, img.width, img.height);
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  return { data: new Uint8ClampedArray(data), width: img.width, height: img.height, naturalWidth: img.width };
}

async function pdfRaster(bytes: Buffer): Promise<Raster> {
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 4 });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  await page.render({ canvas: canvas as never, canvasContext: ctx as never, viewport }).promise;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: new Uint8ClampedArray(data), width: canvas.width, height: canvas.height };
}

/** Decodes a downloaded PNG, SVG or PDF file with jsQR and zxing-wasm. */
export async function decodeFile(path: string): Promise<FileDecode & { pngSize?: [number, number] }> {
  const bytes = readFileSync(path);
  if (path.endsWith('.png')) {
    const r = await pngRaster(bytes);
    return { ...(await both(r)), pngSize: [r.width, r.height] };
  }
  if (path.endsWith('.svg')) return both(rasterise(bytes.toString('utf8'), 1000));
  if (path.endsWith('.pdf')) return both(await pdfRaster(bytes));
  throw new Error(`unknown file type: ${path}`);
}
