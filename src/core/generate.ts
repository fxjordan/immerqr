import { assertValidLogo, LOGO_MIN_VERSION, MAX_LOGO_SCALE, placeLogo } from './logo';
import { buildMatrix } from './matrix';
import { encodePayload, InvalidPayloadError } from './payload';
import { renderSvg } from './render-svg';
import { assertValidStyle, styleWarnings } from './style';
import type { GenerateError, GenerateInput, GenerateResult, StyleWarning } from './types';

export function isGenerateError(r: GenerateResult | GenerateError): r is GenerateError {
  return 'code' in r;
}

/**
 * Encodes the payload and renders it. User-correctable problems come back as a `GenerateError`;
 * settings no control can produce (quiet zone under 4, unknown colour, non-positive logo size) throw.
 * A logo forces ECC H, since it hides modules that error correction has to restore.
 */
export function generate(input: GenerateInput): GenerateResult | GenerateError {
  assertValidStyle(input.style);
  const { logo } = input;
  if (logo) {
    assertValidLogo(logo);
    if (logo.scale > MAX_LOGO_SCALE) return { code: 'logo-too-large', maxScale: MAX_LOGO_SCALE };
  }
  const ecc = logo ? 'H' : input.ecc;
  let text: string;
  try {
    text = encodePayload(input.payload);
  } catch (e) {
    if (e instanceof InvalidPayloadError) return { code: 'invalid-payload', field: e.field };
    throw e;
  }
  const built = buildMatrix(text, ecc, logo ? LOGO_MIN_VERSION : 1);
  if (!built.ok) return { code: 'too-long', maxChars: built.maxChars, length: built.length };
  const { matrix } = built;
  const warnings: StyleWarning[] = styleWarnings(input.style);
  if (ecc !== input.ecc) warnings.push('ecc-raised-for-logo');
  return {
    text,
    version: matrix.version,
    ecc,
    size: matrix.size,
    svg: renderSvg(matrix, input.style, logo && placeLogo(logo, matrix.size)),
    warnings,
  };
}
