import { Pressable, StyleSheet, Text } from 'react-native';

import { writeToDeveloper } from './contact';
import { CONTACT_EMAIL } from './testers';
import { colors, space, text } from '@/ui/tokens';

/**
 * Адрес разработчика. Подчёркнут, потому что одного акцентного цвета мало:
 * красным в приложении набраны и обычные подписи, и человек не понимает,
 * что по этой строке можно нажать.
 */
export function ContactLink() {
  return (
    <Pressable
      onPress={() => void writeToDeveloper()}
      accessibilityRole="link"
      accessibilityLabel={`Написать на ${CONTACT_EMAIL}`}
      hitSlop={space.sm}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Text style={styles.email}>{CONTACT_EMAIL}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  email: {
    ...text.body,
    color: colors.accent,
    textDecorationLine: 'underline',
    // Подчёркивание вплотную к буквам выглядит грязно на мелком кегле.
    textDecorationColor: colors.accent,
  },
  pressed: { opacity: 0.6 },
});
