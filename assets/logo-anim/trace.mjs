// Шаг 2 из 2: маски из prepare.py → контуры SVG → src/ui/logo-geometry.ts.
//
// Зависимость одна — potrace, ставится здесь же, в свой node_modules:
//   cd assets/logo-anim && npm i
// Запуск из корня проекта: node assets/logo-anim/trace.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { Potrace } = require('potrace');

const work = path.join(os.tmpdir(), 'pathway-logo-anim');
const masks = path.join(work, 'masks');
const out = path.join(here, '..', '..', 'src', 'ui', 'logo-geometry.ts');
const geom = JSON.parse(fs.readFileSync(path.join(work, 'geom.json'), 'utf8'));

function trace(file, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = new Potrace({ turdSize: 20, alphaMax: 1, optCurve: true, optTolerance: 0.3, threshold: 128, ...opts });
    p.loadImage(path.join(masks, file), (err) => {
      if (err) return reject(err);
      const m = p.getPathTag('#fff').match(/ d="([^"]+)"/);
      resolve(m ? m[1].replace(/\s+/g, ' ').trim() : '');
    });
  });
}

// Тело и наконечник видны в финальном кадре — десятые доли. Полосы только
// проявляют дорогу и потом прячутся под телом — целых хватает.
const round1 = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));
const round0 = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n))));
const r1 = (n) => Math.round(n * 10) / 10;

const body = round1(await trace('body.png'));
const arrow = round1(await trace('arrow.png'));
const bands = [];
for (let k = 0; k < geom.bands; k++) {
  bands.push(round0(await trace(`band${String(k).padStart(2, '0')}.png`, { turdSize: 30, optTolerance: 1.2 })));
}

const ts = `/**
 * Геометрия логотипа для анимированной заставки. СГЕНЕРИРОВАНО — не править.
 *
 * Источник — растровый assets/logo-source.png, генератор — assets/logo-anim
 * (prepare.py, затем trace.mjs). Координаты плитки: 1000×1000, начало
 * в левом верхнем углу цветного квадрата.
 */

export const LOGO_SIZE = 1000;

/** Дорога без наконечника — финальный, чистый контур. */
export const ROAD_PATH =
  '${body}';

/** Наконечник стрелки в финальном положении. */
export const ARROW_PATH =
  '${arrow}';

/**
 * Дорога, нарезанная по пройденному пути: от нижнего края к стрелке.
 * Полосы перекрываются на 3 px, поэтому стыков не видно.
 */
export const ROAD_BANDS: readonly string[] = [
${bands.map((b) => `  '${b}',`).join('\n')}
];

/**
 * Маршрут стрелки: точка за нижним краем плитки, центры полос (точка i —
 * центр полосы i − 1), основание наконечника.
 */
export const ROUTE_X: readonly number[] = [${geom.route.map((p) => r1(p[0])).join(', ')}];
export const ROUTE_Y: readonly number[] = [${geom.route.map((p) => r1(p[1])).join(', ')}];

/** Точка крепления наконечника: середина его основания. */
export const ARROW_ANCHOR = { x: ${r1(geom.anchor[0])}, y: ${r1(geom.anchor[1])} } as const;
/** Острие — отсюда разливается градиент. */
export const ARROW_TIP = { x: ${r1(geom.tip[0])}, y: ${r1(geom.tip[1])} } as const;
/** Куда смотрит стрелка в финале, градусы (0 — вправо, по часовой — плюс). */
export const ARROW_FINAL_ANGLE = ${r1(geom.finalAngle)};
`;

fs.writeFileSync(out, ts);
console.log(`записано: ${path.relative(process.cwd(), out)} (${ts.length} байт, полос ${bands.length})`);
