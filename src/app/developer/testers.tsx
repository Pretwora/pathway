import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactLink } from '@/features/developer/ContactLink';
import { TESTERS } from '@/features/developer/testers';
import { useT } from '@/i18n';
import { IconButton } from '@/ui/components/IconButton';
import { goBack } from '@/ui/goBack';
import { colors, layout, radius, space, text } from '@/ui/tokens';

/** Титры: кто проверял приложение до выхода, и как попасть в этот список. */
export default function TestersScreen() {
  const t = useT();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <IconButton icon="back" label={t.common.back} onPress={goBack} />
        <Text style={styles.title}>{t.testers.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {TESTERS.length === 0 ? (
          <Text style={styles.empty}>{t.testers.empty}</Text>
        ) : (
          <>
            <Text style={styles.lead}>{t.testers.lead}</Text>
            <View style={styles.list}>
              {TESTERS.map((name) => (
                <View key={name} style={styles.row}>
                  <Text style={styles.name}>{name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.invite}>
          <Text style={styles.inviteTitle}>{t.testers.inviteTitle}</Text>
          <Text style={styles.inviteText}>{t.testers.inviteText}</Text>
          <ContactLink />
        </View>
      </ScrollView>
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
  body: { paddingHorizontal: layout.screenPadding, paddingTop: space.xl, gap: space.lg },
  title: { ...text.screenTitle, color: colors.text },
  lead: { ...text.caption, color: colors.textSecondary },
  empty: { ...text.caption, color: colors.textTertiary },

  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { ...text.body, color: colors.text },

  invite: { gap: space.sm },
  inviteTitle: { ...text.cardTitle, color: colors.text },
  inviteText: { ...text.caption, color: colors.textTertiary },
});
