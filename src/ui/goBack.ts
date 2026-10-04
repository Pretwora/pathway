import { router } from 'expo-router';

/**
 * Безопасный возврат. Если возвращаться некуда (экран открыт как первый —
 * deep link, уведомление, холодный старт), уходим на дом, а не падаем с
 * «GO_BACK was not handled».
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
