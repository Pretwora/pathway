import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
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
  const t = useT();

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
              <Text style={styles.title}>{t.finishGoal.deleteTitle}</Text>
              <Text style={styles.body}>{t.finishGoal.deleteBody(progress, target)}</Text>

              <View style={styles.actions}>
                <Button title={t.common.delete} variant="danger" onPress={onDelete} />
                <Button title={t.common.back} variant="ghost" onPress={() => setConfirmingDelete(false)} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t.finishGoal.title}</Text>
              <Text style={styles.body}>{t.finishGoal.body(progress, target)}</Text>

              <View style={styles.actions}>
                <Button title={t.common.toArchive} onPress={onArchive} />
                <Button title={t.common.cancel} variant="ghost" onPress={onClose} />
              </View>

              {/* Отделено намеренно: необратимое действие не должно стоять
                  вплотную к обычным, чтобы в него не попадали мимо. */}
              <View style={styles.destructive}>
                <Button title={t.common.delete} variant="danger" onPress={onDeletePress} />
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
