# Handover: ImmerQR frontend

**Start only after phase 1 in `doc/plan.md` is marked done. Work on your own branch in a separate git worktree.**

You are building the user interface of **ImmerQR**, a free, browser-only QR code generator at `immerqr.de`. It is an evening hobby project with no money involved. Its whole reason to exist: codes made here contain the user's link directly, so they never redirect, expire or end up behind a paywall. The brand line is **"Codes, die nie verwelken." / "QR codes that never wilt."**

## Sources of truth

Read these before writing any UI code. Where this prompt and a source disagree, the source wins.

- `doc/branding.md`: name, promises, palette tokens (light and dark), typography, mark SVG, code style rules, voice.
- `doc/brand/board.html`: the brand board. Open it in a browser; it is the visual reference for every screen, including a sketched simple mode.
- `doc/handover/contract.md`: the boundary to `src/core/`. You own `src/ui/`, styles and static assets; you call core and render what it returns. You never compute a QR matrix or export in UI code.

The implementation agent sets up the project (Vite, TypeScript, Svelte 5 unless the user chose otherwise), core, tests and deployment. Check `doc/plan.md` for the current stack and phase before starting; if core is not ready yet, build against a stub that satisfies `contract.md`.

## Working alongside the implementation agent

Both agents run at the same time, so keep out of each other's way:

- **Own worktree and branch.** Work in a separate git worktree on branch `frontend` (`git worktree add ../qrgen-frontend -b frontend`), never in the implementation agent's checkout. Merge `main` into `frontend` often and resolve `package.json` / `package-lock.json` conflicts by re-running `npm install`.
- **What you own:** `src/ui/` (replace the placeholder `App.svelte` freely), styles, fonts, icons, `public/` assets except `CNAME`, and the locale files below. The implementation agent owns `src/core/`, `tests/`, configs and workflows; propose changes there through `doc/handover/contract.md` or the user.
- **i18n from the first screen.** Create `src/i18n/de.json`, `src/i18n/en.json` and a small typed `t(key, params?)` helper with `{name}` interpolation. The implementation agent later adds browser-language detection, persistence, `<html lang>` updates and the key-parity tests on top, without changing the helper's call signature.
- **Core API.** Import only from `src/core/index.ts`. `generate`, `isGenerateError`, `encodePayload`, `BRAND_STYLE` and `CLASSIC_STYLE` exist now; exports, scan check and logo arrive phase by phase (see the status table in `doc/plan.md`). Until then, stub them behind the signatures in `contract.md`.
- **Leaf animation hook.** The three finder cores in every SVG from `generate` carry `class="eye"`. Animate those; never re-draw the code in UI.

### Code-style rules newer than the board

`doc/branding.md` (section "Code style") wins over `doc/brand/board.html`. Decode tests changed three things since the board was drawn:

- The leaf in the code eyes is **mirrored**: top-right and bottom-left corners at full radius. The logo mark keeps its original orientation.
- Alignment patterns (the small 5×5 squares) stay square in every module style.
- The "Punkt" eye option is a 3×3 core with corner radius 0.6, not a circle. Label it accordingly if "Punkt" reads wrong next to the preview.

## Design rules

- **Tokens first.** Turn the palette in `doc/branding.md` into CSS custom properties in `src/ui/tokens.css`, using the light/dark structure shown in `doc/brand/board.html` (`prefers-color-scheme` plus a `data-theme` override). Every colour in a component comes from a token.
- **Fonts are self-hosted.** Bundle Bricolage Grotesque, Inter and JetBrains Mono as woff2 (for example via `@fontsource` packages), latin + latin-ext subsets for umlauts. The page makes zero requests to other origins.
- **The code sits on white.** The preview and every export render on a white card in both themes, as on the board.
- **Show the payload verbatim.** Whatever the code contains appears in JetBrains Mono next to the scan check: "Geprüft: Der Code enthält genau …".
- **Motion is one moment.** The three leaf eyes unfurl when a code first appears and regrow subtly when it changes. Everything else is still. Respect `prefers-reduced-motion`.
- **Copy follows the voice section** of `doc/branding.md`: German uses "du", labels say what happens ("PNG laden"), at most one garden metaphor per screen. Every string goes through the i18n layer (`de` and `en`), never inline.
- **Accessible by default.** Visible focus ring in shoot green, a label on every control, the scan-check status in an `aria-live` region, full keyboard operation, WCAG AA contrast.

## Screens

Build in this order. Each screen is done when it matches the board's look in light and dark at 375 px and 1280 px wide, and every state listed exists.

1. **App shell.** Header with the small lockup (mark + "Immer**QR**"), mode switch Einfach/Erweitert, language switch DE/EN. Footer with the three promises (Direkt, Für immer, Lokal) and links to "Warum ImmerQR", Datenschutz, Impressum and the source on GitHub. Mode and language persist locally.
2. **Simple mode** (default). Matches the sketch on the board: heading, URL field, scan check, live preview, PNG / SVG / PDF buttons, and a collapsed "Logo hinzufügen" drop zone (drag-and-drop or file picker, logo stays local). States: empty field (friendly placeholder code or prompt), valid and scanned, text too long for a QR code, scan check failed, logo added (shows that error correction rose to H).
3. **Advanced mode.** Same preview card, sticky beside the form on desktop and above it on mobile. Settings grouped into four sections:
   - *Inhalt*: content type (URL, Text, WLAN, Kontakt, E-Mail, SMS, Telefon, Ort) with one form per type.
   - *Aussehen*: module style (Punkte, Quadrate, Abgerundet), eye style (Blatt, Quadrat, Punkt), colours for modules, eyes and background (incl. transparent), "Klassisch" reset to plain black squares. Show core's warnings inline (low contrast, inverted colours) next to the control that caused them.
   - *Logo*: upload, size slider capped at 25 %, white plate on/off, plate padding.
   - *Größe & Export*: pixel size for PNG; print size in mm/cm with DPI; quiet zone (min 4); error correction L/M/Q/H with a one-line explanation each; PDF page (A4, Letter, exact size); file name.
4. **Warum ImmerQR.** The "wilt vs. evergreen" timeline from the board, the three promises, a short plain explanation of static vs. dynamic codes.
5. **Datenschutz / Impressum.** Simple text pages; content comes from the user, leave clearly marked placeholders.
6. **PWA touches.** Install hint (dismissable, shown once), "update available, reload" toast, offline indicator. App icons and favicon from the mark (16, 32, 180, 192, 512, maskable), `theme-color` fir.
7. **404 page** in the brand voice, linking home.

## Done

The frontend is done when:

- every screen and state above exists in both languages and both themes,
- an automated accessibility check (axe via Playwright) reports zero violations on every screen,
- a search of `src/ui/` finds no colour literals outside `tokens.css` and no user-facing strings outside the locale files,
- the network panel shows no request to another origin during a full session,
- you have listed for the user, in your final message, anything from the board you changed or left out and why.
