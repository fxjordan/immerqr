/** What the user wants to encode. `encodePayload` turns it into the exact string stored in the code. */
export type Payload =
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'wifi'; ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }
  | {
      kind: 'vcard';
      firstName: string;
      lastName: string;
      org?: string;
      phone?: string;
      email?: string;
      url?: string;
      address?: string;
    }
  | { kind: 'email'; to: string; subject?: string; body?: string }
  | { kind: 'sms'; number: string; message?: string }
  | { kind: 'phone'; number: string }
  | { kind: 'geo'; lat: number; lng: number };

export type PayloadKind = Payload['kind'];

export type Ecc = 'L' | 'M' | 'Q' | 'H';

export type ModuleStyle = 'square' | 'dots' | 'rounded';

/** Style of the 3×3 finder core. The outer 7×7 ring is always square. */
export type EyeStyle = 'square' | 'leaf' | 'dot';

export interface CodeStyle {
  modules: ModuleStyle;
  eye: EyeStyle;
  /** Module and finder-ring colour, `#rgb` or `#rrggbb`. */
  fg: string;
  /** Finder-core colour, `#rgb` or `#rrggbb`. */
  eyeColor: string;
  bg: string | 'transparent';
  /** Border in modules, integer ≥ 4. */
  quietZone: number;
}

export interface LogoImage {
  dataUrl: string;
  width: number;
  height: number;
}

export interface Logo {
  image: LogoImage;
  /** Logo side relative to the symbol width (quiet zone excluded), at most 0.25. */
  scale: number;
  plate: boolean;
  /** Space between logo and plate edge, in modules. */
  platePadding: number;
}

export interface GenerateInput {
  payload: Payload;
  ecc: Ecc;
  style: CodeStyle;
  logo?: Logo;
}

export type StyleWarning = 'low-contrast' | 'inverted' | 'ecc-raised-for-logo' | 'low-module-px';

export interface GenerateResult {
  /** Exact encoded string, shown to the user verbatim. */
  text: string;
  /** QR version 1–40. */
  version: number;
  /** ECC level actually used. */
  ecc: Ecc;
  /** Symbol width in modules, quiet zone excluded. */
  size: number;
  /** Self-contained SVG, no external references. Its viewBox is in module units, quiet zone included. */
  svg: string;
  warnings: StyleWarning[];
}

/**
 * `too-long` counts in the unit of the encoding mode QR picks for the text:
 * digits for numeric text, characters for upper-case alphanumeric text, UTF-8 bytes otherwise.
 */
export type GenerateError =
  | { code: 'too-long'; maxChars: number; length: number }
  | { code: 'invalid-payload'; field: string }
  | { code: 'logo-too-large'; maxScale: number };
