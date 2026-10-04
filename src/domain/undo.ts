/**
 * Сессия отмены.
 *
 * Сессия — это всё, что натапано, пока горит плашка «+30 · Отменить».
 * Отмена снимает сессию целиком: человек не считает отдельные нажатия,
 * он видит одно число и хочет убрать именно его.
 *
 * Плашка гаснет → сессия забывается. Следующий тап начинает новую с нуля.
 */

export type Tap = { day: string; amount: number };

/** Сумма сессии — то самое число на плашке. */
export function sessionTotal(taps: readonly Tap[]): number {
  return taps.reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Сколько снять с каждого дня при отмене сессии.
 *
 * Обычно сессия целиком в одном дне, но таймер плашки продлевается каждым тапом:
 * если тапать в 23:59, сессия переедет через полночь и заденет два дня.
 */
export function tapsByDay(taps: readonly Tap[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const tap of taps) {
    byDay.set(tap.day, (byDay.get(tap.day) ?? 0) + tap.amount);
  }
  return byDay;
}
