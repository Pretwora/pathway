import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import {
  ARROW_ANCHOR,
  ARROW_FINAL_ANGLE,
  ARROW_PATH,
  ARROW_TIP,
  LOGO_SIZE,
  ROAD_BANDS,
  ROAD_PATH,
  ROUTE_X,
  ROUTE_Y,
} from '@/ui/logo-geometry';
import { colors, space, text, trailGradient } from '@/ui/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const tileBg = require('@/assets/images/logo-tile-bg.png');

/** Сторона плитки на экране. */
const TILE = 168;
/** Пикселей на единицу координат логотипа. */
const K = TILE / LOGO_SIZE;
/** Скругление — как у исходника логотипа, ~28 % стороны. */
const TILE_RADIUS = TILE * 0.28;

/** Радиус разлива градиента: от острия до дальнего угла плитки. */
const FLOOD_R = 1150 * K;
/** Кольцо волны: максимальный радиус и запас под толщину. */
const RING_MAX = 720 * K;
const RING_BOX = (RING_MAX + 4) * 2;

/** Последняя точка маршрута — основание наконечника. */
const ROUTE_LAST = ROUTE_X.length - 1;

/**
 * Раскадровка, мс. Всё считается от одного часового значения t, поэтому
 * кадр однозначен: нет цепочек колбэков, которые могут разъехаться.
 */
const TIMELINE = {
  tileIn: [0, 240],
  drive: [120, 900],
  flood: [860, 1280],
  pop: [860, 1200],
  border: [860, 1080],
  ring: [860, 1420],
  word: 1020,
  letterStep: 45,
  letterDuration: 280,
  end: 1600,
  fadeOut: 220,
  /** «Уменьшить движение»: сколько держать готовый логотип. */
  reducedHold: 500,
} as const;

const WORD = 'pathway';

function seg(t: number, from: number, to: number): number {
  'worklet';
  return Math.min(1, Math.max(0, (t - from) / (to - from)));
}

function easeOut(x: number): number {
  'worklet';
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

/**
 * Разгон и мягкое прибытие стрелки: cubic-bezier(.5, 0, .2, 1).
 * Своя бисекция, а не Easing.bezier: нужна обычная функция внутри worklet.
 */
function travel(x: number): number {
  'worklet';
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 20; i++) {
    t = (lo + hi) / 2;
    const u = 1 - t;
    const bx = 3 * u * u * t * 0.5 + 3 * u * t * t * 0.2 + t * t * t;
    if (bx < x) lo = t;
    else hi = t;
  }
  const u = 1 - t;
  return 3 * u * t * t + t * t * t;
}

function catmull(a: number, b: number, c: number, d: number, t: number): number {
  'worklet';
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

/** Точка маршрута стрелки по дробному индексу — сплайн Катмулла — Рома. */
function routeAt(u: number, xs: readonly number[], ys: readonly number[]): [number, number] {
  'worklet';
  const last = xs.length - 1;
  const v = Math.min(last, Math.max(0, u));
  const i = Math.min(last - 1, Math.floor(v));
  const f = v - i;
  const i0 = Math.max(0, i - 1);
  const i3 = Math.min(last, i + 2);
  return [catmull(xs[i0], xs[i], xs[i + 1], xs[i3], f), catmull(ys[i0], ys[i], ys[i + 1], ys[i3], f)];
}

/** Полоса дороги: проявляется, когда стрелка проехала её центр. */
function Band({ d, index, u, bodyIn }: { d: string; index: number; u: SharedValue<number>; bodyIn: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const passed = u.get() - 1 - index;
    const shown = Math.min(1, Math.max(0, (passed + 0.2) / 0.6));
    // Чистый контур проявляется поверх полос, а прячем их, только когда он
    // встал целиком: если гасить их одновременно, на середине дорога на кадр
    // становится полупрозрачной и серой. Потом полосы не нужны — край у них грубее.
    return { opacity: bodyIn.get() >= 1 ? 0 : shown };
  });
  return <AnimatedPath d={d} fill="url(#roadShade)" animatedProps={props} />;
}

function Letter({ char, index, t }: { char: string; index: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const from = TIMELINE.word + index * TIMELINE.letterStep;
    const l = easeOut(seg(t.get(), from, from + TIMELINE.letterDuration));
    return { opacity: l, transform: [{ translateY: 12 * (1 - l) }] };
  });
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>;
}

