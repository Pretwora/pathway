/**
 * Схема базы. Обоснования — docs/03-архитектура.md.
 *
 * Главное правило: прогресс НЕ хранится полем. Он всегда SUM(entries.amount).
 * Поля `current` в goals нет и не должно появиться.
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const goals = sqliteTable(
  'goals',
  {
    id: text('id').primaryKey(),
    /** «Тысяча отжиманий» */
    title: text('title').notNull(),
    /** 1000 */
    target: integer('target').notNull(),
    /**
     * Свободный текст про цель: «по 30–50 за подход, утром и вечером».
     * Необязателен — тогда пустая строка. Нигде не подставляется в счётчик,
     * поэтому длина ему не мешает.
     */
    description: text('description').notNull(),
    /** Числа кнопок быстрого шага: [10, 30, 120] */
    quickSteps: text('quick_steps', { mode: 'json' }).$type<number[]>().notNull(),
    status: text('status', { enum: ['active', 'archived'] }).notNull(),
    createdAt: integer('created_at').notNull(),
    completedAt: integer('completed_at'),
  },
  (t) => [
    /**
     * Инвариант «одна активная цель» на уровне базы, а не проверки в UI.
     * Частичный уникальный индекс: строка со status='active' может быть только одна.
     * Проверку в коде обходит баг или гонка. Индекс не обходит ничто.
     */
    uniqueIndex('one_active_goal')
      .on(t.status)
      .where(sql`${t.status} = 'active'`),
  ],
);

/**
 * Одна запись — один день. Не серия, не тап.
 *
 * Человеку не важно, занимался он в 13:10 или в 12:44 — важно, что 17 июля было 170.
 * День как единица записи убирает окно склейки (тапы просто идут в сегодняшний день),
 * группировку истории (запись и есть день) и делает правку прямой: «было не 200,
 * а 150» — ставишь 150.
 *
 * Отрицательных записей не бывает: сделать минус невозможно. Поэтому и прогресс
 * не может уйти в минус — не проверкой, а тем, что нечему.
 */
export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    /** Локальный день: «2026-07-17». Строка сортируется как дата — это и нужно. */
    day: text('day').notNull(),
    amount: integer('amount').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    /** Один день — одна запись. Инвариант базы, а не договорённость в коде. */
    uniqueIndex('one_entry_per_day').on(t.goalId, t.day),
  ],
);

/**
 * Состояние самого приложения, а не пользователя: ключ — значение.
 *
 * Отдельно от целей намеренно: восстановление из копии заменяет goals и entries
 * целиком, а настройки устройства это переживать не должны.
 *
 * Сейчас пуста. Единственным жильцом был флаг активации закрытого тестирования —
 * он уехал вместе с паролем в 2.0. Таблицу оставили: она ничего не стоит, а
 * удаление потребовало бы миграции ради пустого места.
 */
export const appState = sqliteTable('app_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
