import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactLink } from '@/features/developer/ContactLink';
import { useT } from '@/i18n';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { goBack } from '@/ui/goBack';
import { colors, layout, space, text } from '@/ui/tokens';

/** Визитка: кто сделал, куда писать, какая версия. Вход — из архива. */
export default function DeveloperScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const t = useT();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <IconButton icon="back" label={t.common.back} onPress={goBack} />
        <Text style={styles.title}>{t.developer.title}</Text>
      </View>

      <View style={styles.body}>

        <View style={styles.card}>
          <Text style={styles.name}>{t.developer.author}</Text>
          <ContactLink />
        </View>

        <Text style={styles.hint}>{t.developer.hint}</Text>

        <Button
          title={t.developer.testers}
          variant="ghost"
          onPress={() => router.push('/developer/testers')}
        />
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
  body: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: space.xl, gap: space.lg },
  title: { ...text.screenTitle, color: colors.text },

  card: { gap: space.xs },
  name: { ...text.goalTitle, color: colors.text },

  hint: { ...text.caption, color: colors.textTertiary },
  footer: { ...text.meta, color: colors.textTertiary, textAlign: 'center', paddingBottom: space.base },
});
