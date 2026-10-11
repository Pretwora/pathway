import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LANGS } from '@/domain/lang';
import { exportBackup, pickBackup, restoreBackup } from '@/features/settings/backup';
import { LANGUAGE_NAMES, backupErrorText, useLanguageStore, useT } from '@/i18n';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { Segmented } from '@/ui/components/Segmented';
import { goBack } from '@/ui/goBack';
import { colors, layout, space, text } from '@/ui/tokens';

const LANGUAGE_OPTIONS = LANGS.map((value) => ({ value, label: LANGUAGE_NAMES[value], lang: value }));

export default function SettingsScreen() {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const [busy, setBusy] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function onExport() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await exportBackup();
      if (!ok) Alert.alert(t.common.unavailable, t.settings.exportUnavailable);
    } catch {
      Alert.alert(t.common.failed, t.settings.exportFailed);
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
      Alert.alert(t.settings.restoreTitle, t.settings.restoreBody(data.goals.length, data.entries.length), [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.restoreConfirm,
          style: 'destructive',
          onPress: () =>
            void restoreBackup(data)
              .then(() => Alert.alert(t.common.done, t.settings.restored))
              .catch(() => Alert.alert(t.common.failed, t.settings.restoreFailed)),
        },
      ]);
    } catch (e) {
      Alert.alert(t.settings.wrongFile, backupErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <IconButton icon="back" label={t.common.back} onPress={goBack} />
        <Text style={styles.title}>{t.settings.title}</Text>
      </View>

      {/* Скролл — на случай крупного системного шрифта: подсказка под копией длинная. */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.settings.language}</Text>
          <Segmented options={LANGUAGE_OPTIONS} value={lang} onChange={setLang} label={t.settings.language} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.settings.data}</Text>
          <Button title={busy ? t.settings.exporting : t.settings.export} onPress={onExport} disabled={busy} />
          <Button title={t.settings.restore} variant="ghost" onPress={onImport} disabled={busy} />
          <Text style={styles.hint}>{t.settings.hint}</Text>
        </View>
      </ScrollView>

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
  scroll: { flex: 1 },
  body: { paddingHorizontal: layout.screenPadding, paddingTop: space.xl, paddingBottom: space.lg, gap: space.xl },
  title: { ...text.screenTitle, color: colors.text },
  section: { gap: space.md },
  sectionLabel: { ...text.label, color: colors.textTertiary },
  hint: { ...text.caption, color: colors.textTertiary },
  footer: { ...text.meta, color: colors.textTertiary, textAlign: 'center', paddingBottom: space.base },
});
