/**
 * Действия над активной целью + сессия отмены.
 *
 * Чтение прогресса здесь НЕ живёт: прогресс — это SUM(entries) из базы,
 * экраны читают его реактивно через useLiveQuery. Стор отвечает за действия.
 */

import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import * as repo from '@/data/goals-repo';
import { sessionTotal, tapsByDay, type Tap } from '@/domain/undo';

type GoalStore = {
  /**
   * Тапы текущей сессии — всё, что натапано, пока горит плашка отмены.
   * Живёт в памяти: отмена нужна «прямо сейчас», переживать перезапуск ей незачем.
   */
  session: Tap[];
  /**
   * Чья это сессия. Без привязки тапы прошлой цели всплывали на следующей:
   * цель уходит в архив, экран исчезает, сессию закрыть некому — и «Отменить»
   * вычитало чужие числа из чужих дней.
   */
  sessionGoalId: string | null;
  /** Число на плашке: «+30 · Отменить». */
  pendingAmount: number;

  addAmount: (goalId: string, amount: number) => Promise<void>;
  /** Откатывает сессию целиком, а не последний тап. */
  undoSession: (goalId: string) => Promise<void>;
  /** Плашка погасла — сессия забыта, следующий тап начнёт новую. */
  endSession: () => void;
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  session: [],
  sessionGoalId: null,
  pendingAmount: 0,

  async addAmount(goalId, amount) {
    // Тактильный отклик первым: человек тапает не глядя, убирая телефон в карман,
    // и вибрация — единственное подтверждение, что засчиталось.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { day } = await repo.addAmount(goalId, amount);

    set((s) => {
      // Цель сменилась — начинаем сессию заново, а не дописываем в чужую.
      const previous = s.sessionGoalId === goalId ? s.session : [];
      const session = [...previous, { day, amount }];
      return { session, sessionGoalId: goalId, pendingAmount: sessionTotal(session) };
    });
  },

  async undoSession(goalId) {
    const { session, sessionGoalId } = get();
    if (session.length === 0) return;
    // Чужая сессия — молча забываем её, но данные текущей цели не трогаем.
    if (sessionGoalId !== goalId) {
      set({ session: [], sessionGoalId: null, pendingAmount: 0 });
      return;
    }

    // Сессия обнуляется сразу: иначе быстрый повторный тап по «Отменить»
    // снимет то же самое дважды.
    set({ session: [], sessionGoalId: null, pendingAmount: 0 });

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    for (const [day, amount] of tapsByDay(session)) {
      await repo.subtractFromDay(goalId, day, amount);
    }
  },

  endSession() {
    set({ session: [], sessionGoalId: null, pendingAmount: 0 });
  },
}));
