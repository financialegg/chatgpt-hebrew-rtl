from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets"
OUT.mkdir(exist_ok=True)

NAVY = (15, 33, 64, 255)
BLUE = (45, 137, 239, 255)
CYAN = (45, 196, 205, 255)
WHITE = (255, 255, 255, 255)
LIGHT = (245, 248, 252, 255)
GRAY = (86, 101, 119, 255)
BORDER = (216, 224, 234, 255)
GREEN = (32, 167, 114, 255)

FONT_HE = "/usr/share/fonts/truetype/noto/NotoSansHebrew-Regular.ttf"
FONT_HE_BOLD = "/usr/share/fonts/truetype/noto/NotoSansHebrew-Bold.ttf"
FONT_LAT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_LAT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(path, size):
    return ImageFont.truetype(path, size=size)

def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, round(size * 0.125))
    d.ellipse((pad, pad, size - pad, size - pad), fill=NAVY)
    y = round(size * 0.70)
    x1 = round(size * 0.66)
    x2 = round(size * 0.36)
    width = max(1, round(size * 0.045))
    d.line((x1, y, x2, y), fill=CYAN, width=width)
    d.line((x2, y, x2 + round(size * 0.10), y - round(size * 0.08)), fill=CYAN, width=width)
    d.line((x2, y, x2 + round(size * 0.10), y + round(size * 0.08)), fill=CYAN, width=width)
    f = font(FONT_HE_BOLD, max(10, round(size * 0.45)))
    text = "א"
    bbox = d.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    tx = (size - tw) // 2
    ty = round(size * 0.17) - bbox[1]
    d.text((tx, ty), text, font=f, fill=WHITE)
    return img

# The package icons are generated from the same design.
icons_dir = ROOT / "browser-extension" / "icons"
icons_dir.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 128):
    make_icon(size).save(icons_dir / f"icon{size}.png")

# Store screenshot: accurate visual representation of the popup and core RTL behavior.
W, H = 1280, 800
img = Image.new("RGB", (W, H), LIGHT[:3])
d = ImageDraw.Draw(img)
d.rounded_rectangle((60, 55, 1220, 745), radius=28, fill=(255, 255, 255), outline=BORDER[:3], width=2)
icon = make_icon(96)
img.paste(icon, (92, 82), icon)
d.text((205, 92), "Hebrew RTL for ChatGPT", font=font(FONT_LAT_BOLD, 36), fill=NAVY[:3])

subtitle = "עברית תקינה מימין לשמאל בתוך ChatGPT"
fsub = font(FONT_HE_BOLD, 28)
bbox = d.textbbox((0, 0), subtitle, font=fsub)
d.text((1160 - (bbox[2] - bbox[0]), 145), subtitle, font=fsub, fill=GRAY[:3])

pane = (95, 210, 790, 685)
d.rounded_rectangle(pane, radius=18, fill=(248, 250, 253), outline=BORDER[:3], width=2)
bubble = (135, 260, 745, 560)
d.rounded_rectangle(bubble, radius=20, fill=(255, 255, 255), outline=(227, 233, 240), width=2)

lines = [
    "מניית אנבידיה (NVDA) עלתה ב־5.3% לאחר הדוח.",
    "זיכרון ברוחב פס גבוה (HBM) ממשיך להיות צוואר בקבוק מרכזי.",
    "תשואת אג״ח ארצות הברית ל־10 שנים ירדה ל־4.12%.",
]
fy = font(FONT_HE, 25)
y = 305
for line in lines:
    bbox = d.textbbox((0, 0), line, font=fy)
    d.text((710 - (bbox[2] - bbox[0]), y), line, font=fy, fill=(31, 41, 55))
    y += 76

tagf = font(FONT_LAT_BOLD, 18)
d.rounded_rectangle((135, 590, 320, 630), radius=20, fill=(231, 247, 243))
d.text((160, 599), "RTL", font=tagf, fill=GREEN[:3])
d.rounded_rectangle((335, 590, 570, 630), radius=20, fill=(234, 244, 255))
d.text((360, 599), "Code stays LTR", font=font(FONT_LAT_BOLD, 16), fill=BLUE[:3])

