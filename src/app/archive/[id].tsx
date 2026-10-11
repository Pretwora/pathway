import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDays, useGoal, useHasActiveGoal } from '@/data/hooks';
import { daysSpent, formatDay, formatDaysSpent } from '@/domain/day';
import { isClosedEarly, overshoot, progressFraction, sumAmounts } from '@/domain/progress';
import { ShareSheet } from '@/features/share/ShareSheet';
import { useLang, useT } from '@/i18n';
import { useGoalActions } from '@/store/useGoalActions';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { Trail } from '@/ui/components/Trail';
import { goBack } from '@/ui/goBack';
import { colors, layout, radius, space, text } from '@/ui/tokens';

export default function ArchivedGoalScreen() {
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goal, loading } = useGoal(id);
  const { days } = useDays(id);
  const { hasActive } = useHasActiveGoal();
  const { repeatGoal, resumeGoal, deleteGoal } = useGoalActions();
  const [sharing, setSharing] = useState(false);
  const t = useT();
  const lang = useLang();

  if (loading) return <View style={styles.screen} />;
  if (!goal) {
    // Цель удалили с этого же экрана — уходим назад, а не показываем пустоту.
    goBack();
    return <View style={styles.screen} />;
  }

  const total = sumAmounts(days);
  const extra = overshoot(total, goal.target);
  const spent = goal.completedAt ? daysSpent(goal.createdAt, goal.completedAt) : null;
  /**
   * Продолжить можно только недобранное. У достигнутой цели возврат в работу
   * мгновенно показал бы экран победы снова — для неё есть «Повторить заново».
   */
  const canResume = isClosedEarly(total, goal.target);

  function onRepeat() {
    if (!goal) return;
    if (hasActive) {
      Alert.alert(t.archivedGoal.activeExistsTitle, t.archivedGoal.activeExistsBody);
      return;
    }
    // После повтора уводим на дом (там уже новая активная цель → счётчик).
    void repeatGoal(goal.id).then(() => {
      if (router.canGoBack()) router.dismissAll();
      else router.replace('/');
    });
  }

  /** Возврат в работу: та же цель со всей историей, счётчик продолжает с текущего. */
  function onResume() {
    if (!goal) return;
    if (hasActive) {
      Alert.alert(t.archivedGoal.activeExistsTitle, t.archivedGoal.activeExistsBody);
      return;
    }
    void resumeGoal(goal.id).then(() => {
      if (router.canGoBack()) router.dismissAll();
      else router.replace('/');
    });
  }

  function onDelete() {
    if (!goal) return;
    Alert.alert(t.archivedGoal.deleteTitle, t.archivedGoal.deleteBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => void deleteGoal(goal.id).then(() => goBack()),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <IconButton icon="back" label={t.common.back} onPress={goBack} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>{canResume ? t.archivedGoal.closedEarly : t.common.goalReached}</Text>
        <Text style={styles.number} numberOfLines={1} adjustsFontSizeToFit>
          {total}
        </Text>
        <Text style={styles.title}>{goal.title}</Text>
        <View style={styles.metaRow}>
          {spent ? <Text style={styles.meta}>{formatDaysSpent(spent, lang)}</Text> : null}
          {extra > 0 ? <Text style={styles.metaExtra}>{t.common.overBy(extra)}</Text> : null}
          {/* Без этой строки закрытое досрочно неотличимо от добитого,
              и кнопка «Продолжить» появлялась бы без объяснения. */}
          {canResume ? (
            <Text style={styles.meta}>{t.archivedGoal.finishedEarly(goal.target)}</Text>
          ) : null}
        </View>

        <View style={styles.trail}>
          <Trail
            fraction={progressFraction(total, goal.target)}
            complete={!canResume}
            width={width - layout.screenPadding * 2}
            animateIn={false}
          />
        </View>

        {days.length > 0 ? (
          <View style={styles.history}>
            {days.map((entry) => (
              <View key={entry.id} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{formatDay(entry.day, lang)}</Text>
                <Text style={styles.dayAmount}>{entry.amount}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        {/* У недобранного главное действие — продолжить с текущего результата.
            Начать его же с нуля тоже можно, но это редкий выбор, поэтому
            кнопка тише: они звучат похоже, а делают разное. */}
        {canResume ? (
          <>
            <Button title={t.archivedGoal.resume} onPress={onResume} />
            <Button title={t.archivedGoal.startOver} variant="ghost" onPress={onRepeat} />
          </>
        ) : (
          <Button title={t.archivedGoal.repeat} onPress={onRepeat} />
        )}
        <Button title={t.common.share} variant="ghost" onPress={() => setSharing(true)} />
        <Button title={t.common.delete} variant="ghost" onPress={onDelete} />
      </View>

      {sharing ? (
        <ShareSheet
          goal={goal}
          progress={total}
          finishedAt={goal.completedAt ?? goal.createdAt}
          onClose={() => setSharing(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: layout.screenPadding, paddingTop: space.base },

  body: { paddingHorizontal: layout.screenPadding, paddingTop: space.lg, alignItems: 'center', gap: space.sm },
  kicker: { ...text.label, letterSpacing: 2, color: colors.accent },
  number: { ...text.hero, fontSize: 72, color: colors.text },
  title: { ...text.goalTitle, fontSize: 20, color: colors.textSecondary, textAlign: 'center' },
  metaRow: { alignItems: 'center', gap: space.xs },
  trail: { alignSelf: 'stretch', paddingTop: space.base, paddingBottom: space.lg },
  meta: { ...text.caption, color: colors.textTertiary },
  metaExtra: { ...text.caption, color: colors.success },

  history: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayLabel: { ...text.body, color: colors.textSecondary },
  dayAmount: { ...text.bodyStrong, color: colors.text },

  actions: { paddingHorizontal: layout.screenPadding, paddingTop: space.md, paddingBottom: space.base, gap: space.md },
});
