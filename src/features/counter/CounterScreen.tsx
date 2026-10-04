import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDays, useProgress } from '@/data/hooks';
import type { Entry, Goal } from '@/db/schema';
import { dayKey, dayNumber, formatDay } from '@/domain/day';
import { isReached, progressFraction, remaining } from '@/domain/progress';
import { Celebration } from '@/features/celebration/Celebration';
import { FinishGoalModal } from '@/features/counter/FinishGoalModal';
import { useGoalActions } from '@/store/useGoalActions';
import { useGoalStore } from '@/store/useGoalStore';
import { AmountModal } from '@/ui/components/AmountModal';
import { DayRow } from '@/ui/components/DayRow';
import { HeaderButton } from '@/ui/components/HeaderButton';
import { IconButton } from '@/ui/components/IconButton';
import { StepButton } from '@/ui/components/StepButton';
import { Trail } from '@/ui/components/Trail';
import { UndoBar } from '@/ui/components/UndoBar';
import { colors, layout, radius, space, text } from '@/ui/tokens';

/** Сколько плашка отмены висит после ПОСЛЕДНЕГО тапа. */
const UNDO_VISIBLE_MS = 5000;

/**
 * «Сейчас» для подписи «День 12». Замер при открытии экрана и заново при
 * каждом возврате в приложение: телефон достают из кармана на следующий
 * день, а экран всё это время висел смонтированным.
 */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);
  return now;
}

