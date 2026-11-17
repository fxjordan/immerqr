#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["qrcode>=7.4", "pillow>=10"]
# ///
"""Generate a plain, static QR code PNG for a URL. No redirects, no tracking, no expiry."""

import argparse
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_M
from PIL import Image

QUIET_ZONE = 4  # modules of white border required by the QR spec


def build_qr(data: str, size: int, with_logo: bool) -> Image.Image:
    # H tolerates ~30% damage, which the logo occludes; M is enough otherwise.
    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H if with_logo else ERROR_CORRECT_M,
        box_size=1,
        border=QUIET_ZONE,
    )
    qr.add_data(data)
    qr.make(fit=True)

    total_modules = qr.modules_count + 2 * QUIET_ZONE
    box = size // total_modules
    if box < 1:
        sys.exit(f"error: size {size}px too small, need at least {total_modules}px for this URL")

    qr.box_size = box
    img = qr.make_image(fill_color="black", back_color="white").get_image().convert("RGB")

    # Integer module size keeps every module crisp; pad the remainder to hit the exact size.
    canvas = Image.new("RGB", (size, size), "white")
    offset = (size - img.width) // 2
    canvas.paste(img, (offset, offset))
    return canvas


def add_logo(img: Image.Image, logo_path: Path, scale: float) -> Image.Image:
    logo = Image.open(logo_path).convert("RGBA")
    max_side = int(img.width * scale)
    logo.thumbnail((max_side, max_side), Image.LANCZOS)

    # White plate behind the logo so it doesn't blend into the modules.
    pad = max(2, max_side // 12)
    plate = Image.new("RGBA", (logo.width + 2 * pad, logo.height + 2 * pad), "white")
    plate.alpha_composite(logo, (pad, pad))

    pos = ((img.width - plate.width) // 2, (img.height - plate.height) // 2)
    out = img.convert("RGBA")
    out.alpha_composite(plate, pos)
    return out.convert("RGB")


def main() -> None:
    p = argparse.ArgumentParser(description="URL -> plain static QR code PNG.")
    p.add_argument("url", help="content to encode, stored verbatim")
    p.add_argument("-o", "--output", type=Path, default=Path("qr.png"), help="output PNG (default: qr.png)")
    p.add_argument("-s", "--size", type=int, default=1024, help="image width/height in px (default: 1024)")
    p.add_argument("-l", "--logo", type=Path, help="optional logo image to place in the center")
    p.add_argument(
        "--logo-scale",
        type=float,
        default=0.22,
        help="logo width as fraction of QR width (default: 0.22, max 0.25 to stay scannable)",
    )
    args = p.parse_args()

    if not 0 < args.logo_scale <= 0.25:
        p.error("--logo-scale must be in (0, 0.25]")

    img = build_qr(args.url, args.size, with_logo=args.logo is not None)
    if args.logo:
        img = add_logo(img, args.logo, args.logo_scale)

    img.save(args.output, "PNG")
    print(f"wrote {args.output} ({args.size}x{args.size}px)")


if __name__ == "__main__":
    main()
