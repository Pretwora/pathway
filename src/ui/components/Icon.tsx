import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/ui/tokens';

export type IconName = 'archive' | 'settings' | 'back' | 'plus' | 'check' | 'share';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Иконки линией, скруглённые концы — как у тропы. Свои, а не из набора:
 * их шесть, а пакет иконок весит мегабайты и тянет шрифт.
 */
export function Icon({ name, size = 20, color = colors.textSecondary, strokeWidth = 1.8 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'archive' ? (
        <>
          <Rect x={3} y={4} width={18} height={5} rx={1.5} {...stroke} />
          <Path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" {...stroke} />
          <Path d="M10 13h4" {...stroke} />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...stroke} />
          <Circle cx={15} cy={7} r={2} {...stroke} />
          <Circle cx={9} cy={17} r={2} {...stroke} />
        </>
      ) : null}
      {name === 'back' ? <Path d="M15 5l-7 7 7 7" {...stroke} /> : null}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...stroke} /> : null}
      {name === 'check' ? <Path d="M4 12.5l5.5 5.5L20 6.5" {...stroke} /> : null}
      {name === 'share' ? (
        <>
          <Path d="M12 3v12" {...stroke} />
          <Path d="M7 8l5-5 5 5" {...stroke} />
          <Path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
