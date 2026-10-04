import { Pressable, StyleSheet } from 'react-native';

import { colors, layout, radius, space } from '@/ui/tokens';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  /** Иконка без подписи — значит, подпись обязана быть для экранного диктора. */
  label: string;
  onPress: () => void;
};

/**
 * Круглая кнопка-иконка в шапке: «Архив», «Настройки», «Назад».
 *
 * 44 — ровно минимум HIG, не больше: вес у шапки меньше, чем у кнопок шага
 * внизу, и спорить с ними за внимание ей нельзя. Контур и подложка — теней
 * в тёмной теме нет, край кнопки показывает граница.
 */
export function IconButton({ icon, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={space.xs}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceRaised },
});
