/**
 * Написать разработчику.
 *
 * Тап по адресу обязан давать результат. Почтового клиента может не быть
 * вовсе (частый случай на Android без Gmail и на любом iPhone, где Mail
 * не настроен), и тогда openURL молча отклоняется — человек видит, что
 * ничего не произошло, и уходит. Поэтому запасной путь: кладём адрес
 * в буфер и говорим об этом вслух.
 */

import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Platform } from 'react-native';

import { CONTACT_EMAIL } from './testers';

/**
 * Тема письма: версия и платформа сразу в заголовке.
 *
 * Иначе разбор бага начинается с трёх писем «а какая у тебя версия?».
 */
function subject(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
  return `Pathway ${version} (${platform})`;
}

/** Открывает письмо, а если почты нет — копирует адрес и сообщает об этом. */
export async function writeToDeveloper(): Promise<void> {
  const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject())}`;

  try {
    // canOpenURL не всегда честен с mailto, поэтому просто пробуем открыть
    // и ловим отказ — это единственная проверка, которой можно верить.
    await Linking.openURL(url);
    return;
  } catch {
    await Clipboard.setStringAsync(CONTACT_EMAIL);
    Alert.alert(
      'Почта не открылась',
      `Адрес скопирован: ${CONTACT_EMAIL}\n\nВставь его в любой почтовый клиент или мессенджер.`,
    );
  }
}
