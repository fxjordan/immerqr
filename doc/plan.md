# ImmerQR plan

Implementation plan for immerqr.de. Requirements come from `doc/handover/implementation.md`, the core/UI boundary from `doc/handover/contract.md`, the code style from `doc/branding.md`.

## Decisions

| Question | Answer |
|---|---|
| UI framework | Svelte 5 |
| Python CLI | kept under `cli/` as a reference tool, not part of the web build |
| Licence | MIT |

## Stack

| Concern | Choice |
|---|---|
| Build | Vite + TypeScript (`strict`, `noUncheckedIndexedAccess`) |
| UI | Svelte 5 (runes) |
| Lint / format | ESLint (typescript-eslint, eslint-plugin-svelte) + Prettier; `svelte-check` in CI |
| QR encoding | Nayuki's QR Code generator (MIT), vendored in `src/core/vendor/qrcodegen.ts` with its licence header |
| Rendering | own SVG renderer in core; PNG by drawing the SVG onto a canvas at integer module size |
| PDF | jsPDF, lazy-loaded (`import()`), modules as vector paths |
| Scan check | jsQR in the app; zxing-wasm as second decoder in tests |
| Offline / install | vite-plugin-pwa (Workbox precache, manifest, prompt-for-update) |
| i18n | own JSON dictionaries `de` / `en`, no library |
| Unit tests | Vitest, two projects: `node` (core logic, SVG rasterised with `@resvg/resvg-js`) and `browser` (Vitest browser mode on Playwright Chromium, for canvas PNG export and PDF rasterising with `pdfjs-dist`) |
| Property tests | fast-check |
| E2E | Playwright + `@axe-core/playwright` |
| Deploy | GitHub Actions → GitHub Pages, `public/CNAME` = `immerqr.de`, base path `/` |
| Package manager | npm, Node 24 LTS (`.nvmrc`), lockfile committed |

## Folder layout

```
cli/qrgen.py              Python prototype, unchanged behaviour
doc/                      branding, handover, this plan
public/                   CNAME, icons, robots.txt (frontend agent fills icons)
src/
  core/                   pure TS, no framework or DOM-global imports at module top level
    vendor/qrcodegen.ts   Nayuki, vendored
    payload.ts            encodePayload + validation per kind
    matrix.ts             text + ECC → module matrix, capacity check
    render-svg.ts         matrix + style (+ logo) → SVG string
    style.ts              defaults, presets ("Blatt im Auge", "Klassisch"), warnings, contrast
    logo.ts               scale cap, plate geometry, ECC forcing
    generate.ts           generate(): ties the above together
    scan.ts               scanCheck() with jsQR
    export-svg.ts | export-png.ts | export-pdf.ts
    index.ts              public API, the only import the UI uses
  ui/                     frontend agent's
  i18n/                   de.json, en.json, loader, language detection
  main.ts
tests/
  core/                   Vitest node project
  browser/                Vitest browser project
  e2e/                    Playwright
  fixtures/               corpus, logos
  helpers/                rasterise (resvg), decode (jsQR + zxing-wasm)
.github/workflows/        ci.yml (PR + main), deploy.yml (main → Pages)
LICENSE                   MIT
```

## Contract refinements

To land in `doc/handover/contract.md` before code depends on them:

- **`Logo.image`** becomes `{ dataUrl: string; width: number; height: number }` instead of `ImageBitmap | HTMLImageElement`. The SVG embeds the logo as a `data:` URI (so it stays self-contained), and core stays testable in Node. The UI reads the dropped file with `FileReader` and passes the result.
- **`GenerateError`** gains `{ code: 'logo-too-large'; maxScale: 0.25 }`; a scale above 0.25 is rejected, not clamped. `'logo-too-large'` leaves the warning list.
- **`exportPng`** takes `{ sizePx: number }` and returns the actual module size alongside the blob, so the UI can show "N px per module".
- **`StyleWarning`** is a closed union: `'low-contrast' | 'inverted' | 'ecc-raised-for-logo' | 'low-module-px'` (the last for PNG/print sizes under 4 px or 0.4 mm per module).

## Known risks

