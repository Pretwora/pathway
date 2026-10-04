import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors, trailGradient } from '@/ui/tokens';

const COUNT = 36;
const FALL_MS = 2600;

/**
 * Своё конфетти вместо библиотеки: частиц мало, логика на десять строк,
 * а лишняя зависимость тянет свой жизненный цикл и ломается на мажорных
 * обновлениях reanimated.
 *
 * Палитра — цвета тропы и белый: те же синий, голубой и зелёный, что на
 * логотипе. Случайная радуга убила бы всю премиальность разом.
 */
const PIECE_COLORS = [...trailGradient.map((s) => s.color), colors.text];

type PieceProps = {
  index: number;
  width: number;
  height: number;
};

function Piece({ index, width, height }: PieceProps) {
  const progress = useSharedValue(0);

  // Детерминированный разброс: одинаковый на каждый рендер, но выглядит случайным.
  const startX = ((index * 137) % 100) / 100;
  const size = 6 + ((index * 31) % 7);
  const drift = (((index * 71) % 100) / 100 - 0.5) * 120;
  const spin = ((index * 53) % 8) - 4;
  const delay = (index % 12) * 90;
  const color = PIECE_COLORS[index % PIECE_COLORS.length];

  useEffect(() => {
    progress.set(
      withDelay(delay, withTiming(1, { duration: FALL_MS, easing: Easing.linear })),
    );
  }, [progress, delay]);

  const animated = useAnimatedStyle(() => {
    const t = progress.get();
    return {
      transform: [
        { translateY: -40 + t * (height + 80) },
        { translateX: drift * t },
        { rotate: `${spin * t * 360}deg` },
      ],
      // Гаснет к концу падения, чтобы не исчезать резко на середине экрана
      opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: startX * width,
          width: size,
          height: size * 2.2,
          backgroundColor: color,
        },
        animated,
      ]}
    />
  );
}

export function Confetti() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.layer} pointerEvents="none">
      {Array.from({ length: COUNT }, (_, i) => (
        <Piece key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  piece: { position: 'absolute', top: 0, borderRadius: 1 },
});
