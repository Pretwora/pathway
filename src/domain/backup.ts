/**
 * Разбор и проверка файла резервной копии. Чистая логика — тестируется без телефона.
 *
 * Файл может быть любым (пользователь выбирает вручную), поэтому проверяем строго
 * и падаем с понятной причиной, а не с загадочной ошибкой при вставке в базу.
 * Причина — код, а не текст: слова подбирает экран, на языке интерфейса.
 */

export type BackupGoal = {
  id: string;
  title: string;
  target: number;
  description: string;
  quickSteps: number[];
  status: 'active' | 'archived';
  createdAt: number;
  completedAt: number | null;
};

export type BackupEntry = {
  id: string;
  goalId: string;
  day: string;
  amount: number;
  createdAt: number;
  updatedAt: number;
};

export type BackupData = {
  version: number;
  exportedAt: number;
  goals: BackupGoal[];
  entries: BackupEntry[];
};

/** Формат, который умеет читать этот код. Файл новее — не рискуем. */
export const SUPPORTED_VERSION = 1;

/**
 * Почему копия не подошла:
 * — notBackup: это не наш файл;
 * — newerVersion: копия из более новой версии приложения;
 * — corrupted: структура повреждена (detail — где именно, для отладки);
 * — twoActive: две активные цели — нарушен инвариант базы.
 */
export type BackupErrorCode = 'notBackup' | 'newerVersion' | 'corrupted' | 'twoActive';

export class BackupError extends Error {
  constructor(
    readonly code: BackupErrorCode,
    readonly detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'BackupError';
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function num(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BackupError('corrupted', `field ${field}`);
  return v;
}

function str(v: unknown, field: string): string {
  if (typeof v !== 'string') throw new BackupError('corrupted', `field ${field}`);
  return v;
}

function nullableNum(v: unknown, field: string): number | null {
  if (v === null || v === undefined) return null;
  return num(v, field);
}

function parseGoal(raw: unknown): BackupGoal {
  if (!isObject(raw)) throw new BackupError('corrupted', 'goal');
  const status = raw.status;
  if (status !== 'active' && status !== 'archived') throw new BackupError('corrupted', 'goal status');
  const steps = raw.quickSteps;
  if (!Array.isArray(steps) || !steps.every((s) => typeof s === 'number')) {
    throw new BackupError('corrupted', 'quick steps');
  }
  return {
    id: str(raw.id, 'id'),
    title: str(raw.title, 'title'),
    target: num(raw.target, 'target'),
    // Копии до переименования хранят это поле как «unit» — читаем и такие,
    // иначе человек с копией месячной давности останется без данных.
    description: str(raw.description ?? raw.unit, 'description'),
    quickSteps: steps,
    // deadlineAt в старых копиях просто игнорируем: срока в приложении больше нет.
    status,
    createdAt: num(raw.createdAt, 'createdAt'),
    completedAt: nullableNum(raw.completedAt, 'completedAt'),
  };
}

function parseEntry(raw: unknown): BackupEntry {
  if (!isObject(raw)) throw new BackupError('corrupted', 'entry');
  return {
    id: str(raw.id, 'id'),
    goalId: str(raw.goalId, 'goalId'),
    day: str(raw.day, 'day'),
    amount: num(raw.amount, 'amount'),
    createdAt: num(raw.createdAt, 'createdAt'),
    updatedAt: num(raw.updatedAt, 'updatedAt'),
  };
}

/**
 * Разбирает содержимое файла копии. Бросает BackupError с кодом причины, если
 * это не наш файл, версия новее или структура повреждена.
 */
export function parseBackup(raw: unknown): BackupData {
  if (!isObject(raw)) throw new BackupError('notBackup');
  if (raw.app !== 'pathway') throw new BackupError('notBackup');

  const version = num(raw.version, 'version');
  if (version > SUPPORTED_VERSION) {
    throw new BackupError('newerVersion');
  }

  if (!Array.isArray(raw.goals) || !Array.isArray(raw.entries)) {
    throw new BackupError('corrupted', 'goals or entries');
  }

  const goals = raw.goals.map(parseGoal);
  const entries = raw.entries.map(parseEntry);

  // Инвариант базы: активная цель одна. Ловим здесь ради понятной причины.
  if (goals.filter((g) => g.status === 'active').length > 1) {
    throw new BackupError('twoActive');
  }

  return { version, exportedAt: nullableNum(raw.exportedAt, 'exportedAt') ?? 0, goals, entries };
}
