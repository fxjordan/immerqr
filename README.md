# ImmerQR

QR codes that never wilt. Free, browser-only QR code generator at [immerqr.de](https://immerqr.de).

The code contains exactly what you typed: no redirect, no shortener, no tracking parameter, no expiry, no server. A code made here keeps working as long as its target exists, even if immerqr.de disappears.

## Development

Needs Node 24 (see `.nvmrc`).

```sh
npm install
npx playwright install chromium
npm run dev            # local dev server
npm run lint           # ESLint + Prettier
npm run check          # svelte-check (TypeScript)
npm test               # core unit tests (Node)
npm run test:browser   # browser unit tests (Chromium)
npm run test:e2e       # end-to-end tests against the production build
```

Pushes to `main` run CI and deploy to GitHub Pages. Plan and status: `doc/plan.md`.

## Python CLI

`cli/qrgen.py` is the original prototype: URL in, PNG out. Needs [uv](https://docs.astral.sh/uv/).

```sh
cli/qrgen.py "https://example.com"                         # -> qr.png, 1024x1024
cli/qrgen.py "https://example.com" -o out.png -s 512       # custom output + size
cli/qrgen.py "https://example.com" -l logo.png             # logo in the center
cli/qrgen.py "https://example.com" -l logo.png --logo-scale 0.15
```

With a logo, error correction switches to level H (~30% recoverable). `--logo-scale` is the logo width relative to the QR (default 0.22, max 0.25).

## Licence

MIT, see `LICENSE`. Vendored QR encoder by Project Nayuki, MIT.
