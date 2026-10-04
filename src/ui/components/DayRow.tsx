import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { Entry } from '@/db/schema';
import { formatDay } from '@/domain/day';
import { colors, radius, space, text } from '@/ui/tokens';

const ACTION_WIDTH = 112;
const DOT = 10;

type Props = {
  entry: Entry;
  onEdit: () => void;
  /** Самый свежий день: точка залита, линии сверху нет. */
  first: boolean;
  /** Самый ранний день — начало тропы: линии снизу нет. */
  last: boolean;
};

function EditAction({ drag, onPress }: { drag: SharedValue<number>; onPress: () => void }) {
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.get() + ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={animated}>
      {/* Именно Pressable: плашка выглядит кнопкой, значит должна нажиматься.
          Открывать правку только по доехавшему до конца свайпу — ловушка. */}
      <Pressable style={styles.action} onPress={onPress} accessibilityRole="button">
        <Text style={styles.actionLabel}>Исправить</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * День в истории — узел на ленте. Лента продолжает тропу: вниз — к старту,
 * вверх — к сегодняшнему дню.
 */
export function DayRow({ entry, onEdit, first, last }: Props) {
  const swipeable = useRef<SwipeableMethods>(null);

  function openEdit() {
    // Закрываем свайп, иначе после правки строка останется разъехавшейся.
    swipeable.current?.close();
    onEdit();
  }

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      renderRightActions={(_progress, drag) => <EditAction drag={drag} onPress={openEdit} />}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') openEdit();
      }}
    >
      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={[styles.line, first && styles.lineHidden]} />
          <View style={[styles.dot, first && styles.dotCurrent]} />
          <View style={[styles.line, last && styles.lineHidden]} />
        </View>
        <Text style={styles.day}>{formatDay(entry.day)}</Text>
        <Text style={styles.amount}>{entry.amount}</Text>
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: space.md,
    // Фон обязателен: при свайпе строка едет поверх кнопки «Исправить».
    backgroundColor: colors.bg,
  },
  rail: { width: DOT, alignSelf: 'stretch', alignItems: 'center' },
  line: { width: 2, flex: 1, backgroundColor: colors.border },
  lineHidden: { backgroundColor: 'transparent' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    backgroundColor: colors.bg,
  },
  dotCurrent: { borderColor: colors.accent, backgroundColor: colors.accent },
  day: { ...text.body, flex: 1, color: colors.textSecondary },
  amount: { ...text.bodyStrong, color: colors.text },
  action: {
    width: ACTION_WIDTH,
    height: '100%',
    backgroundColor: colors.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginLeft: space.sm,
  },
  actionLabel: { ...text.caption, color: colors.onAccent },
});
