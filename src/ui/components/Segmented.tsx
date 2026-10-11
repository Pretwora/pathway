import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, radius, space, text } from '@/ui/tokens';

type Option<T extends string> = {
  value: T;
  label: string;
  /** Язык подписи, если он может отличаться от языка интерфейса: «ru», «en». */
  lang?: string;
};

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Что выбирают — для экранного диктора: «Язык». */
  label: string;
};

/**
 * Выбор одного из нескольких вариантов: дорожка с сегментами, выбранный залит.
 *
 * Не две кнопки рядом: у кнопок нет состояния «выбрано», и человек не видел бы,
 * что включено сейчас.
 */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && !selected && styles.itemPressed]}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
              // Высота сегмента фиксирована — крупный системный шрифт не должен её распирать.
              maxFontSizeMultiplier={1.3}
              // Подпись может быть на другом языке, чем интерфейс («Русский» среди
              // английского) — VoiceOver прочитает её своим голосом.
              accessibilityLanguage={option.lang}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  item: {
    flex: 1,
    height: layout.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
  },
  itemSelected: { backgroundColor: colors.accentFill },
  itemPressed: { backgroundColor: colors.surfaceRaised },
  label: { ...text.button, fontSize: 16, color: colors.textSecondary },
  labelSelected: { color: colors.onAccent },
});
