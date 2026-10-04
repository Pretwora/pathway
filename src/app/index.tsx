import { StyleSheet, View } from 'react-native';

import { useActiveGoal } from '@/data/hooks';
import { CounterScreen } from '@/features/counter/CounterScreen';
import { IdleHome } from '@/features/home/IdleHome';
import { colors } from '@/ui/tokens';

/**
 * Роутер главного экрана:
 * — есть активная цель → счётчик;
 * — нет → дом с закрытыми целями и кнопкой «Новая цель».
 */
export default function Index() {
  const { goal, loading } = useActiveGoal();

  if (loading) return <View style={styles.screen} />;
  return goal ? <CounterScreen goal={goal} /> : <IdleHome />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
