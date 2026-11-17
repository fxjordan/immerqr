import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

const require = createRequire(import.meta.url);

// Load the wasm from node_modules; the package default would fetch it from a CDN.
prepareZXingModule({
  overrides: { wasmBinary: readFileSync(require.resolve('zxing-wasm/reader/zxing_reader.wasm')).buffer },
});

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Rasterises an SVG to `widthPx` on white, as a phone camera would see a printed code. */
export function rasterise(svg: string, widthPx: number): Raster {
  const img = new Resvg(svg, {
    fitTo: { mode: 'width', value: widthPx },
    background: '#ffffff',
    font: { loadSystemFonts: false },
  }).render();
  return { data: new Uint8ClampedArray(img.pixels), width: img.width, height: img.height };
}

export function decodeJsqr(r: Raster): string | null {
  return jsQR(r.data, r.width, r.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

export async function decodeZxing(r: Raster): Promise<string | null> {
  const results = await readBarcodes(
    { data: r.data, width: r.width, height: r.height, colorSpace: 'srgb' } as ImageData,
    { formats: ['QRCode'], maxNumberOfSymbols: 1 },
  );
  return results[0]?.text ?? null;
}
