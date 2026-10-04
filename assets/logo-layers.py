"""Раскладка растрового логотипа Pathway на слои для иконки Android.

Запуск из корня проекта: python assets/logo-layers.py
Пишет иконки в assets/images, а контрольный лист с масками — во временный
каталог (путь печатается в конце). Смотреть его после каждой правки
SCALE/DX/DY: Android показывает только центральные 66 % слоя.

Фон — градиент, восстановленный полиномом по пикселям вне дороги (так он
продолжается и в скруглённые углы, которых у исходника нет). Дорога —
«снятие смешивания» с белым: alpha = проекция (p - B) на (W - B).
"""
import os
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'images')
CHECK = os.path.join(tempfile.gettempdir(), 'pathway-mask-check.png')

src = np.array(Image.open(os.path.join(HERE, 'logo-source.png')).convert('RGBA')).astype(np.float64)
H, W = src.shape[:2]
rgb, alpha = src[..., :3], src[..., 3]

# Цветной квадрат логотипа (замерено по альфе).
X0, X1, Y0, Y1 = 14, 1240, 18, 1221
yy, xx = np.mgrid[0:H, 0:W]
sx = (xx - X0) / (X1 - X0)
sy = (yy - Y0) / (Y1 - Y0)

inside = alpha > 250
inside_core = np.array(Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(21))) > 0

mn, mx = rgb.min(axis=2), rgb.max(axis=2)
road_raw = (mn > 150) & ((mx - mn) < 110)
road_grown = np.array(Image.fromarray((road_raw * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(41))) > 0

sample = inside_core & ~road_grown
DEG = 4


def basis(x, y):
    cols = []
    for i in range(DEG + 1):
        for j in range(DEG + 1 - i):
            cols.append((x ** i) * (y ** j))
    return np.stack(cols, axis=-1)


A = basis(sx[sample], sy[sample])
coef = [np.linalg.lstsq(A, rgb[..., c][sample], rcond=None)[0] for c in range(3)]
resid = np.stack([A @ coef[c] - rgb[..., c][sample] for c in range(3)], -1)
print('fit residual: mean %.2f  p95 %.2f  max %.2f' % (np.abs(resid).mean(), np.percentile(np.abs(resid), 95), np.abs(resid).max()))


def background(x, y):
    B = basis(x, y)
    return np.clip(np.stack([B @ coef[c] for c in range(3)], -1), 0, 255)


Bg = background(sx, sy)
white = np.array([255.0, 255.0, 255.0])
d = white - Bg
a = ((rgb - Bg) * d).sum(-1) / np.maximum((d * d).sum(-1), 1e-6)
a = np.clip(a, 0, 1)
a[~inside] = 0
# Шум фона даёт альфу 0.02–0.08 по всему квадрату — срезаем.
a = np.clip((a - 0.08) / 0.92, 0, 1)
fg = np.where(a[..., None] > 0.02, (rgb - (1 - a[..., None]) * Bg) / np.maximum(a[..., None], 1e-6), 255)
fg = np.clip(fg, 0, 255)

recon = fg * a[..., None] + Bg * (1 - a[..., None])
err = np.abs(recon - rgb)[inside]
print('recon error: mean %.2f  p99 %.2f' % (err.mean(), np.percentile(err, 99)))

road_rgba = np.dstack([fg, a * 255]).astype(np.uint8)


def layer(size, scale, dx, dy):
    """Слой иконки: логотипный квадрат масштабом scale, сдвиг dx/dy в долях слоя."""
    c0x = (1 - scale) / 2 + dx
    c0y = (1 - scale) / 2 + dy
    v, u = np.mgrid[0:size, 0:size]
    lx = ((u + 0.5) / size - c0x) / scale
    ly = ((v + 0.5) / size - c0y) / scale
    bg = background(np.clip(lx, 0, 1), np.clip(ly, 0, 1)).astype(np.uint8)
    # Дорога: исходный квадрат → место в слое.
    road_img = Image.fromarray(road_rgba).crop((X0, Y0, X1, Y1))
    tw, th = round(scale * size), round(scale * size)
    road_img = road_img.resize((tw, th), Image.LANCZOS)
    fg_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fg_layer.alpha_composite(road_img, (round(c0x * size), round(c0y * size)))
    return Image.fromarray(bg).convert('RGBA'), fg_layer


SIZE = 1024
SCALE, DX, DY = 0.74, -0.04, 0.04
bg_l, fg_l = layer(SIZE, SCALE, DX, DY)
bg_l.convert('RGB').save(os.path.join(OUT, 'adaptive-background.png'))
fg_l.save(os.path.join(OUT, 'adaptive-icon.png'))

flat = bg_l.copy()
flat.alpha_composite(fg_l)

# Монохромный слой для тематических иконок Android 13+: белая дорога.
mono = Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0))
mono.putalpha(fg_l.getchannel('A'))
mono.save(os.path.join(OUT, 'adaptive-monochrome.png'))

# Проверка маской: Android видит центральные 66 % слоя, потом режет формой.
crop = flat.crop((round(SIZE * 0.17), round(SIZE * 0.17), round(SIZE * 0.83), round(SIZE * 0.83))).resize((400, 400), Image.LANCZOS)
sheet = Image.new('RGB', (1300, 460), (30, 30, 34))
for i, shape in enumerate(['circle', 'squircle', 'square']):
    m = Image.new('L', (400, 400), 0)
    dr = ImageDraw.Draw(m)
    if shape == 'circle':
        dr.ellipse((0, 0, 399, 399), fill=255)
    elif shape == 'squircle':
        dr.rounded_rectangle((0, 0, 399, 399), radius=120, fill=255)
    else:
        dr.rounded_rectangle((0, 0, 399, 399), radius=40, fill=255)
    sheet.paste(crop, (30 + i * 430, 30), m)
sheet.save(CHECK)

# Обычная иконка (Android 7 и старше, круглая иконка) и логотип карточки —
# исходник как есть, со своими скруглёнными углами. Заставка своя,
# анимированная (assets/logo-anim), системная — пустая (splash-blank.png).
logo = Image.open(os.path.join(HERE, 'logo-source.png')).convert('RGBA')
logo.resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, 'icon.png'))
logo.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'card-logo.png'))
print('маски:', CHECK)
