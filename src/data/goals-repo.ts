/**
 * Репозиторий: единственное место, которое знает про SQL.
 * Экраны сюда не ходят напрямую — только через стор.
 */

import { desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { entries, goals, type Entry, type Goal } from '@/db/schema';
import { dayKey } from '@/domain/day';

export type CreateGoalInput = {
  title: string;
  target: number;
  /** Свободный текст, необязателен: пустая строка — нормальная цель. */
  description: string;
  quickSteps: number[];
};

export async function getActiveGoal(): Promise<Goal | null> {
  const rows = await db.select().from(goals).where(eq(goals.status, 'active')).limit(1);
  return rows[0] ?? null;
}

/**
 * Заводит цель активной. Если активная уже есть, база отвергнет вставку
 * по индексу one_active_goal — это не баг, а инвариант.
 */
export async function createGoal(input: CreateGoalInput, now = Date.now()): Promise<Goal> {
  const goal: Goal = {
    id: randomUUID(),
    title: input.title.trim(),
    target: input.target,
    description: input.description.trim(),
    quickSteps: input.quickSteps,
    status: 'active',
    createdAt: now,
    completedAt: null,
  };
  await db.insert(goals).values(goal);
  return goal;
}

export async function listEntries(goalId: string): Promise<Entry[]> {
  return db.select().from(entries).where(eq(entries.goalId, goalId)).orderBy(desc(entries.day));
}

export type AddResult = { day: string };

/**
 * Засчитывает тап в сегодняшний день. Пишет в базу СРАЗУ — приложение могут убить
 * в любой момент, а человек уверен, что сделанное засчитано.
 *
 * UPSERT: база сама решает, завести день или дописать в существующий, и сама
 * складывает. Читать amount в JS и писать сумму обратно нельзя — три быстрых тапа
 * прочитают одно значение и затрут друг друга.
 */
export async function addAmount(goalId: string, amount: number, now = Date.now()): Promise<AddResult> {
  const day = dayKey(now);

  await db
    .insert(entries)
    .values({ id: randomUUID(), goalId, day, amount, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [entries.goalId, entries.day],
      set: { amount: sql`${entries.amount} + ${amount}`, updatedAt: now },
    });

  return { day };
}

/**
 * Откат тапов сессии из дня. Если день обнулился — убираем его целиком,
 * чтобы в истории не осталось дня с нулём.
 */
export async function subtractFromDay(goalId: string, day: string, amount: number): Promise<void> {
  await db
    .update(entries)
    .set({ amount: sql`${entries.amount} - ${amount}` })
    .where(sql`${entries.goalId} = ${goalId} AND ${entries.day} = ${day}`);

  await db.delete(entries).where(sql`${entries.goalId} = ${goalId} AND ${entries.day} = ${day} AND ${entries.amount} <= 0`);
}

/**
 * Правка дня: «было не 200, а 150» — ставим 150.
 * Ноль убирает день целиком: его просто не было.
 */
export async function setDayAmount(entryId: string, amount: number, now = Date.now()): Promise<void> {
  if (amount <= 0) {
    await db.delete(entries).where(eq(entries.id, entryId));
    return;
  }
  await db.update(entries).set({ amount, updatedAt: now }).where(eq(entries.id, entryId));
}

export async function archiveGoal(goalId: string, now = Date.now()): Promise<void> {
  await db.update(goals).set({ status: 'archived', completedAt: now }).where(eq(goals.id, goalId));
}

/**
 * Вернуть закрытую цель в работу — вместе со всей историей.
 *
 * Не то же, что «Повторить заново»: там заводится новая цель с нулём, здесь
 * продолжается эта же. Нужно после досрочного завершения: человек закрыл
 * цель с текущим результатом, а потом решил всё-таки добить.
 *
 * Если активная цель уже есть, база отвергнет обновление по one_active_goal —
 * поэтому экран прячет кнопку, пока текущая не закрыта.
 */
export async function resumeGoal(goalId: string): Promise<void> {
  await db.update(goals).set({ status: 'active', completedAt: null }).where(eq(goals.id, goalId));
}

export async function listArchivedGoals(): Promise<Goal[]> {
  return db.select().from(goals).where(eq(goals.status, 'archived')).orderBy(desc(goals.completedAt));
}

export async function deleteGoal(goalId: string): Promise<void> {
  // entries уедут каскадом — при условии, что PRAGMA foreign_keys = ON (см. db/client.ts)
  await db.delete(goals).where(eq(goals.id, goalId));
}

/** Все данные для резервной копии. */
export async function exportAll(): Promise<{ goals: Goal[]; entries: Entry[] }> {
  const [g, e] = await Promise.all([db.select().from(goals), db.select().from(entries)]);
  return { goals: g, entries: e };
}

/**
 * Заменяет все данные копией. Транзакция: если вставка нарушит инвариант
 * (две активные цели, два дня-дубля), всё откатывается — база не остаётся
 * ни пустой, ни наполовину восстановленной.
 */
export async function replaceAll(newGoals: Goal[], newEntries: Entry[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(entries);
    await tx.delete(goals);
    for (const g of newGoals) await tx.insert(goals).values(g);
    for (const e of newEntries) await tx.insert(entries).values(e);
  });
}

/**
 * Повторить закрытую цель: те же настройки, счётчик с нуля.
 * Главный цикл возвращения в приложение.
 *
 * Если активная цель уже есть, база отвергнет вставку по one_active_goal —
 * поэтому экран прячет кнопку, пока текущая цель не закрыта.
 */
export async function repeatGoal(goalId: string, now = Date.now()): Promise<Goal> {
  const rows = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  const source = rows[0];
  if (!source) throw new Error('Цель не найдена');

  return createGoal(
    {
      title: source.title,
      target: source.target,
      description: source.description,
      quickSteps: source.quickSteps,
    },
    now,
  );
}
