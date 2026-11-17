import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export const MM_PER_PT = 25.4 / 72;

export interface RenderedPdf {
  /** Page size from the MediaBox, in mm. */
  pageMm: [number, number];
  /** Number of raster images painted on the page. */
  images: number;
  /** Number of fill operations (vector paths and rects). */
  fills: number;
  image: ImageData;
  /** Pixels per mm of `image`. */
  pxPerMm: number;
}

export async function renderPdf(blob: Blob, pxPerMm = 20): Promise<RenderedPdf> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const page = await pdf.getPage(1);
  const [x0, y0, x1, y1] = page.view as [number, number, number, number];
  const ops = await page.getOperatorList();
  const count = (...codes: number[]) => ops.fnArray.filter((f) => codes.includes(f)).length;
  const viewport = page.getViewport({ scale: pxPerMm * MM_PER_PT });
  const canvas = new OffscreenCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvas: canvas as unknown as HTMLCanvasElement, canvasContext: ctx as never, viewport })
    .promise;
  return {
    pageMm: [(x1 - x0) * MM_PER_PT, (y1 - y0) * MM_PER_PT],
    images: count(pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject),
    fills: count(pdfjs.OPS.fill, pdfjs.OPS.eoFill, pdfjs.OPS.constructPath),
    image: ctx.getImageData(0, 0, canvas.width, canvas.height),
    pxPerMm,
  };
}

/** Bounding box of pixels darker than mid-grey, in mm. */
export function darkBoxMm(r: RenderedPdf): { x: number; y: number; w: number; h: number } {
  const { data, width, height } = r.image;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4]! < 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const s = r.pxPerMm;
  return { x: minX / s, y: minY / s, w: (maxX + 1 - minX) / s, h: (maxY + 1 - minY) / s };
}
