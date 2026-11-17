# Decode test for QR code styles. Run: uv run --with qrcode --with pillow --with opencv-python-headless python doc/brand/scan-test.py
import qrcode, cv2, numpy as np
from qrcode.constants import ERROR_CORRECT_Q
from PIL import Image, ImageDraw
def render(data, dots, leaf, center, dot_r=0.45, scale=20, pad=4, lr=(2.75,1.75,1.25)):
    q = qrcode.QRCode(error_correction=ERROR_CORRECT_Q, border=0); q.add_data(data); q.make(fit=True)
    m = q.get_matrix(); n = len(m); S = (n + 2*pad) * scale
    im = Image.new("RGB", (S, S), "white"); d = ImageDraw.Draw(im)
    fin = lambda r, c: (r < 7 and c < 7) or (r < 7 and c >= n-7) or (r >= n-7 and c < 7)
    for r in range(n):
        for c in range(n):
            if m[r][c] and not fin(r, c):
                x, y = (c+pad)*scale, (r+pad)*scale
                if dots:
                    cx, cy = x+scale/2, y+scale/2; rr = dot_r*scale
                    d.ellipse((cx-rr, cy-rr, cx+rr, cy+rr), fill="#0F3B2C")
                else:
                    d.rectangle((x, y, x+scale-1, y+scale-1), fill="#0F3B2C")
    for (r0, c0) in [(0,0),(0,n-7),(n-7,0)]:
        x, y = (c0+pad)*scale, (r0+pad)*scale
        corners = (True, False, True, False) if leaf else (False,)*4
        rad = [int(v*scale) for v in lr] if leaf else [0,0,0]
        d.rounded_rectangle((x, y, x+7*scale-1, y+7*scale-1), radius=rad[0], fill="#0F3B2C", corners=corners)
        d.rounded_rectangle((x+scale, y+scale, x+6*scale-1, y+6*scale-1), radius=rad[1], fill="white", corners=corners)
        d.rounded_rectangle((x+2*scale, y+2*scale, x+5*scale-1, y+5*scale-1), radius=rad[2], fill=center, corners=corners)
    return np.array(im)[:, :, ::-1]
u = "https://example.com/speisekarte?tisch=12"
dets = {"cv": cv2.QRCodeDetector(), "aruco": cv2.QRCodeDetectorAruco()}
def test(img):
    res = []
    for name, det in dets.items():
        for sz in (None, 300):
            x = img if sz is None else cv2.resize(img, (sz, sz), interpolation=cv2.INTER_AREA)
            res.append(det.detectAndDecode(x)[0] == u)
    return res
for dots in (False, True):
    for leaf in (False, True):
        for center in ("#0F3B2C", "#2F7D4F"):
            print(f"dots={dots!s:5} leaf={leaf!s:5} center={center}", test(render(u, dots, leaf, center)))
print("mild leaf", test(render(u, True, True, "#0F3B2C", lr=(2.0,1.2,0.8))))

def render2(data, inner_leaf_r, outer_r, scale=20, pad=4):
    q = qrcode.QRCode(error_correction=ERROR_CORRECT_Q, border=0); q.add_data(data); q.make(fit=True)
    m = q.get_matrix(); n = len(m); S = (n + 2*pad) * scale
    im = Image.new("RGB", (S, S), "white"); d = ImageDraw.Draw(im)
    fin = lambda r, c: (r < 7 and c < 7) or (r < 7 and c >= n-7) or (r >= n-7 and c < 7)
    for r in range(n):
        for c in range(n):
            if m[r][c] and not fin(r, c):
                cx, cy = (c+pad+.5)*scale, (r+pad+.5)*scale; rr = .45*scale
                d.ellipse((cx-rr, cy-rr, cx+rr, cy+rr), fill="#0F3B2C")
    for (r0, c0) in [(0,0),(0,n-7),(n-7,0)]:
        x, y = (c0+pad)*scale, (r0+pad)*scale
        d.rounded_rectangle((x, y, x+7*scale-1, y+7*scale-1), radius=int(outer_r*scale), fill="#0F3B2C")
        d.rounded_rectangle((x+scale, y+scale, x+6*scale-1, y+6*scale-1), radius=int(max(outer_r-1,0)*scale), fill="white")
        d.rounded_rectangle((x+2*scale, y+2*scale, x+5*scale-1, y+5*scale-1), radius=int(inner_leaf_r*scale), fill="#2F7D4F", corners=(True, False, True, False))
    return np.array(im)[:, :, ::-1]
print("---")
for ilr in (1.0, 1.25, 1.5):
    for orr in (0, 1.0, 1.5):
        print(f"inner_leaf={ilr} outer_round={orr}", test(render2(u, ilr, orr)))
