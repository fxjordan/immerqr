import { buildMatrix } from './matrix';
import { encodePayload, InvalidPayloadError } from './payload';
import { renderSvg } from './render-svg';
import { assertValidStyle, styleWarnings } from './style';
import type { GenerateError, GenerateInput, GenerateResult } from './types';

export function isGenerateError(r: GenerateResult | GenerateError): r is GenerateError {
  return 'code' in r;
}

/**
 * Encodes the payload and renders it. User-correctable problems come back as a `GenerateError`;
 * a style no control can produce (quiet zone under 4, unknown colour) throws.
 */
export function generate(input: GenerateInput): GenerateResult | GenerateError {
  assertValidStyle(input.style);
  let text: string;
  try {
    text = encodePayload(input.payload);
  } catch (e) {
    if (e instanceof InvalidPayloadError) return { code: 'invalid-payload', field: e.field };
    throw e;
  }
  const built = buildMatrix(text, input.ecc);
  if (!built.ok) return { code: 'too-long', maxChars: built.maxChars, length: built.length };
  const { matrix } = built;
  return {
    text,
    version: matrix.version,
    ecc: input.ecc,
    size: matrix.size,
    svg: renderSvg(matrix, input.style),
    warnings: styleWarnings(input.style),
  };
}
