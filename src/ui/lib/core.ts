/**
 * The UI's single entry point into core. Re-exports `src/core/index.ts` and fills in
 * contract functions core does not ship yet with stubs that keep the contract's signatures.
 */
import * as core from '../../core/index';
import type { GenerateResult } from '../../core/index';

export * from '../../core/index';

export type PdfPage = 'A4' | 'Letter' | 'fit';

/** Raised by the PDF stub until core provides `exportPdf`. */
export class ExportUnavailableError extends Error {
  constructor(readonly format: 'pdf') {
    super(`${format} export unavailable`);
    this.name = 'ExportUnavailableError';
  }
}

type ExportPdf = (result: GenerateResult, opts: { page: PdfPage; sizeMm: number }) => Promise<Blob>;

/** Contract limit for the logo side relative to the symbol width. */
export const MAX_LOGO_SCALE: number =
  ((core as Record<string, unknown>)['MAX_LOGO_SCALE'] as number | undefined) ?? 0.25;

const coreExportPdf = (core as Record<string, unknown>)['exportPdf'] as ExportPdf | undefined;

export const exportPdf: ExportPdf =
  coreExportPdf ??
  (() => {
    return Promise.reject(new ExportUnavailableError('pdf'));
  });
