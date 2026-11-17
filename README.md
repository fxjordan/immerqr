# qrgen

Plain, static QR code generator. URL in, PNG out. The URL is encoded verbatim: no redirect service, no tracking, no expiry.

Needs [uv](https://docs.astral.sh/uv/) (dependencies install automatically on first run).

```sh
./qrgen.py "https://example.com"                         # -> qr.png, 1024x1024
./qrgen.py "https://example.com" -o out.png -s 512       # custom output + size
./qrgen.py "https://example.com" -l logo.png             # logo in the center
./qrgen.py "https://example.com" -l logo.png --logo-scale 0.15
```

With a logo, error correction switches to level H (~30% recoverable). `--logo-scale` is the logo width relative to the QR (default 0.22, max 0.25). Transparent PNG logos work best.