/** Экран активной цели: счётчик, тропа, кнопки шага, история. Сердце приложения. */
export function CounterScreen({ goal }: { goal: Goal }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const progress = useProgress(goal.id);
  const { days } = useDays(goal.id);
  const { setDayAmount, archiveGoal, deleteGoal } = useGoalActions();

  const addAmount = useGoalStore((s) => s.addAmount);
  const undoSession = useGoalStore((s) => s.undoSession);
  const endSession = useGoalStore((s) => s.endSession);
  const pendingAmount = useGoalStore((s) => s.pendingAmount);

  const [undoVisible, setUndoVisible] = useState(false);
  // Растёт на каждый тап. Плашка по нему понимает, что отсчёт начался заново.
  const [tapSeq, setTapSeq] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [finishing, setFinishing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Экран уходит (или сменилась цель) — окно отмены закрыто.
   *
   * Раньше здесь только гасился таймер, и это оставляло сессию жить: цель
   * достигнута → «В архив» → экран размонтирован → endSession звать некому.
   * Числа прошлой цели всплывали на следующей, а «Отменить» вычитало их
   * из чужих дней.
   */
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      endSession();
    };
  }, [goal.id, endSession]);

  // Цель достигнута → показываем празднование, пока её не закрыли в архив.
  const won = isReached(progress, goal.target);

  /** Каждый тап продлевает сессию: плашка гаснет через UNDO_VISIBLE_MS после последнего. */
  function onStep(step: number) {
    void addAmount(goal.id, step);
    setUndoVisible(true);
    setTapSeq((n) => n + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setUndoVisible(false);
      endSession();
    }, UNDO_VISIBLE_MS);
  }

  function onUndo() {
    void undoSession(goal.id);
    setUndoVisible(false);
    if (timer.current) clearTimeout(timer.current);
  }

  /**
   * «Закончил». Записанное остаётся — гаснет только окно отмены.
   * Тем, кто не хочет ждать пять секунд, глядя на экран.
   */
  function onDone() {
    setUndoVisible(false);
    endSession();
    if (timer.current) clearTimeout(timer.current);
  }

  const left = remaining(progress, goal.target);
  const fraction = progressFraction(progress, goal.target);
  const percent = Math.floor(fraction * 100);
  const day = dayNumber(goal.createdAt, now);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/*
        Кнопки шага живут вне скролла и не двигаются никогда: главный сценарий —
        достать телефон и попасть по ним не глядя. Всё остальное — заголовок,
        тропа, история — едет одним общим скроллом. На маленьком экране длинное
        описание просто отматывается, а не выдавливает кнопки за край.
      */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        {/* «Завершить» стоит слева, отдельно от навигации справа: это
            действие над целью, а не переход, и соседство с «Архивом»
            путало бы их. */}
        <View style={styles.topBar}>
          <HeaderButton title="Завершить" onPress={() => setFinishing(true)} />
          <View style={styles.topNav}>
            <IconButton icon="archive" label="Архив" onPress={() => router.push('/archive')} />
            <IconButton icon="settings" label="Настройки" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.kicker}>
            День {day} · с {formatDay(dayKey(goal.createdAt))}
          </Text>
          {/* Без numberOfLines: обрезать название нечестно — человек должен
              видеть, что делает, целиком. Место под это отдаёт история. */}
          <Text style={styles.title}>{goal.title}</Text>
          {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counter} maxFontSizeMultiplier={1.1} numberOfLines={1} adjustsFontSizeToFit>
            {progress}
          </Text>
          <View style={styles.counterSide}>
            <Text style={styles.percent}>{percent}%</Text>
            <Text style={styles.target}>из {goal.target}</Text>
          </View>
        </View>

        <View style={styles.trail}>
          <Trail fraction={fraction} width={width - layout.screenPadding * 2} />
        </View>

        {/* Без единицы: её нет в модели, а «осталось 5» и так однозначно. */}
        <Text style={styles.remaining}>
          осталось <Text style={styles.remainingNumber}>{left}</Text>
        </Text>

        <View style={styles.history}>
          {days.length === 0 ? (
            <Text style={styles.empty}>Пока пусто. Тапни кнопку внизу, когда сделаешь первый подход.</Text>
          ) : (
            <>
              <View style={styles.historyHead}>
                <Text style={styles.historyLabel}>По дням</Text>
                <Text style={styles.historyHint}>свайп — исправить</Text>
              </View>
              {days.map((entry, i) => (
                <DayRow
                  key={entry.id}
                  entry={entry}
                  first={i === 0}
                  last={i === days.length - 1}
                  onEdit={() => setEditing(entry)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {undoVisible && pendingAmount > 0 ? (
        <View style={styles.undoWrap}>
          <UndoBar
            amount={pendingAmount}
            onUndo={onUndo}
            onDone={onDone}
            durationMs={UNDO_VISIBLE_MS}
            resetKey={tapSeq}
          />
        </View>
      ) : null}

      {/* Панель доходит до самого низа экрана, под системную полоску жестов:
          отступ снизу берём из insets, а не из SafeAreaView. */}
      <View style={[styles.dock, { paddingBottom: insets.bottom + space.sm }]}>
        <View style={styles.steps}>
          {goal.quickSteps.map((step, i) => (
            <StepButton key={`${step}-${i}`} step={step} onPress={() => onStep(step)} />
          ))}
        </View>
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.manual, pressed && styles.manualPressed]}
        >
          <Text style={styles.manualLabel}>Другое количество</Text>
        </Pressable>
      </View>

      {/* Монтируются только на время показа — так поле само стартует с нужным значением. */}
      {adding ? (
        <AmountModal
          mode="add"
          onClose={() => setAdding(false)}
          onSubmit={(amount) => onStep(amount)}
        />
      ) : null}

      {editing ? (
        <AmountModal
          key={editing.id}
          mode="edit"
          dayLabel={formatDay(editing.day)}
          initialValue={editing.amount}
          onClose={() => setEditing(null)}
          onSubmit={(amount) => void setDayAmount(editing.id, amount)}
        />
      ) : null}

      {finishing ? (
        <FinishGoalModal
          progress={progress}
          target={goal.target}
          onClose={() => setFinishing(false)}
          onArchive={() => {
            setFinishing(false);
            void archiveGoal(goal.id);
          }}
          onDelete={() => {
            setFinishing(false);
            void deleteGoal(goal.id);
          }}
        />
      ) : null}

      {won ? (
        <Celebration goal={goal} progress={progress} onArchive={() => void archiveGoal(goal.id)} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollBody: { flexGrow: 1, paddingBottom: space.base },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.base,
  },
  topNav: { flexDirection: 'row', gap: space.sm },

  header: { paddingHorizontal: layout.screenPadding, paddingTop: space.lg, gap: space.sm },
  kicker: { ...text.label, color: colors.textTertiary },
  title: { ...text.goalTitle, color: colors.text },
  description: { ...text.caption, color: colors.textTertiary },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.base,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.lg,
  },
  counter: { ...text.counter, color: colors.text, flexShrink: 1 },
  counterSide: { alignItems: 'flex-end', gap: space.xs, paddingBottom: space.md },
  percent: { ...text.target, color: colors.accent },
  target: { ...text.caption, color: colors.textSecondary },

  trail: { paddingHorizontal: layout.screenPadding, paddingTop: space.sm },
  remaining: {
    ...text.caption,
    color: colors.textSecondary,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.xs,
  },
  remainingNumber: { ...text.caption, fontFamily: text.bodyStrong.fontFamily, color: colors.text },

  history: { paddingHorizontal: layout.screenPadding, paddingTop: space.lg },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: space.xs,
  },
  historyLabel: { ...text.label, color: colors.textTertiary },
  historyHint: { ...text.meta, color: colors.textTertiary },
  empty: { ...text.caption, color: colors.textTertiary, textAlign: 'center', marginTop: space.sm },

  undoWrap: { paddingBottom: space.md, alignItems: 'center' },

  /** Нижняя панель: кнопки шага на своей подложке, чтобы зона пальца читалась сразу. */
  dock: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.base,
    paddingTop: space.base,
    gap: space.xs,
  },
  steps: { flexDirection: 'row', gap: space.md },
  manual: {
    height: layout.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  manualPressed: { backgroundColor: colors.surfaceRaised },
  manualLabel: { ...text.body, color: colors.textSecondary },
});
