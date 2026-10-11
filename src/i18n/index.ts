/**
 * Язык интерфейса: текущий выбор, словари и подписи.
 *
 * Правило проекта: текст на экране — только отсюда. Строка прямо в компоненте —
 * такая же ошибка, как цвет мимо tokens.ts.
 *
 * Выбор живёт в сторе (переключение — мгновенно, без перезапуска) и в базе
 * (`app_state`, переживает перезапуск). Пока человек язык не выбирал, берём
 * язык телефона — и не записываем его: сменит язык телефона — со следующего
 * запуска приложение пойдёт следом.
 */

import { I18nManager, Platform, Settings } from 'react-native';
import { create } from 'zustand';

import { loadLanguage, saveLanguage } from '@/data/settings-repo';
import { BackupError } from '@/domain/backup';
import { langFromLocale, langFromLocales, type Lang } from '@/domain/lang';
import { en } from './en';
import { ru, type Dictionary } from './ru';

export type { Dictionary } from './ru';
export type { Lang } from '@/domain/lang';

const DICTIONARIES: Record<Lang, Dictionary> = { ru, en };

/**
 * Названия языков в переключателе. Каждое — на своём языке и не переводится:
 * человек, случайно включивший чужой язык, должен узнать свой.
 */
export const LANGUAGE_NAMES: Record<Lang, string> = { ru: 'Русский', en: 'English' };

/** iOS: список языков, которые человек предпочитает (с учётом выбора для приложения в Настройках iOS). */
function applePreferredLanguages(): string[] {
  try {
    const preferred: unknown = Settings.get('AppleLanguages');
    return Array.isArray(preferred) ? preferred.filter((l): l is string => typeof l === 'string') : [];
  } catch {
    return [];
  }
}

/** Локаль устройства, как её видит React Native: «ru_RU». */
function deviceLocale(): string | undefined {
  try {
    return I18nManager.getConstants().localeIdentifier ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Язык телефона.
 *
 * На iOS — первый знакомый язык из списка предпочтений: локаль процесса там
 * зависит от того, какие языки объявлены в сборке, и может врать. Список не
 * прочитался — откатываемся на локаль устройства, как на Android.
 */
export function deviceLang(): Lang {
  if (Platform.OS === 'ios') {
    const preferred = applePreferredLanguages();
    if (preferred.length > 0) return langFromLocales(preferred);
  }
  return langFromLocale(deviceLocale());
}

type LanguageStore = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  lang: deviceLang(),
  setLang: (lang) => {
    set({ lang });
    // Запись не ждём: интерфейс уже переключился, а не записалось — при
    // следующем запуске просто вернётся прежний выбор.
    void saveLanguage(lang).catch(() => {});
  },
}));

/** Достаёт сохранённый выбор из базы. Зовётся один раз — после миграций, до снятия заставки. */
export async function restoreLanguage(): Promise<void> {
  const saved = await loadLanguage();
  if (saved) useLanguageStore.setState({ lang: saved });
}

/** Словарь текущего языка — для компонентов. */
export function useT(): Dictionary {
  return DICTIONARIES[useLanguageStore((s) => s.lang)];
}

/** Текущий язык — для дат и склонений из `domain/day`. */
export function useLang(): Lang {
  return useLanguageStore((s) => s.lang);
}

/** Словарь вне компонентов: системные окна, тексты для меню «Поделиться». */
export function getT(): Dictionary {
  return DICTIONARIES[useLanguageStore.getState().lang];
}

/**
 * Почему копия не подошла — словами текущего языка. Ошибка разбора JSON —
 * тоже «не наш файл»: человек выбрал что-то другое.
 */
export function backupErrorText(error: unknown): string {
  const t = getT();
  if (error instanceof BackupError) return t.backupErrors[error.code];
  if (error instanceof SyntaxError) return t.backupErrors.notBackup;
  return t.backupErrors.unreadable;
}
