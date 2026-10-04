import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Goal } from '@/db/schema';
import { daysSpent, formatDaysSpent } from '@/domain/day';
import { overshoot } from '@/domain/progress';
import { ShareSheet } from '@/features/share/ShareSheet';
import { Button } from '@/ui/components/Button';
import { Trail } from '@/ui/components/Trail';
import { colors, layout, space, text } from '@/ui/tokens';
import { Confetti } from './Confetti';
import { useCompletionSound } from './useCompletionSound';

type Props = {
  goal: Goal;
  progress: number;
  onArchive: () => void;
};

/**
 * Экран победы. Единственное место, где дизайн-система разрешает лишнее:
 * это кульминация продукта, ради неё возвращаются и её показывают друзьям.
 *
 * Выхода в счётчик нет: цель достигнута — её закрывают в архив. Кнопки «Закрыть»
 * нет намеренно, иначе цель зависала бы достигнутой, но не заархивированной.
 *
 * Показывается, пока цель достигнута и активна — значит, переживает перезапуск.
 */
export function Celebration({ goal, progress, onArchive }: Props) {
  const { width } = useWindowDimensions();
  // Компонент монтируется ровно в момент победы, поэтому время берётся здесь.
  // Ленивый инициализатор: замерить один раз, а не заново на каждый рендер —
  // иначе «за 24 дня» пересчитывалось бы, пока человек смотрит на экран.
  const [finishedAt] = useState(() => Date.now());

  const extra = overshoot(progress, goal.target);
  const days = daysSpent(goal.createdAt, finishedAt);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useCompletionSound();

  return (
    // onRequestClose (кнопка «Назад» на Android) — no-op: уйти можно только «В архив».
    <Modal visible animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      {/* Свой SafeAreaProvider: Modal рендерится в отдельном контейнере, и провайдер
          из корня приложения до него не достаёт. */}
      <SafeAreaProvider>
        <View style={styles.screen}>
          <Confetti />

          <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.body}>
              <Animated.Text entering={FadeInDown.duration(400)} style={styles.kicker}>
                Цель достигнута
              </Animated.Text>

              <Animated.Text
                entering={ZoomIn.duration(500).delay(150)}
                style={styles.number}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {progress}
              </Animated.Text>

              <Animated.Text entering={FadeIn.duration(400).delay(400)} style={styles.title}>
                {goal.title}
              </Animated.Text>

              <Animated.Text entering={FadeIn.duration(400).delay(600)} style={styles.days}>
                {formatDaysSpent(days)}
              </Animated.Text>

              {extra > 0 ? (
                <Animated.Text entering={FadeIn.duration(400).delay(800)} style={styles.extra}>
                  перевыполнено на {extra}
                </Animated.Text>
              ) : null}
            </View>

            {/* Тропа пройдена целиком: финиш залит и отмечен. Выезжает
                с нуля — последний шаг до цели видно глазами. */}
            <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.trail}>
              <Trail fraction={1} complete width={width - layout.screenPadding * 2} />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(1000)} style={styles.actions}>
              <Button title="Поделиться" icon="share" onPress={() => setSharing(true)} />
              <Button title="В архив" variant="ghost" onPress={onArchive} />
            </Animated.View>
          </SafeAreaView>

          {/* Вложен в Modal победы, чтобы лечь ПОВЕРХ него, а не под ним. */}
          {sharing ? (
            <ShareSheet
              goal={goal}
              progress={progress}
              finishedAt={finishedAt}
              onClose={() => setSharing(false)}
            />
          ) : null}
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: layout.screenPadding },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.sm },
  kicker: { ...text.label, letterSpacing: 2, color: colors.accent },
  number: { ...text.hero, color: colors.text, marginVertical: space.sm },
  title: { ...text.goalTitle, fontSize: 20, color: colors.textSecondary, textAlign: 'center' },
  days: { ...text.caption, color: colors.textTertiary },
  extra: { ...text.caption, color: colors.success },
  trail: { paddingBottom: space.lg },
  actions: { gap: space.md, paddingBottom: space.base },
});
