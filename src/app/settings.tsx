import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportBackup, pickBackup, restoreBackup } from '@/features/settings/backup';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { goBack } from '@/ui/goBack';
import { colors, layout, space, text } from '@/ui/tokens';

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function onExport() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await exportBackup();
      if (!ok) Alert.alert('Недоступно', 'Здесь нельзя сохранить файл.');
    } catch (e) {
      Alert.alert('Не получилось', e instanceof Error ? e.message : 'Ошибка при сохранении копии');
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await pickBackup();
      if (!data) return; // передумал выбирать

      // Замена необратима — спрашиваем явно, с числами из копии.
      Alert.alert(
        'Восстановить из копии?',
        `В копии целей: ${data.goals.length}, записей: ${data.entries.length}. ` +
          'Все текущие данные будут заменены. Отменить нельзя.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Восстановить',
            style: 'destructive',
            onPress: () =>
              void restoreBackup(data)
                .then(() => Alert.alert('Готово', 'Данные восстановлены из копии.'))
                .catch((e) =>
                  Alert.alert('Не получилось', e instanceof Error ? e.message : 'Ошибка восстановления'),
                ),
          },
        ],
      );
    } catch (e) {
      Alert.alert('Не тот файл', e instanceof Error ? e.message : 'Не удалось прочитать копию');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <IconButton icon="back" label="Назад" onPress={goBack} />
        <Text style={styles.title}>Настройки</Text>
      </View>

      <View style={styles.body}>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Данные</Text>
          <Button title={busy ? 'Сохраняем…' : 'Сохранить копию данных'} onPress={onExport} disabled={busy} />
          <Button title="Восстановить из копии" variant="ghost" onPress={onImport} disabled={busy} />
          <Text style={styles.hint}>
            Данные хранятся только на этом телефоне. Сохрани копию в облако или отправь себе — иначе при
            смене телефона история пропадёт. Восстановление заменит всё, что есть сейчас.
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>Pathway · {version}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.base,
  },
  body: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: space.xl, gap: space.xl },
  title: { ...text.screenTitle, color: colors.text },
  section: { gap: space.md },
  sectionLabel: { ...text.label, color: colors.textTertiary },
  hint: { ...text.caption, color: colors.textTertiary },
  footer: { ...text.meta, color: colors.textTertiary, textAlign: 'center', paddingBottom: space.base },
});
