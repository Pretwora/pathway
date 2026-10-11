import { Pressable, StyleSheet, Text } from 'react-native';

import { useT } from '@/i18n';
import { colors, space, text } from '@/ui/tokens';
import { writeToDeveloper } from './contact';
import { CONTACT_EMAIL } from './testers';

/**
 * Адрес разработчика. Подчёркнут, потому что одного акцентного цвета мало:
 * акцентом в приложении набраны и обычные подписи, и человек не понимает,
 * что по этой строке можно нажать.
 */
export function ContactLink() {
  const t = useT();

  return (
    <Pressable
      onPress={() => void writeToDeveloper()}
      accessibilityRole="link"
      accessibilityLabel={t.developer.writeTo(CONTACT_EMAIL)}
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
