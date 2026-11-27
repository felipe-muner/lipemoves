"""Example LipeMoves covers following assets/covers/STYLE.md.
Full-bleed photo, huge flat-colour caps headline placed BEHIND the person
(person cut out with Apple Vision, see mask.swift), no shadows, no blur."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT = "/Users/felipe/projects/lipemoves"
OUT = f"{ROOT}/assets/covers/examples"
MASKS = f"{ROOT}/assets/covers/masks"
os.makedirs(OUT, exist_ok=True)
FUT = "/System/Library/Fonts/Supplemental/Futura.ttc"
BOLD = lambda s: ImageFont.truetype(FUT, s, index=2)   # Futura Bold
WHITE = (255, 255, 255)
TEAL = (38, 128, 152)
SKY = (52, 160, 196)
CORAL = (238, 122, 82)
PALE = (248, 236, 140)

# crop: (cx, cy, zoom) centre of the crop as a fraction of the photo
# head: list of (text, size as fraction of cover height, colour)
# block: (x, y, w, align) as fractions of the cover; lines stacked from y
COVERS = [
    dict(slug="kettlebell-flow", src="public/landing/hero.jpg",
         yt=dict(crop=(0.5, 0.30, 1.0), block=(0.03, 0.03, 0.94, "left"),
                 lines=[("KETTLEBELL", 0.30, CORAL)],
                 extra=[("20 MIN FLOW  |  NO TALKING", 0.055, WHITE, (0.45, 0.31, 0.50, "right"))]),
         ig=dict(crop=(0.55, 0.5, 1.0), block=(0.33, 0.17, 0.62, "right"),
                 lines=[("KETTLEBELL", 0.06, CORAL), ("FLOW", 0.10, CORAL), ("20 MIN  |  NO TALKING", 0.022, WHITE)])),
    dict(slug="forearm-stand", src="public/ebooks/photos/GAB00162-2.jpg",
         yt=dict(crop=(0.5, 0.45, 1.0), block=(0.03, 0.50, 0.37, "left"),
                 lines=[("BUILD UP TO", 0.07, PALE), ("FOREARM", 0.15, WHITE), ("STAND", 0.15, WHITE)]),
         ig=dict(crop=(0.43, 0.43, 1.0), block=(0.07, 0.155, 0.86, "center"),
                 lines=[("BUILD UP TO", 0.024, PALE), ("FOREARM", 0.055, WHITE), ("STAND", 0.055, WHITE)])),
    dict(slug="open-hips", src="public/ebooks/photos/IMG_7149.jpg",
         yt=dict(crop=(0.5, 0.52, 1.0), block=(0.03, 0.03, 0.94, "center"),
                 lines=[("RELEASE TIGHT", 0.08, CORAL), ("HIPS", 0.40, TEAL)]),
         ig=dict(crop=(0.5, 0.5, 1.0), block=(0.05, 0.17, 0.90, "center"),
                 lines=[("RELEASE TIGHT", 0.035, CORAL), ("HIPS", 0.17, TEAL), ("30 MIN FLOW", 0.035, CORAL)])),
]


def crop_fill(im, W, H, cx, cy, zoom):
    r = max(W / im.width, H / im.height) * zoom
    big = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = max(0, min(big.width - W, int(big.width * cx - W / 2)))
    y = max(0, min(big.height - H, int(big.height * cy - H / 2)))
    return big.crop((x, y, x + W, y + H))


def render(c, fmt, W, H):
    o = c[fmt]
    base = os.path.splitext(os.path.basename(c["src"]))[0]
    photo = Image.open(f"{ROOT}/{c['src']}").convert("RGB")
    mask = Image.open(f"{MASKS}/{base}-mask.png").convert("L")
    bg = crop_fill(photo, W, H, *o["crop"]).convert("RGBA")
    m = crop_fill(mask, W, H, *o["crop"]).filter(ImageFilter.GaussianBlur(1.2))
    person = bg.copy()
    person.putalpha(m)

    txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(txt)
    fx, fy, fw, align = o["block"]
    x0, y, w = fx * W, fy * H, fw * W
    for text, size, color in o["lines"]:
        s = int(size * H)
        f = BOLD(s)
        while f.getbbox(text)[2] - f.getbbox(text)[0] > w and s > 10:
            s -= 2
            f = BOLD(s)
        bb = f.getbbox(text)
        tw = bb[2] - bb[0]
        x = {"left": x0, "right": x0 + w - tw, "center": x0 + (w - tw) / 2}[align]
        d.text((x - bb[0], y - bb[1]), text, font=f, fill=color + (255,))
        y += (bb[3] - bb[1]) + s * 0.10

    for text, size, color, (ex, ey, ew, ealign) in o.get("extra", []):
        f = BOLD(int(size * H))
        bb = f.getbbox(text)
        tw = bb[2] - bb[0]
        x = {"left": ex * W, "right": ex * W + ew * W - tw, "center": ex * W + (ew * W - tw) / 2}[ealign]
        d.text((x - bb[0], ey * H - bb[1]), text, font=f, fill=color + (255,))

    out = Image.alpha_composite(Image.alpha_composite(bg, txt), person)
    name = "youtube" if fmt == "yt" else "instagram"
    out.convert("RGB").save(f"{OUT}/{c['slug']}-{name}.jpg", quality=90)


for c in COVERS:
    render(c, "yt", 1280, 720)
    render(c, "ig", 1080, 1920)
print("ok")
