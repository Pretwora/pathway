import { useId, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { Goal } from '@/db/schema';
import { dayKey, formatDay } from '@/domain/day';
import { isClosedEarly, progressFraction } from '@/domain/progress';
import { colors, radius, space, text, trailGradient } from '@/ui/tokens';

type Props = {
  goal: Goal;
  /** Сколько набрано. Именно результат, а не цель: по цели их не различить. */
  total: number;
  onPress: () => void;
};

const BAR = 4;

/** Полоска пройденного — та же тропа, распрямлённая. У досрочных она короче. */
function ResultBar({ fraction }: { fraction: number }) {
  const [width, setWidth] = useState(0);
  const id = `bar-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View style={styles.bar} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={BAR}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              {trailGradient.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={BAR} rx={BAR / 2} fill={colors.border} />
          <Rect x={0} y={0} width={width * fraction} height={BAR} rx={BAR / 2} fill={`url(#${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * Карточка закрытой цели в архиве.
 *
 * Показывает результат, а не цель: брошенная на трёхстах и добитая до
 * тысячи иначе выглядели бы одинаково — у обеих было бы написано «1000».
 */
export function CompletedGoalCard({ goal, total, onPress }: Props) {
  const early = isClosedEarly(total, goal.target);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.title} numberOfLines={2}>
        {goal.title}
      </Text>
      <View style={styles.row}>
        <View style={styles.result}>
          <Text style={styles.number}>{total}</Text>
          {early ? <Text style={styles.of}>из {goal.target}</Text> : null}
          {/* Акцент здесь уместен именно потому, что применяется редко:
              недобранных целей в архиве меньшинство. */}
          {early ? (
            <View style={styles.early}>
              <Text style={styles.earlyLabel}>досрочно</Text>
            </View>
          ) : null}
        </View>
        {goal.completedAt ? <Text style={styles.date}>{formatDay(dayKey(goal.completedAt))}</Text> : null}
      </View>
      <ResultBar fraction={progressFraction(total, goal.target)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.base,
    gap: space.md,
  },
  cardPressed: { backgroundColor: colors.surfaceRaised },
  title: { ...text.cardTitle, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  result: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexShrink: 1 },
  number: { ...text.number, color: colors.text },
  of: { ...text.caption, color: colors.textTertiary },
  early: {
    alignSelf: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
  },
  earlyLabel: { ...text.label, fontSize: 11, color: colors.accent },
  date: { ...text.meta, color: colors.textTertiary },
  bar: { height: BAR },
});
