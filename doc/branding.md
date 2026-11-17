# ImmerQR – Branding

## Name

**ImmerQR**: "immer" is German for "always", as in "für immer" (forever). The name reads as "QR, forever": codes made here keep working for as long as the target exists.

- Taglines: **"Codes, die nie verwelken."** / **"QR codes that never wilt."** Secondary: "Für immer und immerdar."
- Spelling: `ImmerQR` in running text, `immerqr` for domain, repo and package names.

### Why this name

The problem this project answers has two parts: generator sites that route the code through their own redirect, and codes that stop working after a trial period or end up behind a paywall. The expiry is the bigger pain, because printed codes can't be replaced. ImmerQR names that promise directly.

- **Meaning:** carries the "forever" promise in one word.
- **German character, English-friendly:** "immer" is easy to pronounce and echoes "ever" and "immerse".
- **Findable:** "QR" in the name helps search, unlike pure word names.
- **Available (checked 2026-11-17):** immerqr.de, .com, .app and .dev all unregistered; GitHub handle free; no existing product found. The closest name in use is Unitag's "ImmersiveQR", different enough.

### Candidates considered

Domain status from registry RDAP lookups on 2026-11-17 (no record = unregistered). No trademark search done.

| Name | Idea | Free domains | Why not chosen |
|---|---|---|---|
| **ImmerQR** | QR forever | .de .com .app .dev | Chosen |
| QRstein | QR set in stone | .de .app .dev | Backup; funny, .com taken |
| QRune | QR + rune, carved to last | .de .app .dev | Less German |
| Immerdar | "for evermore" | .de .app .dev | Strong, but nothing in it says QR |
| Unkaputtbar | "unbreakable", German joke word | .app | Coca-Cola slogan origin, few domains |
| Steinfest | set in stone | .app .dev | Plain |
| qrklar | "klar" = clear | .de .com .app .dev | Too close to the existing klarqr |
| straightqr | direct, honest | .de .com .app .dev | Functional, forgettable |
| nodetour | no redirect detour | .de .app .dev | Misread as "node tour" |
| barecode | bare + barcode pun | .de .dev | Search engines correct it to "barcode" |

## Promises

These three statements are the product. Copy never weakens them.

| | DE | EN |
|---|---|---|
| Direct | Dein Link steckt im Code, ohne Zwischenstation. | Your link goes straight into the code, no middleman. |
| Forever | Kein Konto, kein Ablauf, nichts zu kündigen. | No account, no expiry, nothing to cancel. |
| Local | Alles passiert in deinem Browser, auch offline. | Everything happens in your browser, even offline. |

## Visual identity: "Immergrün"

Concept: codes that never wilt. An evergreen keeps its leaves through winter; an ImmerQR code keeps working because it holds the link itself. "Immer" is already in the German word for evergreen.

Visual references: `brand/board.html` (full brand board) and `brand/directions.html` (the four directions compared: Kästchenpapier, Immergrün, Bernstein, Mosaik). Earlier sign-based directions (Wegweiser road sign, Emaille enamel plate) were dropped.

Taglines: **"Codes, die nie verwelken."** / **"QR codes that never wilt."** Secondary: "Für immer und immerdar."

### Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `snow` | `#F4F8F3` | `#0A1712` | Page background |
| `surface` | `#FFFFFF` | `#11221B` | Cards, inputs |
| `line` | `#D3DED6` | `#20362C` | Borders |
| `muted` (lichen) | `#56665E` | `#93A79C` | Secondary text |
| `ink` | `#10201A` | `#E5EFE8` | Body text |
| `fir` | `#0F3B2C` | – | Brand, code modules |
| `moss` | `#2F7D4F` | – | Leaf in each code eye |
| `link` | `#2F7D4F` | `#5FB27F` | Links |
| `brand` (button) | `#0F3B2C` | `#A6DB6B` | Primary button fill |
| `on-brand` | `#FFFFFF` | `#0A1712` | Primary button text |
| `shoot` | `#A6DB6B` | `#A6DB6B` | Highlights, focus ring. Fill only (1.5:1 on snow) |
| `warn` | `#B3261E` | `#F2877E` | Errors |

Contrast (WCAG): ink on snow 15.7:1, fir on snow 11.6:1, white on moss 5.0:1, fir on shoot 7.7:1, lichen on snow 5.7:1. Dark: ink 15.6:1, light moss 7.1:1, dark text on shoot 11.3:1.

Success states use moss with a check icon; the brand green and "all good" mean the same thing here.

### Typography

All OFL-licensed and self-hosted (no requests to Google Fonts).

| Role | Face | Use |
|---|---|---|
| Display | Bricolage Grotesque 700/800, tracking -0.03 to -0.055 em | Wordmark, headings |
| Body | Inter 400/600 | Labels, help text, settings |
| Data | JetBrains Mono | The encoded payload, shown character for character |

### Mark

One QR finder pattern (the corner "eye") whose 3×3 core has grown into a leaf: two opposite corners at full radius, a thin vein across. Ring in fir, leaf in moss. Variants: reversed on fir (snow ring, shoot leaf), one colour, black only for print. Works down to 16 px.

```svg
<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <path fill="#0F3B2C" fill-rule="evenodd" d="M0 3.5A3.5 3.5 0 0 1 3.5 0h21A3.5 3.5 0 0 1 28 3.5v21a3.5 3.5 0 0 1-3.5 3.5h-21A3.5 3.5 0 0 1 0 24.5zM4 4v20h20V4z"/>
  <path fill="#2F7D4F" d="M14 8h5a1 1 0 0 1 1 1v5a6 6 0 0 1-6 6H9a1 1 0 0 1-1-1v-5a6 6 0 0 1 6-6z"/>
  <path fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" d="M10.2 17.8 16.6 11.4"/>
</svg>
```

Wordmark: "Immer" in fir, "QR" in moss (dark mode: ink and shoot), Bricolage Grotesque 800.

### Code style: "Blatt im Auge"

How the app draws codes by default:

- Data modules: dots, radius 0.45 module, fir `#0F3B2C` on white.
- Finder patterns: outer ring stays **square**; the 3×3 core is a moss leaf.
- Quiet zone: 4 modules. Error correction: Q by default, H with a logo.
- Background: always white, in both themes.
- A plain option (classic black squares) is always available.

Tested with OpenCV's `QRCodeDetector` and `QRCodeDetectorAruco`, full size and scaled to 300 px (`brand/scan-test.py`): dots + square ring + leaf core decode everywhere; a leaf-shaped or rounded **outer** ring fails, so it is not allowed. Light modules (shoot on white, 1.5:1) are not allowed either. Test on real phones before shipping.

### Domain

`immerqr.de`, the only domain. Generated codes never point at it, so the site can move hosts without breaking any code.

## Voice

- Say what the code contains, word for word.
- German uses "du": friendly, not salesy.
- Labels say what happens: "PNG laden", "Download PNG".
- Never "Pro", "Premium" or upgrade hints.
- No exclamation marks or growth-hacking copy.
- No vague trust claims; show the scan check instead.
- Garden metaphors in small doses: one per screen at most.
- No eco claims: the green is about lasting, not about CO₂.
