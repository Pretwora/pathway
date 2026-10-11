/**
 * Настройки устройства в таблице `app_state`: ключ — значение.
 *
 * Отдельно от целей: восстановление из копии заменяет цели и записи, а выбор
 * языка остаётся — это настройка телефона, а не данные.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appState } from '@/db/schema';
import { isLang, type Lang } from '@/domain/lang';

const LANGUAGE_KEY = 'language';

/** Выбранный язык или null, если человек ещё не выбирал. */
export async function loadLanguage(): Promise<Lang | null> {
  const rows = await db.select().from(appState).where(eq(appState.key, LANGUAGE_KEY)).limit(1);
  const value = rows[0]?.value;
  return isLang(value) ? value : null;
}

export async function saveLanguage(lang: Lang): Promise<void> {
  await db
    .insert(appState)
    .values({ key: LANGUAGE_KEY, value: lang })
    .onConflictDoUpdate({ target: appState.key, set: { value: lang } });
}