- **Capacity codes at 300 px.** A version-40 code (177 + 8 modules) at 300 px gives 1.6 px per module, below what any decoder reads. The 300 px decode runs only where it yields ≥ 2.5 px per module; 1000 px always runs. The skip is explicit in the test output.
- **jsQR and dots.** Resolved in phase 2 with three style rules, agreed 2026-11-17 and recorded in `doc/branding.md`: the leaf eye is mirrored (top-right/bottom-left rounded), alignment patterns stay square, the "Punkt" eye has corner radius 0.6.
- **jsQR and fractional rasters.** jsQR misreads large versions at some fractional pixel-per-module ratios (v40 at 5.4 px fails, 5.5 px passes) but reads every integer ratio from 5 px on. Exports and the in-app scan check always use integer module sizes; the corpus suite keeps fractional 300/1000 px rasters, the v40 capacity test snaps to integer module sizes.
- **CSP vs. Svelte and logo.** Svelte transitions inject inline styles; logos are `data:` URIs. Expected widening: `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`. Each widening is checked in phase 9 and documented in `index.html`.
- **Suite runtime.** 8 kinds × 4 ECC × 3 module × 3 eye styles × corpus × 2 sizes × 2 decoders is several thousand decodes. Budget: under 3 min in CI; if exceeded, shard by payload kind across CI jobs rather than cut combinations.

## Phases

Each phase is done when its tests pass in CI, the deployed site shows the feature, and the phase is marked done here.

### Phase 1: Scaffold & deploy

Features:
- Move `qrgen.py` to `cli/`, update README (web app + CLI section), add MIT `LICENSE`.
- Vite + Svelte 5 + TS strict, ESLint, Prettier, `svelte-check`.
- Vitest node + browser projects, Playwright config, one smoke test each.
- `ci.yml`: install, lint, typecheck, unit, browser, e2e on every push and PR.
- `deploy.yml`: build and publish to Pages on `main` after CI.
- `public/CNAME`, placeholder page "ImmerQR – bald." with the mark.

Tests: Vitest smoke, Playwright loads `/` and finds the heading.

Done-check: CI green; placeholder live at `https://immerqr.de` over HTTPS.

Needs from you: GitHub repo (name `immerqr`?), Pages source set to "GitHub Actions", DNS at the `.de` registrar (4 `A` + 4 `AAAA` records for GitHub Pages, or `ALIAS`), "Enforce HTTPS" after the cert is issued.

### Phase 2: Core encoding

Features:
- `encodePayload` for url, text, wifi, vcard (3.0), email (`mailto:` with percent-encoded subject/body), sms (`SMSTO:`), phone (`tel:`), geo (`geo:lat,lng`, up to 6 decimals).
- Validation → `invalid-payload` with field name.
- Matrix via Nayuki, UTF-8 byte mode (with ECI-free UTF-8, which iOS and Android read), minimum version that fits, `too-long` with `maxChars` for the chosen ECC.
- SVG renderer: modules square / dots / rounded, eye core square / leaf / dot, outer ring always square (no option exists to change it), colours, transparent background, quiet zone ≥ 4, integer `viewBox` in module units, deterministic output (fixed attribute order, fixed number formatting).
- `generate` returning text, version, svg, warnings (`low-contrast` < 4.5 : 1, `inverted`).

Tests:
- Round-trip decode suite (full corpus from the handover), jsQR and zxing-wasm, 300 px and 1000 px.
- Verbatim payload property test for url and text (fast-check).
- Capacity: exactly at capacity decodes, one over returns `too-long` without throwing, for each ECC.
- WiFi escaping of `; , : \ "`, vCard escaping of `, ; \n`, umlauts.
- Style guards: contrast, inverted, quiet zone < 4 rejected by type and at runtime.
- SVG: well-formed (parsed by `fast-xml-parser`), has `viewBox`, no `http` href, no `@import`, no `<text>`/fonts.
- Determinism: snapshot SVGs for a fixed input set.

Done-check: suites green in CI; deployed placeholder unchanged (core not wired yet).

### Phase 3: Exports and scan check

The frontend agent builds simple mode in parallel (`doc/handover/frontend-design.md`); this phase delivers what it calls.

Features:
- `exportSvg`, `exportPng` (canvas, integer module size, remainder padded with the background or left transparent to hit exact pixels), `scanCheck` (jsQR on an integer-module rasterisation, transparent backgrounds judged on white).

