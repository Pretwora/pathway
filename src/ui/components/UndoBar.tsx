import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, radius, space, text } from '@/ui/tokens';
import { Icon } from './Icon';

type Props = {
  amount: number;
  onUndo: () => void;
  /**
   * «Закончил» — гасит плашку, не дожидаясь конца отсчёта.
   *
   * Ничего не «подтверждает»: тап уже записан в базу в момент нажатия
   * (см. правило про синхронную запись). Кнопка закрывает окно отмены,
   * когда человек не хочет ждать и стоять над экраном.
   */
  onDone: () => void;
  /** Сколько плашке жить. Отсчёт заливки идёт ровно столько же. */
  durationMs: number;
  /**
   * Меняется на каждый тап. Сессия продлевается — значит и заливку надо
   * налить обратно и пустить заново, не перемонтируя плашку: иначе она
   * мигала бы появлением на каждый тап.
   */
  resetKey: number;
};

/**
 * «+30 · Отменить». Без отмены человек, тапнувший лишний раз,
 * теряет доверие к цифре — а доверие к цифре здесь и есть весь продукт.
 *
 * Подложка утекает влево и показывает, сколько времени осталось. Заливка
 * вместо цифры или кольца — потому что плашку видят краем глаза, и сигнал
 * не должен требовать чтения.
 */
export function UndoBar({ amount, onUndo, onDone, durationMs, resetKey }: Props) {
  // 1 — полная плашка, 0 — пустая.
  const fill = useSharedValue(1);

  useEffect(() => {
    fill.set(1);
    fill.set(withTiming(0, { duration: durationMs, easing: Easing.linear }));
  }, [resetKey, durationMs, fill]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.get() }] }));

  return (
    <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOutDown.duration(160)} style={styles.bar}>
      {/* Первым в разметке — значит под текстом. */}
      <Animated.View style={[styles.fill, fillStyle]} pointerEvents="none" />

      <Text style={styles.amount}>+{amount}</Text>

      <Pressable onPress={onUndo} hitSlop={12} accessibilityRole="button">
        <Text style={styles.undo}>Отменить</Text>
      </Pressable>

      {/* Разделитель: два действия рядом, и промахнуться по «Отменить» нельзя. */}
      <View style={styles.divider} />

      <Pressable
        onPress={onDone}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Готово"
        style={({ pressed }) => [styles.done, pressed && styles.donePressed]}
      >
        <Icon name="check" size={16} color={colors.text} strokeWidth={2.6} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: 48,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    borderRadius: radius.pill,
    // Фон экрана, а не поверхности: подложку рисует уезжающий слой,
    // и к концу от плашки остаётся один контур.
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.base,
    // Обрезает заливку по форме пилюли.
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceRaised,
    // Уезжает влево, а не сжимается к центру.
    transformOrigin: 'left center',
  },
  amount: { ...text.number, fontSize: 16, color: colors.text },
  undo: { ...text.body, fontFamily: fonts.bold, color: colors.accent },

  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: colors.border,
  },
  /**
   * Обведена контуром, а не залита: акцент в плашке уже занят «Отменить»,
   * и второй яркий элемент спорил бы с ним за внимание.
   */
  done: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePressed: { backgroundColor: colors.surfaceRaised },
});
