/**
 * Реактивное чтение. useLiveQuery сам пересчитывает при любой записи в базу
 * (enableChangeListener в db/client.ts), поэтому счётчик обновляется без
 * ручного обновления состояния.
 */

import { desc, eq, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { entries, goals } from '@/db/schema';
import { sumAmounts } from '@/domain/progress';

export function useActiveGoal() {
  const { data, error, updatedAt } = useLiveQuery(
    db.select().from(goals).where(eq(goals.status, 'active')).limit(1),
  );
  // Признак загрузки — updatedAt, а не data: useLiveQuery отдаёт пустой массив
  // ещё до первого ответа базы, и по data мы бы решили, что цели нет, и увели
  // человека на создание новой поверх существующей.
  return { goal: data?.[0] ?? null, error, loading: updatedAt === undefined };
}

/** Дни цели, свежие сверху. Группировать не нужно: запись и есть день. */
export function useDays(goalId: string | undefined) {
  const { data, error } = useLiveQuery(
    db
      .select()
      .from(entries)
      .where(eq(entries.goalId, goalId ?? ''))
      .orderBy(desc(entries.day)),
    [goalId],
  );
  return { days: data ?? [], error };
}

/** Прогресс никогда не хранится — всегда сумма дней. */
export function useProgress(goalId: string | undefined) {
  const { days } = useDays(goalId);
  return useMemo(() => sumAmounts(days), [days]);
}

/** Закрытые цели, свежие сверху. */
export function useArchivedGoals() {
  const { data, error, updatedAt } = useLiveQuery(
    db.select().from(goals).where(eq(goals.status, 'archived')).orderBy(desc(goals.completedAt)),
  );
  return { goals: data ?? [], error, loading: updatedAt === undefined };
}

/**
 * Итог каждой цели: id → сумма записей.
 *
 * Списку архива нужен результат, а не цель: без него закрытое досрочно и
 * добитое выглядят одинаково. Считаем одним запросом с группировкой, а не
 * по записи на карточку — иначе на каждую цель ушёл бы свой useLiveQuery.
 */
export function useTotalsByGoal() {
  const { data } = useLiveQuery(
    db
      .select({ goalId: entries.goalId, total: sql<number>`sum(${entries.amount})` })
      .from(entries)
      .groupBy(entries.goalId),
  );

  return useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of data ?? []) totals.set(row.goalId, Number(row.total ?? 0));
    return totals;
  }, [data]);
}

/** Одна цель по id — для карточки архива. */
export function useGoal(goalId: string | undefined) {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(goals)
      .where(eq(goals.id, goalId ?? ''))
      .limit(1),
    [goalId],
  );
  return { goal: data?.[0] ?? null, loading: updatedAt === undefined };
}

/** Есть ли сейчас активная цель — от этого зависит, можно ли повторить закрытую. */
export function useHasActiveGoal() {
  const { data, updatedAt } = useLiveQuery(
    db.select({ id: goals.id }).from(goals).where(eq(goals.status, 'active')).limit(1),
  );
  return { hasActive: (data?.length ?? 0) > 0, loading: updatedAt === undefined };
}
