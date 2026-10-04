import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, layout, radius, space, text } from '@/ui/tokens';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  /**
   * danger — то же тело, что у ghost, но подпись красным: необратимое
   * действие должно читаться как опасное, не превращаясь при этом в главную
   * кнопку экрана.
   */
  variant?: 'primary' | 'ghost' | 'danger';
  /** Иконка слева от подписи — только у главной кнопки экрана. */
  icon?: IconName;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, style }: Props) {
  const isPrimary = variant === 'primary';
  const labelColor = isPrimary ? colors.onAccent : variant === 'danger' ? colors.danger : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        pressed && (isPrimary ? styles.primaryPressed : styles.ghostPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} color={labelColor} strokeWidth={2.4} /> : null}
        <Text
          style={[styles.label, !isPrimary && styles.ghostLabel, { color: labelColor }]}
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: layout.buttonHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  primary: { backgroundColor: colors.accentFill },
  primaryPressed: { backgroundColor: colors.accentFillPressed },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  ghostPressed: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  label: { ...text.button },
  /** Вторичные кнопки тише главной: тот же кегль, но не жирный. */
  ghostLabel: { ...text.body },
});
