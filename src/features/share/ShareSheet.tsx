import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import type { Goal } from '@/db/schema';
import { Button } from '@/ui/components/Button';
import { colors, layout, space, text } from '@/ui/tokens';
import { ShareCard } from './ShareCard';

type Props = {
  goal: Goal;
  progress: number;
  finishedAt: number;
  onClose: () => void;
};

/** Превью карточки + захват в PNG + системное меню «Поделиться». */
export function ShareSheet({ goal, progress, finishedAt, onClose }: Props) {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      // Захват в PNG. На Android view-shot капризнее — result:tmpfile надёжнее base64.
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Недоступно', 'Здесь нельзя поделиться картинкой.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Поделиться достижением' });
    } catch (e) {
      Alert.alert('Не получилось', e instanceof Error ? e.message : 'Ошибка при создании картинки');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Пустой onPress гасит всплытие — тап по карточке не закрывает лист. */}
        <Pressable onPress={() => {}}>
          <ShareCard ref={cardRef} goal={goal} progress={progress} finishedAt={finishedAt} />
        </Pressable>

        <SafeAreaView edges={['bottom']} style={styles.actions}>
          <Button title={busy ? 'Готовим…' : 'Поделиться'} onPress={onShare} disabled={busy} />
          <Text style={styles.close} onPress={onClose} accessibilityRole="button">
            Закрыть
          </Text>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xl,
    paddingHorizontal: layout.screenPadding,
  },
  actions: { alignSelf: 'stretch', gap: space.md, alignItems: 'stretch' },
  close: { ...text.caption, color: colors.textTertiary, textAlign: 'center', paddingVertical: space.sm },
});
