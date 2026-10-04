/**
 * Геометрия тропы — линии прогресса на счётчике, экране победы и в карточке.
 *
 * Форма одна на всё приложение и задана в собственных координатах 342×128:
 * SVG растягивает её под ширину экрана через viewBox. Поэтому длину и точки
 * можно посчитать один раз при загрузке модуля, а не мерить на устройстве.
 */

export const TRAIL_VIEW = { width: 342, height: 128 } as const;

type Point = readonly [number, number];
type Cubic = readonly [Point, Point, Point, Point];

/**
 * Два кубических сегмента: от старта слева внизу к финишу справа вверху.
 * Концы отступают от краёв на ореол маркера (17–18): SVG обрезает всё, что
 * за viewBox, и ореол на старте и финише срезало бы по краю.
 */
const SEGMENTS: readonly Cubic[] = [
  [[18, 108], [98, 108], [104, 36], [176, 56]],
  [[176, 56], [244, 75], [256, 22], [322, 20]],
];

export const TRAIL_START: Point = SEGMENTS[0][0];
export const TRAIL_END: Point = SEGMENTS[1][3];

export const TRAIL_PATH =
  `M${SEGMENTS[0][0].join(' ')}` + SEGMENTS.map(([, a, b, c]) => `C${a.join(' ')} ${b.join(' ')} ${c.join(' ')}`).join('');

function cubicAt([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return [
    w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0],
    w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1],
  ];
}

/** Сколько точек в таблице «доля пути → координата». 100 шагов по 1 % — глазу хватает. */
const STEPS = 100;

function buildTable() {
  // Плотная выборка по параметру t, потом перевод в равные доли длины:
  // у кривой Безье t и пройденная длина не пропорциональны.
  const dense: Point[] = [];
  for (const seg of SEGMENTS) {
    for (let i = 0; i <= 400; i++) dense.push(cubicAt(seg, i / 400));
  }
  const acc = [0];
  for (let i = 1; i < dense.length; i++) {
    const [x0, y0] = dense[i - 1];
    const [x1, y1] = dense[i];
    acc.push(acc[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const length = acc[acc.length - 1];

  const xs: number[] = [];
  const ys: number[] = [];
  let j = 0;
  for (let k = 0; k <= STEPS; k++) {
    const target = (k / STEPS) * length;
    while (j < acc.length - 1 && acc[j + 1] < target) j++;
    const span = acc[j + 1] - acc[j] || 1;
    const f = Math.min(1, Math.max(0, (target - acc[j]) / span));
    const a = dense[j];
    const b = dense[Math.min(j + 1, dense.length - 1)];
    xs.push(a[0] + (b[0] - a[0]) * f);
    ys.push(a[1] + (b[1] - a[1]) * f);
  }
  return { length, xs, ys };
}

const table = buildTable();

/** Длина тропы в координатах viewBox — для strokeDasharray. */
export const TRAIL_LENGTH = table.length;
export const TRAIL_XS: readonly number[] = table.xs;
export const TRAIL_YS: readonly number[] = table.ys;

/**
 * Точка на тропе по доле пройденного пути, 0..1.
 *
 * Worklet: зовётся из анимации маркера в UI-потоке. Таблицы передаются
 * аргументами — так их не нужно замыкать, и reanimated копирует их явно.
 */
export function trailPointAt(fraction: number, xs: readonly number[], ys: readonly number[]): Point {
  'worklet';
  const clamped = Math.min(1, Math.max(0, fraction));
  const pos = clamped * (xs.length - 1);
  const i = Math.floor(pos);
  const next = Math.min(i + 1, xs.length - 1);
  const f = pos - i;
  return [xs[i] + (xs[next] - xs[i]) * f, ys[i] + (ys[next] - ys[i]) * f];
}
