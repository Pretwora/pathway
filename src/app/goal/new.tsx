import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DESCRIPTION_MAX, TITLE_MAX } from '@/domain/goal';
import { useGoalActions } from '@/store/useGoalActions';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { goBack } from '@/ui/goBack';
import { colors, layout, radius, space, text } from '@/ui/tokens';

const DEFAULT_STEPS = [5, 10, 20];

export default function NewGoalScreen() {
  const { createGoal } = useGoalActions();

  // Шаблонов нет: форма всегда пустая, подсказки — в плейсхолдерах.
  // Шаги по умолчанию стоят сразу: пустые три поля пугают сильнее, чем
  // готовые числа, которые можно поправить.
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState(() => DEFAULT_STEPS.map(String));
  const [saving, setSaving] = useState(false);
  /** Поле в фокусе — его рамка горит акцентом. Только для вида. */
  const [active, setActive] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  /** Верх каждого нижнего поля внутри скролла — запоминается при вёрстке. */
  const fieldTops = useRef<Record<string, number>>({});
  /** Какое поле сейчас в фокусе. null — верхние поля, их промотка не нужна. */
  const focusedField = useRef<string | null>(null);

  /** Высота клавиатуры: на столько же вырастает нижний отступ формы. */
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /** Подматывает поле под верх видимой области. */
  const scrollToField = useCallback((key: string) => {
    const top = fieldTops.current[key];
    if (top === undefined) return;
    // Нижний отступ применяется в текущем кадре — промотку берём в следующий.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, top - space.base), animated: true });
    });
  }, []);

  /**
   * Фокус ушёл на нижнее поле. Если клавиатура уже поднята, keyboardDidShow
   * больше не придёт — переход между полями системное событие не рождает,
   * поэтому проматываем прямо здесь.
   */
  const onFieldFocus = useCallback(
    (key: string | null) => {
      focusedField.current = key;
      if (key && keyboardHeight > 0) scrollToField(key);
    },
    [keyboardHeight, scrollToField],
  );

  /**
   * Приложение собрано в режиме edge-to-edge (edgeToEdgeEnabled в
   * gradle.properties), а он отменяет действие adjustResize: окно под
   * клавиатуру не ужимается, она просто ложится поверх. Из-за этого не
   * работают ни системная промотка, ни KeyboardAvoidingView — им нечего
   * измерять.
   *
   * Поэтому место под клавиатуру резервируем сами: содержимое становится
   * выше ровно на её высоту, и появляется куда прокручивать. Дальше
   * доматываем к полю — по keyboardDidShow, а не по onFocus, потому что на
   * момент фокуса высота клавиатуры ещё не известна.
   */
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      const key = focusedField.current;
      if (key) scrollToField(key);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToField]);

  // Обработчики стабильные, а не собранные фабрикой на рендере: фабрика,
  // возвращающая замыкание над ref, для React Compiler неотличима от чтения
  // ref во время рендера.
  const onDescriptionLayout = useCallback((e: LayoutChangeEvent) => {
    fieldTops.current.description = e.nativeEvent.layout.y;
  }, []);

  const onStepsLayout = useCallback((e: LayoutChangeEvent) => {
    fieldTops.current.steps = e.nativeEvent.layout.y;
  }, []);

  const targetNumber = Number.parseInt(target, 10);
  const parsedSteps = steps.map((s) => Number.parseInt(s, 10));

  // Описание не проверяем: цель без пояснения — обычное дело.
  const valid =
    title.trim().length > 0 &&
    Number.isFinite(targetNumber) &&
    targetNumber > 0 &&
    parsedSteps.every((s) => Number.isFinite(s) && s > 0);

  async function onSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await createGoal({
        title,
        target: targetNumber,
        description,
        quickSteps: parsedSteps,
      });
      // dismissAll, а не replace: стек здесь [/, /goal/new], и замена верхнего
      // экрана оставляла [/, /] — два счётчика друг на друге. Видно этого не
      // было (экраны одинаковые), но празднование монтировалось дважды, и
      // вместе с ним дважды звучали фанфара и вибрация.
      if (router.canGoBack()) router.dismissAll();
      else router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        // Без собственной высоты ScrollView растягивается по содержимому и не
        // прокручивается вовсе: под клавиатурой форму было не домотать.
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: layout.screenPadding + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <IconButton icon="back" label="Назад" onPress={goBack} />
          <Text style={styles.heading}>Новая цель</Text>
        </View>

        <Field label="Название">
          <TextInput
            style={[styles.input, active === 'title' && styles.inputActive]}
            value={title}
            onChangeText={setTitle}
            onFocus={() => {
              setActive('title');
              onFieldFocus(null);
            }}
            onBlur={() => setActive(null)}
            placeholder="Например, тысяча отжиманий"
            placeholderTextColor={colors.textTertiary}
            maxLength={TITLE_MAX}
          />
        </Field>

        <Field label="Сколько всего">
          <TextInput
            style={[styles.input, styles.numberInput, active === 'target' && styles.inputActive]}
            value={target}
            onChangeText={setTarget}
            onFocus={() => {
              setActive('target');
              onFieldFocus(null);
            }}
            onBlur={() => setActive(null)}
            placeholder="1000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            maxLength={9}
          />
        </Field>

        <Field label="Описание" onLayout={onDescriptionLayout}>
          <TextInput
            style={[styles.input, styles.description, active === 'description' && styles.inputActive]}
            value={description}
            onChangeText={setDescription}
            onFocus={() => {
              setActive('description');
              onFieldFocus('description');
            }}
            onBlur={() => setActive(null)}
            placeholder="По 30–50 за подход, утром и вечером."
            placeholderTextColor={colors.textTertiary}
            maxLength={DESCRIPTION_MAX}
            multiline
            // Без этого на iOS текст в многострочном поле липнет к верхнему краю.
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Не обязательно. Видно под названием на счётчике. {description.length} из {DESCRIPTION_MAX}
          </Text>
        </Field>

        <Field label="Кнопки быстрого добавления" onLayout={onStepsLayout}>
          <View style={styles.row}>
            {steps.map((s, i) => (
              <View key={i} style={[styles.input, styles.stepBox, active === `step-${i}` && styles.inputActive]}>
                <Text style={styles.stepPlus}>+</Text>
                <TextInput
                  style={styles.stepInput}
                  value={s}
                  onChangeText={(v) => setSteps((prev) => prev.map((old, j) => (j === i ? v : old)))}
                  onFocus={() => {
                    setActive(`step-${i}`);
                    onFieldFocus('steps');
                  }}
                  onBlur={() => setActive(null)}
                  keyboardType="number-pad"
                  maxLength={5}
                  accessibilityLabel={`Шаг ${i + 1}`}
                />
              </View>
            ))}
          </View>
          <Text style={styles.hint}>
            Числа на больших кнопках внизу счётчика. Поставь то, чем считаешь на самом деле — любое другое
            количество можно ввести вручную.
          </Text>
        </Field>

        <Button
          title={saving ? 'Создаём…' : 'Начать'}
          onPress={onSubmit}
          disabled={!valid || saving}
          style={styles.submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  style,
  onLayout,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
  /** Нужен нижним полям: по нему считается, куда промотать под клавиатуру. */
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={[styles.field, style]} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  body: { padding: layout.screenPadding, paddingTop: space.base, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  heading: { ...text.screenTitle, color: colors.text },
  field: { gap: space.sm },
  label: { ...text.label, color: colors.textTertiary },
  input: {
    ...text.body,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.base,
  },
  inputActive: { borderColor: colors.accent },
  numberInput: { ...text.number },
  /** Под пять строк: длинное описание на экране читается целиком. */
  description: { minHeight: 132, paddingTop: space.md },
  row: { flexDirection: 'row', gap: space.md },
  stepBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  stepPlus: { ...text.number, color: colors.accent },
  stepInput: { ...text.number, color: colors.text, minWidth: 40, padding: 0, textAlign: 'left' },
  hint: { ...text.caption, fontSize: 13, lineHeight: 18, color: colors.textTertiary },
  submit: { marginTop: space.sm },
});
