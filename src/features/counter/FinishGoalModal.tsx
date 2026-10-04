import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/ui/components/Button';
import { colors, layout, radius, space, text } from '@/ui/tokens';

type Props = {
  /** Сколько набрано на момент разговора — человек решает, глядя на это число. */
  progress: number;
  target: number;
  onClose: () => void;
  /** Закрыть с текущим результатом. Продолжить можно будет из архива. */
  onArchive: () => void;
  /** Стереть вместе с историей. Необратимо. */
  onDelete: () => void;
};

/**
 * «Завершить цель?» — своё окно, а не системный Alert.
 *
 * Системный диалог здесь не годился по двум причинам. Он выглядит чужим:
 * светлая плашка посреди тёмного приложения. И он плохо держит три действия
 * с разным весом — Android сам решает, как их разложить, и «Удалить»
 * оказывается рядом с «В архив».
 *
 * Здесь порядок задан: сначала обычный выход, потом отказ, и только внизу,
 * отдельно, необратимое удаление.
 */
export function FinishGoalModal({ progress, target, onClose, onArchive, onDelete }: Props) {
  /**
   * Удаление с накопленным прогрессом спрашиваем дважды: цена ошибки — вся
   * история. Пустую цель («начал не то») стираем сразу, там терять нечего.
   */
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function onDeletePress() {
    if (progress > 0) {
      setConfirmingDelete(true);
      return;
    }
    onDelete();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Пустой onPress: гасит всплытие, иначе тап по карточке её закроет. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {confirmingDelete ? (
            <>
              <Text style={styles.title}>Удалить цель?</Text>
              <Text style={styles.body}>
                Исчезнет вся история — {progress} из {target}. Отменить нельзя.
              </Text>

              <View style={styles.actions}>
                <Button title="Удалить" variant="danger" onPress={onDelete} />
                <Button title="Назад" variant="ghost" onPress={() => setConfirmingDelete(false)} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Завершить цель?</Text>
              <Text style={styles.body}>
                Сейчас {progress} из {target}. В архиве цель сохранится вместе с историей — её
                можно будет продолжить. Удаление сотрёт её целиком.
              </Text>

              <View style={styles.actions}>
                <Button title="В архив" onPress={onArchive} />
                <Button title="Отмена" variant="ghost" onPress={onClose} />
              </View>

              {/* Отделено намеренно: необратимое действие не должно стоять
                  вплотную к обычным, чтобы в него не попадали мимо. */}
              <View style={styles.destructive}>
                <Button title="Удалить" variant="danger" onPress={onDeletePress} />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.base,
  },
  title: { ...text.screenTitle, fontSize: 20, color: colors.text },
  body: { ...text.caption, color: colors.textSecondary },
  actions: { gap: space.md, marginTop: space.xs },
  destructive: {
    marginTop: space.sm,
    paddingTop: space.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
