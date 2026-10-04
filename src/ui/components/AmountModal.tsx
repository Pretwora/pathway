import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { isValidAmount } from '@/domain/progress';
import { Button } from '@/ui/components/Button';
import { colors, layout, radius, space, text } from '@/ui/tokens';

type Props = {
  /** Заголовок и подпись зависят от того, добавляем мы или правим день. */
  mode: 'add' | 'edit';
  /** Для правки: подпись дня («17 июля») и его текущее значение. */
  dayLabel?: string;
  initialValue?: number;
  onClose: () => void;
  onSubmit: (amount: number) => void;
};

/**
 * Ввод числа. Два случая:
 * — add: докинуть, когда кнопки шага не подходят (сделал 47, а кнопки по 10);
 * — edit: поставить дню правильное значение («было не 200, а 150»).
 *
 * Отрицательных не принимает: сделать минус невозможно. Ошибку исправляют
 * правкой дня, а не вычитанием.
 */
export function AmountModal({ mode, dayLabel, initialValue, onClose, onSubmit }: Props) {
  // Компонент монтируется только на время показа (родитель даёт key), поэтому
  // начальное значение задаётся здесь, а не синхронизируется эффектом.
  const [value, setValue] = useState(() =>
    mode === 'edit' && initialValue !== undefined ? String(initialValue) : '',
  );

  const amount = Number.parseInt(value, 10);
  const valid = isValidAmount(amount) && (mode === 'edit' || amount > 0);

  function submit() {
    if (!valid) return;
    onSubmit(amount);
    onClose();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Пустой onPress: гасит всплытие, иначе тап по самой карточке её закроет. */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>
              {mode === 'edit' ? `Сколько было ${dayLabel}` : 'Сколько добавить'}
            </Text>

            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={mode === 'edit' ? '150' : '47'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              maxLength={9}
              textAlign="center"
              onSubmitEditing={submit}
            />

            {mode === 'edit' ? (
              <Text style={styles.hint}>Ноль уберёт этот день из истории.</Text>
            ) : null}

            <View style={styles.actions}>
              <Button title="Отмена" variant="ghost" onPress={onClose} style={styles.action} />
              <Button
                title={mode === 'edit' ? 'Исправить' : 'Добавить'}
                onPress={submit}
                disabled={!valid}
                style={styles.action}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  input: {
    ...text.counter,
    fontSize: 40,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  hint: { ...text.caption, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: space.md },
  action: { flex: 1 },
});