type Props = {
  /** Заставка отыграла или её пропустили — можно убирать. */
  onDone: () => void;
};

/**
 * Заставка при холодном старте: стрелка въезжает снизу и прокладывает
 * дорогу, из острия разливается градиент логотипа, снизу — надпись.
 *
 * Лежит поверх приложения, которое под ней уже загружено: после заставки
 * кнопки работают сразу. Тап в любом месте пропускает её — главный
 * сценарий «достал телефон, тапнул +10» ждать не должен. С включённым
 * «Уменьшить движение» — просто готовый логотип на полсекунды.
 *
 * Системная заставка Android при этом пустая (splash-blank.png): иначе
 * готовый логотип мелькнул бы до того, как начал собираться.
 */
export function AnimatedSplash({ onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  const leaving = useSharedValue(false);

  function leave(duration: number, delay = 0) {
    if (leaving.get()) return;
    leaving.set(true);
    fade.set(
      withDelay(
        delay,
        withTiming(0, { duration }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }

  useEffect(() => {
    if (reduceMotion) {
      t.set(TIMELINE.end);
      leave(TIMELINE.fadeOut, TIMELINE.reducedHold);
      return;
    }
    t.set(
      withTiming(TIMELINE.end, { duration: TIMELINE.end, easing: Easing.linear }, (finished) => {
        if (finished) runOnJS(leave)(TIMELINE.fadeOut);
      }),
    );
    // Один раз при появлении: заставка не перезапускается.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Дробный индекс точки маршрута, где сейчас основание стрелки. */
  const u = useDerivedValue(() => travel(seg(t.get(), TIMELINE.drive[0], TIMELINE.drive[1])) * ROUTE_LAST);
  /** Чистый контур дороги поверх полос — когда проявилась последняя. */
  const bodyIn = useDerivedValue(() => Math.min(1, Math.max(0, (u.get() - (ROUTE_LAST - 0.6)) / 0.5)));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  const tileStyle = useAnimatedStyle(() => {
    const now = t.get();
    const appear = easeOut(seg(now, TIMELINE.tileIn[0], TIMELINE.tileIn[1]));
    const pop = seg(now, TIMELINE.pop[0], TIMELINE.pop[1]);
    const bump = Math.sin(pop * Math.PI) * 0.045 * (1 - pop * 0.3);
    return { opacity: appear, transform: [{ scale: 0.9 + 0.1 * appear + bump }] };
  });

  const borderStyle = useAnimatedStyle(() => ({
    opacity: 1 - seg(t.get(), TIMELINE.border[0], TIMELINE.border[1]),
  }));

  /** Разлив: круг растёт из острия, картинка внутри стоит на месте. */
  const floodStyle = useAnimatedStyle(() => {
    const f = Math.max(0.001, easeOut(seg(t.get(), TIMELINE.flood[0], TIMELINE.flood[1])));
    return { opacity: f > 0.002 ? 1 : 0, transform: [{ scale: f }] };
  });
  const floodImageStyle = useAnimatedStyle(() => {
    const f = Math.max(0.001, easeOut(seg(t.get(), TIMELINE.flood[0], TIMELINE.flood[1])));
    return { transform: [{ scale: 1 / f }] };
  });

  const arrowStyle = useAnimatedStyle(() => {
    const now = t.get();
    const pos = u.get();
    const p = pos / ROUTE_LAST;
    const [x, y] = routeAt(pos, ROUTE_X, ROUTE_Y);
    const [ax, ay] = routeAt(pos + 0.35, ROUTE_X, ROUTE_Y);
    const [bx, by] = routeAt(pos - 0.35, ROUTE_X, ROUTE_Y);
    const tangent = (Math.atan2(ay - by, ax - bx) * 180) / Math.PI;
    // К финишу поворот и перспектива сходят на нет: стрелка встаёт ровно
    // туда, где она на логотипе.
    const s = Math.min(1, Math.max(0, (p - 0.82) / 0.18));
    const settle = s * s * (3 - 2 * s);
    const rotate = (tangent - ARROW_FINAL_ANGLE) * (1 - settle);
    // Внизу дорога «ближе» — стрелка крупнее.
    const scale = 1 + 0.95 * Math.pow(1 - p, 1.4);
    return {
      opacity: now >= TIMELINE.drive[0] ? 1 : 0,
      transform: [
        { translateX: (x - ARROW_ANCHOR.x) * K },
        { translateY: (y - ARROW_ANCHOR.y) * K },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  const bodyProps = useAnimatedProps(() => ({ opacity: bodyIn.get() }));

  const ringProps = useAnimatedProps(() => {
    const r = seg(t.get(), TIMELINE.ring[0], TIMELINE.ring[1]);
    return {
      r: (80 + easeOut(r) * 640) * K,
      strokeWidth: 3 - 2 * r,
      opacity: r > 0 && r < 1 ? 0.75 * (1 - r) : 0,
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <Pressable
        style={styles.press}
        onPress={() => leave(TIMELINE.fadeOut / 2)}
        accessibilityRole="button"
        accessibilityLabel="Пропустить заставку"
      >
        <View style={styles.stage}>
          <Svg width={RING_BOX} height={RING_BOX} style={styles.ring} pointerEvents="none">
            <Defs>
              <LinearGradient id="ringGrad" x1="0" y1="1" x2="1" y2="0">
                {trailGradient.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <AnimatedCircle
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              fill="none"
              stroke="url(#ringGrad)"
              animatedProps={ringProps}
            />
          </Svg>

          <Animated.View style={[styles.tile, tileStyle]}>
            <Animated.View style={[styles.flood, floodStyle]}>
              <Animated.Image source={tileBg} style={[styles.floodImage, floodImageStyle]} />
            </Animated.View>

            <Svg width={TILE} height={TILE} viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="roadShade" x1="0" y1="600" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
                  <Stop offset={0} stopColor={colors.logoRoad} />
                  <Stop offset={1} stopColor={colors.logoRoadShade} />
                </LinearGradient>
              </Defs>
              {ROAD_BANDS.map((d, i) => (
                <Band key={i} d={d} index={i} u={u} bodyIn={bodyIn} />
              ))}
              <AnimatedPath d={ROAD_PATH} fill="url(#roadShade)" animatedProps={bodyProps} />
            </Svg>

            <Animated.View style={[styles.arrow, arrowStyle]} pointerEvents="none">
              <Svg width={TILE} height={TILE} viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`}>
                <Path d={ARROW_PATH} fill={colors.logoRoad} />
              </Svg>
            </Animated.View>

            <Animated.View style={[styles.border, borderStyle]} pointerEvents="none" />
          </Animated.View>
        </View>

        <View style={styles.word}>
          {WORD.split('').map((c, i) => (
            <Letter key={i} char={c} index={i} t={t} />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: colors.bg, zIndex: 10 },
  press: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.base },
  stage: { width: TILE, height: TILE },
  ring: {
    position: 'absolute',
    left: ARROW_TIP.x * K - RING_BOX / 2,
    top: ARROW_TIP.y * K - RING_BOX / 2,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: TILE_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  flood: {
    position: 'absolute',
    left: ARROW_TIP.x * K - FLOOD_R,
    top: ARROW_TIP.y * K - FLOOD_R,
    width: FLOOD_R * 2,
    height: FLOOD_R * 2,
    borderRadius: FLOOD_R,
    overflow: 'hidden',
  },
  floodImage: {
    position: 'absolute',
    left: FLOOD_R - ARROW_TIP.x * K,
    top: FLOOD_R - ARROW_TIP.y * K,
    width: TILE,
    height: TILE,
    // Масштаб вокруг острия — той же точки, вокруг которой растёт круг.
    transformOrigin: [ARROW_TIP.x * K, ARROW_TIP.y * K, 0],
  },
  arrow: {
    ...StyleSheet.absoluteFill,
    // Поворот и масштаб — вокруг основания наконечника.
    transformOrigin: [ARROW_ANCHOR.x * K, ARROW_ANCHOR.y * K, 0],
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderRadius: TILE_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
  },
  word: { flexDirection: 'row', height: 36, alignItems: 'center' },
  letter: { ...text.screenTitle, fontSize: 26, color: colors.text },
});
