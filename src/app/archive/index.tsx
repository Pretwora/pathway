import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useArchivedGoals, useTotalsByGoal } from '@/data/hooks';
import { CompletedGoalCard } from '@/ui/components/CompletedGoalCard';
import { HeaderButton } from '@/ui/components/HeaderButton';
import { IconButton } from '@/ui/components/IconButton';
import { goBack } from '@/ui/goBack';
import { colors, layout, space, text } from '@/ui/tokens';

export default function ArchiveScreen() {
  const { goals, loading } = useArchivedGoals();
  const totals = useTotalsByGoal();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="back" label="Назад" onPress={goBack} />
          <Text style={styles.heading}>Архив</Text>
        </View>
        {/* Про разработчика вспоминают редко — поэтому вход отсюда, а не с главной. */}
        <HeaderButton title="Разработчик" onPress={() => router.push('/developer')} />
      </View>

      {loading ? null : goals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>Пока пусто.</Text>
          <Text style={styles.emptySub}>Закрытые цели будут собираться здесь.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {goals.map((goal) => (
            <CompletedGoalCard
              key={goal.id}
              goal={goal}
              total={totals.get(goal.id) ?? 0}
              onPress={() => router.push(`/archive/${goal.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.base,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.base,
    paddingBottom: space.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heading: { ...text.screenTitle, color: colors.text },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.sm },
  empty: { ...text.screenTitle, fontSize: 20, color: colors.textSecondary },
  emptySub: { ...text.caption, color: colors.textTertiary },

  list: { paddingHorizontal: layout.screenPadding, gap: space.md, paddingBottom: space.xl },
});
