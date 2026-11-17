# Core ↔ UI contract

Shared boundary between the two agents working on ImmerQR. The implementation agent owns `src/core/`; the frontend agent owns `src/ui/`, styles and static assets. Either agent may propose a change here; the change lands in this file before it lands in code.

## Principle

`src/core/` is pure TypeScript with no framework imports. Everything a user can produce (payload string, matrix, SVG, PNG, PDF, scan result) comes from core, so it is unit-testable without a browser UI. The UI holds form state, calls core, and renders what core returns.

## Types (starting point, refine in code)

```ts
// What the user wants to encode. encodePayload() turns it into the exact string stored in the code.
type Payload =
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'wifi'; ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }
  | { kind: 'vcard'; firstName: string; lastName: string; org?: string; phone?: string; email?: string; url?: string; address?: string }
  | { kind: 'email'; to: string; subject?: string; body?: string }
  | { kind: 'sms'; number: string; message?: string }
  | { kind: 'phone'; number: string }
  | { kind: 'geo'; lat: number; lng: number };

type Ecc = 'L' | 'M' | 'Q' | 'H';

interface CodeStyle {
  modules: 'square' | 'dots' | 'rounded';
  eye: 'square' | 'leaf' | 'dot';        // 3x3 core only; the outer 7x7 ring is always square
  fg: string;                            // module colour
  eyeColor: string;                      // core colour
  bg: string | 'transparent';
  quietZone: number;                     // modules, minimum 4
}

// The UI reads the dropped file with FileReader and passes the data URL; the SVG embeds it, so it stays self-contained.
interface LogoImage { dataUrl: string; width: number; height: number }
interface Logo { image: LogoImage; scale: number; plate: boolean; platePadding: number } // scale ≤ 0.25, above is an error

interface GenerateInput { payload: Payload; ecc: Ecc; style: CodeStyle; logo?: Logo }

interface GenerateResult {
  text: string;                          // exact encoded string, shown to the user verbatim
  version: number;                       // QR version 1–40
  ecc: Ecc;                              // level actually used (H when a logo forced it)
  size: number;                          // symbol width in modules, quiet zone excluded
  svg: string;                           // self-contained SVG, viewBox in module units; the three finder cores carry class="eye" for the unfurl animation
  warnings: StyleWarning[];
}

// low-module-px: PNG or print size gives under 4 px or 0.4 mm per module.
type StyleWarning = 'low-contrast' | 'inverted' | 'ecc-raised-for-logo' | 'low-module-px';

type GenerateError =
  | { code: 'too-long'; maxChars: number; length: number } // counted in UTF-8 bytes, or characters for digit-only / upper-case alphanumeric text
  | { code: 'invalid-payload'; field: string }
  | { code: 'logo-too-large'; maxScale: 0.25 };

declare function encodePayload(p: Payload): string;      // throws InvalidPayloadError { field }
declare function isGenerateError(r: GenerateResult | GenerateError): r is GenerateError;
// generate() throws only for styles no control can produce: quiet zone < 4 or a colour that is not #rgb / #rrggbb.
declare function generate(input: GenerateInput): GenerateResult | GenerateError;
// exportPng and scanCheck draw on a canvas and need the browser main thread.
declare function scanCheck(svg: string): Promise<{ ok: true; text: string } | { ok: false }>;
declare function exportSvg(result: GenerateResult): Blob;
declare function exportPng(result: GenerateResult, opts: { sizePx: number }): Promise<{ blob: Blob; modulePx: number }>;
declare function exportPdf(result: GenerateResult, opts: { page: 'A4' | 'Letter' | 'fit'; sizeMm: number }): Promise<Blob>;
```

## Defaults

Core exports `BRAND_STYLE` and `CLASSIC_STYLE`. Simple mode calls `generate` with the brand style ("Blatt im Auge", see `doc/branding.md`): `modules: 'dots'`, `eye: 'leaf'`, fir modules, moss eyes, white background, quiet zone 4, ECC `Q` (`H` when a logo is present).
