import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const completeSound = require('@/assets/sounds/complete.m4a');

/**
 * Звук победы — вторая половина того же сигнала, что и вибрация.
 *
 * Играет один раз при монтировании и только здесь. На тап, отмену и досрочное
 * завершение звука нет намеренно: в зале тихо, и приложение, звенящее после
 * каждого подхода, выключат вместе со звуком телефона.
 *
 * Режим ставим прямо перед проигрыванием, а не при старте приложения. Настройка
 * глобальная и переживает экран, но нужна ровно в этом месте — пусть и живёт
 * рядом с ним, а не в корневом лэйауте, которому до звука дела нет.
 */
export function useCompletionSound() {
  const player = useAudioPlayer(completeSound);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await setAudioModeAsync({
          // Умолчание модуля — играть всегда. Нам наоборот: беззвучный режим и
          // вибро на Android, переключатель на торце на iOS должны глушить звук.
          playsInSilentMode: false,
          // Где можно — duckOthers: на тренировке часто в наушниках, и фанфара
          // поверх музыки в полную громкость — каша. Чужой звук приглушится на
          // четыре секунды и вернётся сам. На iOS так нельзя: переключатель
          // слушает только категория Ambient, а она приглушать не умеет —
          // модуль отвергает такую пару. Беззвучный режим важнее, там смешиваем.
          interruptionMode: Platform.OS === 'ios' ? 'mixWithOthers' : 'duckOthers',
          shouldPlayInBackground: false,
        });
      } catch {
        // Не удалось выставить режим — молчим: играть с умолчанием модуля
        // значит звенеть и в беззвучном режиме.
        return;
      }
      // Режим ставится асинхронно — за это время экран могли уже закрыть.
      if (cancelled) return;
      player.play();
    })();

    return () => {
      cancelled = true;
    };
  }, [player]);
}
