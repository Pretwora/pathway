import { useEffect, useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, motion, trailGradient } from '@/ui/tokens';
import {
  TRAIL_END,
  TRAIL_LENGTH,
  TRAIL_PATH,
  TRAIL_START,
  TRAIL_VIEW,
  TRAIL_XS,
  TRAIL_YS,
  trailPointAt,
} from '@/ui/trail';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Доля пройденного пути, 0..1. */
  fraction: number;
  /** Ширина на экране; высота — по пропорции тропы. */
  width: number;
  /**
   * Путь пройден: маркера нет, финиш залит и отмечен галочкой.
   * Экран победы и карточка для шеринга.
   */
  complete?: boolean;
  /** Выехать с нуля при появлении. Карточке для шеринга не нужно — её фотографируют. */
  animateIn?: boolean;
};

/** Цвет градиента в точке тропы — чтобы кольцо маркера совпадало с линией под ним. */
function colorAt(fraction: number): string {
  const stops = trailGradient;
  let i = 0;
  while (i < stops.length - 2 && fraction > stops[i + 1].offset) i++;
  const a = stops[i];
  const b = stops[i + 1];
  const f = Math.min(1, Math.max(0, (fraction - a.offset) / (b.offset - a.offset)));
  const mix = (from: string, to: string, at: number) =>
    Math.round(parseInt(from, 16) + (parseInt(to, 16) - parseInt(from, 16)) * at)
      .toString(16)
      .padStart(2, '0');
  const ca = a.color.slice(1);
  const cb = b.color.slice(1);
  return `#${mix(ca.slice(0, 2), cb.slice(0, 2), f)}${mix(ca.slice(2, 4), cb.slice(2, 4), f)}${mix(ca.slice(4, 6), cb.slice(4, 6), f)}`;
}

/**
 * Тропа прогресса — замена кольцу. Путь от старта к финишу: пройденное
 * залито градиентом логотипа, впереди — пунктир, «ты здесь» — кольцо.
 *
 * Пунктир идёт по всей длине, а залитая часть ложится поверх: так не нужно
 * резать пунктир на границе, и он не мигает при анимации.
 */
export function Trail({ fraction, width, complete = false, animateIn = true }: Props) {
  const height = (width * TRAIL_VIEW.height) / TRAIL_VIEW.width;
  const target = complete ? 1 : Math.min(1, Math.max(0, fraction));
  // Уникальный id градиента: на экране победы поверх счётчика две тропы,
  // и одинаковый id у SVG на Android подхватывает не тот градиент.
  const gradientId = `trail-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const progress = useSharedValue(animateIn ? 0 : target);

  useEffect(() => {
    progress.set(withTiming(target, { duration: motion.trail }));
  }, [target, progress]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: TRAIL_LENGTH * (1 - progress.get()),
  }));

  const markerProps = useAnimatedProps(() => {
    const [x, y] = trailPointAt(progress.get(), TRAIL_XS, TRAIL_YS);
    return { cx: x, cy: y };
  });

  const markerColor = colorAt(target);
  const lastStop = trailGradient[trailGradient.length - 1].color;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${TRAIL_VIEW.width} ${TRAIL_VIEW.height}`}>
      <Defs>
        <LinearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={TRAIL_START[0]}
          y1={TRAIL_START[1]}
          x2={TRAIL_END[0]}
          y2={TRAIL_END[1]}
        >
          {trailGradient.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>

      {/* Пунктир впереди: точки через ~2.4 % пути. Нулевой штрих Android не
          рисует вовсе, поэтому 0.1 — со скруглёнными концами это точка. */}
      <Path
        d={TRAIL_PATH}
        stroke={colors.trailDots}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={[0.1, 8.1]}
        fill="none"
      />

      <AnimatedPath
        d={TRAIL_PATH}
        stroke={`url(#${gradientId})`}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={[TRAIL_LENGTH, TRAIL_LENGTH]}
        fill="none"
        animatedProps={lineProps}
      />

      <Circle cx={TRAIL_START[0]} cy={TRAIL_START[1]} r={5} fill={trailGradient[0].color} />

      {complete ? (
        <>
          <Circle cx={TRAIL_END[0]} cy={TRAIL_END[1]} r={18} fill={colors.accentMuted} />
          <Circle cx={TRAIL_END[0]} cy={TRAIL_END[1]} r={11} fill={lastStop} />
          <Path
            d={`M${TRAIL_END[0] - 5} ${TRAIL_END[1] + 0.5}l3.5 3.5 6.5-7`}
            stroke={colors.bg}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <Circle cx={TRAIL_END[0]} cy={TRAIL_END[1]} r={8} fill={colors.bg} stroke={colors.textTertiary} strokeWidth={2} />
          <Circle cx={TRAIL_END[0]} cy={TRAIL_END[1]} r={3} fill={colors.textTertiary} />
          <AnimatedCircle r={17} fill={colors.accentMuted} animatedProps={markerProps} />
          <AnimatedCircle
            r={8}
            fill={colors.bg}
            stroke={markerColor}
            strokeWidth={4}
            animatedProps={markerProps}
          />
        </>
      )}
    </Svg>
  );
}
