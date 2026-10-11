/**
 * День — единица записи.
 *
 * Раньше тапы склеивались по временному окну в 2 минуты: эвристика с краями
 * (прыжок часов, долгая серия, пауза чуть больше окна). День — не эвристика,
 * а факт: тап попадает в сегодняшний день, и всё.
 */

import type { Lang } from './lang';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Русские месяцы — в родительном падеже: «17 июля». */
const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** Английские — сокращённые, как в календарях: «Jul 17». */
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Ключ дня по локальному времени устройства: «2026-07-17».
 *
 * Локальное время, а не UTC: человек, занимающийся в 23:40, считает это сегодняшним
 * днём. Строка с ведущими нулями сортируется как дата — отдельного порядка не нужно.
 */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * «2026-07-17» → «17 июля» / «Jul 17». Месяц склоняем таблицей: его задаём мы,
 * а не пользователь. Год не пишем: цели живут недели, а не годы.
 */
export function formatDay(key: string, lang: Lang): string {
  const [, month, day] = key.split('-');
  const m = Number(month) - 1;
  return lang === 'en' ? `${MONTHS_EN[m]} ${Number(day)}` : `${Number(day)} ${MONTHS_RU[m]}`;
}

/**
 * Какой по счёту день идёт цель — для подписи «День 12» над названием.
 *
 * Считаем календарные дни, а не сутки: цель, начатая в 23:50, в 00:10 уже
 * во втором дне. Разница берётся по датам, а не по миллисекундам, иначе
 * переход на летнее время давал бы 23-часовые сутки и сбивал счёт.
 */
export function dayNumber(startedAt: number, now: number): number {
  const start = new Date(startedAt);
  const end = new Date(now);
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((b - a) / DAY_MS) + 1);
}

/**
 * Сколько дней заняла цель — для экрана победы, архива и карточки.
 *
 * Те же календарные дни, что в «День 12» на счётчике: закрыл цель в день,
 * когда там было написано «День 12», — значит «за 12 дней». Раньше считали
 * сутки, и в тот же день выходило «за 11» — два экрана противоречили друг
 * другу. Минимум 1: закрыл за один присест — это «за 1 день», а не «за 0».
 */
export function daysSpent(startedAt: number, finishedAt: number): number {
  return dayNumber(startedAt, finishedAt);
}

/**
 * «за 1 день», «за 3 дня», «за 24 дня» / «in 1 day», «in 24 days».
 * Слово наше — значит склоняем.
 */
export function formatDaysSpent(days: number, lang: Lang): string {
  if (lang === 'en') return `in ${days} ${days === 1 ? 'day' : 'days'}`;
  const lastTwo = days % 100;
  const last = days % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `за ${days} дней`;
  if (last === 1) return `за ${days} день`;
  if (last >= 2 && last <= 4) return `за ${days} дня`;
  return `за ${days} дней`;
}
