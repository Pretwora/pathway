/**
 * Действия, не привязанные к сессии тапов (создание, правка дня, архив).
 * Отделены от useGoalStore, чтобы тот занимался только счётчиком и отменой.
 */

import { useCallback } from 'react';

import * as repo from '@/data/goals-repo';

export function useGoalActions() {
  const createGoal = useCallback(async (input: repo.CreateGoalInput) => {
    return repo.createGoal(input);
  }, []);

  const archiveGoal = useCallback(async (goalId: string) => {
    return repo.archiveGoal(goalId);
  }, []);

  /** «Было не 200, а 150». Ноль убирает день из истории. */
  const setDayAmount = useCallback(async (entryId: string, amount: number) => {
    return repo.setDayAmount(entryId, amount);
  }, []);

  /** Повторить закрытую цель: те же настройки, счётчик с нуля. */
  const repeatGoal = useCallback(async (goalId: string) => {
    return repo.repeatGoal(goalId);
  }, []);

  /** Вернуть в работу ту же цель вместе с историей. */
  const resumeGoal = useCallback(async (goalId: string) => {
    return repo.resumeGoal(goalId);
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    return repo.deleteGoal(goalId);
  }, []);

  return { createGoal, archiveGoal, setDayAmount, repeatGoal, resumeGoal, deleteGoal };
}
