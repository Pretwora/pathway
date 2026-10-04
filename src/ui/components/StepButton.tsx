import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, layout, motion, radius, text } from '@/ui/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  step: number;
  onPress: () => void;
};

/**
 * Главная кнопка приложения. По ней тапают в перчатке, не глядя, между
 * подходами — поэтому она большая (72pt против минимума HIG в 44) и отвечает
 * мгновенно.
 *
 * Акцентом только «+»: три одинаково залитые кнопки съели бы весь акцент
 * экрана, и тропа над ними перестала бы быть главной.
 *
 * get/set вместо .value: с включённым React Compiler присваивание в .value
 * считается мутацией и валится линтом.
 */
export function StepButton({ step, onPress }: Props) {
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      style={[styles.button, animated]}
      onPressIn={() => scale.set(withTiming(motion.pressScale, { duration: motion.press }))}
      onPressOut={() => scale.set(withTiming(1, { duration: motion.press }))}
      // onPress, а не onPressIn: засчитываем по завершённому тапу, иначе
      // случайное касание при доставании телефона добавит лишнего.
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Добавить ${step}`}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>
        <Text style={styles.plus}>+</Text>
        {step}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: layout.stepButtonHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...text.stepButton, color: colors.text },
  plus: { color: colors.accent },
});
