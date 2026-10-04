import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, layout, radius, space, text } from '@/ui/tokens';

type Props = {
  title: string;
  onPress: () => void;
};

/**
 * Малая кнопка с подписью в шапке: «Завершить», «Разработчик».
 *
 * Для действий, у которых нет однозначной иконки. Переходы («Архив»,
 * «Настройки», «Назад») — круглые IconButton.
 *
 * С обводкой, потому что голый серый текст не читается как нажимаемый.
 * hitSlop добавляет к цели пальца невидимые поля: сама кнопка ниже 44pt,
 * но промахиваться по ней человек не должен.
 */
export function HeaderButton({ title, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={space.sm}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // Иначе в колоночном контейнере кнопка растянется во всю ширину экрана.
    alignSelf: 'flex-start',
    height: layout.headerButton,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.base,
  },
  pressed: { backgroundColor: colors.surface },
  label: { ...text.caption, fontFamily: fonts.semibold, color: colors.textSecondary },
});
