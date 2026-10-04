/**
 * Логика прогресса. Чистые функции: без React, без SQL, без Date.now().
 * Время всегда приходит аргументом — иначе это не тестируется.
 *
 * Обоснования — docs/03-архитектура.md.
 */

import { DAY_MS } from './day';

export { DAY_MS };

/** Единственный способ узнать прогресс. Кэшированного поля `current` не существует. */
export function sumAmounts(entries: readonly { amount: number }[]): number {
  return entries.reduce((acc, e) => acc + e.amount, 0);
}

/**
 * Прогресс после правки дня: старое значение уходит, новое приходит.
 * Нужен, чтобы показать результат правки до её применения.
 */
export function progressAfterEdit(current: number, oldAmount: number, newAmount: number): number {
  return current - oldAmount + newAmount;
}

/**
 * Сколько осталось. Прогресс не может быть отрицательным (записи всегда ≥ 0),
 * поэтому остаток просто не уходит ниже нуля при перевыполнении.
 */
export function remaining(current: number, target: number): number {
  return Math.max(0, target - current);
}

/**
 * Годится ли число как добавка или как новое значение дня.
 *
 * Отрицательных записей не бывает: сделать минус невозможно. Ошибку исправляют
 * правкой дня («было не 200, а 150»), а не вычитанием. Поэтому и прогресс
 * не может уйти в минус — не проверкой, а тем, что нечему.
 *
 * Ноль как новое значение дня допустим: это способ убрать день, которого не было.
 */
export function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}

export function isReached(current: number, target: number): boolean {
  return current >= target;
}

/**
 * Закрыто досрочно — то есть до цели не дошли.
 *
 * Отдельного поля в базе нет намеренно: это вычисляется из тех же данных,
 * что и всё остальное (правило «прогресс не хранится»). Заодно правка дня
 * в архиве автоматически меняет и этот признак.
 *
 * От него зависит, можно ли вернуть цель в работу: у достигнутой цели
 * возврат мгновенно показал бы экран победы снова.
 */
export function isClosedEarly(current: number, target: number): boolean {
  return current < target;
}

/**
 * Насколько перевыполнено. Цель 1000, набрано 1010 → 10.
 * Обрезать прогресс до цели нельзя: это враньё про чужую тренировку.
 */
export function overshoot(current: number, target: number): number {
  return Math.max(0, current - target);
}

/**
 * Доля для кольца прогресса, 0..1.
 * Цель 0 — деление на ноль, поэтому считаем такую цель достигнутой.
 * Отрицательный прогресс (наисправлялся в минус) — это 0, а не минус кольцо.
 */
export function progressFraction(current: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(1, Math.max(0, current / target));
}

/*
 * Срока у цели нет — вырезан вместе с темпом «по 34 в день» и пометкой
 * «срок прошёл». Цель, к которой идут по чуть-чуть, дедлайна не просит,
 * а поле срока отжимало кнопку «Начать» за нижний край экрана.
 */
