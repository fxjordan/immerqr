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

interface Logo { image: ImageBitmap | HTMLImageElement; scale: number; plate: boolean; platePadding: number } // scale ≤ 0.25

interface GenerateInput { payload: Payload; ecc: Ecc; style: CodeStyle; logo?: Logo }

interface GenerateResult {
  text: string;                          // exact encoded string, shown to the user verbatim
  version: number;                       // QR version 1–40
  svg: string;                           // self-contained SVG, no external references
  warnings: StyleWarning[];              // e.g. 'low-contrast', 'inverted', 'logo-too-large', 'ecc-raised-for-logo'
}

type GenerateError = { code: 'too-long'; maxChars: number } | { code: 'invalid-payload'; field: string };

declare function encodePayload(p: Payload): string;
declare function generate(input: GenerateInput): GenerateResult | GenerateError;
declare function scanCheck(svg: string): Promise<{ ok: true; text: string } | { ok: false }>;
declare function exportSvg(result: GenerateResult): Blob;
declare function exportPng(result: GenerateResult, sizePx: number): Promise<Blob>;
declare function exportPdf(result: GenerateResult, opts: { page: 'A4' | 'Letter' | 'fit'; sizeMm: number }): Promise<Blob>;
```

## Defaults

Simple mode calls `generate` with the brand style ("Blatt im Auge", see `doc/branding.md`): `modules: 'dots'`, `eye: 'leaf'`, fir modules, moss eyes, white background, quiet zone 4, ECC `Q` (`H` when a logo is present).