Tests:
- Browser project: PNG has exact requested dimensions, integer module size, padding in background colour, decodes with jsQR and zxing-wasm; SVG export round-trips; scan check passes for every style and reports failure for an unreadable image.
- E2E (once the frontend's simple mode is merged): type URL, download PNG and SVG, decode both files, equal to input; empty field and too-long states visible.

Done-check: deployed site generates and downloads a scannable code.

### Phase 4: Logo

Features: logo drop/picker passes a data URL to core; ECC forced to H with `ecc-raised-for-logo`; white plate on/off, plate padding; scale ≤ 0.25 (default 0.22, as in the CLI) of the symbol width, quiet zone excluded; logo centred, plate snapped to whole modules; logo codes use at least version 4 (version 2 failed the decode tests).

Tests: every corpus URL with a logo at 0.25 and a plate decodes at H (both decoders, both sizes); scale 0.26 returns `logo-too-large`; ECC L input with logo yields H and the warning; SVG still has no external reference (logo is `data:`).

Done-check: deployed simple mode accepts a logo and the scan check passes.

### Phase 5: PDF export

Features: `exportPdf` with lazy-loaded jsPDF; modules, eyes and plate as vector paths; logo embedded as image; pages A4, Letter, or exact code size; code size in mm, centred on the page.

Tests (browser project): MediaBox matches A4 / Letter / exact size within 0.1 mm; code bounding box matches requested mm within 0.1 mm; page content has path operators and no raster image for modules; rasterised with pdf.js, decodes. E2E: PDF download decodes. Bundle check: jsPDF is in a separate chunk not loaded on first paint.

Done-check: deployed site downloads a PDF that prints at the stated size.

### Phase 6: i18n

Features: `de.json` / `en.json`, typed key access, detection from `navigator.languages` (de* → de, else en), switch, persisted in `localStorage`, `<html lang>` updated, `{name}` interpolation.

Tests: both locales have identical key sets (unit); TS type rejects unknown keys; E2E: switching language changes every visible string (no string equal across locales except an allow-list such as "PNG", "SVG", "PDF", "ImmerQR") and updates `lang`.

Done-check: deployed site switches DE/EN and remembers the choice.

### Phase 7: Advanced mode logic

Features: every advanced option wired through core: eight content-type forms, ECC L/M/Q/H (locked to H with logo), PNG pixels, print size mm/cm + DPI, quiet zone ≥ 4, colours for modules, eyes, background, transparent, "Klassisch" preset, logo scale/plate/padding, PDF page, file name (sanitised, default `immerqr-<host-or-kind>`). Mode persisted.

Tests: unit tests for each option's effect on `generate` (incl. `low-module-px`); file-name sanitising; E2E per content type: fill form, download PNG, decode equals `encodePayload` output; "Klassisch" yields black squares.

Done-check: deployed advanced mode produces every option, warnings appear.

### Phase 8: PWA

Features: manifest (name, `theme_color` fir, icons from the frontend agent), Workbox precache of all build assets incl. fonts and the jsPDF chunk, prompt-for-update hook for the frontend toast, offline indicator hook.

Tests: E2E: load, go offline, reload, generate and download a code; manifest valid and installable (Lighthouse PWA audit in CI).

Done-check: deployed site installs on Android/desktop and works in flight mode.

### Phase 9: Hardening

Features: CSP meta tag, starting from `default-src 'self'; connect-src 'none'`, each widening justified in a comment; `Referrer-Policy: no-referrer` meta; no third-party requests; Lighthouse ≥ 95 in all categories.

Tests: E2E fails on any request not to the page origin during a full session (both modes, all exports, language switch); no CSP violation in the console; axe zero violations in both modes × both themes; Lighthouse CI budget.

Done-check: all quality suites green; real-device list below filled in.

## Real-device check list

Before launch. Scanners: iOS camera, Android Google Lens, one third-party app (name it).

| Case | iOS camera | Google Lens | Third-party |
|---|---|---|---|
| URL | | | |
| Text | | | |
| WiFi | | | |
| vCard | | | |
| E-mail | | | |
| SMS | | | |
| Phone | | | |
| Geo | | | |
| Logo (0.25, plate) | | | |
| 2 cm print | | | |

## Status

| Phase | Status |
|---|---|
| 1 Scaffold & deploy | built, all checks green locally; waiting for GitHub repo + DNS to deploy |
| 2 Core encoding | built, 190 node tests green locally (round-trip suite ~20 s); not yet in CI |
| 3 Exports and scan check | core done (22 browser tests green); E2E download tests wait for the frontend's simple mode |
| 4 Logo | core done (logo suites green); UI drop zone is the frontend's |
| 5 PDF export | core done (PDF browser tests green); lazy-chunk check moves to phase 9 with the network test |
| 6 i18n | detection, persistence, `<html lang>` done; key-parity and E2E tests wait for the frontend's locale files |
| 7 Advanced mode logic | core done (print size, `low-module-px`, file names); per-content-type E2E waits for the frontend's forms |
| 8 PWA | planned |
| 9 Hardening | planned |
