"""Шаг 1 из 2: логотип → маски дороги, наконечника и полос проявки.

Запуск из корня проекта:
    python assets/logo-anim/prepare.py
    node assets/logo-anim/trace.mjs

Что делает. Из растрового `assets/logo-source.png` восстанавливает фон
плитки (полиномом, как logo-layers.py) и снимает с него белую дорогу. Дорогу
делит на наконечник стрелки и тело, а тело — на 40 полос по «пройденному
пути»: геодезическое расстояние от нижнего края по самой дороге. Полосы
проявляются по одной вслед за стрелкой, из их центров складывается маршрут,
по которому стрелка едет.

Пишет:
- маски полос, тела и наконечника — во временный каталог (для trace.mjs);
- `geom.json` рядом с масками — маршрут, точку крепления и угол стрелки;
- `assets/images/logo-tile-bg.png` — фон плитки без дороги.
"""
import json
import math
import os
import tempfile

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'assets', 'logo-source.png')
TILE_BG = os.path.join(ROOT, 'assets', 'images', 'logo-tile-bg.png')
WORK = os.path.join(tempfile.gettempdir(), 'pathway-logo-anim')
MASKS = os.path.join(WORK, 'masks')
os.makedirs(MASKS, exist_ok=True)

# Цветной квадрат логотипа в исходнике (замерено по альфе).
X0, X1, Y0, Y1 = 14, 1240, 18, 1221
N = 1000  # координаты плитки: 1000×1000

# --- Фон и дорога ---------------------------------------------------------------
src = np.array(Image.open(SRC).convert('RGBA')).astype(np.float64)
H, W = src.shape[:2]
rgb, alpha = src[..., :3], src[..., 3]
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
    return np.stack([(x ** i) * (y ** j) for i in range(DEG + 1) for j in range(DEG + 1 - i)], -1)


A = basis(sx[sample], sy[sample])
coef = [np.linalg.lstsq(A, rgb[..., c][sample], rcond=None)[0] for c in range(3)]
Bg = np.clip(np.stack([basis(sx, sy) @ coef[c] for c in range(3)], -1), 0, 255)
d = 255.0 - Bg
a = np.clip(((rgb - Bg) * d).sum(-1) / np.maximum((d * d).sum(-1), 1e-6), 0, 1)
a[~inside] = 0
a = np.clip((a - 0.08) / 0.92, 0, 1)

Image.fromarray(Bg.astype(np.uint8)).crop((X0, Y0, X1, Y1)).resize((512, 512), Image.LANCZOS).save(TILE_BG)

road = np.array(Image.fromarray((a * 255).astype(np.uint8)).crop((X0, Y0, X1, Y1)).resize((N, N), Image.LANCZOS)) > 127
yy, xx = np.mgrid[0:N, 0:N]

# --- Наконечник ------------------------------------------------------------------
# Линия основания проходит через две внутренние точки «усов»; всё, что за ней
# со стороны острия, — наконечник.
P0 = np.array([647.0, 327.0])
P1 = np.array([714.0, 365.0])
TIP = np.array([800.0, 212.0])
dv = P1 - P0
nrm = np.array([dv[1], -dv[0]])
side = (xx - P0[0]) * nrm[0] + (yy - P0[1]) * nrm[1]
arrow = road & (side > 0) & (xx > 560) & (yy < 440)
body = road & ~arrow
ANCHOR = (P0 + P1) / 2

# --- Пройденный путь: волна от нижнего края по телу дороги (сетка 500) -------------
S = 2
small = np.array(Image.fromarray((body * 255).astype(np.uint8)).resize((N // S, N // S), Image.NEAREST)) > 127
dist = np.full(small.shape, -1, dtype=np.int32)
front = small & (np.arange(small.shape[0])[:, None] >= small.shape[0] - 3)
dist[front] = 0
step = 0
while front.any():
    step += 1
    grown = np.zeros_like(front)
    grown[1:, :] |= front[:-1, :]
    grown[:-1, :] |= front[1:, :]
    grown[:, 1:] |= front[:, :-1]
    grown[:, :-1] |= front[:, 1:]
    grown[1:, 1:] |= front[:-1, :-1]
    grown[:-1, :-1] |= front[1:, 1:]
    grown[1:, :-1] |= front[:-1, 1:]
    grown[:-1, 1:] |= front[1:, :-1]
    front = grown & small & (dist < 0)
    dist[front] = step
maxd = dist.max()

prog = np.repeat(np.repeat(np.where(dist >= 0, dist / maxd, -1.0), S, 0), S, 1)
reached = np.array(Image.fromarray(((prog >= 0) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 127
# Крошки маски, до которых волна не дошла, — не дорога. Маска волны расширена
# на 3 px, чтобы её «лесенка» не легла на край дороги.
body = body & reached
# Краевым пикселям, которых волна на грубой сетке не достала, — путь соседа.
for _ in range(6):
    hole = body & (prog < 0)
    if not hole.any():
        break
    nb = np.full_like(prog, -1.0)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            nb = np.maximum(nb, np.roll(np.roll(prog, dy, 0), dx, 1))
    prog = np.where(hole, nb, prog)
body = body & (prog >= 0)

# --- Полосы и маршрут ------------------------------------------------------------
K = 40
centers = []
for k in range(K):
    lo, hi = k / K, (k + 1) / K
    band = body & (prog >= lo) & ((prog < hi) if k < K - 1 else (prog <= 1.0001))
    if not band.any():
        continue
    # Запас в 3 px во все стороны — чтобы на стыках полос не было щелей.
    b = band.copy()
    for _ in range(3):
        g = b.copy()
        g[1:, :] |= b[:-1, :]
        g[:-1, :] |= b[1:, :]
        g[:, 1:] |= b[:, :-1]
        g[:, :-1] |= b[:, 1:]
        b = g
    b &= body
    Image.fromarray(np.where(b, 0, 255).astype(np.uint8)).save(os.path.join(MASKS, f'band{len(centers):02d}.png'))
    ys, xs = np.nonzero(band)
    centers.append([float(xs.mean()), float(ys.mean())])

# Скользящее среднее по 5 точкам; последняя точка — основание наконечника.
route = []
for i in range(len(centers)):
    lo, hi = max(0, i - 2), min(len(centers), i + 3)
    route.append([sum(p[0] for p in centers[lo:hi]) / (hi - lo), sum(p[1] for p in centers[lo:hi]) / (hi - lo)])
route.append([float(ANCHOR[0]), float(ANCHOR[1])])
# Стрелка въезжает из-за нижнего края плитки: точка далеко за стартом.
(x0, y0), (x1, y1) = route[0], route[1]
route.insert(0, [x0 + (x0 - x1) * 6, y0 + (y0 - y1) * 6])

Image.fromarray(np.where(body, 0, 255).astype(np.uint8)).save(os.path.join(MASKS, 'body.png'))
Image.fromarray(np.where(arrow, 0, 255).astype(np.uint8)).save(os.path.join(MASKS, 'arrow.png'))

final_angle = math.degrees(math.atan2(TIP[1] - ANCHOR[1], TIP[0] - ANCHOR[0]))
with open(os.path.join(WORK, 'geom.json'), 'w', encoding='utf-8') as f:
    json.dump({'bands': len(centers), 'route': route, 'anchor': ANCHOR.tolist(), 'tip': TIP.tolist(),
               'finalAngle': final_angle}, f)
print(f'полос: {len(centers)}, точек маршрута: {len(route)}, маски: {MASKS}')
