/**
 * Выбор языка: язык телефона, сохранённый выбор, переключение, тексты ошибок
 * копии. База подменена — проверяем логику, а не SQLite.
 */
import { I18nManager, Platform, Settings } from 'react-native';

import { loadLanguage, saveLanguage } from '@/data/settings-repo';
import { BackupError } from '@/domain/backup';
import { backupErrorText, deviceLang, getT, restoreLanguage, useLanguageStore } from './index';

jest.mock('@/data/settings-repo', () => ({
  loadLanguage: jest.fn(),
  saveLanguage: jest.fn(() => Promise.resolve()),
}));

// В тестах нет нативного SettingsManager — без подмены Settings бросает при
// первом обращении. На телефоне он есть; если вдруг нет — deviceLang это
// переживает (см. тест про откат на локаль устройства).
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const loadMock = loadLanguage as jest.MockedFunction<typeof loadLanguage>;
const saveMock = saveLanguage as jest.MockedFunction<typeof saveLanguage>;

function onPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

function withLocale(localeIdentifier: string | undefined) {
  jest
    .spyOn(I18nManager, 'getConstants')
    .mockReturnValue({ isRTL: false, doLeftAndRightSwapInRTL: true, localeIdentifier } as ReturnType<
      typeof I18nManager.getConstants
    >);
}

afterEach(() => {
  jest.restoreAllMocks();
  loadMock.mockReset();
  saveMock.mockClear();
});

describe('deviceLang', () => {
  it('iOS: первый знакомый язык из списка предпочтений', () => {
    onPlatform('ios');
    jest.spyOn(Settings, 'get').mockReturnValue(['kk-KZ', 'ru-RU', 'en-US']);
    expect(deviceLang()).toBe('ru');
  });

  it('iOS: английский интерфейс в России — английский', () => {
    onPlatform('ios');
    jest.spyOn(Settings, 'get').mockReturnValue(['en-RU']);
    expect(deviceLang()).toBe('en');
  });

  it('iOS: список не прочитался — берём локаль устройства, а не сдаёмся', () => {
    onPlatform('ios');
    jest.spyOn(Settings, 'get').mockImplementation(() => {
      throw new Error('no settings');
    });
    withLocale('ru_RU');
    expect(deviceLang()).toBe('ru');
  });

  it('Android: локаль устройства', () => {
    onPlatform('android');
    withLocale('ru_RU');
    expect(deviceLang()).toBe('ru');
    withLocale('en_US');
    expect(deviceLang()).toBe('en');
  });

  it('локаль неизвестна — английский', () => {
    onPlatform('android');
    withLocale(undefined);
    expect(deviceLang()).toBe('en');
  });
});

describe('сохранённый выбор', () => {
  it('ничего не выбрано — остаётся язык телефона', async () => {
    useLanguageStore.setState({ lang: 'en' });
    loadMock.mockResolvedValue(null);
    await restoreLanguage();
    expect(useLanguageStore.getState().lang).toBe('en');
  });

  it('выбор из базы побеждает язык телефона', async () => {
    useLanguageStore.setState({ lang: 'en' });
    loadMock.mockResolvedValue('ru');
    await restoreLanguage();
    expect(useLanguageStore.getState().lang).toBe('ru');
  });

  it('переключение меняет язык сразу и записывает выбор', () => {
    useLanguageStore.setState({ lang: 'ru' });
    useLanguageStore.getState().setLang('en');
    expect(useLanguageStore.getState().lang).toBe('en');
    expect(getT().common.back).toBe('Back');
    expect(saveMock).toHaveBeenCalledWith('en');
  });

  it('запись не удалась — интерфейс всё равно переключён, ошибка не всплывает', async () => {
    saveMock.mockRejectedValueOnce(new Error('disk full'));
    useLanguageStore.setState({ lang: 'en' });
    useLanguageStore.getState().setLang('ru');
    await Promise.resolve();
    expect(useLanguageStore.getState().lang).toBe('ru');
  });
});

describe('backupErrorText', () => {
  it('код причины — текст на текущем языке', () => {
    useLanguageStore.setState({ lang: 'en' });
    expect(backupErrorText(new BackupError('newerVersion'))).toBe(getT().backupErrors.newerVersion);
    expect(backupErrorText(new BackupError('twoActive'))).toBe(getT().backupErrors.twoActive);
    useLanguageStore.setState({ lang: 'ru' });
    expect(backupErrorText(new BackupError('corrupted', 'field target'))).toBe(getT().backupErrors.corrupted);
  });

  it('не JSON — «не наш файл», остальное — «не удалось прочитать»', () => {
    useLanguageStore.setState({ lang: 'en' });
    expect(backupErrorText(new SyntaxError('Unexpected token'))).toBe(getT().backupErrors.notBackup);
    expect(backupErrorText(new Error('EACCES'))).toBe(getT().backupErrors.unreadable);
  });
});
