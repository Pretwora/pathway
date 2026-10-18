import { useReducedMotion } from 'react-native-reanimated';

/**
 * Анимации появления и исчезновения (`entering` / `exiting`) — только через это.
 *
 * На iOS с включённым «Уменьшить движение» Reanimated не запускает такие
 * анимации, и элемент остаётся невидимым навсегда: экран празднования был
 * пустым и тёмным, плашка отмены не появлялась (известная ошибка, Reanimated
 * #6863). Поэтому при уменьшенном движении анимацию не передаём вовсе —
 * элемент просто появляется сразу. Это заодно и есть то, что человек просил
 * в настройках.
 *
 * Настройка читается один раз при запуске (как и в Reanimated): переключил
 * её — со следующего запуска.
 */
export function useMotion() {
  const reduced = useReducedMotion();
  return function motion<T>(animation: T): T | undefined {
    return reduced ? undefined : animation;
  };
}
