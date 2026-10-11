/**
 * Язык интерфейса — только выбор, без слов. Сами словари живут в `src/i18n`.
 */

export type Lang = 'ru' | 'en';

export const LANGS: readonly Lang[] = ['ru', 'en'];

export function isLang(value: unknown): value is Lang {
  return value === 'ru' || value === 'en';
}

/**
 * Язык по локали телефона: «ru_RU», «ru-KZ», «ru» → русский, всё остальное →
 * английский. Регион не важен: человек с русским языком в Казахстане читает
 * по-русски, с английским в России — по-английски.
 */
export function langFromLocale(locale: string | null | undefined): Lang {
  return langFromLocales([locale]);
}

/**
 * Язык по списку предпочтений телефона: первый, который мы знаем. Казах с
 * русским вторым языком получит русский, немец с английским — английский.
 * Ничего знакомого — английский.
 */
export function langFromLocales(locales: readonly (string | null | undefined)[]): Lang {
  for (const locale of locales) {
    if (!locale) continue;
    if (/^ru(?:[-_]|$)/i.test(locale)) return 'ru';
    if (/^en(?:[-_]|$)/i.test(locale)) return 'en';
  }
  return 'en';
}
