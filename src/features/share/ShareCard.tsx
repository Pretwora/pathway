import { Image } from 'expo-image';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Goal } from '@/db/schema';
import { daysSpent, formatDaysSpent } from '@/domain/day';
import { isClosedEarly, overshoot, progressFraction } from '@/domain/progress';
import { Trail } from '@/ui/components/Trail';
import { colors, radius, space, text } from '@/ui/tokens';

const logo = require('@/assets/images/card-logo.png');

/** Ширина карточки. Фиксированная — чтобы захват был предсказуемого размера. */
const CARD_WIDTH = 320;
const PADDING = space.lg;

type Props = {
  goal: Goal;
  progress: number;
  finishedAt: number;
};

/**
 * Карточка-достижение для шеринга. Захватывается в PNG и уходит в соцсети —
 * единственный бесплатный канал продвижения, поэтому вылизана.
 *
 * Внизу та же тропа, что на счётчике: по ней карточку узнают без логотипа.
 * ref нужен для captureRef.
 */
export const ShareCard = forwardRef<View, Props>(function ShareCard({ goal, progress, finishedAt }, ref) {
  const extra = overshoot(progress, goal.target);
  const days = daysSpent(goal.createdAt, finishedAt);
  const early = isClosedEarly(progress, goal.target);

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <View style={styles.brand}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
        <Text style={styles.wordmark}>pathway</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.kicker}>{early ? 'Цель закрыта' : 'Цель достигнута'}</Text>
        <Text style={styles.number} numberOfLines={1} adjustsFontSizeToFit>
          {progress}
        </Text>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.meta}>
          {formatDaysSpent(days)}
          {extra > 0 ? <Text style={styles.extra}> · перевыполнено на {extra}</Text> : null}
          {early ? <Text> · цель была {goal.target}</Text> : null}
        </Text>
      </View>

      {/* Без анимации: карточку фотографируют сразу, недоехавшая тропа
          попала бы в картинку. */}
      <Trail
        fraction={progressFraction(progress, goal.target)}
        complete={!early}
        width={CARD_WIDTH - PADDING * 2}
        animateIn={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 5,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: PADDING,
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  logo: { width: 26, height: 26 },
  wordmark: { ...text.screenTitle, fontSize: 14, color: colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  kicker: { ...text.label, fontSize: 11, letterSpacing: 2, color: colors.accent },
  number: { ...text.hero, fontSize: 64, color: colors.text },
  title: { ...text.body, fontFamily: text.button.fontFamily, color: colors.textSecondary, textAlign: 'center' },
  meta: { ...text.meta, fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: space.xs },
  extra: { color: colors.success },
});
