import jsQR from 'jsqr';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Serve the wasm from the dev server; the package default would fetch it from a CDN.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
  },
});

async function load(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (blob.type !== 'image/svg+xml') return createImageBitmap(blob);
  // Chrome's createImageBitmap does not decode SVG.
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

/** Draws an image file onto white and returns its pixels at the file's own size. */
export async function pixels(blob: Blob): Promise<ImageData> {
  const bmp = await load(blob);
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, bmp.width, bmp.height);
  ctx.drawImage(bmp, 0, 0);
  return ctx.getImageData(0, 0, bmp.width, bmp.height);
}

export async function decodeBoth(img: ImageData): Promise<{ jsqr: string | null; zxing: string | null }> {
  const jsqr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
  const results = await readBarcodes(img, { formats: ['QRCode'], maxNumberOfSymbols: 1 });
  return { jsqr, zxing: results[0]?.text ?? null };
}