card = (840, 225, 1170, 630)
d.rounded_rectangle(card, radius=22, fill=(255, 255, 255), outline=BORDER[:3], width=2)
d.text((875, 260), "Hebrew RTL", font=font(FONT_LAT_BOLD, 28), fill=NAVY[:3])

lab = "מצב תצוגה"
flab = font(FONT_HE_BOLD, 20)
bb = d.textbbox((0, 0), lab, font=flab)
d.text((1130 - (bb[2] - bb[0]), 315), lab, font=flab, fill=(42, 52, 66))
d.rounded_rectangle((875, 350, 1135, 402), radius=10, fill=(249, 250, 252), outline=BORDER[:3])
smart = "חכם"
fsm = font(FONT_HE, 19)
bb = d.textbbox((0, 0), smart, font=fsm)
d.text((1112 - (bb[2] - bb[0]), 363), smart, font=fsm, fill=(42, 52, 66))

for yy, txt in [(445, "תקן טבלאות"), (505, "תקן את שדה הכתיבה")]:
    d.rounded_rectangle((1097, yy, 1122, yy + 25), radius=5, fill=BLUE[:3])
    d.line((1103, yy + 13, 1109, yy + 19, 1118, yy + 7), fill=WHITE[:3], width=3)
    ft = font(FONT_HE, 19)
    bb = d.textbbox((0, 0), txt, font=ft)
    d.text((1075 - (bb[2] - bb[0]), yy + 1), txt, font=ft, fill=(42, 52, 66))

d.text((95, 705), "Local processing • No analytics • No conversation uploads", font=font(FONT_LAT, 18), fill=GRAY[:3])
img.save(OUT / "screenshot-1280x800.png")

# Small promotional tile.
W, H = 440, 280
img2 = Image.new("RGB", (W, H), NAVY[:3])
d2 = ImageDraw.Draw(img2)
d2.ellipse((-60, -80, 220, 200), fill=(22, 52, 96))
d2.ellipse((270, 120, 520, 370), fill=(20, 63, 102))
ic = make_icon(128)
img2.paste(ic, (36, 74), ic)
d2.text((178, 72), "Hebrew RTL", font=font(FONT_LAT_BOLD, 30), fill=WHITE[:3])
txt = "עברית מסודרת ב־ChatGPT"
fh = font(FONT_HE_BOLD, 23)
bb = d2.textbbox((0, 0), txt, font=fh)
d2.text((405 - (bb[2] - bb[0]), 126), txt, font=fh, fill=(228, 240, 255))
d2.text((178, 176), "Smart RTL • Mixed text • Tables", font=font(FONT_LAT, 15), fill=(191, 216, 241))
img2.save(OUT / "promo-440x280.png")

# Optional marquee.
W, H = 1400, 560
img3 = Image.new("RGB", (W, H), NAVY[:3])
d3 = ImageDraw.Draw(img3)
d3.ellipse((-100, -160, 560, 500), fill=(22, 52, 96))
d3.ellipse((950, 150, 1550, 750), fill=(17, 77, 112))
ic = make_icon(200)
img3.paste(ic, (130, 175), ic)
d3.text((400, 150), "Hebrew RTL for ChatGPT", font=font(FONT_LAT_BOLD, 52), fill=WHITE[:3])
txt = "עברית נכונה. אנגלית וקוד נשארים בכיוון הנכון."
fh = font(FONT_HE_BOLD, 34)
bb = d3.textbbox((0, 0), txt, font=fh)
d3.text((1260 - (bb[2] - bb[0]), 240), txt, font=fh, fill=(225, 238, 250))
d3.text((400, 320), "Smart direction • Tables • Composer • Local processing", font=font(FONT_LAT, 25), fill=(188, 215, 239))
img3.save(OUT / "marquee-1400x560.png")

print("Generated Chrome Web Store assets.")
