# Handover: ImmerQR implementation

You are planning and building **ImmerQR**, a free, browser-only QR code generator for `immerqr.de`, hosted on GitHub Pages. Evening hobby project, no money involved: zero running cost beyond the one domain.

The core promise drives every decision: **the code contains exactly what the user typed.** No redirect, no shortener, no tracking parameter, no expiry, no server. A code made today keeps working as long as its target exists, even if immerqr.de disappears.

## Sources of truth

- `doc/branding.md`: name, promises, code style rules ("Blatt im Auge") and their scan-test results, palette.
- `doc/handover/contract.md`: the boundary between `src/core/` (yours) and `src/ui/` (the frontend agent's, prompt in `doc/handover/frontend-design.md`). Keep core free of framework imports.
- `qrgen.py`: the existing Python CLI prototype. Its logo logic (H correction, white plate, scale cap 0.25 after a failed decode at 0.30) is proven; port it.
- `doc/brand/scan-test.py`: the decode test that set the style rules.

## Step 1: confirm open decisions

Ask the user these in one message before scaffolding, with your recommendation first:

1. UI framework: Svelte 5 (recommended: small bundle, many form controls) or another they know.
2. The Python CLI: keep under `cli/` or delete.
3. Licence: MIT (recommended).

Done when all three have an answer.

## Step 2: write the plan

Write `doc/plan.md`: stack, folder layout, phases, and for each phase its features, its tests and its done-check. Use the stack below unless the user decided otherwise. Done when the user has approved the plan.

| Concern | Choice |
|---|---|
| Build | Vite + TypeScript (strict) |
| UI | Svelte 5 |
| QR encoding | Nayuki's QR Code generator (MIT), vendored; gives the raw module matrix |
| Rendering | own SVG renderer in core; PNG via canvas |
| PDF | jsPDF, lazy-loaded, vector modules |
| Scan check | jsQR in the app; zxing-wasm as a second decoder in tests |
| Offline / install | vite-plugin-pwa (Workbox precache, manifest) |
| i18n | own JSON dictionaries `de` / `en`, no library |
| Tests | Vitest (core, rasterise SVG with `@resvg/resvg-js`), Playwright (e2e, axe) |
| Deploy | GitHub Actions → Pages, custom domain `immerqr.de` (CNAME), base path `/` |

## Step 3: build phase by phase

Work test-first (the `tdd` skill fits). Each phase ends deployed and green in CI. Suggested order:

1. **Scaffold & deploy.** Project, lint/format, Vitest, Playwright, CI, Pages workflow, `CNAME`. A placeholder page live on Pages.
2. **Core encoding.** `encodePayload` for all eight payload kinds, `generate`, capacity errors, SVG renderer with all module and eye styles.
3. **Simple mode, minimal UI.** URL → preview → PNG/SVG download → scan check, so the frontend agent has something real to style.
4. **Logo.** Port from `qrgen.py`: forces ECC H, white plate, scale ≤ 0.25.
5. **PDF export.** Vector, exact physical size, A4/Letter/fit.
6. **i18n.** `de` / `en`, browser-language detection, switch, persisted, `<html lang>` updated.
7. **Advanced mode logic.** Every option in the feature list wired through core, style warnings returned by `generate`.
8. **PWA.** Manifest, icons from the frontend agent, service worker, offline generation, update prompt.
9. **Hardening.** CSP, no third-party requests, Lighthouse, real-device check list.

## Features

**Simple mode (default):** URL field with live preview; optional logo by drag-and-drop or picker (stays local); PNG, SVG, PDF download; scan check showing the exact encoded text.

**Advanced mode:**

- Content types: URL, text, WiFi, vCard contact, email, SMS, phone, geo location.
- Error correction L / M / Q / H; locked to H with a logo.
- Size: pixels for PNG; mm/cm + DPI for print.
- Quiet zone (min 4 modules).
- Colours: modules, eyes, background, transparent background; contrast and inverted-colour warnings.
- Module style: dots (default), squares, rounded. Eye (3×3 core) style: leaf (default), square, dot. The outer 7×7 ring is always square: rounded or leaf-shaped rings failed every decode test.
- "Klassisch" preset: plain ink squares.
- Logo: scale ≤ 25 %, white plate on/off, plate padding.
- PDF: A4, Letter or exact code size.
- File name.

**Everywhere:** German and English; light and dark theme; works offline after first load; installable; keyboard and screen-reader accessible.

**Trust, built in:**

- Strict CSP meta tag: `default-src 'self'; connect-src 'none'` (widen only what the build provably needs, document why).
- All libraries and fonts bundled; zero requests to other origins.
- No analytics, no cookies; only `localStorage` for mode, language and dismissed hints.

## Quality: tests for generated codes

The generated code is the product. These suites must exist and pass in CI; the decode suites are the heart of it.

**Round-trip decode (core, Vitest).** For every combination of payload kind × ECC (L, M, Q, H) × module style × eye style: generate → rasterise the SVG at 300 px and 1000 px → decode with jsQR **and** zxing-wasm → decoded text equals `encodePayload` output byte for byte. Corpus at least:

- short and long ASCII URLs; URLs with `?`, `&`, `#`, `%20`, `+`, ports, IPv6 hosts
- Unicode: `https://example.com/größe`, `Grüße aus Köln`, emoji, CJK (UTF-8 survives the round trip)
- a payload exactly at capacity for each ECC (decodes) and one character over (returns `too-long`, no throw)
- WiFi SSIDs and passwords containing `; , : \ "` (escaped per spec, decodes back to the original values)
- vCard fields with commas, semicolons, newlines and umlauts
- mailto with subject and body needing percent-encoding; SMS and tel with `+49` numbers; geo with negative and 6-decimal coordinates

**Verbatim payload.** For URL and text input, `encodePayload` returns the input unchanged apart from trimming outer whitespace: no added scheme, no parameters, no normalisation. Property-based test (fast-check) over random strings.

**Logo.** With a logo at scale 0.25 and a plate, every corpus URL decodes at ECC H. Scale above 0.25 is rejected. A logo forces ECC to H and reports the `ecc-raised-for-logo` warning.

**Style guards.** Contrast below 4.5 : 1 between modules and background yields `low-contrast`; light modules on a dark background yield `inverted`; quiet zone below 4 is impossible to set. A rounded outer ring is impossible to produce.

**Export fidelity.**

- PNG: exact requested pixel dimensions, integer module size (padding the remainder), decodes.
- SVG: well-formed XML, has `viewBox`, contains no external reference (`href` to http, `@import`, fonts), decodes after rasterising.
- PDF: page and code size match the requested mm within 0.1 mm (read the MediaBox), modules are vector paths, decodes after rasterising.

**Determinism.** The same input produces byte-identical SVG (snapshot tests for a fixed set).

**App level (Playwright).**

- Type a URL, download PNG/SVG/PDF, decode each downloaded file → equals input.
- No request leaves the origin during a full session (fail on any non-self request).
- With the network offline after first load, the app reloads and generates codes.
- Both locales have identical key sets; switching language changes every visible string.
- axe reports zero violations in both modes and both themes.

**Real devices (manual, before launch).** Scan one code of each payload kind, the logo case, and a 2 cm print with the iOS camera, Android Google Lens and one third-party scanner app. Record the results in `doc/plan.md`.

## Done

Phase done: its tests pass in CI, the deployed site shows the feature, and `doc/plan.md` marks it done. Project done: every feature above is live on immerqr.de, every quality suite passes, and the real-device check list is filled in.
