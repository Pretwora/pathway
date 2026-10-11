import { isLang, langFromLocale, langFromLocales } from './lang';

describe('langFromLocales', () => {
  it('берёт первый знакомый язык из списка предпочтений', () => {
    expect(langFromLocales(['kk-KZ', 'ru-RU'])).toBe('ru');
    expect(langFromLocales(['de-DE', 'en-US', 'ru-RU'])).toBe('en');
    expect(langFromLocales(['ru-RU', 'en-US'])).toBe('ru');
  });

  it('ничего знакомого или пусто — английский', () => {
    expect(langFromLocales(['de-DE', 'fr-FR'])).toBe('en');
    expect(langFromLocales([])).toBe('en');
    expect(langFromLocales([null, undefined, ''])).toBe('en');
  });

  it('не путает похожие коды: «enm», «rue» — не наши', () => {
    expect(langFromLocales(['rue', 'ru'])).toBe('ru');
    expect(langFromLocales(['enm', 'ru'])).toBe('ru');
  });
});

describe('langFromLocale', () => {
  it('русская локаль в любом регионе — русский', () => {
    expect(langFromLocale('ru_RU')).toBe('ru');
    expect(langFromLocale('ru-KZ')).toBe('ru');
    expect(langFromLocale('ru')).toBe('ru');
    expect(langFromLocale('RU_ru')).toBe('ru');
  });

  it('всё остальное — английский', () => {
    expect(langFromLocale('en_RU')).toBe('en');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('de_DE')).toBe('en');
  });

  it('не путает похожие коды: «rue», «rw» — не русский', () => {
    expect(langFromLocale('rue_UA')).toBe('en');
    expect(langFromLocale('rw')).toBe('en');
  });

  it('локаль неизвестна — английский', () => {
    expect(langFromLocale(undefined)).toBe('en');
    expect(langFromLocale(null)).toBe('en');
    expect(langFromLocale('')).toBe('en');
  });
});

describe('isLang', () => {
  it('принимает только известные языки', () => {
    expect(isLang('ru')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(null)).toBe(false);
  });
});
