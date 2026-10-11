import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { Trail } from '@/ui/components/Trail';
import { colors, layout, space, text } from '@/ui/tokens';

const logo = require('@/assets/images/card-logo.png');

/**
 * Дом, когда активной цели нет: пустая тропа и одна кнопка «Новая цель».
 *
 * Готовых шаблонов нет намеренно: цели у всех свои, и список чужих примеров
 * только отодвигал бы кнопку. Закрытых целей здесь тоже нет — экран отвечает
 * на один вопрос, «что делаем сейчас». История живёт в Архиве, ссылка сверху.
 */
export function IdleHome() {
  const { width } = useWindowDimensions();
  const t = useT();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.wordmark}>pathway</Text>
        </View>
        <View style={styles.topNav}>
          <IconButton icon="archive" label={t.common.archive} onPress={() => router.push('/archive')} />
          <IconButton icon="settings" label={t.common.settings} onPress={() => router.push('/settings')} />
        </View>
      </View>

      {/* Скролл — на случай крупного системного шрифта: иначе текст
          выдавит кнопку за нижний край. */}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.trailBlock}>
          <Trail fraction={0} width={width - layout.screenPadding * 2} animateIn={false} />
          <View style={styles.trailLabels}>
            <Text style={styles.trailLabel}>{t.home.youAreHere}</Text>
            <Text style={styles.trailLabel}>{t.home.goal}</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.heading}>{t.home.heading}</Text>
          <Text style={styles.phrase}>{t.home.phrase}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button title={t.home.newGoal} icon="plus" onPress={() => router.push('/goal/new')} />
        <Text style={styles.note}>{t.home.note}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.base,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  logo: { width: 30, height: 30 },
  wordmark: { ...text.screenTitle, fontSize: 17, color: colors.text },
  topNav: { flexDirection: 'row', gap: space.sm },

  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space.xl,
    gap: space.xl,
  },
  trailBlock: { gap: space.sm },
  trailLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  trailLabel: { ...text.label, color: colors.textTertiary },

  intro: { gap: space.md },
  heading: { ...text.screenTitle, fontSize: 28, lineHeight: 36, color: colors.text },
  phrase: { ...text.body, lineHeight: 24, color: colors.textSecondary },

  actions: { paddingHorizontal: layout.screenPadding, paddingBottom: space.lg, gap: space.md },
  note: { ...text.caption, fontSize: 13, color: colors.textTertiary, textAlign: 'center' },
});
