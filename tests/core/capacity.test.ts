import { describe, expect, it } from 'vitest';
import { BRAND_STYLE, CLASSIC_STYLE, generate, isGenerateError } from '../../src/core';
import type { CodeStyle, Ecc } from '../../src/core';
import { decodeAll } from '../helpers/roundtrip';

/** ISO/IEC 18004 version-40 capacities. */
const CAPACITY: Record<Ecc, { byte: number; alphanumeric: number; numeric: number }> = {
  L: { byte: 2953, alphanumeric: 4296, numeric: 7089 },
  M: { byte: 2331, alphanumeric: 3391, numeric: 5596 },
  Q: { byte: 1663, alphanumeric: 2420, numeric: 3993 },
  H: { byte: 1273, alphanumeric: 1852, numeric: 3057 },
};

const url = (bytes: number) => {
  const base = 'https://example.com/';
  return base + 'a'.repeat(bytes - base.length);
};

describe.each(['L', 'M', 'Q', 'H'] as const)('capacity at ECC %s', (ecc) => {
  const cap = CAPACITY[ecc];

  it.concurrent.each([
    ['brand', BRAND_STYLE],
    ['classic', CLASSIC_STYLE],
  ] as Array<[string, CodeStyle]>)('a URL exactly at capacity decodes (%s)', async (_name, style) => {
    const r = generate({ payload: { kind: 'url', url: url(cap.byte) }, ecc, style });
    if (isGenerateError(r)) throw new Error(r.code);
    expect(r.version).toBe(40);
    const { decoded, skipped } = await decodeAll(r.svg, r.size + 2 * style.quietZone, { snap: true });
    expect(skipped).toEqual([300]);
    for (const d of decoded) {
      expect(d.jsqr, `jsqr ${d.px}px`).toBe(r.text);
      expect(d.zxing, `zxing ${d.px}px`).toBe(r.text);
    }
  });

  it('one byte over returns too-long', () => {
    const r = generate({ payload: { kind: 'url', url: url(cap.byte + 1) }, ecc, style: BRAND_STYLE });
    expect(r).toEqual({ code: 'too-long', maxChars: cap.byte, length: cap.byte + 1 });
  });

  it('counts multi-byte characters in UTF-8 bytes', () => {
    const r = generate({ payload: { kind: 'text', text: 'ä'.repeat(cap.byte) }, ecc, style: BRAND_STYLE });
    expect(r).toEqual({ code: 'too-long', maxChars: cap.byte, length: cap.byte * 2 });
  });

  it('uses the denser alphanumeric and numeric modes', () => {
    for (const [mode, ch] of [
      ['alphanumeric', 'A'],
      ['numeric', '7'],
    ] as const) {
      const max = cap[mode];
      const fits = generate({ payload: { kind: 'text', text: ch.repeat(max) }, ecc, style: BRAND_STYLE });
      expect(isGenerateError(fits), mode).toBe(false);
      const over = generate({ payload: { kind: 'text', text: ch.repeat(max + 1) }, ecc, style: BRAND_STYLE });
      expect(over).toEqual({ code: 'too-long', maxChars: max, length: max + 1 });
    }
  });
});
