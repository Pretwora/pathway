/**
 * Единственный источник цветов, отступов и типографики.
 *
 * Литерал вида `#2F86FF` или `padding: 24` в компоненте — ошибка ревью.
 * Обоснования значений — docs/02-дизайн-система.md.
 */

import type { TextStyle } from 'react-native';

/** Палитра «Фирменная»: тёмный синий фон, акцент и тропа — из логотипа. */
export const colors = {
  /** Фон приложения. Не чистый чёрный: #000 смазывается на OLED при скролле. */
  bg: '#0A0F1A',
  /** Карточки, поля ввода, нижняя панель с кнопками шага. */
  surface: '#111826',
  /** Кнопки и приподнятые элементы. */
  surfaceRaised: '#172134',
  /** Границы и разделители. Теней нет — только границы. */
  border: '#233047',

  /** Основной текст. Не чистый белый: #FFF даёт ореол вокруг букв. */
  text: '#EEF3FA',
  /** Подписи. */
  textSecondary: '#9BA8BD',
  /** Даты, служебное. Контраст к фону 5.3 — читается и мелким кеглем. */
  textTertiary: '#7A879E',

  /**
   * Акцент для текста и линий. Светлее синего из логотипа: #1471FD на тёмном
   * фоне даёт контраст 4.4, а подписи акцентом мелкие.
   */
  accent: '#2F86FF',
  /**
   * Заливка главной кнопки. Темнее акцента: белая подпись на #2F86FF
   * набирает только 3.5, на этом — 4.6.
   */
  accentFill: '#1A6FF0',
  accentFillPressed: '#155CC8',
  /** Подпись на заливке акцентом. */
  onAccent: '#FFFFFF',
  /** Подложка под акцентом: ореол маркера, плашка «досрочно». */
  accentMuted: '#10213D',
  /** Победа, перевыполнение. Зелёный из логотипа. */
  success: '#4BE39D',
  /** Точки непройденной части тропы. */
  trailDots: '#2E3B53',

  /** Опасное действие: удаление. Отдельно от акцента — синий не пугает. */
  danger: '#FF6B6B',

  /** Затемнение под модальными окнами. */
  backdrop: 'rgba(3, 6, 12, 0.78)',

  /** Дорога на логотипе — только заставка. Чисто белая: так на исходнике. */
  logoRoad: '#FFFFFF',
  /** Голубоватая тень внизу дороги — как на исходнике логотипа. */
  logoRoadShade: '#D9EAF9',
} as const;

/**
 * Градиент тропы — как дорога на логотипе: от синего через голубой к зелёному.
 * Чем ближе к цели, тем зеленее.
 */
export const trailGradient = [
  { offset: 0, color: '#1471FD' },
  { offset: 0.55, color: '#30D6F4' },
  { offset: 1, color: '#4BE39D' },
] as const;

/** Шкала с шагом 4. Промежуточных значений не существует. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  /** Малые кнопки шапки, плашки. */
  sm: 12,
  /** Карточки и поля. */
  md: 16,
  /** Кнопки шага, главные кнопки, карточки архива. */
  lg: 20,
  /** Верх нижней панели. */
  xl: 28,
  /** Круглые кнопки-иконки и плашка отмены. */
  pill: 999,
} as const;

export const layout = {
  /** Поля экрана по горизонтали. */
  screenPadding: space.lg,
  /** Кнопка шага. Сильно больше минимума HIG в 44: по ней попадают не глядя, в перчатке. */
  stepButtonHeight: 72,
  /** Главная кнопка экрана. */
  buttonHeight: 56,
  /** Малая кнопка с подписью в шапке. */
  headerButton: 40,
  /** Круглая кнопка-иконка в шапке. Ровно минимум HIG. */
  iconButton: 44,
} as const;

/**
 * Два шрифта: Unbounded — цифры и заголовки, Manrope — всё остальное.
 * У обоих есть кириллица и табличные цифры.
 */
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  display: 'Unbounded_500Medium',
} as const;

/**
 * Табличные цифры. Без них при смене 999 → 1000 число дёргается по горизонтали,
 * потому что глифы разной ширины.
 */
const tabular: Pick<TextStyle, 'fontVariant'> = { fontVariant: ['tabular-nums'] };

export const text = {
  /** Главный счётчик. Единственный элемент такого размера в приложении. */
  counter: { fontFamily: fonts.display, fontSize: 80, letterSpacing: -2, ...tabular },
  /** Число на экране победы и в карточке архивной цели. */
  hero: { fontFamily: fonts.display, fontSize: 88, letterSpacing: -3, ...tabular },
  /** Процент и цель рядом со счётчиком. */
  target: { fontFamily: fonts.display, fontSize: 20, ...tabular },
  screenTitle: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.3 },
  goalTitle: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  stepButton: { fontFamily: fonts.display, fontSize: 24, ...tabular },
  number: { fontFamily: fonts.display, fontSize: 20, ...tabular },
  button: { fontFamily: fonts.bold, fontSize: 17 },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, ...tabular },
  caption: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  /** Подписи капсом над блоками: «ПО ДНЯМ», «НАЗВАНИЕ». */
  label: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  meta: { fontFamily: fonts.medium, fontSize: 12 },
} as const satisfies Record<string, TextStyle>;

export const motion = {
  /** Обычный переход. */
  normal: 200,
  /** Нажатие кнопки. */
  press: 80,
  /** Тропа догоняет значение. */
  trail: 400,
  /** Насколько сжимается кнопка при нажатии. */
  pressScale: 0.96,
} as const;
