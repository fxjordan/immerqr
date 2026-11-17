import { qrcodegen } from './vendor/qrcodegen';
import type { Ecc } from './types';

const { QrCode, QrSegment } = qrcodegen;

export interface Matrix {
  version: number;
  /** Width in modules. */
  size: number;
  /** Row-major dark flags, `size * size` entries. */
  dark: boolean[];
}

export type MatrixResult = { ok: true; matrix: Matrix } | { ok: false; maxChars: number; length: number };

const ECC: Record<Ecc, qrcodegen.QrCode.Ecc> = {
  L: QrCode.Ecc.LOW,
  M: QrCode.Ecc.MEDIUM,
  Q: QrCode.Ecc.QUARTILE,
  H: QrCode.Ecc.HIGH,
};

/** Data codewords of a version-40 symbol per ECC level (ISO/IEC 18004, table 7). */
const V40_DATA_CODEWORDS: Record<Ecc, number> = { L: 2956, M: 2334, Q: 1666, H: 1276 };

type Mode = 'numeric' | 'alphanumeric' | 'byte';

function modeOf(text: string): Mode {
  if (QrSegment.isNumeric(text)) return 'numeric';
  if (QrSegment.isAlphanumeric(text)) return 'alphanumeric';
  return 'byte';
}

function lengthIn(mode: Mode, text: string): number {
  return mode === 'byte' ? new TextEncoder().encode(text).length : text.length;
}

/** Largest single-segment length that fits a version-40 symbol, in the unit of `mode`. */
function capacity(mode: Mode, ecc: Ecc): number {
  const bits = V40_DATA_CODEWORDS[ecc] * 8 - 4;
  switch (mode) {
    case 'numeric': {
      const free = bits - 14;
      const groups = Math.floor(free / 10);
      const rest = free - groups * 10;
      return groups * 3 + (rest >= 7 ? 2 : rest >= 4 ? 1 : 0);
    }
    case 'alphanumeric': {
      const free = bits - 13;
      const pairs = Math.floor(free / 11);
      return pairs * 2 + (free - pairs * 11 >= 6 ? 1 : 0);
    }
    case 'byte':
      return Math.floor((bits - 16) / 8);
  }
}

/** Encodes `text` as one segment in the most compact mode at the smallest version that fits, without boosting ECC. */
export function buildMatrix(text: string, ecc: Ecc, minVersion = 1): MatrixResult {
  const mode = modeOf(text);
  const length = lengthIn(mode, text);
  const maxChars = capacity(mode, ecc);
  if (length > maxChars) return { ok: false, maxChars, length };
  const segs = QrSegment.makeSegments(text);
  const qr = QrCode.encodeSegments(segs, ECC[ecc], minVersion, 40, -1, false);
  const dark: boolean[] = new Array<boolean>(qr.size * qr.size);
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) dark[y * qr.size + x] = qr.getModule(x, y);
  }
  return { ok: true, matrix: { version: qr.version, size: qr.size, dark } };
}
