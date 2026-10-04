import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Unbounded_500Medium } from '@expo-google-fonts/unbounded';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db, migrations, useMigrations } from '@/db/client';
import { AnimatedSplash } from '@/features/splash/AnimatedSplash';
import { colors, layout, text } from '@/ui/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Unbounded_500Medium,
  });
  const { success: dbReady, error: dbError } = useMigrations(db, migrations);
  // Живёт, пока жив процесс: при возврате из фона заставка не повторяется.
  const [splashDone, setSplashDone] = useState(false);

  const ready = (fontsLoaded || fontError) && dbReady;

  useEffect(() => {
    if (ready || dbError || fontError) SplashScreen.hideAsync();
  }, [ready, dbError, fontError]);

  // Миграции упали — молчать нельзя: без базы приложение бессмысленно,
  // а тихий белый экран не даст понять причину.
  if (dbError) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>База не открылась</Text>
        <Text style={styles.fallbackText}>{dbError.message}</Text>
      </View>
    );
  }

  if (!ready) return null;

  return (
    // GestureHandlerRootView обязателен для свайпов — без него они молча не работают
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        />
        {/* Поверх уже загруженного приложения: когда заставка уйдёт,
            кнопки под ней работают сразу. */}
        {splashDone ? null : <AnimatedSplash onDone={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: layout.screenPadding,
  },
  fallbackTitle: { ...text.screenTitle, color: colors.danger },
  fallbackText: { ...text.body, color: colors.textSecondary },
});
