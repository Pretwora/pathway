/**
 * Резервная копия данных в файл.
 *
 * Данные живут только на телефоне (без сервера), поэтому смена или потеря
 * устройства = потеря года тренировок. Экспорт в файл — минимальная защита:
 * человек сам решает, куда положить копию (облако, почта себе, мессенджер).
 */

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { exportAll, replaceAll } from '@/data/goals-repo';
import { parseBackup, type BackupData } from '@/domain/backup';

/** Версия формата — чтобы будущий импорт мог понять, что читает. */
const BACKUP_VERSION = 1;

/**
 * Собирает все цели и записи в JSON, кладёт во временный файл и отдаёт в
 * системное меню «Поделиться». Возвращает false, если делиться негде.
 */
export async function exportBackup(now = Date.now()): Promise<boolean> {
  const data = await exportAll();
  const payload = {
    app: 'pathway',
    version: BACKUP_VERSION,
    exportedAt: now,
    ...data,
  };

  // Дата в имени файла — человеку проще ориентироваться среди копий.
  const stamp = new Date(now).toISOString().slice(0, 10);
  const file = new File(Paths.cache, `pathway-backup-${stamp}.json`);
  // Перезаписываем: копия за сегодня одна.
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Сохранить копию данных',
  });
  return true;
}

/**
 * Даёт выбрать файл копии и разбирает его. Возвращает данные (или null, если
 * пользователь передумал выбирать). Бросает Error с русским текстом, если файл
 * не подходит. Саму замену данных здесь НЕ делает — сначала спросим подтверждение.
 */
export async function pickBackup(): Promise<BackupData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const raw = JSON.parse(file.textSync());
  return parseBackup(raw);
}

/** Заменяет все данные разобранной копией. Необратимо. */
export async function restoreBackup(data: BackupData): Promise<void> {
  await replaceAll(data.goals, data.entries);
}
